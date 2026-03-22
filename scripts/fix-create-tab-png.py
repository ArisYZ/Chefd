"""
Remove checkerboard / white background from create-tab-button.png.
Works on RGB or RGBA; flood-fills from edges through light pixels, then strips
near-white fringes. Re-run after replacing the asset if needed.
"""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


def is_background(r: int, g: int, b: int) -> bool:
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum >= 182:
        return True
    if lum >= 135 and max(r, g, b) - min(r, g, b) <= 32:
        return True
    return False


def is_near_white(r: int, g: int, b: int) -> bool:
    """Fringe / anti-alias pixels that should not stay opaque."""
    return r >= 228 and g >= 228 and b >= 228


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    path = root / "assets" / "images" / "create-tab-button.png"
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    src = im.load()

    # Virtual RGB for flood: transparent areas count as white (already outside art)
    def vr(x: int, y: int) -> tuple[int, int, int]:
        r, g, b, a = src[x, y]
        if a < 40:
            return (255, 255, 255)
        return (r, g, b)

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_start(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not visited[y][x] and is_background(*vr(x, y)):
            visited[y][x] = True
            q.append((x, y))

    for x in range(w):
        try_start(x, 0)
        try_start(x, h - 1)
    for y in range(h):
        try_start(0, y)
        try_start(w - 1, y)

    while q:
        x, y = q.popleft()
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_background(*vr(nx, ny)):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    out = Image.new("RGBA", (w, h))
    out_px = out.load()
    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                out_px[x, y] = (0, 0, 0, 0)
                continue
            r, g, b, a = src[x, y]
            if a < 40:
                out_px[x, y] = (0, 0, 0, 0)
                continue
            if is_near_white(r, g, b):
                out_px[x, y] = (0, 0, 0, 0)
            else:
                out_px[x, y] = (r, g, b, 255)

    # Second pass: remove remaining very light pixels (halo)
    for y in range(h):
        for x in range(w):
            r, g, b, a = out_px[x, y]
            if a == 0:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum >= 218 and max(r, g, b) - min(r, g, b) < 35:
                out_px[x, y] = (0, 0, 0, 0)

    out.save(path, optimize=True)
    print(f"Wrote transparent PNG: {path}")


if __name__ == "__main__":
    main()
