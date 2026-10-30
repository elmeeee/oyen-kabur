export const WORLD_WIDTH = 3600;
export const SPEED = 235;
export const JUMP = 440;
export const GRAVITY = 1000;
export const platforms = [
  { x: 0, y: 482, w: 620 }, { x: 700, y: 482, w: 670 },
  { x: 1450, y: 482, w: 730 }, { x: 2260, y: 482, w: 1340 },
  { x: 225, y: 400, w: 150 }, { x: 440, y: 320, w: 200 },
  { x: 735, y: 350, w: 220 }, { x: 1030, y: 280, w: 220 },
  { x: 1340, y: 330, w: 230 }, { x: 1650, y: 250, w: 220 },
  { x: 1950, y: 305, w: 230 }, { x: 2260, y: 355, w: 230 },
  { x: 2560, y: 280, w: 230 }, { x: 2870, y: 350, w: 230 },
  { x: 3180, y: 400, w: 190 },
];
export const fishSpawns = platforms.slice(4).flatMap(p => [
  { x: p.x + 45, y: p.y - 30 }, { x: p.x + p.w - 35, y: p.y - 30 },
]);
export const sandalRoutes = [
  { x: 550, y: 280, range: 110 }, { x: 1120, y: 240, range: 145 },
  { x: 1750, y: 210, range: 140 }, { x: 2340, y: 315, range: 120 },
  { x: 2750, y: 240, range: 150 }, { x: 3100, y: 440, range: 130 },
];
export class RunState {
  score = 0;
  lives = 3;
  invulnerableUntil = 0;
  collect(): void { this.score += 10; }
  damage(now: number): boolean {
    if (now < this.invulnerableUntil || this.lives === 0) return false;
    this.lives--;
    this.invulnerableUntil = now + 1500;
    return true;
  }
}
