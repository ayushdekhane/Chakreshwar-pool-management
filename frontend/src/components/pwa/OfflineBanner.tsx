import React, { useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount } = usePwa();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 shadow-sm text-xs transition-all relative z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="font-medium">
            You are currently working offline. Your changes are saved on this device and will sync when internet connectivity returns.
            {pendingCount > 0 && ` (${pendingCount} pending)`}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-600 rounded text-white/90 hover:text-white transition-colors"
          aria-label="Dismiss offline message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

