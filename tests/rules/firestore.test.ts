// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { DEMO_MAX_XP, MAX_MISSION_REWARD, WEEKLY_XP_CAP } from '@/game/limits';
import { createRulesEnv, minutesAgo, seed } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createRulesEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const guest = () => env.unauthenticatedContext().firestore();

const profile = (extra: Record<string, unknown> = {}) => ({
  displayName: 'Alice',
  ageConfirmed: true,
  createdAt: serverTimestamp(),
  ...extra,
});

const progress = (xp: number, extra: Record<string, unknown> = {}) => ({
  xp,
  schemaVersion: 1,
  rank: 'intern',
  done: {},
  hints: {},
  quiz: {},
  achievements: [],
  codex: [],
  unlocks: [],
  updatedAt: serverTimestamp(),
  ...extra,
});

const ALICE_PROGRESS = 'users/alice/progress/main';

describe('users/{uid}', () => {
  it('lets a player create, read and delete their own profile', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), profile()));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice')));
    await assertSucceeds(deleteDoc(doc(alice(), 'users/alice')));
  });

  it('keeps other players and guests out of a profile', async () => {
    await seed(env, 'users/alice', {
      displayName: 'Alice',
      ageConfirmed: true,
      createdAt: minutesAgo(1),
    });
    await assertFails(getDoc(doc(bob(), 'users/alice')));
    await assertFails(getDoc(doc(guest(), 'users/alice')));
    await assertFails(setDoc(doc(bob(), 'users/alice'), profile()));
  });

  it('requires the 15+ confirmation', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), profile({ ageConfirmed: false })));
    const { ageConfirmed: _omit, ...withoutAge } = profile();
    await assertFails(setDoc(doc(alice(), 'users/alice'), withoutAge));
  });

  it('rejects unknown fields, long names and client-made timestamps', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice'), profile({ isAdmin: true })));
    await assertFails(
      setDoc(doc(alice(), 'users/alice'), profile({ displayName: 'x'.repeat(41) })),
    );
    await assertFails(
      setDoc(doc(alice(), 'users/alice'), profile({ createdAt: Timestamp.fromMillis(0) })),
    );
  });

  it('keeps createdAt fixed on update', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice'), profile()));
    await assertSucceeds(updateDoc(doc(alice(), 'users/alice'), { title: 'Root of all evil' }));
    await assertFails(updateDoc(doc(alice(), 'users/alice'), { createdAt: serverTimestamp() }));
  });
});

describe('users/{uid}/progress/main', () => {
  it('migrates guest progress on sign-up, then accepts a normal update straight after', async () => {
    // Sign-up: the guest's demo progress moves into the new account.
    await assertSucceeds(
      setDoc(doc(alice(), ALICE_PROGRESS), progress(4200, { done: { 'w01-m1': true } })),
    );
    // Seconds later the player finishes a mission: one full reward must sync at once.
    await assertSucceeds(
      updateDoc(doc(alice(), ALICE_PROGRESS), {
        xp: 4200 + MAX_MISSION_REWARD,
        done: { 'w01-m1': true, 'w01-m2': true },
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(getDoc(doc(alice(), ALICE_PROGRESS)));
  });

  it('caps migrated guest XP at DEMO_MAX_XP', async () => {
    await assertSucceeds(setDoc(doc(alice(), ALICE_PROGRESS), progress(DEMO_MAX_XP)));
    await env.clearFirestore();
    await assertFails(setDoc(doc(alice(), ALICE_PROGRESS), progress(DEMO_MAX_XP + 1)));
  });

  it('rejects bad first writes', async () => {
    await assertFails(setDoc(doc(alice(), ALICE_PROGRESS), progress(-1)));
    await assertFails(setDoc(doc(alice(), ALICE_PROGRESS), progress(1.5)));
    await assertFails(setDoc(doc(alice(), 'users/alice/progress/other'), progress(10)));
    await assertFails(setDoc(doc(alice(), ALICE_PROGRESS), progress(10, { cheat: true })));
    await assertFails(
      setDoc(doc(alice(), ALICE_PROGRESS), progress(10, { updatedAt: Timestamp.fromMillis(0) })),
    );
    await assertFails(setDoc(doc(bob(), ALICE_PROGRESS), progress(10)));
  });

  it('never lets XP go down', async () => {
    await seed(env, ALICE_PROGRESS, { xp: 1000, schemaVersion: 1, updatedAt: minutesAgo(5) });
    await assertFails(
      updateDoc(doc(alice(), ALICE_PROGRESS), { xp: 999, updatedAt: serverTimestamp() }),
    );
  });

  it('refuses more than one reward in an instant', async () => {
    await assertSucceeds(setDoc(doc(alice(), ALICE_PROGRESS), progress(0)));
    await assertFails(
      updateDoc(doc(alice(), ALICE_PROGRESS), {
        xp: MAX_MISSION_REWARD + 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('allows one more reward per elapsed minute', async () => {
    await seed(env, ALICE_PROGRESS, { xp: 1000, schemaVersion: 1, updatedAt: minutesAgo(2.1) });
    await assertSucceeds(
      updateDoc(doc(alice(), ALICE_PROGRESS), {
        xp: 1000 + 3 * MAX_MISSION_REWARD,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('syncs a long offline session without blocking the player', async () => {
    await seed(env, ALICE_PROGRESS, { xp: 1000, schemaVersion: 1, updatedAt: minutesAgo(60) });
    await assertSucceeds(
      updateDoc(doc(alice(), ALICE_PROGRESS), { xp: 4000, updatedAt: serverTimestamp() }),
    );
  });

  it('is private to its owner', async () => {
    await seed(env, ALICE_PROGRESS, { xp: 10, schemaVersion: 1, updatedAt: minutesAgo(5) });
    await assertFails(getDoc(doc(bob(), ALICE_PROGRESS)));
    await assertFails(getDoc(doc(guest(), ALICE_PROGRESS)));
    await assertFails(
      updateDoc(doc(bob(), ALICE_PROGRESS), { xp: 20, updatedAt: serverTimestamp() }),
    );
  });
});

describe('leaderboards/{week}/scores/{uid}', () => {
  const WEEK = '2026-W46';
  const score = (xp: number) => ({
    name: 'Alice',
    xp,
    rank: 'intern',
    updatedAt: serverTimestamp(),
  });
  const aliceScore = `leaderboards/${WEEK}/scores/alice`;

  it('is readable by everyone, including guests', async () => {
    await seed(env, aliceScore, { name: 'Alice', xp: 10, updatedAt: minutesAgo(1) });
    await assertSucceeds(getDocs(collection(guest(), `leaderboards/${WEEK}/scores`)));
  });

  it('lets players write only their own score', async () => {
    await assertSucceeds(setDoc(doc(alice(), aliceScore), score(300)));
    await assertFails(setDoc(doc(bob(), aliceScore), score(300)));
    await assertFails(setDoc(doc(guest(), `leaderboards/${WEEK}/scores/guest`), score(1)));
  });

  it('rejects malformed week IDs and the weekly cap', async () => {
    await assertFails(setDoc(doc(alice(), 'leaderboards/week-46/scores/alice'), score(1)));
    await assertFails(setDoc(doc(alice(), 'leaderboards/2026-W54/scores/alice'), score(1)));
    await assertFails(setDoc(doc(alice(), aliceScore), score(WEEKLY_XP_CAP + 1)));
  });

  it('only grows, at the same pace as progress', async () => {
    await assertSucceeds(setDoc(doc(alice(), aliceScore), score(300)));
    await assertSucceeds(setDoc(doc(alice(), aliceScore), score(300 + MAX_MISSION_REWARD)));
    await assertFails(setDoc(doc(alice(), aliceScore), score(100)));
    await assertFails(setDoc(doc(alice(), aliceScore), score(300 + 3 * MAX_MISSION_REWARD)));
  });
});

describe('blueprints/{id}', () => {
  const blueprint = (ownerUid: string, extra: Record<string, unknown> = {}) => ({
    ownerUid,
    title: 'Two-tier web stack',
    world: 'w06',
    json: '{"nodes":[]}',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extra,
  });
  const seeded = {
    ownerUid: 'alice',
    title: 'Mine',
    world: 'w06',
    json: '{}',
    createdAt: minutesAgo(5),
    updatedAt: minutesAgo(5),
  };

  it('is public to read', async () => {
    await seed(env, 'blueprints/b1', seeded);
    await assertSucceeds(getDoc(doc(guest(), 'blueprints/b1')));
  });

  it('lets a signed-in player share their own design', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'blueprints/b1'), blueprint('alice')));
    await assertFails(setDoc(doc(alice(), 'blueprints/b2'), blueprint('bob')));
    await assertFails(setDoc(doc(guest(), 'blueprints/b3'), blueprint('alice')));
  });

  it('limits size and fields', async () => {
    await assertFails(
      setDoc(doc(alice(), 'blueprints/b1'), blueprint('alice', { json: 'x'.repeat(50_001) })),
    );
    await assertFails(setDoc(doc(alice(), 'blueprints/b1'), blueprint('alice', { likes: 999 })));
    await assertFails(setDoc(doc(alice(), 'blueprints/b1'), blueprint('alice', { world: 'mars' })));
  });

  it('lets only the owner edit or delete, and never hand it over', async () => {
    await seed(env, 'blueprints/b1', seeded);
    await assertSucceeds(
      updateDoc(doc(alice(), 'blueprints/b1'), { title: 'Renamed', updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(bob(), 'blueprints/b1'), { title: 'Mine now', updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(alice(), 'blueprints/b1'), { ownerUid: 'bob', updatedAt: serverTimestamp() }),
    );
    await assertFails(deleteDoc(doc(bob(), 'blueprints/b1')));
    await assertSucceeds(deleteDoc(doc(alice(), 'blueprints/b1')));
  });

  describe('likes/{uid}', () => {
    const like = () => ({ createdAt: serverTimestamp() });

    it('allows one like per player, as themselves', async () => {
      await seed(env, 'blueprints/b1', seeded);
      await assertSucceeds(setDoc(doc(bob(), 'blueprints/b1/likes/bob'), like()));
      await assertFails(setDoc(doc(bob(), 'blueprints/b1/likes/carol'), like()));
      await assertFails(setDoc(doc(guest(), 'blueprints/b1/likes/guest'), like()));
    });

    it('rejects likes on missing blueprints, extra fields and edits', async () => {
      await assertFails(setDoc(doc(bob(), 'blueprints/nope/likes/bob'), like()));
      await seed(env, 'blueprints/b1', seeded);
      await assertFails(setDoc(doc(bob(), 'blueprints/b1/likes/bob'), { ...like(), weight: 100 }));
      await assertSucceeds(setDoc(doc(bob(), 'blueprints/b1/likes/bob'), like()));
      await assertFails(setDoc(doc(bob(), 'blueprints/b1/likes/bob'), like()));
    });

    it('lets a player take back their own like only', async () => {
      await seed(env, 'blueprints/b1', seeded);
      await seed(env, 'blueprints/b1/likes/bob', { createdAt: minutesAgo(1) });
      await assertFails(deleteDoc(doc(alice(), 'blueprints/b1/likes/bob')));
      await assertSucceeds(deleteDoc(doc(bob(), 'blueprints/b1/likes/bob')));
    });
  });
});

describe('everything else', () => {
  it('is denied by default', async () => {
    await assertFails(setDoc(doc(alice(), 'admin/config'), { open: true }));
    await assertFails(getDoc(doc(alice(), 'admin/config')));
    await assertFails(getDoc(doc(guest(), 'leaderboards/2026-W46')));
  });
});
