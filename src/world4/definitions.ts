export interface HarborPoint { x: number; y: number }
export interface DeckDefinition extends HarborPoint {
  width: number;
  kind: 'boat' | 'crane';
  rangeX: number;
  rangeY: number;
  period: number;
  phase: number;
}
export interface WindDefinition extends HarborPoint { width: number; height: number; force: number }
export interface HarborDefinition {
  top: number;
  goalY: number;
  checkpoints: HarborPoint[];
  decks: DeckDefinition[];
  water: (HarborPoint & { width: number; height: number })[];
  wind: WindDefinition[];
  lightning: number[];
  rain: boolean;
  sailors: HarborPoint[];
  boss: (HarborPoint & { arenaLeft: number }) | null;
}
