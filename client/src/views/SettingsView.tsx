import React, { useState } from 'react';
import { AppSettings } from '../types';
import {
  Settings,
  Shield,
  Volume2,
  Bell,
  Send,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Save,
  MessageSquare,
  QrCode,
  Zap,
  Power,
  Terminal
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { api } from '../utils/api';

interface SettingsViewProps {
  settings: AppSettings;
  whatsAppStatus: {
    state: string;
    qrCode: string | null;
    user: any;
    isLinked?: boolean;
  };
  onOpenWhatsAppLink: () => void;
  onSettingsUpdated: (settings: AppSettings) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  whatsAppStatus,
  onOpenWhatsAppLink,
  onSettingsUpdated,
  onDataReset
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form data whenever settings change (e.g. switching accounts)
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('RoutinePulse Notifications Enabled', {
          body: 'Scheduled reminders and alarms will now pop up on your desktop.'
        });
      }
    }
  };

  const handleTestSound = () => {
    soundManager.playAlert(formData.soundType);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateSettings(formData);
      onSettingsUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    window.open('/api/export', '_blank');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          alert('Backup data successfully imported! Refreshing...');
          window.location.reload();
        } else {
          alert('Failed to import backup data.');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <span>Settings & Automation Integrations</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure WhatsApp automation methods, audio alerts, notification preferences, and backups
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* WhatsApp Autonomous Linked Device Card */}
        {(() => {
          const isLinked = Boolean(whatsAppStatus.isLinked || whatsAppStatus.state === 'connected' || whatsAppStatus.state === 'standby');
          return (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  <span>WhatsApp Autonomous Multi-Device Link</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  isLinked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  {isLinked ? 'Linked & Stealth Standby' : 'Not Linked'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isLinked
                      ? `Linked: ${whatsAppStatus.user?.name || whatsAppStatus.user?.id || 'Active WhatsApp Device'}`
                      : 'Link WhatsApp Web for Background Sending'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    {isLinked
                      ? 'Stealth Wake-on-Demand Mode: You will NOT be kept online 24/7. RoutinePulse stays completely asleep and wakes for 2-3s only to transmit scheduled reminders, keeping your WhatsApp status completely offline.'
                      : 'When linked, scheduled messages are transmitted directly over WhatsApp Web sockets even when your phone or laptop is closed.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenWhatsAppLink}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center space-x-2 transition shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isLinked ? 'Manage Connection' : 'Scan QR Code'}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* 24/7 Silent Background Daemon & Windows Startup Info */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Power className="w-4 h-4" />
            <span>24/7 Silent Background Daemon & Auto-Start</span>
          </div>
          <h2 className="text-lg font-bold text-white">Runs continuously even when browser is closed</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            RoutinePulse includes a background scheduler daemon that ticks every 15 seconds.
            You can keep it running 24/7 silently on Windows without keeping a command prompt or browser tab open:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-emerald-400 mb-1 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>start-silent.vbs</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Launches the server invisibly in the background with zero CMD window.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-indigo-400 mb-1 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>install-auto-start.bat</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Configures Windows to auto-boot RoutinePulse silently on computer startup.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-rose-400 mb-1 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>stop-background.bat</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Stops and terminates any running background daemon instance safely.
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Automation Dispatch Method */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Automation Engine</span>
          </div>
          <h2 className="text-lg font-bold text-white">How scheduled WhatsApp messages are dispatched</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              {
                id: 'web_auto',
                title: 'WhatsApp Web Auto-Open',
                badge: 'Recommended',
                desc: 'Opens web.whatsapp.com with phone & text pre-loaded automatically when timer hits'
              },
              {
                id: 'desktop_protocol',
                title: 'WhatsApp Desktop Native App',
                badge: 'Windows App',
                desc: 'Launches native Windows WhatsApp Desktop app via whatsapp:// protocol'
              },
              {
                id: 'twilio',
                title: 'Twilio WhatsApp Cloud API',
                badge: 'Headless / No Browser',
                desc: 'Sends messages directly from the background server without opening any windows'
              },
              {
                id: 'webhook',
                title: 'Webhook / Telegram Bot',
                badge: 'Developers',
                desc: 'Forwards reminder triggers to a custom webhook or Telegram bot'
              }
            ].map(item => (
              <div
                key={item.id}
                onClick={() => setFormData({ ...formData, whatsappMethod: item.id as AppSettings['whatsappMethod'] })}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  formData.whatsappMethod === item.id
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Auto open toggle */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Automatically Open Browser / App on Trigger</p>
              <p className="text-[11px] text-slate-400">If enabled, the server launches the WhatsApp link as soon as the scheduled minute arrives</p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoOpenWhatsApp}
              onChange={e => setFormData({ ...formData, autoOpenWhatsApp: e.target.checked })}
              className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Twilio Config Sub-panel */}
          {formData.whatsappMethod === 'twilio' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 mt-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Twilio WhatsApp API Credentials:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account SID</label>
                  <input
                    type="text"
                    value={formData.twilio?.accountSid || ''}
                    onChange={e => setFormData({
                      ...formData,
                      twilio: { ...formData.twilio!, accountSid: e.target.value }
                    })}
                    placeholder="AC..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={formData.twilio?.authToken || ''}
                    onChange={e => setFormData({
                      ...formData,
                      twilio: { ...formData.twilio!, authToken: e.target.value }
                    })}
                    placeholder="Auth Token"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">From Number</label>
                  <input
                    type="text"
                    value={formData.twilio?.fromPhone || ''}
                    onChange={e => setFormData({
                      ...formData,
                      twilio: { ...formData.twilio!, fromPhone: e.target.value }
                    })}
                    placeholder="+14155238886"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Webhook Config Sub-panel */}
          {formData.whatsappMethod === 'webhook' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 mt-3">
              <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Webhook URL (POST payload):
              </label>
              <input
                type="url"
                value={formData.webhookUrl || ''}
                onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                placeholder="https://discord.com/api/webhooks/... or https://your-server.com/webhook"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          )}
        </div>

        {/* Audio Alerts & Notifications */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Volume2 className="w-4 h-4" />
            <span>Sounds & Alarms</span>
          </div>
          <h2 className="text-lg font-bold text-white">Audio Synthesis & Desktop Notifications</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Default Audio Tone</label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.soundType}
                  onChange={e => setFormData({ ...formData, soundType: e.target.value })}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="crystal">Crystal Chime (Elegant Chord)</option>
                  <option value="radar">Radar Pulse (Tech Double-Beep)</option>
                  <option value="harp">Gentle Harp (Relaxing Sweep)</option>
                  <option value="chime">Classic Chime (Two-Tone)</option>
                  <option value="cosmic">Cosmic Ambient (Deep Resonance)</option>
                </select>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Browser Desktop Notifications</label>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800 border border-slate-700">
                <span className="text-xs text-slate-300 capitalize">
                  Status: {notificationPermission}
                </span>
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestNotification}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Grant Permission
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white">Profile Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Your Name</label>
              <input
                type="text"
                value={formData.userName}
                onChange={e => setFormData({ ...formData, userName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Your Mobile Phone</label>
              <input
                type="tel"
                value={formData.userPhone}
                onChange={e => setFormData({ ...formData, userPhone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </span>
          ) : <div />}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold text-xs rounded-xl shadow-lg transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      {/* Backup, Restore & Reset */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white">Data Management & Backup</h2>
        <p className="text-xs text-slate-400">
          Export full backups of all your scheduled reminders, routines, contacts, and custom templates.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON Backup</span>
          </button>

          <label className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restore Backup JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onDataReset}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Sample Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
