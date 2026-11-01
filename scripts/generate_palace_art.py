#!/usr/bin/env python3
"""Original deterministic royal pixel art, ending panels and review sheets."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
OUT=Path(__file__).resolve().parents[1]/'public/assets/palace';OUT.mkdir(parents=True,exist_ok=True)
P=dict(ink='#211e35',stone='#4d5068',light='#888da3',purple='#684a8c',deep='#352c52',gold='#d7b16b',cream='#f5dfaa',rose='#d27993',blue='#72b4bc',black='#252636',fur='#3e3e54',orange='#df8f45',green='#6c9874')
assets=[]
def generate(key,size,count,draw,opaque=False,rate=None):
 sheet=Image.new('RGBA',(size[0]*count,size[1]))
 for f in range(count):
  im=Image.new('RGBA',size);draw(ImageDraw.Draw(im),f);sheet.paste(im,(f*size[0],0))
 sheet.save(OUT/f'{key}.png')
 a=dict(key=key,path=f'assets/palace/{key}.png',frame_size=list(size),frame_count=count,kind='spritesheet',origin=[.5,.5],opaque=opaque,status='original-programmatic-runtime')
 if rate:a['animation']=dict(frame_rate=rate,repeat=-1)
 assets.append(a)
def stone(d,f):
 d.rectangle((0,0,31,31),fill=P['stone'])
 for y in [0,15,30]:d.line((0,y,31,y),fill=P['ink'],width=2)
 for x,y in [(15,0),(1,15),(30,15)]:d.line((x,y,x,y+14),fill=P['light'])
 d.line((2,3,12,3),fill=P['light'])
def gold(d,f):
 d.rectangle((0,0,31,14),fill=P['stone']);d.rectangle((0,0,31,4),fill=P['gold']);d.rectangle((1,7,30,12),fill=P['deep'])
 for x in [4,24]:d.rectangle((x,7,x+3,10),fill=P['gold'])
def fragile(d,f):
 gold(d,f)
 for x in [8,23]:d.line((x,4,x-3,9,x+2,14),fill=P['rose'] if f else P['ink'],width=2)
def banner(d,f):
 d.rectangle((2,1,29,5),fill=P['gold']);d.polygon([(5,7),(26,7),(26,80),(16,94),(5,80)],fill=P['purple']);d.rectangle((8,9,23,75),outline=P['gold'],width=2);d.polygon([(11,25),(13,17),(16,23),(20,17),(22,25),(22,38),(11,38)],fill=P['gold'])
def gate(d,f):
 d.rectangle((2,2,125,191),fill=P['stone']);d.rectangle((5,5,122,190),outline=P['light'],width=4);d.rounded_rectangle((24,35,103,191),radius=30,fill=P['ink'])
 for x in range(28,102,12):d.rectangle((x,54,x+4,190),fill=P['gold'])
 d.rectangle((18,88,110,93),fill=P['gold']);d.rectangle((48,15,79,29),fill=P['purple'])
def trap(d,f):
 d.rectangle((2,6,29,61),fill=P['stone']);d.rectangle((5,9,26,58),outline=P['gold'],width=2);d.rectangle((9,23,22,36),fill=P['ink']);d.rectangle((13,27,18,31),fill=P['rose'] if f else P['gold'])
def arrow(d,f):
 d.line((3,15,25,15),fill=P['gold'],width=3);d.polygon([(24,9),(31,15),(24,21)],fill=P['light']);d.line((3,10,8,15,3,20),fill=P['cream'],width=2)
def orb(d,f):
 r=8+f%2;d.ellipse((16-r,16-r,16+r,16+r),fill=P['purple']);d.ellipse((10,10,21,21),fill=P['rose']);d.rectangle((13,12,17,16),fill=P['cream'])
 for x,y in [(2,9),(26,20),(6,26)]:d.rectangle((x,y,x+2,y+2),fill=P['gold'])
def claw(d,f):
 for y in [14,28,42]:d.line((12+f*4,y+10,106-f*4,y),fill=P['rose'],width=4);d.line((18+f*4,y+9,99-f*4,y+1),fill=P['cream'],width=2)
def spark(d,f):
 r=12-f*3
 d.line((16-r,16,16+r,16),fill=P['gold'],width=2);d.line((16,16-r,16,16+r),fill=P['cream'],width=2);d.rectangle((14,14,18,18),fill=P['rose'])
def shadow(d,f):
 for x in range(0,64,8):
  y=14+(x//8+f)%3*4;d.polygon([(x,31),(x+4,y),(x+8,31)],fill=P['purple']);d.point((x+4,y),fill=P['rose'])
def cat(d,f,boss=False,sentinel=False):
 s=2 if boss else 1
 def rect(c,color):d.rectangle(tuple(int(v*s) for v in c),fill=color)
 def ellipse(c,color):d.ellipse(tuple(int(v*s) for v in c),fill=color)
 def poly(c,color):d.polygon([(int(x*s),int(y*s)) for x,y in c],fill=color)
 fur=P['black'] if boss else P['light']
 ellipse((13,27,52,57),fur);ellipse((16,9,49,37),fur);poly([(17,15),(17,3),(29,12)],fur);poly([(36,12),(49,3),(48,17)],fur)
 step=0 if boss else [0,2,0,-2][f%4]
 rect((23+step,53,31+step,60),P['gold']);rect((39-step,53,48-step,60),P['gold']);rect((28,20,30,23),P['rose'] if boss else P['ink']);rect((40,20,42,23),P['gold']);rect((33,27,37,28),P['cream'])
 ellipse((3,35,20,54),fur);ellipse((6,37,15,48),P['ink']);rect((17,34,50,48),P['purple'] if boss or sentinel else P['blue']);rect((18,36,49,39),P['gold'])
 poly([(21,9),(21,1),(27,6),(33,0),(40,6),(46,1),(46,9)],P['gold']);rect((29,6,36,9),P['rose'])
 if sentinel:rect((24,0,43,3),P['rose'])
 if not boss:rect((50,20-f%2,53,60),P['gold']);poly([(47,20-f%2),(52,11-f%2),(57,20-f%2)],P['light'])
 if boss:
  if f in [2,3]:rect((46,26,61,33),P['cream'])
  if f==4:rect((44,34,61,41),P['gold'])
  if f in [5,7]:ellipse((49,13,62,26),P['rose'])
  if f==6:rect((14,45,51,50),P['rose'])
  if f==8:rect((26,20,44,23),P['rose'])
  if f==9:rect((28,21,43,23),P['blue'])
  if f>=10:rect((26,20,44,23),P['light']);rect((21,1,46,8),P['black'])
  if f==11:ellipse((51,49,61,59),P['gold'])
def throne(d,f):
 d.rectangle((22,8,105,160),fill=P['purple']);d.rectangle((18,4,109,159),outline=P['gold'],width=6);d.polygon([(24,10),(29,0),(43,9),(64,0),(84,9),(100,0),(104,10)],fill=P['gold']);d.rectangle((12,115,115,141),fill=P['gold']);d.rectangle((24,139,103,174),fill=P['stone']);d.rectangle((4,174,123,191),fill=P['gold'])
def background(d,f):
 d.rectangle((0,0,319,179),fill=P['deep']);d.ellipse((218,10,262,54),fill=P['cream'])
 for x in range(0,320,64):
  d.rectangle((x+4,70,x+59,179),fill=P['stone']);d.rectangle((x,53,x+63,73),fill=P['stone'])
  for a in range(x,x+64,16):d.rectangle((a,46,a+7,55),fill=P['stone'])
  d.rectangle((x+23,91,x+37,119),fill=P['ink']);d.rectangle((x+25,94,x+34,112),fill=P['purple'])
def arches(d,f):
 for x in range(0,320,80):
  d.rectangle((x+3,30,x+13,179),fill=P['stone']);d.rectangle((x+1,26,x+17,35),fill=P['gold']);d.arc((x+8,-20,x+87,75),180,360,fill=P['purple'],width=8)
  d.rectangle((x+43,39,x+57,111),fill=P['purple']);d.line((x+45,42,x+54,42),fill=P['gold'],width=2)
def ending(d,f):
 d.rectangle((0,0,319,179),fill='#9cc7b0');d.ellipse((240,12,273,45),fill=P['cream']);d.rectangle((0,140,319,179),fill=P['green'])
 for x in [5,250]:d.rectangle((x,80,x+7,145),fill=P['gold']);d.ellipse((x-12,50,x+23,91),fill=P['green'])
 d.rectangle((165,68,276,148),fill=P['cream']);d.polygon([(150,69),(220,24),(291,69)],fill='#ad6650');d.rectangle((204,95,235,148),fill=P['purple']);d.rectangle((172,90,192,111),fill=P['blue'])
 x=[75,120,135][f];y=120
 d.ellipse((x-22,y-6,x+22,y+18),fill=P['orange']);d.ellipse((x+4,y-22,x+29,y+2),fill=P['orange']);d.polygon([(x+6,y-15),(x+6,y-29),(x+17,y-18)],fill=P['orange']);d.polygon([(x+19,y-18),(x+29,y-29),(x+28,y-12)],fill=P['orange']);d.rectangle((x+18,y-13,x+20,y-10),fill=P['ink']);d.rectangle((x-12,y+14,x-4,y+22),fill=P['orange']);d.rectangle((x+10,y+14,x+18,y+22),fill=P['orange'])
 for a in range(f+1):
  xx=x-20+a*13;d.ellipse((xx,y+8,xx+15,y+16),fill=P['blue']);d.polygon([(xx,y+12),(xx-5,y+8),(xx-5,y+16)],fill=P['blue'])
 if f==2:d.rectangle((205,92,234,148),fill=P['gold']);d.ellipse((197,68,220,91),fill=P['gold']);d.line((222,112,244,101),fill=P['gold'],width=5)
generate('palace-stone',(32,32),1,stone,opaque=True)
generate('palace-gold',(32,32),1,gold)
generate('palace-fragile',(32,32),2,fragile)
generate('palace-banner',(32,96),1,banner)
generate('palace-gate',(128,192),1,gate)
generate('palace-trap',(32,64),2,trap)
generate('palace-arrow',(32,32),1,arrow)
generate('palace-orb',(32,32),4,orb,rate=8)
generate('palace-claw',(128,64),3,claw,rate=10)
generate('palace-shadow',(64,32),4,shadow,rate=8)
generate('palace-spark',(32,32),4,spark,rate=12)
generate('palace-guard',(64,64),4,cat,rate=5)
generate('palace-sentinel',(64,64),4,lambda d,f:cat(d,f,sentinel=True),rate=5)
generate('raja-kucing-hitam',(128,128),12,lambda d,f:cat(d,f,True))
generate('palace-throne',(128,192),1,throne)
generate('palace-background',(320,180),1,background,opaque=True)
generate('palace-arches',(320,180),1,arches)
generate('palace-ending',(320,180),3,ending,opaque=True)
metadata=dict(version=1,palette=P,assets=assets,boss_frames=dict(intro=[0],idle=[1],swipe=[2,3],dash=[4],magic=[5],arena=[6],last_meow=[7],hurt=[8],recovery=[9],defeat=[10,11]),limitations=['Original programmatic pixel art; human animation polish remains open.','Ending uses three original static pixel panels, not a fully animated film.','No final soundtrack or voice acting.'])
(OUT/'manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
contact=Image.new('RGB',(1024,1620),P['ink']);d=ImageDraw.Draw(contact)
for i,a in enumerate(assets):
 im=Image.open(OUT/f"{a['key']}.png");im.thumbnail((490,140),Image.Resampling.NEAREST)
 x=12+(i%2)*512;y=12+(i//2)*178;d.text((x,y),f"{a['key']} {a['frame_size']} x{a['frame_count']}",fill=P['cream']);contact.paste(im,(x,y+20),im)
contact.save(OUT/'contact-sheet.png')
boss=Image.open(OUT/'raja-kucing-hitam.png');contact=Image.new('RGBA',(512,384),P['ink'])
for i in range(12):contact.paste(boss.crop((i*128,0,(i+1)*128,128)),((i%4)*128,(i//4)*128))
contact.save(OUT/'boss-contact-sheet.png')
print(f'Generated {len(assets)} palace atlases including three ending panels.')
