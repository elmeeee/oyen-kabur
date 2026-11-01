#!/usr/bin/env python3
"""Original deterministic pixel harbor art; authored locally, no external assets."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
OUT=Path(__file__).resolve().parents[1]/'public/assets/harbor'
OUT.mkdir(parents=True,exist_ok=True)
P=dict(ink='#203947',deep='#315b68',sea='#397d90',foam='#b1e4cf',sky='#83b8b3',wood='#8d593a',gold='#d7b16b',cream='#f5dfaa',rust='#b65f49',blue='#577e9e',white='#e1e7cd')
assets=[]
def generate(key,size,count,paint,opaque=False,rate=None):
 sheet=Image.new('RGBA',(size[0]*count,size[1]))
 for f in range(count):
  im=Image.new('RGBA',size);paint(ImageDraw.Draw(im),f);sheet.paste(im,(f*size[0],0))
 sheet.save(OUT/f'{key}.png')
 a=dict(key=key,path=f'assets/harbor/{key}.png',frame_size=list(size),frame_count=count,kind='spritesheet',origin=[.5,.5],opaque=opaque,status='runtime-original-programmatic')
 if rate:a['animation']=dict(frame_rate=rate,repeat=-1)
 assets.append(a)
def dock(d,f):
 d.rectangle((0,0,31,31),fill=P['wood'])
 for y in [0,15,30]:d.line((0,y,31,y),fill=P['ink'],width=2)
 for x,y in [(6,6),(24,22)]:d.rectangle((x,y,x+2,y+2),fill=P['gold'])
 d.line((1,4,30,4),fill=P['gold'])
def crate(d,f):
 d.rectangle((1,1,30,30),fill=P['wood']);d.rectangle((2,2,29,29),outline=P['gold'],width=3);d.line((5,5,26,26),fill=P['gold'],width=3);d.line((5,26,26,5),fill=P['gold'],width=3)
def container(d,f):
 d.rectangle((0,0,31,31),fill=P['blue']);d.rectangle((0,0,31,3),fill=P['foam']);d.line((0,30,31,30),fill=P['ink'],width=2)
 for x in range(3,32,8):d.line((x,5,x,27),fill=P['deep'],width=3)
 d.rectangle((10,12,21,18),fill=P['cream'])
def boat(d,f,hostile=False):
 d.rectangle((0,16,127,21),fill=P['gold']);d.polygon([(3,22),(123,22),(109,49),(24,49)],fill=P['rust'] if hostile else P['blue']);d.line((10,26,117,26),fill=P['cream'],width=3)
 d.rectangle((38,4,74,15),fill=P['cream']);d.rectangle((43,7,51,12),fill=P['deep']);d.rectangle((59,7,67,12),fill=P['deep'])
 d.rectangle((81,1,84,15),fill=P['wood']);d.polygon([(85,2),(110,6),(85,11)],fill=P['rust'] if not hostile else P['gold'])
 for x in [25,90]:d.ellipse((x,29,x+10,39),fill=P['ink']);d.ellipse((x+3,32,x+7,36),fill=P['gold'])
 for x in range(9,117,24):d.line((x+f*2,55,x+12+f*2,55),fill=P['foam'],width=2)
def cargo(d,f):
 d.rectangle((0,16,127,50),fill=P['blue']);d.rectangle((0,16,127,20),fill=P['gold']);d.rectangle((1,21,126,50),outline=P['ink'],width=2)
 for x in range(8,128,16):d.line((x,23,x,47),fill=P['deep'],width=3)
 d.rectangle((49,27,78,39),fill=P['cream']);d.line((55,33,71,33),fill=P['rust'],width=3)
def crane(d,f):
 d.rectangle((7,15,18,255),fill=P['gold']);d.rectangle((3,247,28,255),fill=P['ink']);d.line((20,16,119,16),fill=P['gold'],width=8)
 for y in range(22,240,28):d.line((8,y,17,y+24),fill=P['wood'],width=2);d.line((17,y,8,y+24),fill=P['wood'],width=2)
 d.line((14,16,96,2,118,15),fill=P['gold'],width=3);d.rectangle((2,34,28,61),fill=P['blue']);d.rectangle((5,38,23,52),fill=P['sky']);d.line((112,20,112,90),fill=P['ink'],width=2);d.arc((105,84,119,101),0,270,fill=P['gold'],width=3)
def anchor(d,f):
 d.ellipse((27,3,37,13),outline=P['gold'],width=3);d.line((32,12,32,45),fill=P['gold'],width=5);d.line((20,25,44,25),fill=P['gold'],width=4);d.arc((10,22,54,53),0,180,fill=P['gold'],width=5);d.polygon([(8,33),(20,36),(11,43)],fill=P['cream']);d.polygon([(56,33),(44,36),(53,43)],fill=P['cream'])
 if f%2:d.line((30,52,34,58),fill=P['foam'],width=2)
def wave(d,f):
 for x in range(0,64,8):
  y=10+((x//8+f)%3)*4
  d.rectangle((x,y,x+7,30),fill=P['sea']);d.rectangle((x,y,x+6,y+2),fill=P['foam'])
def rain(d,f):
 for x,y in [(4,3),(20,19),(10,44)]:
  y=(y+f*9)%52;d.line((x+5,y,x,y+9),fill=P['foam'],width=2)
def lightning(d,f):
 d.line((35,0,20,46,38,85,18,126,34,170,23,214,30,255),fill=P['cream'] if f!=1 else P['gold'],width=5+f*2)
 d.line((34,170,52,194,45,220),fill=P['foam'],width=3)
def duck(d,f,boss=False):
 s=2 if boss else 1
 def rect(c,color):d.rectangle(tuple(int(v*s) for v in c),fill=color)
 def ellipse(c,color):d.ellipse(tuple(int(v*s) for v in c),fill=color)
 bob=f%2
 ellipse((16,25+bob,49,56),P['white']);ellipse((20,7+bob,46,32+bob),P['cream']);rect((19,8+bob,47,14+bob),P['ink']);rect((22,3+bob,44,8+bob),P['white']);rect((29,4+bob,37,8+bob),P['gold'])
 rect((34,19+bob,49,24+bob),P['gold']);rect((33,15+bob,35,18+bob),P['ink']);rect((20,35,47,48),P['blue']);rect((20,37,47,40),P['white']);rect((23,54,32,60),P['gold']);rect((39,54,49,60),P['gold'])
 ellipse((12,32,24,45),P['white'])
 if boss:
  rect((14,12,47,16),P['rust']);rect((32,16,37,19),P['ink']);rect((35,14,36,25),P['ink'])
  if f in [2,3]:rect((44,20,57,29),P['gold']);rect((54,13,58,26),P['ink'])
  if f==4:rect((43,31,60,37),P['foam'])
  if f==5:rect((44,21,58,29),P['rust'])
  if f==6:rect((25,15,36,19),P['rust'])
  if f==7:rect((27,15,36,18),P['sea'])
  if f==8:rect((23,10,45,14),P['white']);rect((30,16,36,18),P['cream'])
def ocean(d,f):
 d.rectangle((0,0,319,99),fill=P['sky']);d.ellipse((230,12,271,53),fill=P['cream']);d.rectangle((0,100,319,179),fill=P['sea'])
 for x,y in [(15,28),(95,55),(155,18)]:d.ellipse((x,y,x+60,y+13),fill='#a7cec0')
 for x in [20,130,240]:d.polygon([(x,91),(x+65,91),(x+52,99),(x+12,99)],fill=P['deep']);d.rectangle((x+25,78,x+45,90),fill=P['deep']);d.line((x+47,61,x+47,91),fill=P['deep'],width=2)
 for y in range(110,180,18):
  for x in range((y%3)*10,320,55):d.line((x,y,x+25,y),fill=P['sky'],width=2)
def buildings(d,f):
 for x in range(0,320,80):
  d.rectangle((x+2,55,x+70,148),fill=P['deep']);d.polygon([(x-3,55),(x+36,29),(x+75,55)],fill=P['rust'])
  for w in [12,45]:d.rectangle((x+w,70,x+w+15,91),fill=P['sky'])
  d.rectangle((x+23,109,x+52,148),fill=P['ink']);d.rectangle((x,148,x+79,155),fill=P['wood'])
def buoy(d,f):
 d.rectangle((13,8,18,53),fill=P['gold']);d.polygon([(4,40),(27,40),(22,58),(9,58)],fill=P['rust']);d.ellipse((8,3,23,14),fill=P['foam'] if f else P['gold'])
def gate(d,f):
 d.rectangle((2,1,10,127),fill=P['wood']);d.rectangle((85,1,93,127),fill=P['wood']);d.rectangle((0,0,95,10),fill=P['gold']);d.rectangle((14,10,80,35),fill=P['blue']);d.line((23,22,71,22),fill=P['cream'],width=3)
generate('harbor-dock',(32,32),1,dock,opaque=True)
generate('harbor-crate',(32,32),1,crate)
generate('harbor-container',(32,32),1,container,opaque=True)
generate('harbor-boat',(128,64),4,boat,rate=5)
generate('harbor-cargo',(128,64),1,cargo)
generate('harbor-crane',(128,256),1,crane)
generate('harbor-anchor',(64,64),4,anchor,rate=8)
generate('harbor-wave',(64,32),4,wave,rate=8)
generate('harbor-rain',(32,64),4,rain,rate=10)
generate('harbor-lightning',(64,256),3,lightning,rate=12)
generate('harbor-sailor',(64,64),4,duck,rate=5)
generate('kapten-bebek',(128,128),9,lambda d,f:duck(d,f,True))
generate('harbor-ship',(128,64),3,lambda d,f:boat(d,f,True),rate=7)
generate('harbor-ocean',(320,180),1,ocean,opaque=True)
generate('harbor-buildings',(320,180),1,buildings)
generate('harbor-buoy',(32,64),2,buoy,rate=3)
generate('harbor-gate',(96,128),1,gate)
manifest=dict(version=1,palette=P,assets=assets,boss_frames=dict(idle=[0,1],anchor=[2,3],wave=[4],ship=[5],hurt=[6],recovery=[7],defeated=[8]),limitations=['Original programmatic pixel art, integrated but not hand-polished final animation.','No new music or harbor audio.','Platforms translate without rotating Arcade collision bodies.'])
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
contact=Image.new('RGB',(1024,1620),P['ink']);d=ImageDraw.Draw(contact)
for i,a in enumerate(assets):
 im=Image.open(OUT/(a['key']+'.png'));im.thumbnail((490,140),Image.Resampling.NEAREST)
 x=12+(i%2)*512;y=12+(i//2)*178;d.text((x,y),f"{a['key']} {a['frame_size']} x{a['frame_count']}",fill=P['cream']);contact.paste(im,(x,y+20),im)
contact.save(OUT/'contact-sheet.png')
boss=Image.open(OUT/'kapten-bebek.png');contact=Image.new('RGBA',(384,384),P['ink'])
for i in range(9):contact.paste(boss.crop((i*128,0,(i+1)*128,128)),((i%3)*128,(i//3)*128))
contact.save(OUT/'boss-contact-sheet.png')
print(f'Generated {len(assets)} original harbor atlases and two contact sheets.')
