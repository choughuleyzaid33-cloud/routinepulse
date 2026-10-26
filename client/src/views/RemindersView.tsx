import React, { useState } from 'react';
import { Reminder, Contact } from '../types';
import {
  Plus,
  Search,
  Send,
  Bell,
  Clock,
  Calendar,
  Zap,
  Edit2,
  Trash2,
  CheckCircle,
  Repeat,
  AlertTriangle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow, parseISO, isFuture } from 'date-fns';
import { api } from '../utils/api';

interface RemindersViewProps {
  reminders: Reminder[];
  contacts: Contact[];
  onOpenNewReminder: (type?: 'someone_else' | 'self') => void;
  onEditReminder: (reminder: Reminder) => void;
  onToggleActive: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTriggerReminder: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  contacts,
  onOpenNewReminder,
  onEditReminder,
  onToggleActive,
  onDeleteReminder,
  onTriggerReminder
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'whatsapp' | 'self' | 'daily' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Extract unique tags
  const allTags = Array.from(new Set(reminders.flatMap(r => r.tags || [])));

  // Filter logic
  const filtered = reminders.filter(r => {
    // Tab filter
    if (filterTab === 'whatsapp' && r.targetType !== 'someone_else') return false;
    if (filterTab === 'self' && r.targetType !== 'self') return false;
    if (filterTab === 'daily' && r.scheduleType !== 'daily' && r.scheduleType !== 'weekdays') return false;
    if (filterTab === 'paused' && r.active) return false;

    // Tag filter
    if (selectedTag !== 'all' && !(r.tags || []).includes(selectedTag)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchRecipient = (r.recipientName || '').toLowerCase().includes(q);
      const matchPhone = (r.recipientPhone || '').includes(q);
      const matchMessage = (r.message || '').toLowerCase().includes(q);
      return matchTitle || matchRecipient || matchPhone || matchMessage;
    }

    return true;
  });

  const handleDirectWhatsAppSend = async (reminder: Reminder) => {
    try {
      const res = await api.sendDirectWhatsAppMessage(reminder.recipientPhone, reminder.message);
      if (res.success) {
        alert(`Message sent autonomously via WhatsApp to ${reminder.recipientName}!`);
        return;
      }
    } catch {
      // Fallback to web link
    }

    try {
      await api.launchWhatsApp(reminder.recipientPhone, reminder.message);
    } catch {
      const clean = reminder.recipientPhone.replace(/[^\d]/g, '');
      window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(reminder.message)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Reminders & WhatsApp Automation Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage scheduled messages for others and alarms for your personal routine
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenNewReminder('someone_else')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition transform hover:-translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>New WhatsApp Schedule</span>
          </button>

          <button
            onClick={() => onOpenNewReminder('self')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-950/40 transition transform hover:-translate-y-0.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>New Self Reminder</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All Reminders' },
            { id: 'whatsapp', label: 'People (WhatsApp)' },
            { id: 'self', label: 'Myself' },
            { id: 'daily', label: 'Daily Recurring' },
            { id: 'paused', label: 'Paused' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as typeof filterTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterTab === tab.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input & Tag Filter */}
        <div className="flex items-center space-x-2">
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, contact, text..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h3 className="text-base font-bold text-slate-300">No reminders match your filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try switching filter tabs or create a new automated reminder to get started.
          </p>
          <div className="mt-4 flex justify-center space-x-3">
            <button
              onClick={() => onOpenNewReminder('someone_else')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
            >
              Schedule WhatsApp Message
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(rem => {
            const isWhatsApp = rem.targetType === 'someone_else';
            let nextRunText = 'Not scheduled';
            if (rem.active && rem.nextRun) {
              const dt = parseISO(rem.nextRun);
              if (isFuture(dt)) {
                nextRunText = `Fires ${formatDistanceToNow(dt, { addSuffix: true })}`;
              } else {
                nextRunText = 'Pending execution';
              }
            }

            return (
              <div
                key={rem.id}
                className={`relative bg-slate-900/80 border rounded-3xl p-5 shadow-xl transition flex flex-col justify-between ${
                  rem.active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isWhatsApp
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {isWhatsApp ? 'WhatsApp Schedule' : 'Self Reminder'}
                    </span>

                    {/* Active toggle */}
                    <button
                      onClick={() => onToggleActive(rem.id)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                        rem.active
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {rem.active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1.5">{rem.title}</h3>

                  {/* Recipient Details if Someone Else */}
                  {isWhatsApp && (
                    <div className="flex items-center space-x-2 mb-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {rem.recipientName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">{rem.recipientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{rem.recipientPhone}</p>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 italic mb-3 line-clamp-3">
                    "{rem.message}"
                  </div>

                  {/* Schedule Info */}
                  <div className="space-y-1 text-xs text-slate-400 mb-3">
                    <div className="flex items-center space-x-1.5 text-indigo-300 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {rem.time} •{' '}
                        {rem.scheduleType === 'daily'
                          ? 'Daily'
                          : rem.scheduleType === 'weekdays'
                          ? 'Weekdays (Mon-Fri)'
                          : rem.scheduleType === 'interval'
                          ? `Every ${rem.intervalMinutes}m`
                          : rem.scheduleType === 'custom_days'
                          ? 'Custom days'
                          : `Once (${rem.date})`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {nextRunText}
                    </div>
                  </div>

                  {/* Tags */}
                  {rem.tags && rem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {rem.tags.map(t => (
                        <span key={t} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isWhatsApp ? (
                    <button
                      onClick={() => handleDirectWhatsAppSend(rem)}
                      className="flex-1 py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Now</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onTriggerReminder(rem.id)}
                      className="flex-1 py-1.5 px-3 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Trigger Test</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditReminder(rem)}
                      title="Edit Reminder"
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      title="Delete Reminder"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
