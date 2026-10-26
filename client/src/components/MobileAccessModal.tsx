import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Wifi,
  Globe,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Share2,
  ExternalLink,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface MobileAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NetworkInfo {
  localIp: string;
  port: number;
  localUrl: string;
  localQrCode: string | null;
  tunnel: {
    active: boolean;
    url: string | null;
    qrCode: string | null;
  };
}

export const MobileAccessModal: React.FC<MobileAccessModalProps> = ({ isOpen, onClose }) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'wifi' | 'remote'>('wifi');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isTunnelLoading, setIsTunnelLoading] = useState(false);

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/network-info');
      const data = await res.json();
      setNetworkInfo(data);
    } catch (err) {
      console.error('Error fetching network info:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleToggleTunnel = async () => {
    setIsTunnelLoading(true);
    try {
      if (networkInfo?.tunnel.active) {
        await fetch('/api/tunnel/stop', { method: 'POST' });
      } else {
        await fetch('/api/tunnel/start', { method: 'POST' });
      }
      await fetchNetworkInfo();
    } catch (err) {
      console.error('Tunnel error:', err);
      alert('Could not start remote tunnel. Please verify internet connection.');
    } finally {
      setIsTunnelLoading(false);
    }
  };

  const localUrl = networkInfo?.localUrl || 'http://192.168.0.105:5000';
  const remoteUrl = networkInfo?.tunnel.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Open RoutinePulse on Your Phone</h2>
            <p className="text-xs text-slate-400">
              Access the app from mobile with zero setup
            </p>
          </div>
        </div>

        {/* Tab Selection: Same Wi-Fi vs Anywhere in the World */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'wifi'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Same Wi-Fi (Home / Fast)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remote')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'remote'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. Anywhere (4G / 5G / Remote)</span>
          </button>
        </div>

        {activeTab === 'wifi' ? (
          /* TAB 1: SAME WI-FI ACCESS */
          <div className="space-y-4">
            <div className="text-center py-1">
              {networkInfo?.localQrCode ? (
                <div className="inline-block p-3.5 bg-white rounded-2xl shadow-xl">
                  <img
                    src={networkInfo.localQrCode}
                    alt="Scan with phone camera"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            {/* Quick URL & Copy Button */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wi-Fi Mobile URL</p>
                <p className="text-sm font-mono font-bold text-cyan-400 select-all">{localUrl}</p>
              </div>

              <button
                onClick={() => handleCopy(localUrl)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
              >
                {copiedUrl === localUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl === localUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1">
                <span>📱 Quick Steps:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Make sure your phone is connected to the same Wi-Fi as your PC.</li>
                <li>Open your phone's camera and point it at the QR code above.</li>
                <li>Tap the link to open RoutinePulse in Safari or Chrome!</li>
              </ol>
            </div>
          </div>
        ) : (
          /* TAB 2: REMOTE ACCESS FROM ANYWHERE (4G/5G) */
          <div className="space-y-4">
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Public Secure Cloud Link (HTTPS)</span>
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  networkInfo?.tunnel.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  {networkInfo?.tunnel.active ? 'Online' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Allows you to open RoutinePulse from your phone when you are away from home, on mobile data (4G/5G), or on a different Wi-Fi network.
              </p>

              <button
                onClick={handleToggleTunnel}
                disabled={isTunnelLoading}
                className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  networkInfo?.tunnel.active
                    ? 'bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/60'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg'
                }`}
              >
                {isTunnelLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>
                  {isTunnelLoading
                    ? 'Configuring Tunnel...'
                    : networkInfo?.tunnel.active
                    ? 'Stop Remote Tunnel'
                    : 'Enable Remote Access Link'}
                </span>
              </button>
            </div>

            {networkInfo?.tunnel.active && remoteUrl && (
              <div className="space-y-3">
                <div className="text-center">
                  {networkInfo.tunnel.qrCode && (
                    <div className="inline-block p-3.5 bg-white rounded-2xl shadow-xl">
                      <img
                        src={networkInfo.tunnel.qrCode}
                        alt="Scan Remote QR Code"
                        className="w-44 h-44 mx-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Public HTTPS URL</p>
                    <p className="text-xs font-mono font-bold text-emerald-400 truncate select-all">{remoteUrl}</p>
                  </div>

                  <button
                    onClick={() => handleCopy(remoteUrl)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 shrink-0 transition"
                  >
                    {copiedUrl === remoteUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl === remoteUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PWA / Install as Native App Tips */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300 flex items-center space-x-1">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tip: Install as a Mobile App (Home Screen Icon)</span>
            </p>
            <p>
              Once opened on your phone: on <strong>iPhone</strong> tap <span className="text-white">Share &gt; "Add to Home Screen"</span>; on <strong>Android</strong> tap <span className="text-white">3 dots &gt; "Install app"</span>. It opens full-screen just like a native app!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
