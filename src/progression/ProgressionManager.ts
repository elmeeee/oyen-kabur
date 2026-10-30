import { LevelLoader, worlds } from './registry';
import { SaveManager } from './SaveManager';
export class ProgressionManager {
  constructor(public saves: SaveManager) {}
  worldUnlocked(id: string): boolean { const i = worlds.findIndex(w => w.id === id); return i === 0 || (i > 0 && !!this.saves.data.records[worlds[i - 1].levelIds[4]]?.completed); }
  unlocked(id: string): boolean {
    const world = worlds.find(w => w.levelIds.includes(id));
    if (!world || !world.available || !this.worldUnlocked(world.id)) return false;
    const i = world.levelIds.indexOf(id);
    return i === 0 || !!this.saves.data.records[world.levelIds[i - 1]]?.completed;
  }
  complete(id: string, score: number, lives: number, damageTaken = 1): number {
    if (!this.unlocked(id)) throw new Error('Level locked');
    const level = LevelLoader.load(id);
    if (!Number.isFinite(score) || !Number.isFinite(lives)) throw new Error('Invalid result');
    const fish = Math.min(level.fish.length, Math.max(0, Math.floor(score / 10)));
    const stars = 1 + Number(fish >= level.objectives.fish) + Number(lives >= level.objectives.lives);
    const old = this.saves.data.records[id];
    this.saves.data.records[id] = { completed: true, bestScore: Math.max(old?.bestScore ?? 0, fish * 10), stars: Math.max(old?.stars ?? 0, stars), fish: Math.max(old?.fish ?? 0, fish) };
    if (damageTaken === 0) this.saves.unlock(level.boss ? ['clean-level', 'clean-boss'] : ['clean-level']);
    this.saves.save(); return stars;
  }
}
export const progression = new ProgressionManager(new SaveManager());
