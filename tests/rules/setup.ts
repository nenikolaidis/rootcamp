// SPDX-License-Identifier: AGPL-3.0-or-later
// Shared rules-test environment. Only ever talks to the local emulator under a demo-* project,
// so these tests can never touch the real Firebase project.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export const PROJECT_ID = 'demo-rootcamp';

export async function createRulesEnv(): Promise<RulesTestEnvironment> {
  if (!PROJECT_ID.startsWith('demo-')) throw new Error('Rules tests must use a demo-* project ID.');
  if (!process.env['FIRESTORE_EMULATOR_HOST']) {
    throw new Error('No Firestore emulator. Run these tests with `npm run test:rules`.');
  }
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
}

/** Write a document with rules switched off, e.g. to plant an older updatedAt. */
export async function seed(
  env: RulesTestEnvironment,
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

/** A Timestamp `minutes` before now (seeding only; tests run outside the engine). */
export function minutesAgo(minutes: number): Timestamp {
  return Timestamp.fromMillis(Date.now() - minutes * 60_000);
}
