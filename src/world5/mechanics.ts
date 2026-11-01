import type { StoneDeck } from './definitions';
export function stonePosition(d:StoneDeck,clock:number):{x:number;y:number}{
  const t=clock*2*Math.PI/d.period;
  return {x:d.x+Math.sin(t)*d.rangeX,y:d.y+Math.sin(t)*d.rangeY};
}
/** Shared guard/trap clock. A stalled frame cannot skip its visible warning. */
export class RoyalTrap {
  state:'idle'|'warning'|'fire'='idle';
  elapsed=0;
  update(delta:number,nearby:boolean):boolean {
    if(!Number.isFinite(delta)||delta<0)throw Error('Invalid trap timestep');
    if(!nearby&&this.state==='idle'){this.elapsed=0;return false;}
    this.elapsed+=delta;
    const duration=this.state==='idle'?2200:this.state==='warning'?1100:500;
    if(this.elapsed<duration)return false;
    this.elapsed=0;
    this.state=this.state==='idle'?'warning':this.state==='warning'?'fire':'idle';
    return this.state==='fire';
  }
}
