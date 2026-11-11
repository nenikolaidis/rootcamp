// SPDX-License-Identifier: AGPL-3.0-or-later
// XP limits shared by the game and the Firestore rules (firestore.rules repeats them;
// tests/game/limits.test.ts fails if the two drift apart). Tune in Phase 2 with xp:balance.

/** Most XP a guest can bring into a new account (demo: Base Camp + 3 + 3 missions). */
export const DEMO_MAX_XP = 5000;

/** Largest single reward. Synced XP may grow by this much, plus this much per elapsed minute. */
export const MAX_MISSION_REWARD = 600;

/** Ceiling for one week's leaderboard score. */
export const WEEKLY_XP_CAP = 20000;
