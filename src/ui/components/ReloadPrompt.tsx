// SPDX-License-Identifier: AGPL-3.0-or-later
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/ui/components/ui/button';
import { t } from '@/ui/i18n';

/** Tells the player when the game works offline, or when a new version is waiting. */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div role="status" aria-live="polite" className="fixed right-4 bottom-4 z-50">
      {(offlineReady || needRefresh) && (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 p-3 text-sm shadow-lg">
          <span>{offlineReady ? t('pwa.offlineReady') : t('pwa.needRefresh')}</span>
          {needRefresh && (
            <Button size="sm" onClick={() => void updateServiceWorker(true)}>
              {t('pwa.reload')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={close}>
            {t('pwa.dismiss')}
          </Button>
        </div>
      )}
    </div>
  );
}
