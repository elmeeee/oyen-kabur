import Phaser from 'phaser';
import { JuraganLele } from './JuraganLele';
import type { LevelDefinition } from '../progression/registry';
export class MarketRuntime {
  readonly boss = new JuraganLele();
  private carts: { sprite: Phaser.Physics.Arcade.Sprite; x: number; range: number }[] = [];
  private shots = new Set<Phaser.Physics.Arcade.Sprite>();
  private clock = 0;
  private nextVolley = 2500;
  private warning: Phaser.GameObjects.Text;
  private bossSprite?: Phaser.GameObjects.Sprite;
  constructor(private scene: Phaser.Scene, private level: LevelDefinition, private player: Phaser.Physics.Arcade.Sprite, private hurt: () => void) {
    const m = level.market!;
    this.warning = scene.add.text(480, 85, '', {fontFamily:'monospace',fontSize:'18px',color:'#fff0bc',backgroundColor:'#203947'}).setOrigin(.5).setScrollFactor(0).setDepth(25);
    for(const c of m.carts) {
      const sprite=scene.physics.add.sprite(c.x,c.y,'market-cart').setImmovable(true);
      sprite.body.setAllowGravity(false);sprite.setSize(60,14).setOffset(2,24);
      sprite.body.checkCollision.down=false;sprite.body.checkCollision.left=false;sprite.body.checkCollision.right=false;
      scene.physics.add.collider(player,sprite);this.carts.push({sprite,x:c.x,range:c.range});
    }
    for(const x of m.vendors) {
      scene.add.sprite(x,450,'market-vendor');
      const crate=scene.physics.add.staticImage(x-90,466,'market-crate');scene.physics.add.collider(player,crate);
    }
    if(level.boss) this.bossSprite=scene.add.sprite(level.goal-170,418,'juragan-lele').setDepth(4);
    scene.events.once('shutdown',()=>this.shots.clear());
  }
  get defeated(): boolean { return this.boss.state==='defeated'; }
  private projectile(x:number,y:number,key:string,vx:number,vy:number):void {
    const shot=this.scene.physics.add.sprite(x,y,key).setDepth(6);
    shot.body.setAllowGravity(false);shot.setSize(key==='market-net'?40:24,key==='market-net'?40:16).setVelocity(vx,vy);
    this.shots.add(shot);this.scene.physics.add.overlap(this.player,shot,()=>{this.hurt();shot.destroy();this.shots.delete(shot);});
  }
  update(delta:number):void {
    this.clock+=delta;
    for(const c of this.carts){const target=c.x+Math.sin(this.clock/1100)*c.range;c.sprite.setVelocityX((target-c.sprite.x)*10);}
    for(const s of this.shots) if(!s.active||Math.abs(s.x-this.player.x)>1100||s.y>650){s.destroy();this.shots.delete(s);}
    const m=this.level.market!;
    if(this.clock>=this.nextVolley){
      this.nextVolley=this.clock+3000;
      for(const x of m.vendors) if(Math.abs(x-this.player.x)<700)this.projectile(x,445,'market-fish',-170,0);
      for(const x of m.nets) if(Math.abs(x-this.player.x)<160){
        const mark=this.scene.add.text(x,this.player.y-90,'NET ↓',{color:'#ffdb70',fontSize:'20px'}).setDepth(10);
        const y=this.player.y;
        this.scene.time.delayedCall(900,()=>{mark.destroy();this.projectile(x,y-180,'market-net',0,190);});
      }
    }
    if(!this.level.boss||!this.bossSprite||this.player.x<this.level.width-650)return;
    const transitions=this.boss.update(delta);
    this.bossSprite.setFrame(this.boss.phase-1);
    this.bossSprite.setY(418 + Math.sin(this.clock/180)*(this.boss.state==='attack'?6:2));
    this.warning.setText(this.defeated?'JURAGAN MENYERAH! Finish →':`Phase ${this.boss.phase} • ${this.boss.state} • ${this.boss.attack}\n${this.boss.state==='recovery'?'Touch Juragan now!':'Keep clear; wait for recovery.'} HP ${this.boss.health}`);
    this.bossSprite.setTint(this.boss.state==='recovery'?0xaaffcc:0xffffff);
    if(transitions.includes('attack')){
      if(this.boss.phase===1)for(const y of [445,365])this.projectile(this.bossSprite.x,y,'market-fish',-210,0);
      if(this.boss.phase===2)this.projectile(this.bossSprite.x,450,'market-cart',-330,0);
      if(this.boss.phase===3)for(const x of [this.player.x-80,this.player.x+80])this.projectile(x,200,'market-net',0,220);
    }
    if(Math.abs(this.player.x-this.bossSprite.x)<65&&Math.abs(this.player.y-this.bossSprite.y)<70){
      if(this.boss.hit())this.player.setVelocityY(-240);
      else if(this.boss.state==='attack')this.hurt();
    }
  }
}
