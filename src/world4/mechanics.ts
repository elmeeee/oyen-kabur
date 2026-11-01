import type { DeckDefinition, WindDefinition } from './definitions';
function timestep(delta: number): void {
  if (!Number.isFinite(delta) || delta < 0) throw new Error('Invalid timestep');
}
/** Level Arcade deck: only translation, never a rotating collision rectangle. */
export function deckPosition(d: DeckDefinition, clock: number): { x: number; y: number } {
  const t = clock * Math.PI * 2 / d.period + d.phase;
  return { x: d.x + Math.sin(t) * d.rangeX, y: d.y + Math.sin(t * (d.kind === 'boat' ? 2 : 1)) * d.rangeY };
}
export function windImpulse(d: WindDefinition, x: number, y: number, delta: number): number {
  timestep(delta);
  return x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height ? d.force * Math.min(delta, 50) / 1000 : 0;
}
/** Fixed location and a full 1.5s warning; no late player tracking or random strikes. */
export class LightningCycle {
  state: 'idle' | 'warning' | 'strike' = 'idle';
  elapsed = 0;
  get duration(): number { return this.state === 'idle' ? 2800 : this.state === 'warning' ? 1500 : 250; }
  update(delta: number, nearby: boolean): void {
    timestep(delta);
    if (this.state === 'idle' && !nearby) { this.elapsed = 0; return; }
    this.elapsed += delta;
    // Keep the warning for a full visible interval even after a stalled frame.
    if (this.elapsed >= this.duration) {
      this.elapsed = 0;
      this.state = this.state === 'idle' ? 'warning' : this.state === 'warning' ? 'strike' : 'idle';
    }
  }
}
