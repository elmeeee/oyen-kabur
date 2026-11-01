/** Deterministic three-phase encounter clock. Caller advances only while active. */
export type BossState = 'telegraph' | 'attack' | 'recovery' | 'defeated';
export type Attack = 'fish-volley' | 'cart-charge' | 'falling-nets';
const MAX_TIMESTEP = 250;

export class JuraganLele {
  health = 6;
  state: BossState = 'telegraph';
  elapsed = 0;
  private damagedThisRecovery = false;

  constructor() {
    this.diagnostic('initialized');
  }

  get phase(): number { return this.health > 4 ? 1 : this.health > 2 ? 2 : 3; }
  get attack(): Attack { return ['fish-volley', 'cart-charge', 'falling-nets'][this.phase - 1] as Attack; }
  get vulnerable(): boolean { return this.state === 'recovery'; }
  get duration(): number { return this.state === 'telegraph' ? 1400 : this.state === 'attack' ? 1000 : 1800; }

  update(delta: number): BossState[] {
    if (!Number.isFinite(delta) || delta < 0) throw new Error('Invalid boss timestep');
    const transitions: BossState[] = [];
    if (this.state === 'defeated') return transitions;
    this.elapsed += Math.min(delta, MAX_TIMESTEP);
    while (this.elapsed >= this.duration) {
      this.elapsed -= this.duration;
      this.state = this.state === 'telegraph' ? 'attack' : this.state === 'attack' ? 'recovery' : 'telegraph';
      this.damagedThisRecovery = false;
      transitions.push(this.state);
      this.diagnostic('state changed');
    }
    return transitions;
  }

  hit(): boolean {
    if (!this.vulnerable || this.damagedThisRecovery || this.health <= 0) return false;
    this.damagedThisRecovery = true; this.health--;
    this.diagnostic('damage received');
    if (this.health === 0) {
      this.state = 'defeated';
      this.elapsed = 0;
      this.diagnostic('defeated');
    }
    return true;
  }

  private diagnostic(event: string): void {
    if (import.meta.env?.DEV) {
      console.debug('[Juragan Lele]', {
        event,
        hp: this.health,
        phase: this.phase,
        state: this.state,
        vulnerable: this.vulnerable,
      });
    }
  }
}
