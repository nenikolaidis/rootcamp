// SPDX-License-Identifier: AGPL-3.0-or-later
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores, includeIgnoreFile } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import rootcamp from './tools/eslint/layer-boundaries.js';

/** Non-deterministic APIs. The engine and worlds get time from the virtual clock and randomness from the seeded RNG. */
const nonDeterministic = {
  'no-restricted-properties': [
    'error',
    {
      object: 'Date',
      property: 'now',
      message: 'Use the virtual clock (lab.clock), not wall-clock time.',
    },
    { object: 'Math', property: 'random', message: 'Use the seeded RNG (lab.rng).' },
    { object: 'performance', property: 'now', message: 'Use the virtual clock (lab.clock).' },
    { object: 'crypto', property: 'getRandomValues', message: 'Use the seeded RNG (lab.rng).' },
    { object: 'crypto', property: 'randomUUID', message: 'Use the seeded RNG (lab.rng).' },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "NewExpression[callee.name='Date'][arguments.length=0]",
      message: 'new Date() reads wall-clock time. Use the virtual clock (lab.clock).',
    },
    {
      selector: "CallExpression[callee.name='Date']",
      message: 'Date() reads wall-clock time. Use the virtual clock (lab.clock).',
    },
  ],
};

/** Browser and timer globals that pure layers must not touch. */
const browserGlobals = [
  'window',
  'document',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
].map((name) => ({ name, message: 'Pure layers must not use browser or timer APIs.' }));

export default defineConfig([
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  globalIgnores([
    'dist',
    'dev-dist',
    'coverage',
    'playwright-report',
    'test-results',
    'node_modules',
    'tests/fixtures',
  ]),

  js.configs.recommended,
  tseslint.configs.strict,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023 },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { rootcamp },
    rules: { 'rootcamp/layer-boundaries': 'error' },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/engine/**/*.ts', 'src/worlds/**/*.ts'],
    rules: { ...nonDeterministic, 'no-restricted-globals': ['error', ...browserGlobals] },
  },
  {
    files: ['src/game/**/*.ts'],
    rules: { 'no-restricted-globals': ['error', ...browserGlobals] },
  },
  {
    files: ['*.{js,ts}', 'tools/**/*.{js,mjs,ts}', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  prettier,
]);
