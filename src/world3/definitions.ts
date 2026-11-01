export interface Point { x: number; y: number }
export interface BridgeDefinition extends Point { width: number; amplitude: number; period: number }
export interface FragileDefinition extends Point { width: number; warningMs: number; respawnMs: number }
export interface CurrentDefinition extends Point { width: number; height: number; forceX: number; forceY: number }
export interface ForestDefinition {
  top: number;
  goalY: number;
  checkpoints: Point[];
  bridges: BridgeDefinition[];
  fragile: FragileDefinition[];
  currents: CurrentDefinition[];
  slippery: { x: number; width: number }[];
  monkeys: Point[];
  secrets: (Point & { width: number; height: number })[];
  boss: { x: number; y: number; arenaLeft: number } | null;
}
