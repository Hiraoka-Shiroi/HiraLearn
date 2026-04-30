/**
 * Single source of truth for XP / level math.
 *
 * Mirrors backend/migrations/20260430_progress_avatar_security.sql
 * (the `complete_lesson` RPC). If you change thresholds here, change
 * them there too — both must agree byte for byte.
 */

export const XP_THRESHOLDS = [
  0,    // start of L1
  100,  // start of L2
  300,  // start of L3
  600,  // start of L4
  1000, // start of L5
  1500, // start of L6
  2100, // start of L7
  2800, // start of L8
  3600, // start of L9
  4500, // start of L10
] as const;

export const MAX_LEVEL = XP_THRESHOLDS.length;

export function calculateLevel(xp: number): number {
  const safeXp = Math.max(0, xp | 0);
  for (let level = MAX_LEVEL; level >= 1; level -= 1) {
    if (safeXp >= XP_THRESHOLDS[level - 1]) {
      return level;
    }
  }
  return 1;
}

export function isMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
}

/**
 * XP needed to advance into the next level. Returns the threshold of
 * level + 1, or +Infinity at the cap.
 */
export function getNextLevelXp(level: number): number {
  if (isMaxLevel(level)) return Number.POSITIVE_INFINITY;
  return XP_THRESHOLDS[level] ?? Number.POSITIVE_INFINITY;
}

/** XP at which the current level started. */
export function getCurrentLevelXp(level: number): number {
  const idx = Math.min(Math.max(level - 1, 0), MAX_LEVEL - 1);
  return XP_THRESHOLDS[idx];
}

/**
 * Progress through the *current* level as a 0..1 fraction.
 * Maxed-out users always read 1.
 */
export function getLevelProgress(xp: number, level?: number): number {
  const lvl = level ?? calculateLevel(xp);
  if (isMaxLevel(lvl)) return 1;
  const start = getCurrentLevelXp(lvl);
  const end = getNextLevelXp(lvl);
  const span = end - start;
  if (span <= 0) return 1;
  return Math.min(Math.max((xp - start) / span, 0), 1);
}

/** XP required to reach the next level from the user's current state. */
export function getXpToNextLevel(xp: number, level?: number): number {
  const lvl = level ?? calculateLevel(xp);
  if (isMaxLevel(lvl)) return 0;
  return Math.max(getNextLevelXp(lvl) - xp, 0);
}
