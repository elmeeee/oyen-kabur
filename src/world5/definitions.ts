export interface PalacePoint { x:number; y:number }
export interface StoneDeck extends PalacePoint { rangeX:number; rangeY:number; period:number; width:number }
export interface PalaceDefinition {
  top:number;
  goalY:number;
  checkpoints:PalacePoint[];
  decks:StoneDeck[];
  fragile:(PalacePoint & {width:number})[];
  guards:(PalacePoint & {ranged:boolean; range:number})[];
  arrows:(PalacePoint & {direction:number})[];
  secrets:(PalacePoint & {width:number;height:number})[];
  gusts:(PalacePoint & {width:number;height:number;force:number})[];
  encounter:({kind:'sentinel'|'king';arenaLeft:number} & PalacePoint)|null;
}
