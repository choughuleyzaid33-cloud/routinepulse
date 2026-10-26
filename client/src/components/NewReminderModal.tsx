import React, { useState, useEffect } from 'react';
import { Reminder, Contact, TargetType, ScheduleType, PriorityLevel } from '../types';
import {
  X,
  Clock,
  Sparkles,
  Phone,
  User,
  Send,
  Calendar,
  Volume2,
  Tag,
  Repeat,
  Heart,
  Briefcase,
  Dumbbell,
  Droplets,
  Sun
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { api } from '../utils/api';

interface NewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (reminder: Reminder) => void;
  contacts: Contact[];
  editingReminder?: Reminder | null;
}

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 }
];

export const NewReminderModal: React.FC<NewReminderModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  contacts,
  editingReminder
}) => {
  const [targetType, setTargetType] = useState<TargetType>('someone_else');
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [time, setTime] = useState('09:00');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [soundAlert, setSoundAlert] = useState('crystal');
  const [tags, setTags] = useState<string>('WhatsApp, Daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (editingReminder) {
      setTargetType(editingReminder.targetType);
      setTitle(editingReminder.title);
      setRecipientName(editingReminder.recipientName);
      setRecipientPhone(editingReminder.recipientPhone);
      setMessage(editingReminder.message);
      setScheduleType(editingReminder.scheduleType);
      setTime(editingReminder.time);
      setDate(editingReminder.date);
      setDaysOfWeek(editingReminder.daysOfWeek || [1, 2, 3, 4, 5]);
      setIntervalMinutes(editingReminder.intervalMinutes || 60);
      setPriority(editingReminder.priority);
      setSoundAlert(editingReminder.soundAlert || 'crystal');
      setTags((editingReminder.tags || []).join(', '));
    } else {
      // Default clean state
      setTargetType('someone_else');
      setTitle('');
      setRecipientName('');
      setRecipientPhone('');
      setMessage('');
      setScheduleType('daily');
      setTime('09:00');
      setDate(new Date().toISOString().split('T')[0]);
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setIntervalMinutes(60);
      setPriority('medium');
      setSoundAlert('crystal');
      setTags('WhatsApp, Daily');
    }
  }, [editingReminder, isOpen]);

  if (!isOpen) return null;

  const handleContactSelect = (contactId: string) => {
    const found = contacts.find(c => c.id === contactId);
    if (found) {
      setRecipientName(found.name);
      setRecipientPhone(found.phone);
      if (!title) {
        setTitle(`Daily ping for ${found.name}`);
      }
    }
  };

  const toggleDay = (dayVal: number) => {
    if (daysOfWeek.includes(dayVal)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter(d => d !== dayVal));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayVal].sort());
    }
  };

  const applySmartPreset = async (category: string) => {
    setIsGenerating(true);
    try {
      const res = await api.smartGenerate(recipientName || 'there', category, 'friendly');
      if (res.generatedText) {
        setMessage(res.generatedText);
      }
    } catch {
      // Fallback
      if (category === 'medication') {
        setMessage(`Hi ${recipientName || 'there'}! 💊 Gentle daily reminder to take your scheduled vitamins and medicine.`);
      } else if (category === 'morning') {
        setMessage(`Good morning ${recipientName || 'there'}! ☀️ Wishing you a wonderful, productive day ahead!`);
      } else if (category === 'hydration') {
        setMessage(`Hey ${recipientName || 'there'}! 💧 Quick reminder to drink a tall glass of water and stay energized.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSound = () => {
    soundManager.playAlert(soundAlert);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanTags = tags.split(',').map(t => t.trim()).filter(Boolean);

      const reminderData: Partial<Reminder> = {
        title: title || (targetType === 'someone_else' ? `WhatsApp message to ${recipientName}` : 'My Daily Reminder'),
        targetType,
        recipientName: targetType === 'self' ? 'Myself' : (recipientName || 'Friend'),
        recipientPhone: targetType === 'someone_else' ? recipientPhone : '',
        channel: targetType === 'someone_else' ? 'whatsapp' : 'system',
        message: message || title,
        scheduleType,
        time,
        date,
        daysOfWeek,
        intervalMinutes,
        priority,
        soundAlert,
        tags: cleanTags,
        active: true
      };

      let result: Reminder;
      if (editingReminder) {
        result = await api.updateReminder(editingReminder.id, reminderData);
      } else {
        result = await api.createReminder(reminderData);
      }

      onSaved(result);
      onClose();
    } catch (err) {
      console.error('Failed to save reminder:', err);
      alert('Could not save reminder. Please verify connection to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Glow Header Border */}
        <div className={`h-1.5 w-full ${targetType === 'someone_else' ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>{editingReminder ? 'Edit Scheduled Reminder' : 'Create New Automation'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automate WhatsApp messages to loved ones or set smart self-reminders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Type Switcher */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Who is this reminder for?
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetType('someone_else')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  targetType === 'someone_else'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Remind Someone (WhatsApp)</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('self')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  targetType === 'self'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Remind Myself</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Reminder Title</span>
              <span className="text-[10px] text-slate-500 font-normal">e.g. Mom's vitamins, Team standup, Water alert</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={targetType === 'someone_else' ? "e.g. Daily Medication Reminder for Mom" : "e.g. Drink 500ml Water"}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Recipient Details (When Someone Else) */}
          {targetType === 'someone_else' && (
            <div className="space-y-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp Recipient</span>
                </span>
                {contacts.length > 0 && (
                  <select
                    onChange={e => handleContactSelect(e.target.value)}
                    defaultValue=""
                    className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
                  >
                    <option value="" disabled>Select from Saved Contacts...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="e.g. Mom, Sarah, John"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    placeholder="9876543210 or +91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Indian 10-digit number (automatically formatted with +91)</span>
                </div>
              </div>
            </div>
          )}

          {/* Message Content & Smart Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {targetType === 'someone_else' ? 'WhatsApp Message Text' : 'Reminder Note / Instructions'}
              </label>
              {targetType === 'someone_else' && (
                <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Smart One-Click Templates:</span>
                </span>
              )}
            </div>

            {/* Smart Template Quick Pills */}
            {targetType === 'someone_else' && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => applySmartPreset('medication')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center space-x-1 transition"
                >
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>Medication / Health</span>
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => applySmartPreset('morning')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center space-x-1 transition"
                >
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Good Morning</span>
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => applySmartPreset('work')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center space-x-1 transition"
                >
                  <Briefcase className="w-3 h-3 text-blue-400" />
                  <span>Work & Standup</span>
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => applySmartPreset('workout')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center space-x-1 transition"
                >
                  <Dumbbell className="w-3 h-3 text-orange-400" />
                  <span>Gym Check-in</span>
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => applySmartPreset('hydration')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white flex items-center space-x-1 transition"
                >
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span>Hydration</span>
                </button>
              </div>
            )}

            <textarea
              required
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={targetType === 'someone_else' ? "Type the exact WhatsApp message to be sent..." : "Details or notes for this self reminder..."}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {/* Schedule Configuration */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Automated Scheduling</span>
              </span>
            </div>

            {/* Schedule Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: 'daily', label: 'Daily', desc: 'Every day' },
                { type: 'weekdays', label: 'Weekdays', desc: 'Mon - Fri' },
                { type: 'custom_days', label: 'Custom Days', desc: 'Select days' },
                { type: 'once', label: 'One-Time', desc: 'Single date' },
                { type: 'interval', label: 'Interval', desc: 'Every X mins' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setScheduleType(item.type as ScheduleType)}
                  className={`p-2 rounded-xl text-center border transition ${
                    scheduleType === item.type
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Time / Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {scheduleType !== 'interval' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Scheduled Time (24h/Local)</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {scheduleType === 'once' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {scheduleType === 'interval' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Repeat Every (Minutes)</label>
                  <select
                    value={intervalMinutes}
                    onChange={e => setIntervalMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every 1 hour</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={180}>Every 3 hours</option>
                    <option value={240}>Every 4 hours</option>
                  </select>
                </div>
              )}
            </div>

            {/* Custom Days Picker */}
            {scheduleType === 'custom_days' && (
              <div className="pt-2">
                <label className="text-xs text-slate-400 mb-1.5 block">Select Days of the Week</label>
                <div className="flex gap-2">
                  {DAYS.map(d => {
                    const isSelected = daysOfWeek.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sound & Priority & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                <span>Audio Alert</span>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </label>
              <select
                value={soundAlert}
                onChange={e => setSoundAlert(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="crystal">Crystal Chime</option>
                <option value="radar">Radar Pulse</option>
                <option value="harp">Gentle Harp</option>
                <option value="chime">Classic Chime</option>
                <option value="cosmic">Cosmic Ambient</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority Level</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Health, Daily, WhatsApp"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition transform hover:-translate-y-0.5 ${
              targetType === 'someone_else'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-900/30'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-900/30'
            }`}
          >
            {targetType === 'someone_else' ? <Send className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span>{isSubmitting ? 'Saving...' : editingReminder ? 'Save Changes' : 'Activate Automation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
