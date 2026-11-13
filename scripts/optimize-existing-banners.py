#!/usr/bin/env python3
"""Generate reversible WebP alternatives for the exact current public banners.

Runs in CI with Pillow, no database credentials or privileged storage writes.
The original PNG URLs remain unchanged in Supabase and in the admin panel.
"""
from __future__ import annotations

import hashlib
import io
import json
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "optimized-banners"
MAP = ROOT / "src" / "lib" / "optimizedLegacyBanners.ts"
ORIGIN = "https://uyleozhwzngnvyddfvni.supabase.co"
BASE = ORIGIN + "/storage/v1/object/public/banners/"
LEGACY_FILES = (
    "1783384982527_10miiwnlz.png",
    "1783385181302_6ypdg1pgq.png",
    "1753202959016_wgrkv0cot.png",
    "1783385194675_v98njb78l.png",
)
MAX_SIZE_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000


def webp(image: Image.Image, *, quality: int) -> bytes:
    result = io.BytesIO()
    image.save(result, format="WEBP", quality=quality, method=6)
    return result.getvalue()


def psnr(original: Image.Image, encoded: bytes) -> float:
    with Image.open(io.BytesIO(encoded)) as decoded:
        diff = ImageChops.difference(original.convert("RGB"), decoded.convert("RGB"))
        values = ImageStat.Stat(diff).rms
        mse = sum(value * value for value in values) / 3
        return float("inf") if mse == 0 else 20 * math.log10(255 / math.sqrt(mse))


def convert_file(filename: str) -> tuple[dict | None, dict]:
    url = BASE + filename
    with urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": "SajTem-CI-Image-Optimizer/1.0"}),
        timeout=25,
    ) as response:
        raw = response.read(MAX_SIZE_BYTES + 1)

    if not raw or len(raw) > MAX_SIZE_BYTES:
        raise ValueError(f"{filename}: source exceeds safe limit")

    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if getattr(image, "is_animated", False):
            raise ValueError(f"{filename}: animated images cannot be flattened")
        width, height = image.size
        if width * height > MAX_PIXELS or min(width, height) < 1:
            raise ValueError(f"{filename}: unsupported image dimensions")
        # Preserve transparency while avoiding unnecessarily large RGBA uploads.
        rgb = image.convert("RGBA" if "A" in image.getbands() else "RGB")

    digest = hashlib.sha256(raw).hexdigest()[:16]
    variants: list[tuple[int, str, int]] = []
    for target_width in sorted(set((min(480, width), min(970, width)))):
        if target_width == width:
            resized = rgb.copy()
        else:
            new_height = max(1, round(height * target_width / width))
            resized = rgb.resize((target_width, new_height), Image.Resampling.LANCZOS)

        encoded = webp(resized, quality=90)
        similarity = psnr(resized, encoded)
        if similarity < 35:
            encoded = webp(resized, quality=96)
            similarity = psnr(resized, encoded)
        # Avoid a visibly degraded copy; prefer the original if it is already efficient.
        if similarity < 35:
            print(f"SKIP {filename} width={target_width}: insufficient quality {similarity:.1f} dB")
            continue
        if len(encoded) >= len(raw) * 0.92:
            print(f"SKIP {filename} width={target_width}: no meaningful savings")
            continue

        name = f"{digest}-{target_width}.webp"
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / name).write_bytes(encoded)
        variants.append((target_width, f"/optimized-banners/{name}", len(encoded)))

    summary = {
        "source": filename,
        "originalBytes": len(raw),
        "originalDimensions": [width, height],
        "variants": [{"width": w, "bytes": n} for w, _, n in variants],
    }
    if not variants:
        return None, summary
    src = variants[-1][1]
    srcset = ", ".join(f"{url} {width}w" for width, url, _ in variants)
    return {"src": src, "srcSet": srcset}, summary


def main() -> None:
    # Keep generation deterministic, including removal of obsolete generated images.
    OUT.mkdir(parents=True, exist_ok=True)
    for path in OUT.glob("*.webp"):
        path.unlink()

    mapping: dict[str, dict] = {}
    report: list[dict] = []
    for filename in LEGACY_FILES:
        option, info = convert_file(filename)
        report.append(info)
        if option:
            mapping[BASE + filename] = option
    if len(mapping) < 2:
        raise SystemExit("At least two current home banners must be successfully converted")
    file_text = (
        "/** Generated automatically by scripts/optimize-existing-banners.py; do not edit. */\n"
        "export type OptimizedBannerVariant = { src: string; srcSet: string };\n"
        "export const optimizedBannerByUrl: Record<string, OptimizedBannerVariant> = "
        + json.dumps(mapping, indent=2, ensure_ascii=False) + ";\n"
    )
    MAP.write_text(file_text, encoding="utf-8")
    (OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("=== Converted legacy public banners ===")
    print(json.dumps(report, indent=2))
    print("Mapped", len(mapping), "source URLs; original PNGs and database rows remain unchanged.")


if __name__ == "__main__":
    main()
