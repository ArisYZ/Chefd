"""
Make white / near-white pixels transparent on the Chef'd app logo PNG.
Optionally upscale for sharper display when shown larger.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def white_to_transparent(
    im: Image.Image,
    *,
    threshold: int = 248,
) -> Image.Image:
    """Pixels where R,G,B are all >= threshold become fully transparent."""
    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    path = root / "assets" / "images" / "chefd-app-logo.png"
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])

    if not path.is_file():
        print(f"Missing file: {path}", file=sys.stderr)
        return 1

    im = Image.open(path)
    out = white_to_transparent(im, threshold=248)

    # Enlarge for crisp rendering on high-DPI screens (was 1024)
    target = 1536
    w, h = out.size
    if max(w, h) < target:
        scale = target / max(w, h)
        new_w = round(w * scale)
        new_h = round(h * scale)
        out = out.resize((new_w, new_h), Image.Resampling.LANCZOS)

    out.save(path, format="PNG", optimize=True)
    print(f"Wrote {path} ({out.size[0]}x{out.size[1]}, RGBA)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
