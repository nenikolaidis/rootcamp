// SPDX-License-Identifier: AGPL-3.0-or-later
import { ReloadPrompt } from '@/ui/components/ReloadPrompt';
import { Button } from '@/ui/components/ui/button';
import { t } from '@/ui/i18n';

export function App() {
  return (
    <>
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 p-6">
        <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">
          {t('app.badge')}
        </p>
        <h1 className="font-display text-5xl tracking-wide text-accent uppercase">
          {t('app.title')}
        </h1>
        <p className="text-lg text-ink">{t('app.tagline')}</p>
        <div>
          <Button disabled>{t('app.setSail')}</Button>
        </div>
      </main>
      <ReloadPrompt />
    </>
  );
}
