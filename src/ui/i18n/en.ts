// SPDX-License-Identifier: AGPL-3.0-or-later
// English UI strings. Every user-facing string goes through t().
export const en = {
  'app.badge': 'Base Camp · v0.0',
  'app.title': 'RootCamp',
  'app.tagline':
    'Learn infrastructure by breaking it. The archipelago is still under construction.',
  'app.setSail': 'Set sail (coming soon)',
  'pwa.offlineReady': 'RootCamp is ready to work offline.',
  'pwa.needRefresh': 'A new version of RootCamp is ready.',
  'pwa.reload': 'Reload',
  'pwa.dismiss': 'Dismiss',
} as const;

export type MessageKey = keyof typeof en;
