// SPDX-License-Identifier: AGPL-3.0-or-later
// firestore.rules can't import TypeScript, so it repeats the XP limits. Keep them identical.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEMO_MAX_XP, MAX_MISSION_REWARD, WEEKLY_XP_CAP } from '@/game/limits';

const rules = readFileSync('firestore.rules', 'utf8');

function ruleConstant(fn: string): number {
  const match = new RegExp(`function ${fn}\\(\\)\\s*\\{\\s*return (\\d+);`).exec(rules);
  if (!match?.[1]) throw new Error(`firestore.rules has no ${fn}()`);
  return Number(match[1]);
}

describe('XP limits match firestore.rules', () => {
  it.each([
    ['demoMaxXp', DEMO_MAX_XP],
    ['maxMissionReward', MAX_MISSION_REWARD],
    ['weeklyXpCap', WEEKLY_XP_CAP],
  ])('%s() == %i', (fn, value) => {
    expect(ruleConstant(fn)).toBe(value);
  });
});
