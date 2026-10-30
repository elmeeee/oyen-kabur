import { levels } from './registry';
export interface RecordData { completed: boolean; bestScore: number; stars: number; fish: number }
export interface SaveData { version: 1; records: Record<string, RecordData>; currency: number }
export interface StorageAdapter { getItem(key: string): string | null; setItem(key: string, value: string): void }
const empty = (): SaveData => ({ version: 1, records: {}, currency: 0 });
export class SaveManager {
  data = empty();
  persistent = true;
  constructor(private storage?: StorageAdapter) {
    try {
      this.storage ??= localStorage;
      const raw: unknown = JSON.parse(this.storage.getItem('oyen-progression') ?? 'null');
      if (!raw || typeof raw !== 'object' || !('version' in raw) || raw.version !== 1) return;
      const candidate = raw as Partial<SaveData>;
      for (const level of levels) {
        const r = candidate.records?.[level.id];
        if (!r || r.completed !== true || !Number.isInteger(r.bestScore) || r.bestScore < 0 || r.bestScore > level.fish.length * 10 || !Number.isInteger(r.stars) || r.stars < 1 || r.stars > 3 || !Number.isInteger(r.fish) || r.fish < 0 || r.fish > level.fish.length) continue;
        this.data.records[level.id] = { ...r };
      }
      this.recalculate();
    } catch { this.persistent = false; }
  }
  recalculate(): void {
    this.data.currency = levels.reduce((sum, l) => sum + (this.data.records[l.id]?.completed ? l.reward + this.data.records[l.id].fish : 0), 0);
  }
  save(): void { this.recalculate(); try { if (!this.storage) throw new Error(); this.storage.setItem('oyen-progression', JSON.stringify(this.data)); } catch { this.persistent = false; } }
  reset(): void { this.data = empty(); this.save(); }
}
