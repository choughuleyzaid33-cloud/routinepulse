import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Phone,
  Send,
  LogOut,
  Zap,
  KeyRound,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';
import { api } from '../utils/api';

interface WhatsAppLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: {
    state: string;
    qrCode: string | null;
    pairingCode?: string | null;
    user: { id?: string; name?: string } | null;
    isLinked?: boolean;
  };
  onRefresh: () => void;
}

export const WhatsAppLinkModal: React.FC<WhatsAppLinkModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'pairing'>('qr');
  const [pairingPhone, setPairingPhone] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Namaste from RoutinePulse! Your automated message was sent successfully. 🚀');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger initial connect if disconnected and not connected yet
    if (status.state === 'disconnected' && !status.isLinked && !status.qrCode) {
      handleStartQRConnect(false);
    }

    // Active polling while modal is open (ensures QR, pairing code, and connected state arrive immediately)
    const timer = setInterval(() => {
      onRefresh();
    }, 2000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartQRConnect = async (forceFresh = false) => {
    setIsConnecting(true);
    try {
      await api.connectWhatsAppClient(undefined, forceFresh);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) return;
    setIsConnecting(true);
    try {
      await api.connectWhatsAppClient(pairingPhone, true);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to unlink your WhatsApp device?')) return;
    try {
      await api.disconnectWhatsAppClient();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTestStatus(null);
    try {
      const res = await api.sendDirectWhatsAppMessage(testPhone, testMessage);
      if (res.success) {
        setTestStatus('SUCCESS: Sent directly via WhatsApp socket!');
      } else {
        setTestStatus(`ERROR: ${res.error}`);
      }
    } catch (err: any) {
      setTestStatus(`ERROR: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isLinked = Boolean(status.isLinked || status.state === 'connected' || status.state === 'standby');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Link Your WhatsApp Account</h2>
            <p className="text-xs text-slate-400">
              Stealth Wake-on-Demand (Never kept online 24/7)
            </p>
          </div>
        </div>

        {isLinked ? (
          /* Connected & Linked State (Wake-on-Demand Stealth Mode) */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">Device Linked & Ready!</h3>
                  <p className="text-xs text-slate-300">
                    Linked account: <span className="font-mono text-emerald-400">{status.user?.name || status.user?.id || 'Active WhatsApp Device'}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 inline-block" />
                Stealth Standby
              </span>
            </div>

            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Stealth Wake-on-Demand Mode (Offline 24/7):</span>
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">Never kept online 24/7:</strong> The socket sleeps completely and keeps your WhatsApp status offline.</li>
                <li><strong className="text-slate-200">Wakes on-demand:</strong> Connects for 2-3 seconds only at the exact scheduled reminder time to transmit your text.</li>
                <li><strong className="text-slate-200">100% Autonomous:</strong> Delivers reminders in the background even when your laptop or phone is closed.</li>
              </ul>
            </div>

            {/* Test Direct Message Form */}
            <form onSubmit={handleSendTest} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Wake-and-Send (Instant)</span>
              </p>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send a Test Message (Instant)</span>
              </p>

              <div>
                <input
                  type="tel"
                  required
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="Indian mobile number (e.g. 9876543210 or +91...)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Waking & Sending...' : 'Test Wake-and-Send'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Unlink Device</span>
                </button>
              </div>

              {testStatus && (
                <p className={`text-[11px] font-mono mt-1 ${testStatus.startsWith('SUCCESS') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testStatus}
                </p>
              )}
            </form>
          </div>
        ) : (
          /* Linking Mode Selection: QR Code or 8-Digit Pairing Code */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('qr');
                  handleStartQRConnect();
                }}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'qr'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Method 1: Scan QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pairing')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'pairing'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Method 2: 8-Digit Code</span>
              </button>
            </div>

            {activeTab === 'qr' ? (
              /* TAB 1: QR Code */
              <div className="space-y-3">
                <div className="text-center py-1">
                  {status.qrCode ? (
                    <div className="inline-block p-3.5 bg-white rounded-2xl shadow-xl">
                      <img
                        src={status.qrCode}
                        alt="Scan WhatsApp QR Code"
                        className="w-52 h-52 mx-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-52 h-52 mx-auto bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-4">
                      <RefreshCw className="w-7 h-7 animate-spin mb-2 text-emerald-400" />
                      <p className="text-xs text-center font-medium">Generating fresh QR code...</p>
                    </div>
                  )}

                  <div className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleStartQRConnect(true)}
                      disabled={isConnecting}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
                      <span>{isConnecting ? 'Refreshing...' : 'Get Fresh QR Code'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <p className="font-bold text-white uppercase tracking-wider text-[11px]">How to scan:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Open <strong className="text-white">WhatsApp</strong> on your mobile phone.</li>
                    <li>Tap <strong className="text-white">Settings</strong> (or 3 dots on top right) &gt; <strong className="text-emerald-400">Linked Devices</strong>.</li>
                    <li>Tap <strong className="text-white">Link a Device</strong> and point your camera here.</li>
                  </ol>
                </div>
              </div>
            ) : (
              /* TAB 2: Pairing Code (Link with phone number instead) */
              <div className="space-y-3">
                <form onSubmit={handleStartPairingCode} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Enter your WhatsApp Phone Number (India)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="tel"
                        required
                        value={pairingPhone}
                        onChange={e => setPairingPhone(e.target.value)}
                        placeholder="e.g. 9876543210 or +919876543210"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={isConnecting}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md whitespace-nowrap"
                      >
                        {isConnecting ? 'Getting Code...' : 'Get Code'}
                      </button>
                    </div>
                  </div>
                </form>

                {status.pairingCode ? (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Your WhatsApp Pairing Code:</p>
                    <div className="flex items-center justify-center space-x-3">
                      <span className="font-mono text-2xl font-black tracking-widest text-emerald-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                        {status.pairingCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(status.pairingCode!)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"
                      >
                        {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Open WhatsApp &gt; Linked Devices &gt; <strong>Link with phone number instead</strong> &gt; Type this 8-digit code.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                    <p className="font-bold text-white uppercase tracking-wider text-[11px]">How pairing code works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Enter your 10-digit mobile number above and click <strong>Get Code</strong>.</li>
                      <li>You will receive an 8-character code on this screen.</li>
                      <li>Open WhatsApp on your phone &gt; <strong>Linked Devices</strong> &gt; <strong>Link with phone number instead</strong> and type the code.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleStartQRConnect(true)}
                disabled={isConnecting}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>Refresh Connection</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
