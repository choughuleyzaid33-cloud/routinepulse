import React, { useState } from 'react';
import { MessageTemplate } from '../types';
import {
  Sparkles,
  Plus,
  Copy,
  Check,
  Send,
  Trash2,
  Tag,
  Wand2,
  X
} from 'lucide-react';
import { api } from '../utils/api';

interface TemplatesViewProps {
  templates: MessageTemplate[];
  onTemplateCreated: (template: MessageTemplate) => void;
  onTemplateDeleted: (id: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onTemplateCreated,
  onTemplateDeleted
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('Mom');

  // Generator state
  const [genCategory, setGenCategory] = useState('medication');
  const [genTone, setGenTone] = useState('friendly');
  const [genRecipient, setGenRecipient] = useState('Sarah');
  const [genResults, setGenResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // New Template Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Custom');
  const [newText, setNewText] = useState('');

  const categories = Array.from(new Set([
    'all',
    'Morning & Greetings',
    'Medication & Health',
    'Gym & Fitness',
    'Work & Deadlines',
    'Family & Celebrations',
    'Household & Bills',
    'Study & Learning',
    ...templates.map(t => t.category).filter(Boolean)
  ]));

  const filtered = templates.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text.replace(/{name}/g, previewName));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.smartGenerate(genRecipient, genCategory, genTone);
      setGenResults(res.options || [res.generatedText]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = async (text: string) => {
    try {
      const created = await api.createTemplate({
        title: `${genTone.toUpperCase()} ${genCategory} template`,
        category: 'Custom',
        text: text.replace(new RegExp(genRecipient, 'g'), '{name}'),
        placeholders: ['name']
      });
      onTemplateCreated(created);
      alert('Saved into Template Library!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createTemplate({
        title: newTitle,
        category: newCategory,
        text: newText,
        placeholders: ['name']
      });
      onTemplateCreated(created);
      setIsModalOpen(false);
      setNewTitle('');
      setNewText('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Message Templates & Smart Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-crafted messages for health reminders, daily greetings, work updates, and automated pings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Smart Prompt Assistant Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Wand2 className="w-4 h-4" />
          <span>Smart Message Composer</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Instant Message Generator</h2>
        <p className="text-xs text-slate-400 max-w-xl mb-4">
          Generate variations of caring, polite, or energetic reminder texts for loved ones or coworkers with one click.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Recipient Name</label>
            <input
              type="text"
              value={genRecipient}
              onChange={e => setGenRecipient(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Reminder Category</label>
            <select
              value={genCategory}
              onChange={e => setGenCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="medication">Medication & Health 💊</option>
              <option value="morning">Morning Greeting ☀️</option>
              <option value="workout">Gym & Fitness 💪</option>
              <option value="work">Work & Deliverables 💼</option>
              <option value="family">Family & Loved Ones ❤️</option>
              <option value="bills">Bills & Finance 💳</option>
              <option value="study">Study & Focus 📚</option>
              <option value="birthday">Birthday Greeting 🎂</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Tone of Voice</label>
            <select
              value={genTone}
              onChange={e => setGenTone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="friendly">Friendly & Warm 😊</option>
              <option value="caring">Caring & Gentle ❤️</option>
              <option value="professional">Professional 👔</option>
              <option value="energetic">Energetic & Hyped 🔥</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Drafting...' : 'Generate Messages'}</span>
            </button>
          </div>
        </div>

        {/* Generated Suggestions Output */}
        {genResults.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-indigo-950">
            <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
              Generated Options:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {genResults.map((text, i) => (
                <div key={i} className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-3.5 flex flex-col justify-between">
                  <p className="text-xs text-slate-200 italic mb-3">"{text}"</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleCopy(`gen_${i}`, text)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 transition"
                    >
                      {copiedId === `gen_${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === `gen_${i}` ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleSaveGenerated(text)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition"
                    >
                      + Save to Library
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Library Filter Pills & Preview Substituted Name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Preview with recipient name:</span>
          <input
            type="text"
            value={previewName}
            onChange={e => setPreviewName(e.target.value)}
            className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(tpl => {
          const previewText = tpl.text.replace(/{name}/g, previewName);

          return (
            <div
              key={tpl.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                    {tpl.category}
                  </span>
                  <button
                    onClick={() => onTemplateDeleted(tpl.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{tpl.title}</h3>

                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 italic mb-4">
                  "{previewText}"
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Tag: &#123;name&#125;
                </span>

                <button
                  onClick={() => handleCopy(tpl.id, tpl.text)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition flex items-center space-x-1"
                >
                  {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === tpl.id ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Create Custom Template</h2>
            <p className="text-xs text-slate-400 mb-4">
              Use &#123;name&#125; anywhere in your message to dynamically insert the recipient's name
            </p>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Template Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Evening Reflection & Check-in"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="Morning & Greetings">Morning & Greetings</option>
                  <option value="Medication & Health">Medication & Health</option>
                  <option value="Work & Follow-up">Work & Follow-up</option>
                  <option value="Household & Personal">Household & Personal</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Message Text with &#123;name&#125;</label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="Hello {name}! Just checking in to see if you..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
