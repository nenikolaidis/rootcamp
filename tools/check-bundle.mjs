// SPDX-License-Identifier: AGPL-3.0-or-later
// Bundle budget (brotli): the first visit downloads ≤ 400 KB; any lazy JS chunk ≤ 200 KB.
// "First visit" = index.html + the entry's static import graph and CSS (from Vite's manifest)
// + the service worker, its Workbox runtime and the web manifest.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

export const KB = 1024;
export const DEFAULT_LIMITS = { initial: 400 * KB, chunk: 200 * KB };

export function brotliSize(buf) {
  return brotliCompressSync(buf, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
}

/** Files a first visit downloads, relative to dist. */
export function initialFiles(dist) {
  const manifestPath = join(dist, '.vite', 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`No ${manifestPath}. Build with build.manifest enabled.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const files = new Set(['index.html']);
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    const chunk = manifest[key];
    if (!chunk) return;
    files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    for (const dep of chunk.imports ?? []) visit(dep);
  };
  for (const [key, chunk] of Object.entries(manifest)) if (chunk.isEntry) visit(key);

  for (const name of readdirSync(dist)) {
    if (name === 'sw.js' || name === 'manifest.webmanifest' || /^workbox-.*\.js$/.test(name)) {
      files.add(name);
    }
  }
  return [...files].filter((f) => existsSync(join(dist, f)));
}

function jsChunks(dist) {
  const dir = join(dist, 'assets');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => `assets/${f}`);
}

export function checkBundle(dist, limits = DEFAULT_LIMITS) {
  const initial = initialFiles(dist).map((file) => ({
    file,
    bytes: brotliSize(readFileSync(join(dist, file))),
  }));
  const initialBytes = initial.reduce((sum, f) => sum + f.bytes, 0);
  const initialSet = new Set(initial.map((f) => f.file));
  const oversize = jsChunks(dist)
    .filter((file) => !initialSet.has(file))
    .map((file) => ({ file, bytes: brotliSize(readFileSync(join(dist, file))) }))
    .filter((c) => c.bytes > limits.chunk);
  const problems = [];
  if (initialBytes > limits.initial) {
    problems.push(
      `First visit is ${fmt(initialBytes)} brotli; the budget is ${fmt(limits.initial)}.`,
    );
  }
  for (const c of oversize) {
    problems.push(
      `${c.file} is ${fmt(c.bytes)} brotli; the per-chunk budget is ${fmt(limits.chunk)}.`,
    );
  }
  return { ok: problems.length === 0, initial, initialBytes, problems };
}

export function fmt(bytes) {
  return `${(bytes / KB).toFixed(1)} KB`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = process.argv[2] ?? 'dist';
  const result = checkBundle(dist);
  for (const f of result.initial.sort((a, b) => b.bytes - a.bytes)) {
    console.log(`  ${fmt(f.bytes).padStart(9)}  ${f.file}`);
  }
  console.log(
    `First visit: ${fmt(result.initialBytes)} of ${fmt(DEFAULT_LIMITS.initial)} (brotli).`,
  );
  if (!result.ok) {
    console.error(result.problems.join('\n'));
    process.exit(1);
  }
}
