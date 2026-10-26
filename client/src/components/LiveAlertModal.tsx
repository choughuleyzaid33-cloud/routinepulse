import React from 'react';
import { Reminder } from '../types';
import { Bell, MessageSquare, Send, CheckCircle2, Clock, X } from 'lucide-react';
import { api } from '../utils/api';

interface LiveAlertModalProps {
  reminder: Reminder | null;
  onClose: () => void;
}

export const LiveAlertModal: React.FC<LiveAlertModalProps> = ({ reminder, onClose }) => {
  if (!reminder) return null;

  const isWhatsApp = reminder.targetType === 'someone_else';

  const handleLaunchWhatsApp = async () => {
    try {
      await api.launchWhatsApp(reminder.recipientPhone, reminder.message);
    } catch (e) {
      console.error(e);
      // Fallback direct link
      const cleanPhone = reminder.recipientPhone.replace(/[^\d]/g, '');
      const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(reminder.message)}`;
      window.open(url, '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Glow Header */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isWhatsApp ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${isWhatsApp ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
            {isWhatsApp ? <MessageSquare className="w-6 h-6 animate-pulse" /> : <Bell className="w-6 h-6 animate-bounce" />}
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${isWhatsApp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
              {isWhatsApp ? 'WhatsApp Schedule Trigger' : 'Daily Life Self-Reminder'}
            </span>
            <h3 className="text-xl font-bold text-white mt-1">{reminder.title}</h3>
          </div>
        </div>

        {/* Recipient info if applicable */}
        {isWhatsApp && (
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600/30 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
                {reminder.recipientName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{reminder.recipientName}</p>
                <p className="text-xs text-slate-400 font-mono">{reminder.recipientPhone}</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-md">
              WhatsApp Ready
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-6 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
          <p className="text-xs uppercase text-slate-400 font-medium mb-1 tracking-wider">Scheduled Message:</p>
          "{reminder.message}"
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isWhatsApp ? (
            <button
              onClick={handleLaunchWhatsApp}
              className="w-full flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span>Launch & Send in WhatsApp</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition transform hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Completed</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium transition flex items-center justify-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
