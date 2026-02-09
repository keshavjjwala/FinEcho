"""
Usage: python transcribe.py <input_audio_path> [output_txt_path]
If output_txt_path is omitted, writes transcript to stdout.

This script is tuned for financial conversations:
- We give Whisper a finance-heavy initial prompt (EMI, SIP, KYC, premium, etc.).
- We post-process the raw transcript with a small correction map
  to fix common mis-hearings like "S I P" → "SIP" or "E M I" → "EMI".

All logic here is deterministic and explainable for demo/judging.
"""

import re
import sys
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except Exception as exc:
    print(f"Failed to import faster_whisper: {exc}", file=sys.stderr)
    sys.exit(1)

# 🔥 Load model ONCE (huge performance win)
MODEL = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8",
    cpu_threads=2,
)

# Simple finance-aware initial prompt to bias decoding vocabulary.
FINANCE_INITIAL_PROMPT = (
    "This is a financial services call about investments, mutual funds, SIP, "
    "EMI, loans, premiums, policies, tenure, insurance, KYC and interest rates. "
    "Use financial terms like EMI, SIP, mutual fund, NAV, premium, policy, "
    "tenure, KYC, interest rate, portfolio, installment, and credit score."
)

# Common ASR mistakes we want to fix in a transparent way.
FINANCE_CORRECTIONS: tuple[tuple[str, str], ...] = (
    # Spelled-out SIP / EMI
    (r"\bS\s*I\s*P\b", "SIP"),
    (r"\bS\.?\s*I\.?\s*P\.?\b", "SIP"),
    (r"\bE\s*M\s*I\b", "EMI"),
    (r"\bE\.?\s*M\.?\s*I\.?\b", "EMI"),
    # Common lowercase variants
    (r"\bsip\b", "SIP"),
    (r"\bemi\b", "EMI"),
    # Interest rate wording cleanups
    (r"\binterest\s+rate\b", "interest rate"),
)


def apply_finance_corrections(text: str) -> str:
    """
    Apply a small dictionary of regex-based corrections to
    normalize key financial terms.

    Explainable rule:
    - We only replace very specific patterns (e.g. 'S I P')
      with their canonical finance form ('SIP').
    """
    corrected = text
    for pattern, replacement in FINANCE_CORRECTIONS:
        corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
    return corrected


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "Usage: python transcribe.py <input_audio_path> [output_txt_path]",
            file=sys.stderr,
        )
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    if not Path(input_path).exists():
        print(f"File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        # Let Whisper auto-detect language (supports English, Hindi, Hinglish)
        # but bias the vocabulary with a finance-heavy initial prompt.
        segments, info = MODEL.transcribe(
            input_path,
            initial_prompt=FINANCE_INITIAL_PROMPT,
        )

        texts: list[str] = []
        for seg in segments:
            if seg and getattr(seg, "text", None):
                text = seg.text.strip()
                if text:
                    texts.append(text)

        raw_text = " ".join(texts).strip()

        if not raw_text:
            print("Transcription produced empty text", file=sys.stderr)
            sys.exit(1)

        # Apply deterministic, finance-specific corrections.
        final_text = apply_finance_corrections(raw_text)

        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(final_text)
            print(f"Transcript saved to {output_path}")
        else:
            # 👈 This is what Node will read from stdout
            print(final_text)

        sys.exit(0)

    except Exception as exc:
        print(f"Transcription error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
