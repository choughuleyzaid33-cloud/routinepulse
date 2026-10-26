import React, { useState } from 'react';
import { Contact, MessageTemplate } from '../types';
import {
  Users,
  Plus,
  Send,
  Phone,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  X,
  MessageCircle
} from 'lucide-react';
import { api } from '../utils/api';

interface ContactsViewProps {
  contacts: Contact[];
  templates: MessageTemplate[];
  onContactCreated: (contact: Contact) => void;
  onContactUpdated: (contact: Contact) => void;
  onContactDeleted: (id: string) => void;
  onScheduleForContact: (contact: Contact) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  templates,
  onContactCreated,
  onContactUpdated,
  onContactDeleted,
  onScheduleForContact
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [quickPingContact, setQuickPingContact] = useState<Contact | null>(null);
  const [quickMessage, setQuickMessage] = useState('');

  // New Contact State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<Contact['category']>('Friends');
  const [notes, setNotes] = useState('');
  const [birthday, setBirthday] = useState('');

  const filtered = contacts.filter(c => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    return true;
  });

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const colors = [
        'from-pink-500 to-rose-500',
        'from-blue-500 to-indigo-500',
        'from-amber-500 to-orange-500',
        'from-emerald-500 to-teal-500',
        'from-purple-500 to-violet-500'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const created = await api.createContact({
        name,
        phone,
        email,
        category,
        notes,
        birthday,
        avatarColor: randomColor
      });
      onContactCreated(created);
      setIsNewContactOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Failed to save contact');
    }
  };

  const handleSendQuickPing = async () => {
    if (!quickPingContact) return;
    try {
      await api.launchWhatsApp(quickPingContact.phone, quickMessage);
    } catch {
      const clean = quickPingContact.phone.replace(/[^\d]/g, '');
      window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(quickMessage)}`, '_blank');
    }
    setQuickPingContact(null);
    setQuickMessage('');
  };

  const handleApplyTemplate = (tpl: MessageTemplate) => {
    if (!quickPingContact) return;
    const substituted = tpl.text.replace(/{name}/g, quickPingContact.name);
    setQuickMessage(substituted);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>People & Contacts Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store loved ones, friends, and colleagues for automated WhatsApp reminders and instant messages
          </p>
        </div>

        <button
          onClick={() => setIsNewContactOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Contact</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['all', 'Family', 'Friends', 'Work', 'VIP', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Contacts Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-300">No contacts in directory yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add your friends, family, or colleagues with their 10-digit mobile number for scheduled automated WhatsApp messages.
          </p>
          <button
            onClick={() => setIsNewContactOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            + Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(contact => (
            <div
              key={contact.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl transition flex flex-col justify-between"
            >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${contact.avatarColor || 'from-indigo-500 to-purple-500'} text-white font-extrabold flex items-center justify-center text-lg shadow-md`}>
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{contact.name}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700/60 inline-block mt-0.5">
                      {contact.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onContactDeleted(contact.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact info list */}
              <div className="space-y-2 text-xs text-slate-300 my-4 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
                <div className="flex items-center space-x-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.birthday && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-pink-400" />
                    <span>Birthday: {contact.birthday}</span>
                  </div>
                )}
              </div>

              {contact.notes && (
                <p className="text-xs text-slate-400 italic line-clamp-2 mb-4">
                  "{contact.notes}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  setQuickPingContact(contact);
                  setQuickMessage(`Hey ${contact.name}! Hope you're having an awesome day! ✨`);
                }}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Instant WhatsApp</span>
              </button>

              <button
                onClick={() => onScheduleForContact(contact)}
                title="Schedule Daily Reminder for this Contact"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition"
              >
                <Clock className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Quick Ping Modal */}
      {quickPingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setQuickPingContact(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Send WhatsApp to {quickPingContact.name}</h2>
                <p className="text-xs text-slate-400 font-mono">{quickPingContact.phone}</p>
              </div>
            </div>

            {/* Template picker */}
            <div className="mb-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                Quick Insert Template:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {templates.slice(0, 4).map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={quickMessage}
              onChange={e => setQuickMessage(e.target.value)}
              placeholder="Write your WhatsApp message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setQuickPingContact(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuickPing}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {isNewContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setIsNewContactOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Add Contact to Directory</h2>
            <p className="text-xs text-slate-400 mb-4">
              Save phone numbers with international codes for automated scheduling
            </p>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Grandma, David, Team Lead"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9876543210 or +91 98765 43210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Relationship / Tag</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Contact['category'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Work">Work</option>
                    <option value="VIP">VIP</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Birthday (Optional)</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes / Routine Details</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Takes vitamins daily at 9am, prefers evening text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewContactOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
