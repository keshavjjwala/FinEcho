import sys
import subprocess
import librosa
import soundfile as sf
import noisereduce as nr
import whisper
import os
import json

if len(sys.argv) < 2:
    print("Usage: python enhance_transcribe.py <audio_path>")
    sys.exit(1)

audio_path = sys.argv[1]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

clean_wav = os.path.join(OUTPUT_DIR, "clean.wav")
enhanced_wav = os.path.join(OUTPUT_DIR, "enhanced.wav")
transcript_txt = os.path.join(OUTPUT_DIR, "transcript.txt")
transcript_json = os.path.join(OUTPUT_DIR, "transcript.json")

# 1️⃣ Convert to clean wav
subprocess.run([
    "ffmpeg", "-y",
    "-i", audio_path,
    "-ar", "16000",
    "-ac", "1",
    clean_wav
], check=True)

# 2️⃣ Noise reduction
audio, sr = librosa.load(clean_wav, sr=16000)
reduced = nr.reduce_noise(
    y=audio,
    sr=sr,
    stationary=False,
    prop_decrease=0.8
)

sf.write(enhanced_wav, reduced, sr)

# 3️⃣ Whisper transcription
model = whisper.load_model("medium")

result = model.transcribe(
    enhanced_wav,
    temperature=0,
    beam_size=5,
    best_of=5,
    fp16=False
)

# 4️⃣ Save outputs
with open(transcript_txt, "w", encoding="utf-8") as f:
    f.write(result["text"])

with open(transcript_json, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print("TRANSCRIPTION_DONE")
print(transcript_txt)
