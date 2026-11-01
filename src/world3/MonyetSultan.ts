export type SultanState = 'telegraph' | 'attack' | 'recovery' | 'cooldown' | 'defeated';
export type SultanAttack = 'banana-fan' | 'ground-slam' | 'monkey-summons';
/** One hit per recovery. No clock runs until the arena is entered, or while paused. */
export class MonyetSultan {
  health = 9;
  state: SultanState = 'telegraph';
  elapsed = 0;
  private hitThisWindow = false;
  get phase(): number { return this.health > 6 ? 1 : this.health > 3 ? 2 : 3; }
  get attack(): SultanAttack { return (['banana-fan', 'ground-slam', 'monkey-summons'] as const)[this.phase - 1]; }
  get duration(): number { return { telegraph: 1300, attack: 850, recovery: 1900, cooldown: 700, defeated: Infinity }[this.state]; }
  update(delta: number): SultanState[] {
    if (!Number.isFinite(delta) || delta < 0) throw new Error('Invalid boss timestep');
    if (this.state === 'defeated') return [];
    this.elapsed += delta;
    const transitions: SultanState[] = [];
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
    if (!this.health) { this.state = 'defeated'; this.elapsed = 0; }
    return true;
  }
}
