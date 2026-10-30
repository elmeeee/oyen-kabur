#!/usr/bin/env python3
"""Original hand-coded pixel motifs; staging art until World 2 runtime integration."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/market'; OUT.mkdir(parents=True,exist_ok=True)
assets=[]
def generate(key,size,count,draw):
 sheet=Image.new('RGBA',(size[0]*count,size[1]))
 for frame in range(count):
  im=Image.new('RGBA',size); draw(ImageDraw.Draw(im),frame);sheet.paste(im,(frame*size[0],0))
 sheet.save(OUT/f'{key}.png')
 assets.append(dict(key=key,path=f'assets/market/{key}.png',frame_size=list(size),frame_count=count,kind='spritesheet',status='staged-not-loaded'))
def tile(d,f):
 d.rectangle((0,0,31,31),fill='#476f78');d.rectangle((1,1,30,14),fill='#779b9a');d.rectangle((1,17,14,30),fill='#638789');d.rectangle((17,17,30,30),fill='#638789');d.line((3,6,27,6),fill='#a9d6ca',width=2)
def cart(d,f):
 for x in [14,49]:d.ellipse((x-6,48,x+6,60),fill='#25373f');d.rectangle((x-2,51,x+2,56),fill='#bcc6af')
 d.rectangle((5,24,58,47),fill='#754934');d.rectangle((7,26,56,32),fill='#c88f50');d.rectangle((7,36,56,43),fill='#a76b3c');d.line((3,22,61,22),fill='#e5ba73',width=3)
 for x in [18,34,48]:d.ellipse((x-7,16+(f%2),x+6,25+(f%2)),fill='#82babc');d.point((x+3,19+(f%2)),fill='#173c50')
def vendor(d,f):
 d.rectangle((21,23,44,48),fill='#d79c58');d.rectangle((24,46,30,58),fill='#263e50');d.rectangle((36,46,42,58),fill='#263e50');d.rectangle((26,29,40,48),fill='#7ab8b0');d.rectangle((24,9,41,25),fill='#b9794c');d.rectangle((18,8,47,12),fill='#e3c88d');d.rectangle((25,3,40,8),fill='#e3c88d');d.rectangle((38,16,40,18),fill='#243743');d.rectangle((44,29-f*3,55,34-f*3),fill='#b9794c')
def boss(d,f):
 d.ellipse((19,29,108,109),fill='#203947');d.ellipse((24,34,103,104),fill=['#59868c','#628b82','#6f858f'][f]);d.polygon([(28,70),(5,47),(9,88)],fill='#437078');d.polygon([(98,70),(121,47),(119,88)],fill='#437078');d.ellipse((40,49,54,64),fill='#f3e6b8');d.ellipse((76,49,90,64),fill='#f3e6b8');d.rectangle((46,54,50,61),fill='#152b37');d.rectangle((78,54,82,61),fill='#152b37');d.arc((43,62,86,88),0,180,fill='#203947',width=4);d.line((36,73,13,67),fill='#e6c99b',width=3);d.line((92,73,115,67),fill='#e6c99b',width=3);d.rectangle((29,26,100,34),fill='#e5b75c');d.rectangle((43,12,85,26),fill='#c08b46');d.rectangle((48,89,83,103),fill='#e5b75c')
def net(d,f):
 for x in range(8,57,8):d.line((x,8,x,56),fill='#c5b993',width=2)
 for y in range(8,57,8):d.line((8,y,56,y),fill='#c5b993',width=2)
 d.rectangle((6,6,58,58),outline='#735d4b',width=3)
generate('market-stone',(32,32),1,tile);generate('market-cart',(64,64),2,cart);generate('market-vendor',(64,64),2,vendor);generate('juragan-lele',(128,128),3,boss);generate('market-net',(64,64),1,net)
(OUT/'manifest.json').write_text(json.dumps(dict(version=1,assets=assets,limitations=['Staging artwork: not loaded into gameplay yet.','Boss frames are phase portraits, not a full animation set.','Market backdrop, crate, collectible and slippery tile variants remain pending.']),indent=2)+'\n')
contact=Image.new('RGB',(640,420),'#203947');d=ImageDraw.Draw(contact)
for i,a in enumerate(assets):
 im=Image.open(OUT/(a['key']+'.png'));im.thumbnail((380,128),Image.Resampling.NEAREST)
 x=10 if i<3 else 250;y=15+(i if i<3 else i-3)*135
 d.text((x,y),a['key'],fill='#f5dc9e');contact.paste(im,(x,y+17),im)
contact.save(OUT/'contact-sheet.png')
print('Generated five staged market assets and contact sheet.')
