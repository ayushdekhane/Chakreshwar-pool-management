import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { connectivity } from '../lib/offline/connectivity';
import { syncEngine } from '../lib/offline/sync-engine';
import { syncQueue } from '../lib/offline/sync-queue';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwa() {
  const [isOnline, setIsOnline] = useState<boolean>(connectivity.isOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(syncEngine.getIsSyncing());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Install Prompt State
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  // Service Worker Registration & Updates via virtual:pwa-register
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker successfully registered:', r?.scope);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
    },
  });

  // Track connectivity & queue
  const refreshQueueCounts = useCallback(async () => {
    try {
      const counts = await syncQueue.getCounts();
      setPendingCount(counts.pending);
      setFailedCount(counts.failed);
      const lastSync = await syncEngine.getLastSyncedAt();
      setLastSyncedTime(lastSync);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // 1. Check standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Check iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 3. beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Show install banner if not dismissed before
      const dismissed = localStorage.getItem('serenity_pwa_install_dismissed');
      if (!dismissed && !isStandalone) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
      setShowInstallBanner(false);
      localStorage.removeItem('serenity_pwa_install_dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Connectivity subscription
    const unsubConn = connectivity.subscribe((online) => {
      setIsOnline(online);
      refreshQueueCounts();
    });

    // 5. Sync engine subscription
    const unsubSync = syncEngine.subscribe((syncing) => {
      setIsSyncing(syncing);
      refreshQueueCounts();
    });

    refreshQueueCounts();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubConn();
      unsubSync();
    };
  }, [refreshQueueCounts]);

  const promptInstall = async () => {
    if (!installPromptEvent) return false;
    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallBanner(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Install prompt error:', err);
      return false;
    } finally {
      setInstallPromptEvent(null);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallBanner(false);
    localStorage.setItem('serenity_pwa_install_dismissed', Date.now().toString());
  };

  const syncNow = async () => {
    await syncEngine.syncNow();
    await refreshQueueCounts();
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    lastSyncedTime,
    syncNow,
    refreshQueueCounts,
    // Installation
    isInstallable: Boolean(installPromptEvent) || (isIos && !isInstalled),
    isInstalled,
    isIos,
    showInstallBanner,
    promptInstall,
    dismissInstallPrompt,
    // Updates
    needRefresh,
    updateServiceWorker: () => updateServiceWorker(true),
    dismissUpdate: () => setNeedRefresh(false),
  };
}

