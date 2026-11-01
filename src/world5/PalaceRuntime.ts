import Phaser from 'phaser';
import type { LevelDefinition } from '../progression/registry';
import { FragilePlatform } from '../world3/mechanics';
import { windImpulse } from '../world4/mechanics';
import { RajaKucingHitam } from './RajaKucingHitam';
import { RoyalTrap, stonePosition } from './mechanics';
interface Guard {sprite:Phaser.Physics.Arcade.Sprite;home:number;range:number;ranged:boolean;clock:RoyalTrap;label:Phaser.GameObjects.Text}
export class PalaceRuntime {
  readonly boss:RajaKucingHitam;
  readonly decks:Phaser.Physics.Arcade.Sprite[]=[];
  readonly fragile:{sprite:Phaser.Physics.Arcade.Image;model:FragilePlatform}[]=[];
  readonly traps:{clock:RoyalTrap;label:Phaser.GameObjects.Text}[]=[];
  private guards:Guard[]=[];
  private shots=new Set<Phaser.Physics.Arcade.Sprite>();
  private secrets:{sprite:Phaser.GameObjects.TileSprite;revealed:boolean}[]=[];
  private clock=0;
  private bossStarted=false;
  private bossSprite?:Phaser.Physics.Arcade.Sprite;
  private warning:Phaser.GameObjects.Text;
  private health:Phaser.GameObjects.Graphics;
  private introShade:Phaser.GameObjects.Rectangle;
  private ghost?:Phaser.GameObjects.Sprite;
  private dais?:Phaser.Physics.Arcade.Image;
  private lanes:Phaser.GameObjects.TileSprite[]=[];
  private dashStart=0;
  private dashEnd=0;
  private facing=1;
  private hurtUntil=0;
  private completed=false;
  plannedX=0;
  constructor(private scene:Phaser.Scene,private level:LevelDefinition,private player:Phaser.Physics.Arcade.Sprite,private hurt:()=>void,private victory:()=>void){
    const p=level.palace!,e=p.encounter;
    this.boss=new RajaKucingHitam(e?.kind==='sentinel');
    this.warning=scene.add.text(480,88,'',{fontFamily:'monospace',fontSize:'17px',color:'#f5dfaa',backgroundColor:'#211e35',align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(26);
    this.health=scene.add.graphics().setScrollFactor(0).setDepth(27);
    this.introShade=scene.add.rectangle(480,270,960,540,0x211e35,.6).setScrollFactor(0).setDepth(24).setVisible(false);
    for(let x=100;x<level.width;x+=320)scene.add.image(x,180,'palace-banner').setDepth(1);
    for(const cp of p.checkpoints){scene.add.image(cp.x,cp.y-35,'palace-banner').setScale(.45).setDepth(2);scene.add.text(cp.x,cp.y-70,'⚑',{color:'#f5dfaa',fontSize:'18px'}).setOrigin(.5);}
    for(const d of p.decks){
      const pos=stonePosition(d,0),sprite=scene.physics.add.sprite(pos.x,pos.y+16,'palace-gold').setDisplaySize(d.width,32).setImmovable(true).setFriction(1,0);
      sprite.body.setAllowGravity(false).setDirectControl(true);sprite.setSize(32,12).setOffset(0,0);
      sprite.body.checkCollision.down=false;sprite.body.checkCollision.left=false;sprite.body.checkCollision.right=false;
      scene.physics.add.collider(player,sprite);this.decks.push(sprite);
    }
    for(const d of p.fragile){
      const sprite=scene.physics.add.staticImage(d.x+d.width/2,d.y+7,'palace-fragile').setDisplaySize(d.width,16).refreshBody();
      const model=new FragilePlatform(1000,3500);
      scene.physics.add.collider(player,sprite,()=>{if(player.body!.touching.down)model.touch();});this.fragile.push({sprite,model});
    }
    for(const g of p.guards){
      if(g.ranged){const perch=scene.physics.add.staticImage(g.x,g.y+36,'palace-gold').setDisplaySize(80,16).refreshBody();scene.physics.add.collider(player,perch);}
      const sprite=scene.physics.add.sprite(g.x,g.y,'palace-guard').setImmovable(true).setSize(28,30).setOffset(18,30);sprite.body.setAllowGravity(false);
      const clock=new RoyalTrap(),label=scene.add.text(g.x,g.y-54,'',{fontSize:'15px',color:'#f5dfaa',backgroundColor:'#352c52'}).setOrigin(.5).setDepth(9);
      scene.physics.add.overlap(player,sprite,()=>this.hurt());this.guards.push({sprite,home:g.x,range:g.range,ranged:g.ranged,clock,label});
    }
    for(const a of p.arrows){scene.add.image(a.x,a.y,'palace-trap').setFlipX(a.direction<0);this.traps.push({clock:new RoyalTrap(),label:scene.add.text(a.x,a.y-65,'',{fontSize:'15px',color:'#f5dfaa',backgroundColor:'#352c52'}).setOrigin(.5).setDepth(9)});}
    for(const s of p.secrets)this.secrets.push({sprite:scene.add.tileSprite(s.x,s.y,s.width,s.height,'palace-stone').setOrigin(0).setDepth(8),revealed:false});
    for(const g of p.gusts)scene.add.text(g.x+20,g.y+30,'← SHADOW WIND',{fontSize:'16px',color:'#f5dfaa',backgroundColor:'#352c52'});
    if(e){
      const sentinel=e.kind==='sentinel';
      this.bossSprite=scene.physics.add.sprite(e.x,e.y,sentinel?'palace-sentinel':'raja-kucing-hitam').setImmovable(true).setDepth(5);
      (this.bossSprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setDirectControl(true);this.bossSprite.setSize(sentinel?28:64,sentinel?30:52).setOffset(sentinel?18:32,sentinel?30:68);
      scene.physics.add.overlap(player,this.bossSprite,()=>{if(this.boss.state==='attack')this.hurt();});
      if(!sentinel){
        scene.add.image(e.x,386,'palace-throne').setDepth(1);
        this.ghost=scene.add.sprite(e.x,e.y,'raja-kucing-hitam',5).setAlpha(.3).setVisible(false).setDepth(4);
        this.dais=scene.physics.add.staticImage(e.arenaLeft+200,428,'palace-gold').setDisplaySize(128,16).refreshBody();
        this.dais.setVisible(false);this.dais.body!.enable=false;scene.physics.add.collider(player,this.dais);
        for(const x of [e.arenaLeft+80,e.x+150])this.lanes.push(scene.add.tileSprite(x,456,110,26,'palace-shadow').setOrigin(0).setVisible(false).setDepth(7));
      }
      this.plan();
    }
    scene.events.once('shutdown',()=>{this.shots.clear();this.guards=[];});
  }
  get defeated():boolean{return this.boss.state==='defeated';}
  get controlsLocked():boolean{return this.bossStarted&&(this.boss.state==='intro'||this.boss.state==='defeat'||(this.boss.state==='defeated'&&!this.boss.sentinel));}
  private shot(x:number,y:number,vx:number,key:'palace-arrow'|'palace-orb'|'palace-claw',vy=0):void{
    const s=this.scene.physics.add.sprite(x,y,key).setDepth(7);s.body.setAllowGravity(false);
    if(key==='palace-claw')s.setSize(92,20).setOffset(18,24);else s.setSize(20,18).setOffset(6,7);
    if(key==='palace-orb'||key==='palace-claw')s.play(key);
    s.setVelocity(vx,vy).setData('expiry',this.clock+(key==='palace-claw'?300:4500));this.shots.add(s);
    const overlap=this.scene.physics.add.overlap(this.player,s,()=>{this.hurt();s.destroy();this.shots.delete(s);});s.once('destroy',()=>overlap.destroy());
  }
  private plan():void{
    if(!this.bossSprite)return;
    const e=this.level.palace!.encounter!;
    this.plannedX=this.boss.attack==='shadow-magic'?e.x-(this.boss.cycle%2?160:0):this.bossSprite.x;
    this.facing=this.player.x>=this.plannedX?1:-1;
    this.dashStart=this.bossSprite.x;
    this.dashEnd=Phaser.Math.Clamp(this.dashStart+this.facing*160,e.arenaLeft+70,this.level.width-150);
    this.ghost?.setPosition(this.plannedX,e.y).setVisible(this.boss.attack==='shadow-magic');
  }
  update(delta:number):void{
    this.clock+=delta;
    const p=this.level.palace!,body=this.player.body as Phaser.Physics.Arcade.Body;
    p.decks.forEach((d,i)=>{const pos=stonePosition(d,this.clock);this.decks[i].setPosition(pos.x,pos.y+16);});
    for(const f of this.fragile){f.model.update(delta,Math.abs(this.player.x-f.sprite.x)<f.sprite.displayWidth/2+20&&Math.abs(this.player.y-f.sprite.y)<65);f.sprite.body!.enable=f.model.state!=='absent';f.sprite.setVisible(f.model.state!=='absent').setFrame(f.model.state==='warning'?1:0).setAlpha(f.model.state==='warning'?.65+.35*Math.sin(this.clock/60):1);}
    for(const g of p.gusts)body.velocity.x+=windImpulse(g,this.player.x,this.player.y,delta);
    for(const s of this.secrets)if(!s.revealed&&Math.abs(this.player.x-s.sprite.x-s.sprite.width/2)<s.sprite.width/2+30&&Math.abs(this.player.y-s.sprite.y-s.sprite.height/2)<90){s.revealed=true;this.scene.tweens.add({targets:s.sprite,alpha:.12,duration:250});this.scene.add.text(s.sprite.x,s.sprite.y-20,'PINTU RAHASIA! + fish',{fontSize:'15px',color:'#f5dfaa'}).setDepth(10);}
    for(const g of this.guards){
      g.sprite.setX(g.home+Math.sin(this.clock/1100)*g.range).setFrame(Math.floor(this.clock/220)%4).setFlipX(this.player.x<g.sprite.x);g.label.setX(g.sprite.x);
      const fire=g.clock.update(delta,Math.abs(this.player.x-g.sprite.x)<520&&Math.abs(this.player.y-g.sprite.y)<230);
      g.label.setText(g.ranged&&g.clock.state==='warning'?'MAGIC! ↓':'');
      if(fire&&g.ranged){const dx=this.player.x-g.sprite.x,dy=this.player.y-g.sprite.y,len=Math.max(1,Math.hypot(dx,dy));this.shot(g.sprite.x,g.sprite.y,dx/len*170,'palace-orb',dy/len*170);}
    }
    this.traps.forEach((t,i)=>{const a=p.arrows[i],fire=t.clock.update(delta,Math.abs(this.player.x-a.x)<600);t.label.setText(t.clock.state==='warning'?'ARROW! →':'');if(fire)this.shot(a.x,a.y,a.direction*220,'palace-arrow');});
    for(const s of this.shots)if(!s.active||this.clock>s.getData('expiry')||s.y>650||s.y<p.top-150||s.x<0||s.x>this.level.width){s.destroy();this.shots.delete(s);}
    if(!p.encounter||!this.bossSprite)return;
    if(!this.bossStarted&&this.player.x<p.encounter.arenaLeft)return;
    if(!this.bossStarted){this.bossStarted=true;this.plan();}
    const transitions=this.boss.update(delta),state=this.boss.state,sentinel=this.boss.sentinel;
    if(transitions.includes('telegraph'))this.plan();
    if(transitions.includes('attack')){
      this.ghost?.setVisible(false);
      if(this.boss.attack==='claw-swipe')this.shot(this.bossSprite.x+this.facing*75,450,0,'palace-claw');
      if(this.boss.attack==='shadow-magic'){
        this.bossSprite.setPosition(this.plannedX,p.encounter.y);
        for(const sign of [-1,1])this.shot(this.bossSprite.x+sign*45,450,sign*(this.boss.phase===4?210:180),'palace-orb');
      }
    }
    if(state==='attack'&&this.boss.attack==='royal-dash')this.bossSprite.setX(Phaser.Math.Linear(this.dashStart,this.dashEnd,Math.min(1,this.boss.elapsed/900)));
    const arena=this.boss.phase>=3&&this.boss.health>0;
    if(this.dais){this.dais.setVisible(arena);this.dais.body!.enable=arena;}
    for(const lane of this.lanes){
      const active=arena&&this.boss.attack==='dark-kingdom'&&(state==='telegraph'||state==='attack');
      lane.setVisible(active).setFrame(Math.floor(this.clock/130)%4).setAlpha(state==='telegraph'?.35:1);
      if(active&&state==='attack'&&body.right>lane.x&&body.left<lane.x+lane.width&&body.bottom>450)this.hurt();
    }
    this.introShade.setVisible(state==='intro');
    this.warning.setPosition(480,state==='intro'?240:88).setFontSize(state==='intro'?22:17);
    if(state==='intro'){
      this.bossSprite.setFrame(0);
      this.player.setVelocityX(0);
      this.warning.setText(sentinel?'ROYAL SENTINEL\nBreak the final guard!':'RAJA KUCING HITAM\n"The fish belong to the kingdom!"\nOYEN: "Aku pulang!"');
    }else if(state==='defeat'||state==='defeated'){
      this.warning.setText(sentinel?'SENTINEL MENYERAH! • Exit →':'RAJA MENYERAH! • Oyen can go home.');this.health.clear();
      this.bossSprite.setFrame(sentinel?3:state==='defeat'&&this.boss.elapsed<600?10:11).setAlpha(state==='defeat'?.6+.4*Math.cos(this.boss.elapsed/130):1).clearTint();
    }else{
      const names=['Royal Claws','Shadow Magic','Dark Kingdom','Last Meow'];
      const cues={'claw-swipe':'CLAW → Jump the swipe','royal-dash':'DASH → Jump as Raja approaches','shadow-magic':'MAGIC → Ghost marks teleport; jump low orbs','dark-kingdom':'SHADOW FLOOR → Leave purple lanes or jump'};
      this.warning.setText(`${sentinel?'ROYAL SENTINEL':'RAJA KUCING HITAM'} • ${sentinel?'':names[this.boss.phase-1]+' • '}HP ${this.boss.health}/${this.boss.maxHealth}\n${state==='recovery'?'EXPOSED! Touch once to hit':state==='telegraph'?cues[this.boss.attack]:state.toUpperCase()}`);
      this.health.clear().fillStyle(0x352c52).fillRect(330,120,300,8).fillStyle(0xd7b16b).fillRect(330,120,300*this.boss.health/this.boss.maxHealth,8);
      const frame=sentinel?Math.floor(this.clock/220)%4:this.clock<this.hurtUntil?8:state==='recovery'?9:state==='attack'?({'claw-swipe':2+Math.floor(this.clock/130)%2,'royal-dash':4,'shadow-magic':5,'dark-kingdom':6}[this.boss.attack]):this.boss.phase===4?7:1;
      this.bossSprite.setFrame(frame).setTint(state==='recovery'?0xb1e4cf:0xffffff);
    }
    if(state==='recovery'&&Math.abs(this.player.x-this.bossSprite.x)<60&&Math.abs(this.player.y-this.bossSprite.y)<65&&this.boss.hit()){
      this.hurtUntil=this.clock+220;this.player.setVelocityY(-200);
      const spark=this.scene.add.sprite(this.bossSprite.x,this.bossSprite.y,'palace-spark').setDepth(9).play({key:'palace-spark',repeat:0});
      spark.once('animationcomplete',()=>spark.destroy());
      if(this.boss.health===0){for(const shot of this.shots)shot.destroy();this.shots.clear();this.ghost?.setVisible(false);}
    }
    if(this.defeated&&!sentinel&&!this.completed){this.completed=true;this.victory();}
  }
}
