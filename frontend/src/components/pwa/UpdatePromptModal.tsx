import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';

export const UpdatePromptModal: React.FC = () => {
  const { needRefresh, updateServiceWorker, dismissUpdate } = usePwa();

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white rounded-2xl shadow-premium border-2 border-[#087FA5] p-4.5 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#087FA5]/10 text-[#087FA5] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#087FA5]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              New version available
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Update Chakreshwar pool  to get the latest improvements.
            </p>
          </div>
        </div>
        <button
          onClick={dismissUpdate}
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={updateServiceWorker}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Update Now</span>
        </button>
        <button
          onClick={dismissUpdate}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
};

