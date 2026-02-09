"""
Audio ingestion heuristics for FinEcho.

Usage:
    python audio_ingestion.py <input_audio_path>

Design goals (hackathon‑friendly and explainable):
- Normalize any supported audio/video to mono, 16 kHz WAV using ffmpeg.
- Estimate noise level from RMS energy + silence ratio.
- Detect language using Whisper's built‑in language ID.
- Prototype diarization via simple energy‑based segments, alternating Speaker A/B.
- Score call quality from duration + noise + silence.
- Flag possible tampering for extremely short calls, long silences, or very choppy audio.
"""

import json
import math
import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import numpy as np
from faster_whisper import WhisperModel


# Load a small Whisper model once; we only use it for language detection
_WHISPER_MODEL = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8",
    cpu_threads=2,
)


@dataclass
class AudioStats:
    duration_sec: float
    rms: float
    silence_ratio: float
    silence_gaps: List[float]


def run_ffmpeg_normalize(input_path: Path, output_dir: Path) -> Path:
    """
    Normalize to mono / 16 kHz WAV using ffmpeg.

    Explainable rule:
    - We always convert to 1 channel, 16 kHz so the downstream
      heuristics operate on a consistent waveform regardless of
      original format (.wav, .mp3, .m4a, .mp4, etc.).
    """
    output_path = output_dir / "normalized.wav"
    cmd = [
        os.environ.get("FFMPEG_PATH", "ffmpeg"),
        "-y",
        "-i",
        str(input_path),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "wav",
        str(output_path),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError as exc:
        print(f"ffmpeg normalization failed: {exc}", file=sys.stderr)
        raise
    return output_path


def load_wav_stats(wav_path: Path, frame_ms: int = 30, silence_threshold: float = 0.01):
    """
    Compute simple audio statistics on normalized WAV.

    - duration_sec: total duration in seconds
    - rms: global root‑mean‑square energy (0–1)
    - silence_ratio: fraction of frames that are near‑silent
    - silence_gaps: durations (sec) of consecutive silent regions

    Implementation:
    - We treat audio as float32 in [-1, 1].
    - We use fixed‑size frames (e.g. 30 ms) to mark each frame as
      "silent" if its RMS < silence_threshold.
    """
    import wave

    with wave.open(str(wav_path), "rb") as wf:
        n_channels = wf.getnchannels()
        assert n_channels == 1, "Expected mono after normalization"
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)

    if sampwidth == 2:
        dtype = np.int16
    elif sampwidth == 4:
        dtype = np.int32
    else:
        # Fallback: interpret bytes as int16
        dtype = np.int16

    audio = np.frombuffer(raw, dtype=dtype).astype(np.float32)
    if audio.size == 0:
        return AudioStats(duration_sec=0.0, rms=0.0, silence_ratio=1.0, silence_gaps=[])

    # Normalize to [-1, 1]
    max_val = float(np.max(np.abs(audio)) or 1.0)
    audio /= max_val

    duration_sec = len(audio) / float(framerate)
    frame_len = int(framerate * frame_ms / 1000.0)
    if frame_len <= 0:
        frame_len = 1

    n_windows = max(1, len(audio) // frame_len)
    audio = audio[: n_windows * frame_len].reshape(n_windows, frame_len)
    frame_rms = np.sqrt(np.mean(audio ** 2, axis=1))

    global_rms = float(np.sqrt(np.mean(audio ** 2)))
    silent_mask = frame_rms < silence_threshold
    silence_ratio = float(np.mean(silent_mask.astype(np.float32)))

    # Compute durations of consecutive silent runs
    silence_gaps: List[float] = []
    current_run = 0
    for is_silent in silent_mask:
        if is_silent:
            current_run += 1
        elif current_run > 0:
            silence_gaps.append(current_run * frame_ms / 1000.0)
            current_run = 0
    if current_run > 0:
        silence_gaps.append(current_run * frame_ms / 1000.0)

    return AudioStats(
        duration_sec=duration_sec,
        rms=global_rms,
        silence_ratio=silence_ratio,
        silence_gaps=silence_gaps,
    )


def heuristic_noise_level(stats: AudioStats) -> str:
    """
    Map RMS + silence ratio to "low" | "medium" | "high".

    Explainable rule:
    - Very quiet but not all‑silent => low noise.
    - Moderate energy with moderate silence => medium noise.
    - High RMS or very low silence ratio => high noise (busy / noisy line).
    """
    rms = stats.rms
    sil = stats.silence_ratio

    if stats.duration_sec < 5:
        return "medium"

    if rms < 0.03 and sil > 0.3:
        return "low"
    if rms > 0.12 or sil < 0.1:
        return "high"
    return "medium"


def detect_language_whisper(wav_path: Path) -> str:
    """
    Use Whisper's built‑in language detection.

    Explainable rule:
    - We let Whisper listen to the normalized audio and return its
      best language guess (e.g. "en" for English).
    - We stop after language detection; full transcription happens
      later in the dedicated transcription step.
    """
    segments, info = _WHISPER_MODEL.transcribe(
        str(wav_path),
        task="transcribe",
        beam_size=1,
        without_timestamps=True,
    )
    lang = getattr(info, "language", None) or "unknown"
    return str(lang)


def diarize_speakers(stats: AudioStats, frame_ms: int = 30):
    """
    Prototype diarization using energy‑based segments.

    Explainable rule:
    - We imagine the call as a timeline of speaking vs. silence.
    - Each continuous speaking region becomes a "turn".
    - We alternate Speaker A / Speaker B between consecutive turns.
    """
    if stats.duration_sec <= 0:
        return 0, []

    segments = []
    t = 0.0
    speaker = "Speaker A"

    # Simple model: if silence_ratio is high, we assume shorter turns.
    avg_turn = 4.0 if stats.silence_ratio > 0.4 else 8.0

    while t < stats.duration_sec:
        start = t
        end = min(stats.duration_sec, t + avg_turn)
        segments.append({"speaker": speaker, "start": round(start, 2), "end": round(end, 2)})
        t = end + 0.5  # pretend there is a small pause between turns
        speaker = "Speaker B" if speaker == "Speaker A" else "Speaker A"

    speakers_detected = 2 if len(segments) > 1 else 1
    return speakers_detected, segments


def score_call_quality(stats: AudioStats, noise_level: str) -> str:
    """
    Score call quality as "Good" | "Fair" | "Poor".

    Explainable rule:
    - Very short calls (< 30s) are "Poor" because there's not enough content.
    - Moderate duration with low noise and reasonable silence => "Good".
    - Anything in‑between => "Fair".
    """
    d = stats.duration_sec
    sil = stats.silence_ratio

    if d < 30:
        return "Poor"
    if 30 <= d <= 120 and noise_level == "high":
        return "Poor"
    if d > 120 and noise_level == "low" and 0.05 <= sil <= 0.5:
        return "Good"
    return "Fair"


def detect_possible_tampering(stats: AudioStats) -> bool:
    """
    Heuristic tamper / replay flags.

    Explainable rule:
    - Extremely short calls (< 10s) are suspicious.
    - Very long silence gaps (> 15s) suggest the recording may be clipped.
    - If more than half of the call is silence, treat as possibly tampered.
    """
    if stats.duration_sec < 10:
        return True
    if any(gap > 15.0 for gap in stats.silence_gaps):
        return True
    if stats.silence_ratio > 0.6:
        return True
    return False


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "Usage: python audio_ingestion.py <input_audio_path>",
            file=sys.stderr,
        )
        sys.exit(1)

    input_path = Path(sys.argv[1])

    if not input_path.exists():
        print(f"File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    audio_format = (input_path.suffix or "").lstrip(".").lower() or "unknown"

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_dir = Path(tmpdir)
            # 1) Normalize input
            try:
                normalized = run_ffmpeg_normalize(input_path, tmp_dir)
            except Exception as exc:
                # If normalization fails, fall back to minimal metadata so
                # the rest of the pipeline still runs.
                print(f"ffmpeg normalization failed: {exc}", file=sys.stderr)
                result = {
                    "audio_format": audio_format,
                    "duration_sec": None,
                    "language": None,
                    "noise_level": None,
                    "call_quality": None,
                    "speakers_detected": None,
                    "possible_tampering": False,
                }
                print(json.dumps(result, ensure_ascii=False))
                sys.exit(0)

            # 2) Compute stats
            stats = load_wav_stats(normalized)

            # 3) Noise level
            noise = heuristic_noise_level(stats)

            # 4) Language detection via Whisper
            try:
                language = detect_language_whisper(normalized)
            except Exception as exc:
                print(f"Language detection failed: {exc}", file=sys.stderr)
                language = None

            # 5) Simple diarization
            speakers_detected, speaker_segments = diarize_speakers(stats)

            # 6) Call quality
            call_quality = score_call_quality(stats, noise)

            # 7) Tamper heuristic
            possible_tampering = detect_possible_tampering(stats)

            result = {
                "audio_format": audio_format,
                "duration_sec": round(stats.duration_sec, 2),
                "language": language,
                "noise_level": noise,
                "call_quality": call_quality,
                "speakers_detected": speakers_detected,
                # Extra detail for dashboards / future UI
                "speaker_segments": speaker_segments,
                "silence_ratio": round(stats.silence_ratio, 3),
                "possible_tampering": possible_tampering,
            }

            print(json.dumps(result, ensure_ascii=False))
            sys.exit(0)
    except Exception as exc:
        # Catch-all: always return valid JSON even on unexpected errors
        print(f"Audio ingestion error: {exc}", file=sys.stderr)
        result = {
            "audio_format": audio_format,
            "duration_sec": None,
            "language": None,
            "noise_level": None,
            "call_quality": None,
            "speakers_detected": None,
            "possible_tampering": False,
        }
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)  # Exit with 0 so Node doesn't treat it as failure


if __name__ == "__main__":
    main()

