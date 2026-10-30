export const catalog = [
  { id: 'bandana', name: 'Red bandana', price: 50 },
  { id: 'glasses', name: 'Sunglasses', price: 100 },
  { id: 'hat', name: 'Fisherman hat', price: 150 },
] as const;
export type CosmeticId = typeof catalog[number]['id'];
export const isCosmetic = (id: unknown): id is CosmeticId => catalog.some(c => c.id === id);
