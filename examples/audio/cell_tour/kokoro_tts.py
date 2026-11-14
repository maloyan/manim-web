#!/usr/bin/env python3
"""Speak lines with Kokoro-82M (Apache-2.0) through kokoro-onnx, fully local.

Called by generate.mjs. It reads one JSON array of {"id", "text", "speed"?} on stdin and
writes <out-dir>/<id>.wav (mono, 24 kHz, float) for each item. A word written
as [word](/IPA/) is spoken with those phonemes (Kokoro's IPA set), for words
the phonemizer gets wrong. An item's "speed" multiplies --speed.

Usage:
  python3 kokoro_tts.py --out-dir DIR [--voice af_heart] [--speed 1.0]
                        [--model-dir ~/.cache/kokoro-onnx] < lines.json

Install (any virtual environment, Python 3.10 to 3.13):
  pip install kokoro-onnx==0.6.1 soundfile
  mkdir -p ~/.cache/kokoro-onnx && cd ~/.cache/kokoro-onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
"""

import argparse
import json
import os
import re
import sys

# A word with a pinned pronunciation, as in misaki: [Peroxisomes](/pəɹˈɑːksəsˌoʊmz/).
PHONEMES = re.compile(r"\[([^\]]+)\]\(/([^/]+)/\)")

INSTALL_HINT = """\
kokoro_tts.py: the Python package '{name}' is missing.
Install the Kokoro path into a virtual environment:
  python3 -m venv ~/.venvs/kokoro
  ~/.venvs/kokoro/bin/pip install kokoro-onnx==0.6.1 soundfile
Then run generate.mjs with KOKORO_PYTHON=~/.venvs/kokoro/bin/python
(or pass --engine say to use macOS `say` instead)."""

MODEL_HINT = """\
kokoro_tts.py: model file not found: {path}
Download the two model files (about 340 MB in total) once:
  mkdir -p {dir} && cd {dir}
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
Or point KOKORO_MODEL_DIR (or --model-dir) at a folder that holds them."""


def main() -> int:
    parser = argparse.ArgumentParser(description="Kokoro-82M lines to WAV files")
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--lang", default="en-us")
    parser.add_argument(
        "--model-dir",
        default=os.environ.get(
            "KOKORO_MODEL_DIR", os.path.expanduser("~/.cache/kokoro-onnx")
        ),
    )
    args = parser.parse_args()

    for name in ("kokoro_onnx", "soundfile"):
        try:
            __import__(name)
        except ImportError:
            print(INSTALL_HINT.format(name=name.replace("_", "-")), file=sys.stderr)
            return 3
    import soundfile
    from kokoro_onnx import Kokoro

    model = os.path.join(args.model_dir, "kokoro-v1.0.onnx")
    voices = os.path.join(args.model_dir, "voices-v1.0.bin")
    for path in (model, voices):
        if not os.path.isfile(path):
            print(MODEL_HINT.format(path=path, dir=args.model_dir), file=sys.stderr)
            return 4

    items = json.load(sys.stdin)
    tts = Kokoro(model, voices)
    os.makedirs(args.out_dir, exist_ok=True)
    for item in items:
        text = item["text"]
        speed = args.speed * item.get("speed", 1.0)
        if PHONEMES.search(text):
            # "[word](/IPA/)" pins one word's sound; the rest is phonemized here.
            parts, at = [], 0
            for m in PHONEMES.finditer(text):
                parts.append(tts.tokenizer.phonemize(text[at : m.start()], args.lang))
                parts.append(m.group(2))
                at = m.end()
            parts.append(tts.tokenizer.phonemize(text[at:], args.lang))
            samples, rate = tts.create(
                " ".join(p.strip() for p in parts if p.strip()),
                voice=args.voice,
                speed=speed,
                is_phonemes=True,
            )
        else:
            samples, rate = tts.create(
                text, voice=args.voice, speed=speed, lang=args.lang
            )
        soundfile.write(os.path.join(args.out_dir, f"{item['id']}.wav"), samples, rate)
        print(f"{item['id']}: {len(samples) / rate:.2f} s", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
