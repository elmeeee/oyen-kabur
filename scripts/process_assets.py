#!/usr/bin/env python3
"""Reviewed concept-sheet regions -> runtime assets. Only Pillow + stdlib required.

Coordinates are source pixels, [left, top, right, bottom), NOT inferred grid cells.
Existing RGBA samples are kept unchanged (including antialiasing and faint alpha).
Only space outside reviewed regions is discarded. No color-keying or alpha cutoff.
Run from any directory: python3 scripts/process_assets.py
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, __version__ as PILLOW_VERSION

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'public/assets/raw'
OUT = ROOT / 'public/assets/processed'
PREVIEW = ROOT / 'public/assets/previews'

# Individually inspected silhouette bounds; padding stays inside the drawn guides.
OYEN = {
    'idle': [(104, 28, 305, 194), (354, 28, 554, 194), (606, 28, 805, 194)],
    'run': [(109, 211, 336, 382), (377, 214, 618, 384), (657, 214, 884, 382),
            (930, 220, 1169, 382), (1199, 208, 1405, 382), (1438, 214, 1664, 384),
            (1696, 204, 1911, 382)],
    'jump': [(116, 387, 347, 575), (405, 395, 639, 577)],
    # No authored fall row. Reuse airborne pose 2; do NOT fabricate/interpolate.
    'fall': [(405, 395, 639, 577)],
    'hurt': [(383, 599, 637, 746)],
}
# Reviewed row-one flying poses. The last one at the right sheet edge is partial
# and deliberately excluded. Wider rectangles include their authored speed trails.
FLY = [(9, 30, 178, 195), (179, 30, 368, 195), (370, 30, 588, 195),
       (590, 30, 774, 195), (776, 30, 966, 195), (968, 30, 1120, 195)]
# Full second-row spin silhouettes INCLUDING separate pale motion arcs.
SPIN = [(14, 226, 190, 377), (218, 220, 365, 380), (382, 225, 549, 380),
        (564, 225, 710, 380), (724, 232, 898, 380), (902, 232, 1081, 380),
        (1091, 233, 1282, 380), (1298, 233, 1473, 380), (1493, 232, 1648, 380),
        (1663, 236, 1815, 380), (1820, 229, 1971, 380)]
FISH = [(35, 47, 166, 149), (175, 53, 311, 151), (318, 47, 455, 152),
        (460, 61, 602, 161), (604, 58, 756, 161), (766, 56, 894, 154)]
HEART = [(33, 358, 141, 457), (163, 358, 272, 457), (291, 359, 398, 457), (417, 360, 526, 459)]
CHILI = [(31, 482, 155, 596), (172, 480, 290, 597)]
SPARK = [(36, 775, 105, 852), (561, 766, 639, 854), (862, 764, 934, 838)]

LIMITATIONS = [
    'No source grid is assumed. Source coordinates are individually reviewed, exclusive-right/bottom crops.',
    'RGBA sources contain real transparency plus very low-alpha color residue. Alpha is NOT thresholded; RGB/alpha and antialiased edges inside crops are preserved.',
    'Oyen has 3 idle, 7 run, 2 airborne poses. Fall reuses airborne pose 2. Hurt uses the final tumble only; the ambiguous crouch/landing pose is previewed but not assigned.',
    'Oyen frames use ONE shared proportional nearest-neighbor scale, centered at x=32 with lowest silhouette baseline y=60. Airborne/tumble poses use silhouette baseline, not inferred anatomical foot tracking.',
    'Concept poses vary in body proportions. Shared scaling and baseline reduce jitter but cannot make AI-drawn silhouettes anatomically identical.',
    'Flying/spin trails are part of the original artwork, not background. Frame edges and trails remain mildly inconsistent; flying pose 6 has a close neighboring trail. See source overlays for manual cleanup.',
    'Final right-edge flying sandal is clipped in the SOURCE and is excluded. Connected third-row flight arcs are ambiguous and are NOT sliced into runtime frames.',
    'Kampung is opaque RGB. Dark outlines, gaps, guide grid and shadow are not safely separable by color. No black-color deletion is performed.',
    'Terrain outputs are reviewed rectangular INTERIOR fill bands, not a complete 32x32 tileset or guaranteed seamless Wang/Tiled tiles. Slopes, caps, corners and collision maps are not inferred.',
    'Kampung parallax is a concatenation of six reviewed scenic panels with black separators omitted. Internal perspective discontinuities remain; it is rendered once, not loop-tiled.',
    'Wall facade is an opaque architectural panel, not a transparent freestanding prop. Plants/poles/palm silhouettes need a hand-authored matte before runtime use; see kampung review preview.',
    'Only selected clean fish/heart/chili/spark poses are extracted. Other item rows remain available in raw sheets; no missing frames are generated.',
]


def source_info(path: Path) -> dict:
    with Image.open(path) as im:
        alpha = im.getchannel('A') if 'A' in im.getbands() else None
        histogram = alpha.histogram() if alpha else None
        return {'path': str(path.relative_to(ROOT / 'public')), 'size': list(im.size), 'mode': im.mode,
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'alpha_extrema': list(alpha.getextrema()) if alpha else None,
                'transparent_pixels': histogram[0] if histogram else 0,
                'partial_alpha_pixels': sum(histogram[1:255]) if histogram else 0}


def checked_crop(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    l, t, r, b = box
    if not (0 <= l < r <= source.width and 0 <= t < b <= source.height):
        raise ValueError(f'Invalid source region {box} for {source.size}')
    return source.crop(box).convert('RGBA')


def checker(size: tuple[int, int]) -> Image.Image:
    im = Image.new('RGBA', size, '#b5c5ca')
    d = ImageDraw.Draw(im)
    for y in range(0, size[1], 8):
        for x in range(0, size[0], 8):
            if (x // 8 + y // 8) % 2:
                d.rectangle((x, y, x + 7, y + 7), fill='#8da2ab')
    return im


def process() -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    names = ['oyen-sheet.png', 'sandal-sheet.png', 'items-sheet.png', 'kampung-tileset.png']
    sources = {name: Image.open(RAW / name).convert('RGBA') for name in names}
    assets: list[dict] = []
    overlays: dict[str, list[tuple[str, tuple[int, int, int, int]]]] = {name: [] for name in names}
    contacts: list[tuple[str, Image.Image]] = []
    # Uniform normalization across EVERY player state, never upscale an individual pose.
    cat_scale = min(60 / (r - l) for boxes in OYEN.values() for l, _t, r, _b in boxes)
    cat_scale = min(cat_scale, min(58 / (b - t) for boxes in OYEN.values() for _l, t, _r, b in boxes))

    def sheet(key: str, source: str, boxes: list[tuple[int, int, int, int]], cell: tuple[int, int],
              scale: float | None = None, baseline: int | None = None,
              animation: tuple[int, int] | None = None, notes: str = '') -> None:
        crops = [checked_crop(sources[source], box) for box in boxes]
        if scale is None:
            scale = min(min((cell[0] - 4) / c.width, (cell[1] - 4) / c.height) for c in crops)
        output = Image.new('RGBA', (cell[0] * len(boxes), cell[1]), (0, 0, 0, 0))
        frames = []
        for i, (crop, box) in enumerate(zip(crops, boxes)):
            size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
            normalized = crop.resize(size, Image.Resampling.NEAREST)
            x, y = (cell[0] - size[0]) // 2, (baseline - size[1] if baseline else (cell[1] - size[1]) // 2)
            if x < 0 or y < 0 or x + size[0] > cell[0] or y + size[1] > cell[1]:
                raise ValueError(f'Frame would be cropped: {key}/{i}')
            # paste without alpha mask: preserve alpha exactly, do NOT square it.
            output.paste(normalized, (i * cell[0] + x, y))
            overlays[source].append((f'{key}:{i}', box))
            frames.append({'source_region': list(box), 'destination_region': [x, y, x + size[0], y + size[1]]})
        path = f'assets/processed/{key}.png'
        output.save(ROOT / 'public' / path)
        asset = {'key': key, 'kind': 'spritesheet', 'path': path, 'source': source,
                 'frame_size': list(cell), 'frame_count': len(boxes), 'scale': scale,
                 'baseline': baseline, 'frames': frames, 'limitations': notes}
        if animation:
            asset['animation'] = {'key': key, 'frame_rate': animation[0], 'repeat': animation[1]}
        assets.append(asset)
        contacts.append((key, output))

    for state, boxes in OYEN.items():
        sheet(f'oyen-{state}', 'oyen-sheet.png', boxes, (64, 64), cat_scale, 60,
              {'idle': (3, -1), 'run': (10, -1), 'jump': (6, 0), 'fall': (1, 0), 'hurt': (1, 0)}[state],
              'Reuses jump frame 1; no distinct falling pose exists.' if state == 'fall' else '')
    sheet('sandal-fly', 'sandal-sheet.png', FLY, (64, 64), animation=(10, -1))
    sheet('sandal-spin', 'sandal-sheet.png', SPIN, (64, 64), animation=(13, -1))
    sheet('fish', 'items-sheet.png', FISH, (32, 32), animation=(7, -1))
    sheet('heart', 'items-sheet.png', HEART, (24, 24), animation=(4, -1))
    sheet('chili', 'items-sheet.png', CHILI, (32, 32), animation=(4, -1))
    sheet('spark', 'items-sheet.png', SPARK, (24, 24), animation=(12, 0),
          notes='Three selected sparkle variants, not a complete source-authored effect sequence.')

    def panel(key: str, boxes: list[tuple[int, int, int, int]], role: str, notes: str) -> None:
        source = sources['kampung-tileset.png']
        crops = [checked_crop(source, box) for box in boxes]
        out = Image.new('RGBA', (sum(c.width for c in crops), max(c.height for c in crops)))
        x = 0
        for i, (crop, box) in enumerate(zip(crops, boxes)):
            out.paste(crop, (x, 0)); x += crop.width
            overlays['kampung-tileset.png'].append((f'{key}:{i}', box))
        path = f'assets/processed/{key}.png'; out.save(ROOT / 'public' / path)
        assets.append({'key': key, 'kind': 'image', 'path': path, 'source': 'kampung-tileset.png',
                       'frame_size': list(out.size), 'frame_count': 1, 'role': role,
                       'source_regions': [list(b) for b in boxes], 'limitations': notes})
        contacts.append((key, out))

    panel('ground', [(105, 18, 160, 85)], 'terrain-fill',
          'Interior grass/dirt band. Repeated horizontally with visible concept-art seams; no inferred slopes/corners.')
    panel('roof', [(864, 17, 940, 35)], 'terrain-fill',
          'Interior terracotta ridge band. Repeated horizontally; no seamless-edge guarantee.')
    panel('wall-facade', [(505, 269, 580, 355)], 'decoration-panel',
          'Opaque wall/door panel, keep rectangular; cannot infer alpha matte from dark outlines.')
    panel('kampung-panorama', [(10, 747, 122, 901), (127, 747, 258, 901), (264, 747, 377, 901),
                               (383, 747, 516, 901), (523, 747, 638, 901), (645, 747, 756, 901)],
          'parallax-background', 'Six scenic panels joined after omitting confirmed vertical guide bars; not loop-seamless.')

    for name, regions in overlays.items():
        im = checker(sources[name].size); im.alpha_composite(sources[name]); draw = ImageDraw.Draw(im)
        for text, box in regions:
            draw.rectangle(box, outline='#ff4d97', width=2)
            draw.text((box[0] + 2, box[1] + 2), text, fill='white', stroke_width=1, stroke_fill='black')
        if name == 'oyen-sheet.png':
            draw.rectangle((108, 600, 360, 747), outline='yellow', width=3)
            draw.text((110, 590), 'REVIEW: crouch / landing (unused)', fill='yellow')
        if name == 'kampung-tileset.png':
            for box, note in [((525, 480, 755, 739), 'REVIEW: palm matte'),
                              ((1080, 365, 1210, 725), 'REVIEW: props matte')]:
                draw.rectangle(box, outline='yellow', width=3)
                draw.text((box[0], box[1]), note, fill='yellow', stroke_width=1, stroke_fill='black')
        im.thumbnail((1480, 1100), Image.Resampling.NEAREST)
        im.convert('RGB').save(PREVIEW / f'{Path(name).stem}-regions.png')

    contact = checker((1024, len(contacts) * 104))
    draw = ImageDraw.Draw(contact)
    for row, (key, im) in enumerate(contacts):
        y = row * 104
        draw.text((8, y + 4), key, fill='black')
        preview = im.copy()
        if preview.width > 995 or preview.height > 76:
            preview.thumbnail((995, 76), Image.Resampling.NEAREST)
        contact.alpha_composite(preview, (8, y + 24))
        if key.startswith('oyen-'):
            draw.line((8, y + 84, 8 + preview.width, y + 84), fill='#ff4d97')
    contact.convert('RGB').save(PREVIEW / 'contact-sheet.png')
    manifest = {'version': 1, 'generator': 'scripts/process_assets.py',
                'pillow_version': PILLOW_VERSION, 'coordinate_convention': '[left, top, right, bottom) in original source pixels',
                'background_policy': 'Keep original RGBA pixels; only discard pixels outside reviewed source rectangles. Kampung panels remain opaque. No thresholding, color key, inpainting or invented frames.',
                'sources': [source_info(RAW / name) for name in names], 'assets': assets,
                'previews': [f'assets/previews/{p.name}' for p in sorted(PREVIEW.glob('*.png'))],
                'limitations': LIMITATIONS}
    (ROOT / 'public/assets/asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Generated {len(assets)} assets; inspect public/assets/previews/contact-sheet.png and *-regions.png.')
    return manifest


if __name__ == '__main__':
    process()
