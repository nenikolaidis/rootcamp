// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@/engine';

describe('engine', () => {
  it('exposes a version', () => {
    expect(ENGINE_VERSION).toBe(0);
  });
});
