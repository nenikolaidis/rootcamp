// SPDX-License-Identifier: AGPL-3.0-or-later
export const KB: number;
export const DEFAULT_LIMITS: { initial: number; chunk: number };
export interface BundleFile {
  file: string;
  bytes: number;
}
export function brotliSize(buf: Uint8Array): number;
export function initialFiles(dist: string): string[];
export function checkBundle(
  dist: string,
  limits?: { initial: number; chunk: number },
): { ok: boolean; initial: BundleFile[]; initialBytes: number; problems: string[] };
export function fmt(bytes: number): string;
