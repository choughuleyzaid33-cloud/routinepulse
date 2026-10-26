import React from 'react';
import { X, Smartphone, Download, Globe, Check, Share2, PlusSquare } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onPromptAccepted: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onPromptAccepted
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          onPromptAccepted();
          onClose();
        }
      } catch (e) {
        console.error('Install prompt failed:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Install RoutinePulse App</h3>
            <p className="text-xs text-zinc-400">Add to your phone home screen for instant daily access</p>
          </div>
        </div>

        {/* If Chrome beforeinstallprompt is ready */}
        {deferredPrompt && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
            <p className="text-xs text-emerald-300 font-semibold">
              Ready for 1-Tap Quick Install!
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Install to Home Screen Now</span>
            </button>
          </div>
        )}

        {/* Step by Step Manual Guide */}
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2 text-white font-semibold">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>For Android (Google Chrome / Brave / Samsung)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
              <li>Tap the <strong className="text-zinc-200">3 vertical dots (⋮)</strong> in the top-right corner of Chrome.</li>
              <li>Select <strong className="text-emerald-400">"Install app"</strong> or <strong className="text-emerald-400">"Add to Home screen"</strong>.</li>
              <li>Tap <strong className="text-zinc-200">Install</strong>. RoutinePulse will now open like a native mobile app!</li>
            </ol>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2 text-white font-semibold">
              <Smartphone className="w-4 h-4 text-zinc-200" />
              <span>For iPhone / iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
              <li>Tap the <strong className="text-zinc-200">Share</strong> button (<Share2 className="w-3 h-3 inline text-emerald-400" />) at the bottom of Safari.</li>
              <li>Scroll down and tap <strong className="text-emerald-400">"Add to Home Screen"</strong> (<PlusSquare className="w-3 h-3 inline text-emerald-400" />).</li>
              <li>Tap <strong className="text-zinc-200">Add</strong> in the top right.</li>
            </ol>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
