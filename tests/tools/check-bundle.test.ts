// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkBundle, KB } from '../../tools/check-bundle.mjs';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A fake dist/ with an entry chunk, a CSS file and an optional lazy chunk. Random bytes don't compress. */
function fakeDist(entryKB: number, lazyKB = 0): string {
  const dist = mkdtempSync(join(tmpdir(), 'rootcamp-bundle-'));
  dirs.push(dist);
  mkdirSync(join(dist, 'assets'));
  mkdirSync(join(dist, '.vite'));
  writeFileSync(join(dist, 'index.html'), '<!doctype html><title>t</title>');
  writeFileSync(join(dist, 'assets/index.js'), randomBytes(entryKB * KB));
  writeFileSync(join(dist, 'assets/index.css'), 'body{}');
  writeFileSync(join(dist, 'sw.js'), 'self.x=1');
  const manifest: Record<string, unknown> = {
    'index.html': { file: 'assets/index.js', isEntry: true, css: ['assets/index.css'] },
  };
  if (lazyKB > 0) {
    writeFileSync(join(dist, 'assets/world.js'), randomBytes(lazyKB * KB));
    manifest['src/worlds/w05.ts'] = { file: 'assets/world.js', isDynamicEntry: true };
  }
  writeFileSync(join(dist, '.vite/manifest.json'), JSON.stringify(manifest));
  return dist;
}

describe('check-bundle', () => {
  it('passes a small app', () => {
    const r = checkBundle(fakeDist(50, 50));
    expect(r.ok).toBe(true);
    expect(r.initial.map((f) => f.file).sort()).toEqual(
      ['assets/index.css', 'assets/index.js', 'index.html', 'sw.js'].sort(),
    );
  });

  it('fails when the first visit is over 400 KB', () => {
    const r = checkBundle(fakeDist(420));
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/First visit/);
  });

  it('fails when a lazy chunk is over 200 KB', () => {
    const r = checkBundle(fakeDist(50, 220));
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/world\.js/);
  });

  it('does not count lazy chunks towards the first visit', () => {
    const r = checkBundle(fakeDist(50, 190));
    expect(r.ok).toBe(true);
    expect(r.initial.map((f) => f.file)).not.toContain('assets/world.js');
  });
});
