export type CaptainState = 'telegraph' | 'attack' | 'recovery' | 'cooldown' | 'defeated';
export type CaptainAttack = 'anchor-throw' | 'water-waves' | 'ship-charge';
/** Nine hits, three distinct phases, one hit per exposed recovery window. */
export class KaptenBebek {
  health = 9;
  state: CaptainState = 'telegraph';
  elapsed = 0;
  private hitThisWindow = false;
  get phase(): number { return this.health > 6 ? 1 : this.health > 3 ? 2 : 3; }
  get attack(): CaptainAttack { return (['anchor-throw', 'water-waves', 'ship-charge'] as const)[this.phase - 1]; }
  get duration(): number { return { telegraph: 1500, attack: 1100, recovery: 2000, cooldown: 650, defeated: Infinity }[this.state]; }
  update(delta: number): CaptainState[] {
    if (!Number.isFinite(delta) || delta < 0) throw new Error('Invalid boss timestep');
    if (this.state === 'defeated') return [];
    this.elapsed += delta;
    const transitions: CaptainState[] = [];
    while (this.elapsed >= this.duration) {
      this.elapsed -= this.duration;
      this.state = this.state === 'telegraph' ? 'attack' : this.state === 'attack' ? 'recovery' : this.state === 'recovery' ? 'cooldown' : 'telegraph';
      if (this.state === 'recovery') this.hitThisWindow = false;
      transitions.push(this.state);
    }
    return transitions;
  }
  hit(): boolean {
    if (this.state !== 'recovery' || this.hitThisWindow) return false;
    this.hitThisWindow = true;
    this.health--;
    if (this.health === 0) { this.state = 'defeated'; this.elapsed = 0; }
    return true;
  }
}
