// SPDX-License-Identifier: AGPL-3.0-or-later
// Fails when a source file is missing the AGPL-3.0-or-later SPDX header in its first lines.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOTS = ['src', 'tests', 'tools', 'e2e'];
const ROOT_FILES = ['vite.config.ts', 'eslint.config.js', 'playwright.config.ts'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'fixtures', 'raw', 'out']);
const HEADER = 'SPDX-License-Identifier: AGPL-3.0-or-later';
// shadcn/ui components are copied in under their MIT licence and keep it.
const MIT_DIR = join('src', 'ui', 'components', 'ui');
const MIT_HEADER = 'SPDX-License-Identifier: MIT';

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(p);
    } else if (EXTS.has(extname(name))) yield p;
  }
}

const files = [...ROOTS.flatMap((r) => [...walk(r)]), ...ROOT_FILES];
const missing = files.filter((f) => {
  try {
    const want = f.startsWith(MIT_DIR) ? MIT_HEADER : HEADER;
    return !readFileSync(f, 'utf8')
      .split('\n')
      .slice(0, 3)
      .some((l) => l.includes(want));
  } catch {
    return false;
  }
});

if (missing.length > 0) {
  console.error(`Missing "${HEADER}" header in:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`SPDX headers OK (${files.length} files).`);
