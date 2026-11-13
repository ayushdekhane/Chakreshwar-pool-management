import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
  Layers,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { offlineStorage } from '../../lib/offline/offline-storage';
import { syncEngine } from '../../lib/offline/sync-engine';
import { syncQueue } from '../../lib/offline/sync-queue';
import { connectivity } from '../../lib/offline/connectivity';
import { StorageStats } from '../../lib/offline/sync-types';
import { formatTime, cn } from '../../utils';
import { toast } from 'sonner';

export const OfflineStorageSettings: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(syncEngine.getIsSyncing());
  const [isOnline, setIsOnline] = useState<boolean>(connectivity.isOnline());

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await offlineStorage.getStorageStats();
      setStats(res);
    } catch (err: any) {
      console.error('Failed to load storage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const unsubSync = syncEngine.subscribe((syncing) => {
      setIsSyncing(syncing);
      loadStats();
    });

    const unsubConn = connectivity.subscribe((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubSync();
      unsubConn();
    };
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline) {
      toast.error('Device is currently offline. Cannot sync with Supabase.');
      return;
    }
    toast.info('Starting synchronization with Supabase...');
    const result = await syncEngine.syncNow();
    if (result.failureCount > 0) {
      toast.error(`Sync finished with ${result.failureCount} error(s). Check details.`);
    } else if (result.successCount > 0) {
      toast.success(`Successfully synchronized ${result.successCount} queued operation(s).`);
    } else {
      toast.success('All local records are up to date.');
    }
    loadStats();
  };

  const handleClearFailedQueue = async () => {
    if (window.confirm('Are you sure you want to clear permanently failed queue items?')) {
      await syncQueue.clearFailedQueue();
      toast.success('Failed queue items cleared.');
      loadStats();
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#70218C] flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5 text-[#70218C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">
                PWA Local Offline Database (IndexedDB)
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                  stats?.isStorageHealthy
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {stats?.isStorageHealthy ? 'Healthy & Persistent' : 'Storage Warning'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Offline data persistence powered by Dexie IndexedDB with automatic two-way Supabase synchronization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing || !isOnline}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all',
              isOnline
                ? 'bg-[#087FA5] hover:bg-[#066382] text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
            <span>Connection</span>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
          </div>
          <span className="text-sm font-bold text-slate-900">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isOnline ? 'Direct Cloud Sync' : 'Saving on Device'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
            <span>Last Successful Sync</span>
            <Clock className="w-3.5 h-3.5 text-[#087FA5]" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            {stats?.lastSyncedAt ? formatTime(stats.lastSyncedAt) : 'Not synced yet'}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Cloud database ledger
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
            <span>Pending Mutations</span>
            <Layers className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            {stats?.pendingQueueCount ?? 0}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Will sync automatically
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-[11px]">
            <span>Storage Quota</span>
            <HardDrive className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            {formatBytes(stats?.storageEstimate?.usage)}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {stats?.storageEstimate?.quota
              ? `of ${formatBytes(stats.storageEstimate.quota)} quota`
              : 'IndexedDB persistent'}
          </p>
        </div>
      </div>

      {/* Record Counts Breakdown */}
      <div>
        <span className="text-xs font-bold text-slate-700 block mb-2">
          Locally Cached Records:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              Customers
            </span>
            <span className="text-base font-extrabold text-[#087FA5]">
              {stats?.customersCount ?? 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              Sessions
            </span>
            <span className="text-base font-extrabold text-[#70218C]">
              {stats?.sessionsCount ?? 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              Payments
            </span>
            <span className="text-base font-extrabold text-emerald-600">
              {stats?.paymentsCount ?? 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              Rentals
            </span>
            <span className="text-base font-extrabold text-amber-600">
              {stats?.rentalsCount ?? 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              Equipment
            </span>
            <span className="text-base font-extrabold text-slate-700">
              {stats?.equipmentCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Failed Queue Items Warning if any */}
      {(stats?.failedQueueCount ?? 0) > 0 && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>{stats?.failedQueueCount}</strong> mutation(s) encountered validation or server errors and could not be synchronized automatically.
            </span>
          </div>
          <button
            onClick={handleClearFailedQueue}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-100 font-semibold text-[11px]"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Failed Items</span>
          </button>
        </div>
      )}
    </div>
  );
};

