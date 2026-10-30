import definitions from '../data/world1.json';
export const levels = definitions;
export type LevelDefinition = typeof levels[number];
export const worlds = Array.from({ length: 5 }, (_, i) => ({ id: `w${i + 1}`, name: ['Kampung Bu Sri', 'Pasar Ikan', 'Hutan Bambu', 'Pelabuhan Oyen', 'Kerajaan Meong'][i], levelIds: Array.from({ length: 5 }, (_, j) => `w${i + 1}-l${j + 1}`), available: i === 0 }));
export class LevelLoader {
  static load(id: string): LevelDefinition {
    const level = levels.find(l => l.id === id);
    if (!level) throw new Error(`Unavailable level: ${id}`);
    return level;
  }
}
