import React, { useState } from 'react';
import { ExecutionLog } from '../types';
import {
  ShieldCheck,
  Trash2,
  Send,
  Bell,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../utils/api';

interface LogsViewProps {
  logs: ExecutionLog[];
  onClearLogs: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'system' | 'failed'>('all');

  const filtered = logs.filter(l => {
    if (filter === 'whatsapp' && l.channel !== 'whatsapp') return false;
    if (filter === 'system' && l.channel !== 'system') return false;
    if (filter === 'failed' && l.status === 'success') return false;
    return true;
  });

  const handleLaunchWhatsApp = async (log: ExecutionLog) => {
    if (log.urls?.webUrl) {
      window.open(log.urls.webUrl, '_blank');
    } else {
      // Re-trigger from message
      const phone = log.recipient.replace(/[^\d]/g, '');
      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(log.messageSent)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Automation Execution Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery verification and dispatch logs from the background daemon
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear Execution History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'All Executions' },
          { id: 'whatsapp', label: 'WhatsApp Dispatches' },
          { id: 'system', label: 'Self Reminders' },
          { id: 'failed', label: 'Failed' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as typeof filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === t.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No execution logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reminder / Task</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Message Dispatched</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(log => {
                  const isWhatsApp = log.channel === 'whatsapp';
                  const isSuccess = log.status === 'success';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isSuccess ? 'Delivered' : 'Failed'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        {log.reminderTitle}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {log.recipient}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                          isWhatsApp ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-800 text-indigo-300'
                        }`}>
                          {log.channel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 italic">
                        "{log.messageSent}"
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isWhatsApp && (
                          <button
                            onClick={() => handleLaunchWhatsApp(log)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition inline-flex items-center space-x-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
