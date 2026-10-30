#!/usr/bin/env python3
"""Validate shipped asset dimensions, transparency and source identity."""
import hashlib
import json
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / 'public'
manifest = json.loads((ROOT / 'assets/asset-manifest.json').read_text())
manifest['assets'] += json.loads((ROOT / 'assets/market/manifest.json').read_text())['assets']
keys = set()
for source in manifest['sources']:
    path = ROOT / source['path']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'Source changed: {path}'
for asset in manifest['assets']:
    assert asset['key'] not in keys, f'Duplicate key: {asset["key"]}'
    keys.add(asset['key'])
    with Image.open(ROOT / asset['path']) as image:
        w, h = asset['frame_size']
        assert image.size == (w * asset['frame_count'], h), f'Invalid atlas: {asset["key"]}'
        if asset['kind'] == 'spritesheet' and asset['key'] not in ['market-background','market-stone']:
            assert image.mode == 'RGBA', f'No alpha: {asset["key"]}'
            for frame in range(asset['frame_count']):
                alpha = image.crop((frame*w, 0, (frame+1)*w, h)).getchannel('A')
                assert alpha.getbbox(), f'Empty frame: {asset["key"]}/{frame}'
                assert alpha.getextrema()[0] == 0, f'No transparency: {asset["key"]}/{frame}'
print(f'Validated {len(keys)} assets and {len(manifest["sources"])} original source hashes.')
