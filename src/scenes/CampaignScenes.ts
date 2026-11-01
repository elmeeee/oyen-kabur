import Phaser from 'phaser';
import { progression } from '../progression/ProgressionManager';
import { button, label } from './presentation';
const captions=[
  'Raja lowers his crown. Oyen keeps the fish.\nThe road home is quiet at last.',
  'OYEN PULANG!\nSafe at home, with every earned fish remembered.',
  'A warm welcome. A well-earned dinner.\nTomorrow, the kampung can wait.',
];
export class EndingScene extends Phaser.Scene {
  private panel=0;
  private art!:Phaser.GameObjects.Image;
  private caption!:Phaser.GameObjects.Text;
  private timer?:Phaser.Time.TimerEvent;
  constructor(){super('EndingScene');}
  create():void {
    if(!progression.saves.data.campaign.completed){this.scene.start('WorldMapScene');return;}
    this.panel=0;this.cameras.main.setBackgroundColor('#211e35');
    label(this,480,24,'OYEN KABUR • TAMAT',24).setOrigin(.5);
    this.art=this.add.image(480,235,'palace-ending',0).setScale(2);
    this.caption=label(this,480,438,'',18).setOrigin(.5).setAlign('center');
    label(this,480,512,'ENTER / SPACE / click → Continue',15).setOrigin(.5);
    const next=()=>this.next();
    this.input.keyboard?.on('keydown-ENTER',next);this.input.keyboard?.on('keydown-SPACE',next);this.input.on('pointerdown',next);
    this.events.once('shutdown',()=>{this.input.keyboard?.off('keydown-ENTER',next);this.input.keyboard?.off('keydown-SPACE',next);this.input.off('pointerdown',next);this.timer?.remove();});
    this.show();
  }
  private show():void {
    this.art.setFrame(this.panel);this.caption.setText(captions[this.panel]);
    this.timer?.remove();this.timer=this.time.delayedCall(4000,()=>this.next());
  }
  private next():void {
    this.timer?.remove();
    if(this.panel<2){this.panel++;this.show();return;}
    progression.saves.finishEnding();this.scene.start('CampaignSummaryScene');
  }
}
export class CampaignSummaryScene extends Phaser.Scene {
  constructor(){super('CampaignSummaryScene');}
  create():void {
    this.cameras.main.setBackgroundColor('#211e35');
    label(this,480,65,'OYEN IS HOME!',36).setOrigin(.5);
    const data=progression.saves.data,records=Object.values(data.records);
    label(this,480,180,`${records.length}/25 levels completed\n${records.reduce((n,r)=>n+r.stars,0)}/75 stars\nBest-score total ${records.reduce((n,r)=>n+r.bestScore,0)}\nLifetime fish pickups ${data.collectedFish}\nSpendable fish ${data.currency}`,22).setOrigin(.5).setAlign('center').setLineSpacing(10);
    label(this,480,320,'All completed levels remain available for replay.',17).setOrigin(.5);
    if(!progression.saves.persistent)label(this,480,353,'Storage unavailable: this victory lasts this session.',15).setOrigin(.5);
    button(this,410,'CREDITS →',()=>this.scene.start('CreditsScene'));
    button(this,480,'WORLD MAP',()=>this.scene.start('WorldMapScene'));
  }
}
export class CreditsScene extends Phaser.Scene {
  constructor(){super('CreditsScene');}
  create():void {
    this.cameras.main.setBackgroundColor('#211e35');
    label(this,480,45,'OYEN KABUR • CREDITS',30).setOrigin(.5);
    label(this,480,190,'An Oyen Kabur production\nPhaser 3 • TypeScript • Vite\nOriginal castle art and ending panels: project generators\nShared concept-sheet artwork: project asset sources\nOriginal forest SFX: local synthesis\nThank you for bringing Oyen home!',18).setOrigin(.5).setAlign('center').setLineSpacing(12);
    label(this,480,335,'Thank you for playing this work-in-progress edition.',14).setOrigin(.5);
    button(this,405,'WORLD MAP',()=>this.scene.start('WorldMapScene'));
    button(this,480,'MAIN MENU',()=>this.scene.start('MainMenuScene'));
  }
}
