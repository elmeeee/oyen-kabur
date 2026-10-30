import { catalog, isCosmetic, type CosmeticId } from './catalog';
import { levels } from './registry';
export interface RecordData { completed: boolean; bestScore: number; stars: number; fish: number }
export interface SaveData { version: 2; collectedFish: number; owned: CosmeticId[]; equipped: CosmeticId | null; achievements: string[]; records: Record<string, RecordData>; currency: number }
export interface StorageAdapter { getItem(key: string): string | null; setItem(key: string, value: string): void }
const empty = (): SaveData => ({ version: 2, records: {}, currency: 0, collectedFish: 0, owned: [], equipped: null, achievements: [] });
export class SaveManager {
  data = empty();
  persistent = true;
  constructor(private storage?: StorageAdapter) {
    try {
      this.storage ??= localStorage;
      const raw: unknown = JSON.parse(this.storage.getItem('oyen-progression') ?? 'null');
      if (!raw || typeof raw !== 'object' || !('version' in raw) || (raw.version !== 1 && raw.version !== 2)) return;
      const candidate = raw as Partial<SaveData>;
      for (const level of levels) {
        const r = candidate.records?.[level.id];
        if (!r || r.completed !== true || !Number.isInteger(r.bestScore) || r.bestScore < 0 || r.bestScore > level.fish.length * 10 || !Number.isInteger(r.stars) || r.stars < 1 || r.stars > 3 || !Number.isInteger(r.fish) || r.fish < 0 || r.fish > level.fish.length) continue;
        this.data.records[level.id] = { ...r };
      }
      if (raw.version === 2) {
        this.data.collectedFish = Number.isSafeInteger(candidate.collectedFish) && candidate.collectedFish! >= 0 ? candidate.collectedFish! : 0;
        this.data.owned = Array.isArray(candidate.owned) ? [...new Set(candidate.owned.filter(isCosmetic))] : [];
        this.data.equipped = isCosmetic(candidate.equipped) && this.data.owned.includes(candidate.equipped) ? candidate.equipped : null;
        this.data.achievements = Array.isArray(candidate.achievements) ? [...new Set(candidate.achievements.filter(a => ['fish100', 'clean-level', 'clean-boss'].includes(a)))] : [];
      }
      this.recalculate();
    } catch { this.persistent = false; }
  }
  recalculate(): void {
    this.data.currency = Math.max(0, this.data.collectedFish + levels.reduce((sum, l) => sum + (this.data.records[l.id]?.completed ? l.reward + this.data.records[l.id].fish : 0), 0) - catalog.filter(c => this.data.owned.includes(c.id)).reduce((sum, c) => sum + c.price, 0));
  }
  save(): void { this.recalculate(); try { if (!this.storage) throw new Error(); this.storage.setItem('oyen-progression', JSON.stringify(this.data)); } catch { this.persistent = false; } }
  purchase(id: CosmeticId): boolean {
    const item = catalog.find(c => c.id === id);
    this.recalculate();
    if (!item || this.data.owned.includes(id) || this.data.currency < item.price) return false;
    this.data.owned.push(id); this.save(); return true;
  }
  equip(id: CosmeticId | null): boolean {
    if (id !== null && !this.data.owned.includes(id)) return false;
    this.data.equipped = id; this.save(); return true;
  }
  collectFish(): string[] { this.data.collectedFish++; const unlocked = this.unlock(this.data.collectedFish >= 100 ? ['fish100'] : []); this.save(); return unlocked; }
  unlock(ids: string[]): string[] {
    const fresh = ids.filter(id => !this.data.achievements.includes(id));
    this.data.achievements.push(...fresh); return fresh;
  }
  reset(): void { this.data = empty(); this.save(); }
}
