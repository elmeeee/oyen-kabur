let memory = 0;
export function highScore(score = 0): number {
  try {
    const stored = Number(localStorage.getItem('oyen-high-score'));
    if (Number.isFinite(stored) && stored >= 0) memory = Math.max(memory, stored);
  } catch { /* Storage can be disabled; retain the session record. */ }
  memory = Math.max(memory, Number.isFinite(score) ? score : 0);
  try { localStorage.setItem('oyen-high-score', String(memory)); } catch { /* Session fallback. */ }
  return memory;
}
