// SPDX-License-Identifier: AGPL-3.0-or-later
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/rules/**', 'tests/e2e/**'],
        },
      },
      {
        test: {
          name: 'rules',
          environment: 'node',
          include: ['tests/rules/**/*.test.ts'],
          // One emulator, shared state: run files one after another.
          fileParallelism: false,
          testTimeout: 15_000,
        },
      },
    ],
  },
});
