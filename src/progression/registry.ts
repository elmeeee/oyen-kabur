import definitions from '../data/world1.json';
import marketLevels from '../data/world2.json';
import forestLevels from '../data/world3.json';
import harborLevels from '../data/world4.json';
import palaceLevels from '../data/world5.json';
import type { PalaceDefinition } from '../world5/definitions';
import type { HarborDefinition } from '../world4/definitions';
import type { ForestDefinition } from '../world3/definitions';
export type MarketDefinition = typeof marketLevels[number]['market'];
export type LevelDefinition = Omit<typeof definitions[number], 'hazards'> & { hazards: {x:number;y:number;range:number}[]; market?: MarketDefinition; forest?: ForestDefinition; harbor?: HarborDefinition; palace?: PalaceDefinition };
export const levels: LevelDefinition[] = [...definitions, ...marketLevels, ...forestLevels, ...harborLevels, ...palaceLevels];
export const worlds = Array.from({ length: 5 }, (_, i) => ({ id: `w${i + 1}`, name: ['Kampung Bu Sri', 'Pasar Ikan', 'Hutan Bambu', 'Pelabuhan Oyen', 'Kerajaan Meong'][i], levelIds: Array.from({ length: 5 }, (_, j) => `w${i + 1}-l${j + 1}`), available: true }));
export class LevelLoader {
  static load(id: string): LevelDefinition {
    const level = levels.find(l => l.id === id);
    if (!level) throw new Error(`Unavailable level: ${id}`);
    return level;
  }
}
