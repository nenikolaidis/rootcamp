// SPDX-License-Identifier: AGPL-3.0-or-later
// Proves the layer and purity rules fail lint (and so fail CI) when broken.
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function ruleIds(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? 'parse-error');
}

const LAYER = 'rootcamp/layer-boundaries';

describe('layer boundaries', () => {
  it.each([
    ['src/engine/a.ts', "import React from 'react';\nexport const x = React;\n"],
    ['src/engine/kernel/a.ts', "import { App } from '../../ui/App';\nexport const x = App;\n"],
    ['src/engine/a.ts', "import { WORLDS } from '@/worlds';\nexport const x = WORLDS;\n"],
    [
      'src/engine/a.ts',
      "import { readFileSync } from 'node:fs';\nexport const x = readFileSync;\n",
    ],
    ['src/worlds/a.ts', "import { GAME_VERSION } from '@/game';\nexport const x = GAME_VERSION;\n"],
    ['src/game/a.ts', "import { App } from '@/ui/App';\nexport const x = App;\n"],
    [
      'src/game/a.ts',
      "import { CLOUD_ENABLED } from '@/cloud';\nexport const x = CLOUD_ENABLED;\n",
    ],
    ['src/game/a.ts', "import { getAuth } from 'firebase/auth';\nexport const x = getAuth;\n"],
    ['src/ui/a.tsx', "import { getAuth } from 'firebase/auth';\nexport const x = getAuth;\n"],
    [
      'src/content/a.ts',
      "import { ENGINE_VERSION } from '@/engine';\nexport const x = ENGINE_VERSION;\n",
    ],
    ['src/engine/a.ts', "export const load = () => import('../ui/App');\n"],
  ])('rejects %s importing across a boundary (%#)', async (file, code) => {
    expect(await ruleIds(file, code)).toContain(LAYER);
  });

  it.each([
    [
      'src/engine/kernel/a.ts',
      "import { ENGINE_VERSION } from '../index';\nexport const x = ENGINE_VERSION;\n",
    ],
    [
      'src/worlds/a.ts',
      "import { ENGINE_VERSION } from '@/engine';\nexport const x = ENGINE_VERSION;\n",
    ],
    [
      'src/game/a.ts',
      "import { WORLDS } from '@/worlds';\nimport { z } from 'zod';\nexport const x = [WORLDS, z];\n",
    ],
    [
      'src/cloud/a.ts',
      "import { getAuth } from 'firebase/auth';\nimport { GAME_VERSION } from '@/game';\nexport const x = [getAuth, GAME_VERSION];\n",
    ],
    [
      'src/ui/a.tsx',
      "import { GAME_VERSION } from '@/game';\nimport { useState } from 'react';\nexport const x = [GAME_VERSION, useState];\n",
    ],
  ])('allows %s (%#)', async (file, code) => {
    expect(await ruleIds(file, code)).not.toContain(LAYER);
  });
});

describe('engine purity', () => {
  it.each([
    ['Date.now()', 'export const t = Date.now();\n', 'no-restricted-properties'],
    ['Math.random()', 'export const r = Math.random();\n', 'no-restricted-properties'],
    ['performance.now()', 'export const t = performance.now();\n', 'no-restricted-properties'],
    ['crypto.randomUUID()', 'export const id = crypto.randomUUID();\n', 'no-restricted-properties'],
    ['new Date()', 'export const d = new Date();\n', 'no-restricted-syntax'],
    ['Date()', 'export const d = Date();\n', 'no-restricted-syntax'],
    ['window', 'export const w = window;\n', 'no-restricted-globals'],
    ['setTimeout', 'export const s = setTimeout;\n', 'no-restricted-globals'],
  ])('rejects %s in src/engine', async (_name, code, rule) => {
    expect(await ruleIds('src/engine/a.ts', code)).toContain(rule);
  });

  it('rejects Math.random() in src/worlds', async () => {
    expect(await ruleIds('src/worlds/a.ts', 'export const r = Math.random();\n')).toContain(
      'no-restricted-properties',
    );
  });

  it('allows a fixed timestamp in src/engine', async () => {
    expect(await ruleIds('src/engine/a.ts', 'export const d = new Date(0);\n')).toEqual([]);
  });

  it('allows Date.now() in src/ui', async () => {
    expect(await ruleIds('src/ui/a.ts', 'export const t = Date.now();\n')).toEqual([]);
  });
});
