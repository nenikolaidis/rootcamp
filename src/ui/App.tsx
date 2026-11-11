// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@/ui/components/ui/button';

export function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 p-6">
      <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">Base Camp · v0.0</p>
      <h1 className="font-display text-5xl tracking-wide text-accent uppercase">RootCamp</h1>
      <p className="text-lg text-ink">
        Learn infrastructure by breaking it. The archipelago is still under construction.
      </p>
      <div>
        <Button disabled>Set sail (coming soon)</Button>
      </div>
    </main>
  );
}
