// SPDX-License-Identifier: AGPL-3.0-or-later
// Enforces the layer rules: engine, worlds, game, cloud, content, ui.
// Resolves `@/…` aliases and relative paths, so a `../../ui/x` import is caught too.
import path from 'node:path';

const LAYERS = ['engine', 'worlds', 'game', 'cloud', 'content', 'ui'];

/** Which other layers each layer may import. */
export const ALLOWED_LAYERS = {
  engine: ['engine'],
  content: ['content'],
  worlds: ['worlds', 'engine', 'content'],
  game: ['game', 'engine', 'worlds', 'content'],
  cloud: ['cloud', 'game', 'engine', 'content'],
  ui: LAYERS,
  app: LAYERS,
};

/** Bare packages a layer may import. `null` = any package. */
const ALLOWED_PACKAGES = {
  engine: [],
  content: [],
  worlds: [],
  game: ['zod'],
  cloud: ['firebase', 'zod'],
  ui: null,
  app: null,
};

/** Packages only one layer may touch, whatever the list above says. */
const OWNED_PACKAGES = [
  { pkg: 'firebase', owners: ['cloud'] },
  { pkg: '@firebase', owners: ['cloud'] },
];

function layerOf(absFile, srcDir) {
  const rel = path.relative(srcDir, absFile);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return undefined;
  const first = rel.split(path.sep)[0];
  return LAYERS.includes(first) ? first : 'app';
}

function packageName(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function matchesPkg(name, prefix) {
  return name === prefix || name.startsWith(prefix + '/');
}

/** @type {import('eslint').Rule.RuleModule} */
export const layerBoundaries = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep engine, worlds, game, cloud, content and ui inside their layer rules.',
    },
    schema: [],
    messages: {
      layer: "'{{from}}' must not import from '{{to}}' ({{spec}}).",
      pkg: "'{{from}}' must not import the package '{{pkg}}'.",
    },
  },
  create(context) {
    const file = context.physicalFilename ?? context.filename;
    const srcDir = path.join(context.cwd, 'src');
    const from = layerOf(file, srcDir);
    if (!from) return {};

    function check(node, spec) {
      if (typeof spec !== 'string') return;
      let target;
      if (spec.startsWith('@/')) target = path.join(srcDir, spec.slice(2));
      else if (spec.startsWith('.')) target = path.resolve(path.dirname(file), spec);

      if (target !== undefined) {
        const to = layerOf(target, srcDir);
        if (!to || !ALLOWED_LAYERS[from].includes(to)) {
          context.report({
            node,
            messageId: 'layer',
            data: { from, to: to ?? 'outside src', spec },
          });
        }
        return;
      }

      const pkg = packageName(spec);
      const owned = OWNED_PACKAGES.find((o) => matchesPkg(pkg, o.pkg));
      if (owned && !owned.owners.includes(from)) {
        context.report({ node, messageId: 'pkg', data: { from, pkg } });
        return;
      }
      const allowed = ALLOWED_PACKAGES[from];
      if (allowed !== null && !allowed.some((a) => matchesPkg(pkg, a))) {
        context.report({ node, messageId: 'pkg', data: { from, pkg } });
      }
    }

    return {
      ImportDeclaration: (n) => check(n.source, n.source.value),
      ExportNamedDeclaration: (n) => n.source && check(n.source, n.source.value),
      ExportAllDeclaration: (n) => check(n.source, n.source.value),
      ImportExpression: (n) => n.source.type === 'Literal' && check(n.source, n.source.value),
    };
  },
};

export default { rules: { 'layer-boundaries': layerBoundaries } };
