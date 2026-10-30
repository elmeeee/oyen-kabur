import definitions from '../data/world1.json';
import marketLevels from '../data/world2.json';
export type MarketDefinition = typeof marketLevels[number]['market'];
export type LevelDefinition = Omit<typeof definitions[number], 'hazards'> & { hazards: {x:number;y:number;range:number}[]; market?: MarketDefinition };
export const levels: LevelDefinition[] = [...definitions, ...marketLevels];
export const worlds = Array.from({ length: 5 }, (_, i) => ({ id: `w${i + 1}`, name: ['Kampung Bu Sri', 'Pasar Ikan', 'Hutan Bambu', 'Pelabuhan Oyen', 'Kerajaan Meong'][i], levelIds: Array.from({ length: 5 }, (_, j) => `w${i + 1}-l${j + 1}`), available: i < 2 }));
export class LevelLoader {
  static load(id: string): LevelDefinition {
    const level = levels.find(l => l.id === id);
    if (!level) throw new Error(`Unavailable level: ${id}`);
    return level;
  }
}
