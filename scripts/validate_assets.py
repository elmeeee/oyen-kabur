#!/usr/bin/env python3
"""Validate shipped asset dimensions, transparency and source identity."""
import hashlib
import json
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / 'public'
manifest = json.loads((ROOT / 'assets/asset-manifest.json').read_text())
manifest['assets'] += json.loads((ROOT / 'assets/market/manifest.json').read_text())['assets']
forest = json.loads((ROOT / 'assets/forest/manifest.json').read_text())
manifest['assets'] += forest['assets']
harbor = json.loads((ROOT / 'assets/harbor/manifest.json').read_text())
manifest['assets'] += harbor['assets']
palace = json.loads((ROOT / 'assets/palace/manifest.json').read_text())
manifest['assets'] += palace['assets']
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
        if asset['kind'] == 'spritesheet' and asset['key'] not in ['market-background','market-stone'] and not asset.get('opaque', False):
            assert image.mode == 'RGBA', f'No alpha: {asset["key"]}'
            for frame in range(asset['frame_count']):
                alpha = image.crop((frame*w, 0, (frame+1)*w, h)).getchannel('A')
                assert alpha.getbbox(), f'Empty frame: {asset["key"]}/{frame}'
                assert alpha.getextrema()[0] == 0, f'No transparency: {asset["key"]}/{frame}'
print(f'Validated {len(keys)} assets and {len(manifest["sources"])} original source hashes.')

# Ensure animation references and original PCM effects are actually loadable.
import wave
for frames in forest['boss_frames'].values():
    assert all(0 <= f < 9 for f in frames)
for a in forest['assets']:
    if 'animation' in a:
        assert a['animation']['frame_rate'] > 0 and a['frame_count'] > 1
for a in forest['audio']:
    with wave.open(str(ROOT / a['path'])) as sound:
        assert sound.getnchannels() == a['channels'] == 1
        assert sound.getframerate() == a['sample_rate'] and sound.getsampwidth() == 2
        assert 0 < sound.getnframes() / sound.getframerate() <= 1
print(f"Validated {len(forest['audio'])} original PCM sound effects and forest animation frames.")

for frames in harbor['boss_frames'].values():
    assert all(0 <= f < 9 for f in frames)
for a in harbor['assets']:
    assert a['origin'] == [0.5, 0.5]
    if 'animation' in a:
        assert a['animation']['frame_rate'] > 0 and a['frame_count'] > 1
print(f"Validated {len(harbor['assets'])} harbor atlases and Captain animation frame references.")

for frames in palace['boss_frames'].values():
    assert all(0 <= f < 12 for f in frames)
for a in palace['assets']:
    assert a['origin'] == [0.5, 0.5]
    if 'animation' in a:
        assert a['animation']['frame_rate'] > 0 and a['frame_count'] > 1
print(f"Validated {len(palace['assets'])} palace atlases, twelve boss poses and three ending panels.")
