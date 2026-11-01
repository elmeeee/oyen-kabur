import type { BridgeDefinition, CurrentDefinition } from './definitions';
const timestep = (delta: number): void => { if (!Number.isFinite(delta) || delta < 0) throw new Error('Invalid timestep'); };
/** Horizontal deck stays level: an Arcade body cannot rotate with drawn ropes. */
export function bridgePosition(def: BridgeDefinition, elapsed: number): { x: number; y: number } {
  const angle = Math.sin(elapsed * Math.PI * 2 / def.period) * 0.32;
  return { x: def.x + Math.sin(angle) * def.amplitude, y: def.y - (1 - Math.cos(angle)) * def.amplitude };
}
export class FragilePlatform {
  state: 'solid' | 'warning' | 'absent' = 'solid';
  elapsed = 0;
  constructor(readonly warningMs: number, readonly respawnMs: number) {
    if (warningMs < 500 || respawnMs < 1000) throw new Error('Unfair fragile timing');
  }
  touch(): void { if (this.state === 'solid') { this.state = 'warning'; this.elapsed = 0; } }
  update(delta: number, occupied: boolean): void {
    timestep(delta);
    if (this.state === 'solid') return;
    this.elapsed += delta;
    if (this.state === 'warning' && this.elapsed >= this.warningMs) { this.state = 'absent'; this.elapsed = 0; }
    else if (this.state === 'absent' && this.elapsed >= this.respawnMs && !occupied) { this.state = 'solid'; this.elapsed = 0; }
  }
}
/** Acceleration is added after input, never a position or input override. */
export function currentImpulse(zone: CurrentDefinition, x: number, y: number, delta: number): { x: number; y: number } {
  timestep(delta);
  const inside = x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
  return inside ? { x: zone.forceX * Math.min(delta, 50) / 1000, y: zone.forceY * Math.min(delta, 50) / 1000 } : { x: 0, y: 0 };
}
export class MonkeyAttack {
  state: 'idle' | 'warning' = 'idle';
  elapsed = 0;
  update(delta: number, inRange: boolean): boolean {
    timestep(delta);
    if (!inRange) { this.elapsed = 0; this.state = 'idle'; return false; }
    this.elapsed += delta;
    if (this.state === 'idle' && this.elapsed >= 2200) { this.state = 'warning'; this.elapsed = 0; }
    if (this.state === 'warning' && this.elapsed >= 950) { this.state = 'idle'; this.elapsed = 0; return true; }
    return false;
  }
}
