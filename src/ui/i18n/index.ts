// SPDX-License-Identifier: AGPL-3.0-or-later
import { en, type MessageKey } from './en';

/** Look up a UI string. Greek (EL) joins as a second catalog later. */
export function t(key: MessageKey): string {
  return en[key];
}

export type { MessageKey };
