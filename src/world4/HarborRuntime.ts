import Phaser from 'phaser';
import type { LevelDefinition } from '../progression/registry';
import { KaptenBebek } from './KaptenBebek';
import { MovingDeck } from './MovingDeck';
import { LightningCycle, windImpulse } from './mechanics';
interface Sentry {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  elapsed: number;
  warning: boolean;
}
export class HarborRuntime {
  readonly boss = new KaptenBebek();
  readonly decks: MovingDeck[] = [];
  readonly lightning: { x: number; model: LightningCycle; marker: Phaser.GameObjects.Text; bolt: Phaser.GameObjects.TileSprite }[] = [];
  private shots = new Set<Phaser.Physics.Arcade.Sprite>();
  private sentries: Sentry[] = [];
  private clock = 0;
  private bossStarted = false;
  private bossSprite?: Phaser.GameObjects.Sprite;
  private hurtUntil = 0;
  private warning: Phaser.GameObjects.Text;
  private health: Phaser.GameObjects.Graphics;
  private rain?: Phaser.GameObjects.TileSprite;
  private sea: Phaser.GameObjects.TileSprite;
  private windMarks: Phaser.GameObjects.TileSprite[] = [];
  constructor(private scene: Phaser.Scene, private level: LevelDefinition, private player: Phaser.Physics.Arcade.Sprite, private hurt: () => void, private drown: () => void) {
    const h = level.harbor!;
    this.warning = scene.add.text(480, 88, '', {fontFamily:'monospace',fontSize:'17px',color:'#f5dfaa',backgroundColor:'#203947',align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(26);
    this.health = scene.add.graphics().setScrollFactor(0).setDepth(27);
    this.sea = scene.add.tileSprite(0, 510, level.width, 60, 'harbor-wave').setOrigin(0).setDepth(2).setAlpha(.85);
    for (const d of h.decks) this.decks.push(new MovingDeck(scene,d,player));
    for (const cp of h.checkpoints) {
      scene.add.sprite(cp.x,cp.y-20,'harbor-buoy').setScale(.6).setDepth(1).play('harbor-buoy');
      scene.add.text(cp.x,cp.y-65,'⚑',{color:'#f5dfaa',fontSize:'18px'}).setOrigin(.5);
    }
    for (const p of h.water) {
      scene.add.text(p.x+p.width/2,490,'WATER ↓',{fontSize:'12px',color:'#f5dfaa',backgroundColor:'#203947'}).setOrigin(.5).setDepth(5);
    }
    for (let x=300;x<level.width;x+=410) {
      if (level.platforms.some(p=>p.y===482&&x>p.x+20&&x<p.x+p.w-20)) scene.add.image(x,466,'harbor-crate').setDepth(1);
    }
    for (const w of h.wind) {
      const streak=scene.add.tileSprite(w.x,w.y,w.width,w.height,'harbor-rain').setOrigin(0).setAlpha(.15).setDepth(3);
      this.windMarks.push(streak);
      scene.add.text(w.x+30,w.y+60,`${w.force>0?'→':'←'} ANGIN / WIND`,{color:'#f5dfaa',backgroundColor:'#203947',fontSize:'17px'}).setDepth(4);
    }
    if (h.rain) this.rain=scene.add.tileSprite(0,0,960,540,'harbor-rain').setOrigin(0).setScrollFactor(0).setAlpha(.3).setDepth(9);
    for (const x of h.lightning) {
      const marker=scene.add.text(x,405,'',{color:'#f5dfaa',backgroundColor:'#b65f49',fontSize:'17px',align:'center'}).setOrigin(.5).setDepth(11);
      const bolt=scene.add.tileSprite(x,h.top,48,482-h.top,'harbor-lightning').setOrigin(.5,0).setVisible(false).setDepth(10);
      this.lightning.push({x,model:new LightningCycle(),marker,bolt});
    }
    for (const p of h.sailors) {
      const sprite=scene.add.sprite(p.x,p.y,'harbor-sailor').setDepth(4);
      const label=scene.add.text(p.x,p.y-50,'',{color:'#f5dfaa',backgroundColor:'#203947',fontSize:'15px'}).setOrigin(.5).setDepth(10);
      this.sentries.push({sprite,label,elapsed:0,warning:false});
    }
    if (h.boss) this.bossSprite=scene.add.sprite(h.boss.x,h.boss.y,'kapten-bebek').setDepth(4);
    scene.events.once('shutdown',()=>{this.shots.clear();this.sentries=[];});
  }
  get defeated(): boolean { return this.boss.state==='defeated'; }
  private projectile(x:number,y:number,vx:number,key:'harbor-anchor'|'harbor-wave'|'harbor-ship',vy=0):void {
    const s=this.scene.physics.add.sprite(x,y,key).setDepth(6).play(key);
    s.body.setAllowGravity(key==='harbor-anchor');
    if(key==='harbor-anchor') {s.setGravityY(-700);s.setSize(24,24).setOffset(20,20);}
    else if(key==='harbor-wave') s.setSize(44,12).setOffset(10,18);
    else s.setSize(104,24).setOffset(12,24);
    s.setVelocity(vx,vy).setData('expires',this.clock+6000);
    this.shots.add(s);
    const overlap=this.scene.physics.add.overlap(this.player,s,()=>{this.hurt();s.destroy();this.shots.delete(s);});
    s.once('destroy',()=>overlap.destroy());
  }
  /** Update after normal input so wind adds acceleration without replacing controls. */
  update(delta:number):void {
    this.clock+=delta;
    const h=this.level.harbor!, body=this.player.body as Phaser.Physics.Arcade.Body;
    this.sea.setFrame(Math.floor(this.clock/140)%4); this.sea.tilePositionX=this.clock/55;
    for (const deck of this.decks) deck.update(this.clock);
    for (const w of h.wind) body.velocity.x+=windImpulse(w,this.player.x,this.player.y,delta);
    for (let i=0;i<this.windMarks.length;i++) this.windMarks[i].tilePositionX=-this.clock*h.wind[i].force/1800;
    if(this.rain) {this.rain.setFrame(Math.floor(this.clock/90)%4);this.rain.tilePositionY=-this.clock/30;}
    // Water only occupies explicit gaps; a dock or moving boat remains safe above it.
    for(const w of h.water) if(this.player.x>=w.x&&this.player.x<=w.x+w.width&&body.bottom>w.y&&body.top<w.y+w.height) {this.drown();break;}
    for(const l of this.lightning) {
      l.model.update(delta,Math.abs(this.player.x-l.x)<650);
      l.marker.setText(l.model.state==='warning'?'PETIR!\n← MOVE →':l.model.state==='strike'?'⚡':'');
      l.bolt.setVisible(l.model.state==='strike').setFrame(Math.floor(this.clock/70)%3);
      // Fixed warned column. No full-screen flash or camera shake is used.
      if(l.model.state==='strike'&&Math.abs(this.player.x-l.x)<34&&body.bottom>h.top&&body.top<482)this.hurt();
    }
    for(const s of this.sentries) {
      if(Math.abs(this.player.x-s.sprite.x)>550||Math.abs(this.player.y-s.sprite.y)>230){s.elapsed=0;s.warning=false;s.label.setText('');continue;}
      s.elapsed+=delta;
      if(!s.warning&&s.elapsed>=2400){s.warning=true;s.elapsed=0;}
      s.label.setText(s.warning?'ANCHOR! ↓':'');s.sprite.setFlipX(this.player.x<s.sprite.x).setFrame(s.warning?2:Math.floor(this.clock/250)%2);
      if(s.warning&&s.elapsed>=1100){s.warning=false;s.elapsed=0;this.projectile(s.sprite.x,s.sprite.y,Math.sign(this.player.x-s.sprite.x)*170,'harbor-anchor',-130);}
    }
    for(const s of this.shots) {
      if(!s.active||s.y>650||s.y<h.top-200||Math.abs(s.x-this.player.x)>1500||this.clock>s.getData('expires')){s.destroy();this.shots.delete(s);}
      else if(s.texture.key==='harbor-anchor')s.rotation+=delta/180;
    }
    if(!h.boss||!this.bossSprite||this.defeated)return;
    if(!this.bossStarted&&this.player.x<h.boss.arenaLeft)return;
    this.bossStarted=true;
    const transitions=this.boss.update(delta), state=this.boss.state;
    const attackFrame=[2+Math.floor(this.clock/180)%2,4,5][this.boss.phase-1];
    this.bossSprite.setFrame(this.clock<this.hurtUntil?6:state==='recovery'?7:state==='attack'?attackFrame:Math.floor(this.clock/300)%2).setTint(this.clock<this.hurtUntil?0xffb1a0:state==='recovery'?0xb1e4cf:0xffffff);
    const cue=['ANCHOR! Watch its arc →','WAVE! Jump when it approaches →','SHIP! Jump over the bow →'][this.boss.phase-1];
    this.warning.setText(`KAPTEN BEBEK • Phase ${this.boss.phase}/3 • HP ${this.boss.health}/9\n${state==='telegraph'?cue:state==='recovery'?'EXPOSED! Touch Kapten once to hit':state.toUpperCase()}`);
    this.health.clear().fillStyle(0x8d593a).fillRect(345,117,270,8).fillStyle(0xd7b16b).fillRect(345,117,30*this.boss.health,8);
    if(transitions.includes('attack')) {
      if(this.boss.phase===1)this.projectile(h.boss.x-65,410,-210,'harbor-anchor',-170);
      else if(this.boss.phase===2)this.projectile(h.boss.x-70,465,-230,'harbor-wave');
      else this.projectile(h.boss.x-90,450,-285,'harbor-ship');
    }
    if(Math.abs(this.player.x-h.boss.x)<64&&Math.abs(this.player.y-h.boss.y)<65) {
      if(this.boss.hit()) {
        this.hurtUntil=this.clock+230;this.player.setVelocityY(-200);
        if(this.defeated) {
          this.bossSprite.setFrame(8).clearTint();this.health.clear();this.warning.setText('KAPTEN MENYERAH! • Harbor exit →');
          for(const shot of this.shots)shot.destroy();this.shots.clear();
        }
      } else if(state==='attack')this.hurt();
    }
  }
}
