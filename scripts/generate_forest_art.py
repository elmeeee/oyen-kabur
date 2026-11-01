#!/usr/bin/env python3
"""Original deterministic pixel art and synthesized SFX. No downloaded artwork."""
import json, math, struct, wave
from pathlib import Path
from PIL import Image, ImageDraw
OUT=Path(__file__).resolve().parents[1]/'public/assets/forest'
OUT.mkdir(parents=True,exist_ok=True)
P=dict(ink='#193833',deep='#244e43',green='#41784e',leaf='#73aa5d',light='#b8cf78',cream='#f5dfaa',brown='#77513d',gold='#e7ac42',blue='#529eaa',foam='#b1e4cf')
assets=[]
def generate(key,size,count,paint,animation=None,opaque=False):
 sheet=Image.new('RGBA',(size[0]*count,size[1]))
 for f in range(count):
  cell=Image.new('RGBA',size);paint(ImageDraw.Draw(cell),f);sheet.paste(cell,(f*size[0],0))
 sheet.save(OUT/f'{key}.png')
 a=dict(key=key,path=f'assets/forest/{key}.png',frame_size=list(size),frame_count=count,kind='spritesheet',origin=[.5,.5],opaque=opaque,status='runtime-original-programmatic')
 if animation:a['animation']=animation
 assets.append(a)
def earth(d,f):
 d.rectangle((0,0,31,31),fill=P['brown']);d.rectangle((0,0,31,7),fill=P['green'])
 for x,y in [(2,2),(14,1),(25,4),(8,20),(23,26)]:d.line((x,y,x+4,y-1),fill=P['leaf'] if y<8 else P['gold'],width=2)
def bamboo(d,f):
 d.rectangle((0,2,31,13),fill=P['ink']);d.rectangle((0,3,31,10),fill=P['leaf'])
 for x in [5,22]: d.line((x,3,x,11),fill=P['cream'],width=2)
 d.line((0,12,31,12),fill=P['green'])
def fragile(d,f):
 bamboo(d,f)
 for x in range(4,32,9):d.line((x,4,x+3,8,x,12),fill=P['brown'] if f==0 else '#ef8054',width=2)
def rock(d,f):
 d.polygon([(0,9),(5,2),(23,1),(31,9),(31,31),(0,31)],fill=P['deep']);d.line((4,7,24,5,28,9),fill=P['foam'],width=3)
 for x in range(2,30,8):d.line((x,15,x+5,15),fill=P['blue'],width=2)
def foliage(d,f):
 for x,y in [(5,30),(30,10),(60,30),(18,66),(52,62)]:
  d.polygon([(x,y+14),(x+20,y),(x+33,y+12),(x+16,y+27)],fill=P['green']);d.line((x+2,y+14,x+29,y+12),fill=P['leaf'],width=2)
def prop(d,f):
 for x in [8,22,40,52]:
  d.rectangle((x,0,x+7,95),fill=P['green']);d.rectangle((x+2,0,x+3,95),fill=P['leaf'])
  for y in range(10,96,24):d.rectangle((x-1,y,x+8,y+2),fill=P['light'])
 for x,y in [(3,20),(30,40),(44,8)]:d.polygon([(x,y),(x+20,y-12),(x+12,y+2)],fill=P['leaf'])
def banana(d,f):
 d.arc((4,3,27,26),0,155,fill=P['ink'],width=9);d.arc((4,1,26,24),0,155,fill=P['gold'],width=6);d.rectangle((25,11,28,15),fill=P['brown'])
def monkey(d,f,boss=False):
 s=2 if boss else 1;off=[0,-1,1,-2][f%4]*s
 def box(coords,fill):d.rectangle(tuple(int(v*s) for v in coords),fill=fill)
 def ellipse(coords,fill):d.ellipse(tuple(int(v*s) for v in coords),fill=fill)
 # Feet remain at y=60 in every frame. Hand/face/body poses distinguish attacks.
 ellipse((5,30,28,55),P['brown']);ellipse((8,33,23,49),P['ink'])
 ellipse((18,25+off/s,49,57),P['brown']);ellipse((24,31,43,52),P['gold'] if boss else P['cream'])
 for x in [22,39]:box((x,53,x+9,60),P['ink'])
 ellipse((12,12,24,29),P['brown']);ellipse((43,12,55,29),P['brown'])
 ellipse((19,8+off/s,49,34+off/s),P['brown']);ellipse((23,15+off/s,46,32+off/s),P['cream'])
 for x in [28,40]:box((x,18+off/s,x+2,21+off/s),P['ink'])
 box((31,27+off/s,39,28+off/s),P['ink'])
 if f in (2,3):box((45,13,54,21),P['brown']);box((48,10,58,14),P['gold'])
 else:box((45,34,54,42),P['brown'])
 if boss:
  d.polygon([(42,19),(42,4),(53,12),(66,2),(77,12),(90,4),(88,19)],fill=P['gold']);d.rectangle((44,17,88,22),fill=P['cream']);d.rectangle((64,10,69,16),fill='#ed7963')
  if f==4:box((23,42,51,49),P['gold']) # slam fists
  if f==5:box((9,29,18,37),P['cream']) # summon gesture
  if f==6:box((28,18,42,21),'#ed7963') # hurt/closed eyes
  if f==7:box((25,20,44,22),P['blue']) # recovery tired eyes
  if f==8:box((24,18,44,21),P['cream']) # surrendered

def water(d,f):
 for y in range(2,64,12):
  x=(y*3+f*6)%24
  d.rectangle((x,y,x+6,y+6),fill=P['blue']);d.line((x,y,x+4,y),fill=P['foam'],width=2)
 d.polygon([(8,26),(22,26),(18,22),(22,26),(18,30)],fill=P['foam'])
def waveart(d,f):
 for x in range(0,64,8):d.rectangle((x,18-(x+f*4)%12,x+6,30),fill=P['gold']);d.point((x+2,16-(x+f*4)%12),fill=P['cream'])
def background(d,f):
 d.rectangle((0,0,319,179),fill=P['deep']);d.ellipse((180,10,256,86),fill='#5c9273')
 for x in range(0,320,27):
  d.rectangle((x,15+(x%5)*8,x+6,179),fill='#34664f');d.rectangle((x+2,20,x+3,179),fill='#497e59')
  for y in range(30,180,32):d.line((x,y,x+7,y),fill='#699864',width=2)
  d.polygon([(x,50),(x+23,34),(x+10,56)],fill='#497e59')
def mist(d,f):
 for x,y in [(0,45),(75,70),(160,35),(245,70)]:d.ellipse((x,y,x+100,y+50),fill=(160,207,173,45))
 d.rectangle((0,130,319,179),fill=(160,207,173,20))
def gate(d,f):
 for x in [5,82]:d.rectangle((x,0,x+8,127),fill=P['leaf'])
 for y in [5,28]:d.rectangle((0,y,95,y+7),fill=P['gold'])
 d.rectangle((19,12,76,32),fill=P['brown']);d.line((25,22,70,22),fill=P['cream'],width=3)
anim=lambda rate:dict(frame_rate=rate,repeat=-1)
generate('forest-earth',(32,32),1,earth,opaque=True)
generate('forest-bamboo',(32,32),1,bamboo)
generate('forest-fragile',(32,32),2,fragile)
generate('forest-rock',(32,32),1,rock)
generate('forest-foliage',(96,96),1,foliage)
generate('forest-stalks',(64,96),1,prop)
generate('forest-banana',(32,32),1,banana)
generate('forest-monkey',(64,64),4,lambda d,f:monkey(d,f),anim(5))
generate('monyet-sultan',(128,128),9,lambda d,f:monkey(d,f,True))
generate('forest-water',(32,64),4,water,anim(8))
generate('forest-shockwave',(64,32),4,waveart,anim(10))
generate('forest-background',(320,180),1,background,opaque=True)
generate('forest-mist',(320,180),1,mist)
generate('forest-gate',(96,128),1,gate)
# Quiet original PCM tones: no sampled or licensed content.
audio=[]
for key,start,end,duration in [('forest-crack',180,50,.18),('forest-boss-hit',440,160,.16),('forest-roar',130,55,.32),('forest-clear',440,880,.4)]:
 rate=22050;frames=[];phase=0
 for n in range(int(rate*duration)):
  t=n/rate;freq=start+(end-start)*t/duration;phase+=2*math.pi*freq/rate
  envelope=min(1,t/.008)*(1-t/duration)**2
  frames.append(struct.pack('<h',int(32767*.18*envelope*(math.sin(phase)+.2*math.sin(phase*2))/1.2)))
 with wave.open(str(OUT/f'{key}.wav'),'wb') as out:out.setparams((1,2,rate,0,'NONE','not compressed'));out.writeframes(b''.join(frames))
 audio.append(dict(key=key,path=f'assets/forest/{key}.wav',sample_rate=rate,channels=1))
metadata=dict(version=1,palette=P,assets=assets,audio=audio,boss_frames=dict(idle=[0,1],banana=[2,3],slam=[4],summon=[5],hurt=[6],recovery=[7],defeated=[8]),limitations=['Original programmatic pixel artwork; requires human art-direction and animation polish.','No background music.','Arcade bridge decks stay horizontal; ropes swing, collision does not rotate.'])
(OUT/'manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
contact=Image.new('RGB',(1024,1200),P['ink']);d=ImageDraw.Draw(contact)
for i,a in enumerate(assets):
 im=Image.open(OUT/(a['key']+'.png'));im.thumbnail((490,128),Image.Resampling.NEAREST)
 x=12+(i%2)*512;y=12+(i//2)*165;d.text((x,y),f"{a['key']} {a['frame_size']} x{a['frame_count']}",fill=P['cream']);contact.paste(im,(x,y+20),im)
contact.save(OUT/'contact-sheet.png')
# Full-size boss poses, so each 128px animation frame can be reviewed.
boss=Image.open(OUT/'monyet-sultan.png');sheet=Image.new('RGBA',(384,384),P['ink'])
for i in range(9):sheet.paste(boss.crop((i*128,0,(i+1)*128,128)),((i%3)*128,(i//3)*128))
sheet.save(OUT/'boss-contact-sheet.png')
print(f'Generated {len(assets)} original forest atlases and {len(audio)} PCM effects.')
