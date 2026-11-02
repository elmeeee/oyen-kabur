export type KingState='intro'|'telegraph'|'attack'|'recovery'|'cooldown'|'defeat'|'defeated';
export type KingAttack='claw-swipe'|'royal-dash'|'shadow-magic'|'dark-kingdom';
/** Deterministic final encounter. Telegraphs expose a fixed attack before it executes. */
export class RajaKucingHitam {
  health:number;
  readonly maxHealth:number;
  state:KingState='intro';
  elapsed=0;
  cycle=0;
  private hitThisWindow=false;
  constructor(readonly sentinel=false){this.maxHealth=sentinel?3:12;this.health=this.maxHealth;}
  get phase():number{return this.sentinel?1:Math.min(4,1+Math.floor((12-this.health)/3));}
  get attack():KingAttack {
    if(this.phase===2)return 'shadow-magic';
    if(this.phase===3)return 'dark-kingdom';
    if(this.phase===4)return (['royal-dash','shadow-magic','dark-kingdom'] as const)[this.cycle%3];
    return this.cycle%2?'royal-dash':'claw-swipe';
  }
  get duration():number {
    return {intro:this.sentinel?1000:2400,telegraph:this.phase===4?1100:1500,attack:900,recovery:this.phase===4?1500:1800,cooldown:this.phase===4?400:650,defeat:1200,defeated:Infinity}[this.state];
  }
  update(delta:number):KingState[] {
    if(!Number.isFinite(delta)||delta<0)throw Error('Invalid boss timestep');
    if(this.state==='defeated')return [];
    this.elapsed+=delta;
    const transitions:KingState[]=[];
    while(this.elapsed>=this.duration){
      this.elapsed-=this.duration;
      if(this.state==='intro')this.state='telegraph';
      else if(this.state==='telegraph')this.state='attack';
      else if(this.state==='attack'){this.state='recovery';this.hitThisWindow=false;}
      else if(this.state==='recovery')this.state='cooldown';
      else if(this.state==='cooldown'){this.state='telegraph';this.cycle++;}
      else if(this.state==='defeat')this.state='defeated';
      transitions.push(this.state);
    }
    return transitions;
  }
  hit():boolean {
    if(this.state!=='recovery'||this.hitThisWindow)return false;
    this.hitThisWindow=true;this.health--;
    if(this.health===0){this.state='defeat';this.elapsed=0;}
    return true;
  }
}
