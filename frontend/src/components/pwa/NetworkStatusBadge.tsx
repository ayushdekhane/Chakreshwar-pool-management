import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, Database } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';
import { formatTime } from '../../utils';
import { cn } from '../../utils';

export const NetworkStatusBadge: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    lastSyncedTime,
    syncNow,
  } = usePwa();

  const [isOpen, setIsOpen] = useState(false);

  // Determine State
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let text = 'Online';
  let Icon = Wifi;

  if (isSyncing) {
    badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
    dotColor = 'bg-[#087FA5]';
    text = 'Syncing...';
    Icon = RefreshCw;
  } else if (!isOnline) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    text = 'Offline Mode';
    Icon = WifiOff;
  } else if (failedCount > 0) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    text = 'Sync Error';
    Icon = AlertCircle;
  }

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await syncNow();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all shadow-xs',
          badgeColor
        )}
        title="Network & Cloud Synchronization Status"
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            dotColor,
            isSyncing && 'animate-spin',
            isOnline && !isSyncing && 'animate-pulse'
          )}
        />
        <span className="hidden sm:inline">{text}</span>
        {pendingCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold">
            {pendingCount}
          </span>
        )}
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-premium border border-[#E2E8F0] p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center',
                  badgeColor
                )}
              >
                <Icon className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Connection & Sync</h4>
                <p className="text-[10px] text-slate-500">
                  {isOnline ? 'Connected to Internet' : 'Device is Offline'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Connection:</span>
              <span className="font-bold flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Last Sync:</span>
              <span className="font-semibold text-slate-700">
                {lastSyncedTime ? formatTime(lastSyncedTime) : 'Pending initial sync'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pending Operations:</span>
              <span
                className={cn(
                  'font-bold px-1.5 py-0.5 rounded text-[11px]',
                  pendingCount > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-700'
                )}
              >
                {pendingCount}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Failed Operations:</span>
              <span
                className={cn(
                  'font-bold px-1.5 py-0.5 rounded text-[11px]',
                  failedCount > 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'text-slate-700'
                )}
              >
                {failedCount}
              </span>
            </div>
          </div>

          <button
            onClick={handleSyncClick}
            disabled={isSyncing || !isOnline}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs',
              isOnline
                ? 'bg-[#087FA5] hover:bg-[#066382] text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

