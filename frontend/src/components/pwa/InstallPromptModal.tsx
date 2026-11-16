import React from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';

export const InstallPromptModal: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIos,
    showInstallBanner,
    promptInstall,
    dismissInstallPrompt,
  } = usePwa();

  if (isInstalled || !showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white rounded-2xl shadow-premium border border-[#E2E8F0] p-4.5 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#087FA5] to-[#70218C] flex items-center justify-center p-2 shadow-sm text-white">
            <img src="/icons/pool-logo.svg" alt="Serenity Logo" className="w-full h-full object-contain filter invert brightness-200" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              Install Chakreshwar Pool Dashboard
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Get quick access to pool operations directly from your device.
            </p>
          </div>
        </div>
        <button
          onClick={dismissInstallPrompt}
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIos ? (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700 space-y-1.5 mb-3">
          <p className="font-semibold text-slate-800">To install on iPhone / iPad:</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Share className="w-4 h-4 text-[#087FA5] flex-shrink-0" />
            <span>1. Tap the <strong>Share</strong> button in Safari toolbar</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <PlusSquare className="w-4 h-4 text-[#087FA5] flex-shrink-0" />
            <span>2. Scroll down and tap <strong>Add to Home Screen</strong></span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={promptInstall}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#087FA5] hover:bg-[#066382] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
          <button
            onClick={dismissInstallPrompt}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      )}
    </div>
  );
};

