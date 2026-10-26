import React, { useState, useEffect } from 'react';
import { Reminder, Routine, Task, Contact, ExecutionLog } from '../types';
import {
  Clock,
  Send,
  Bell,
  CheckCircle2,
  Calendar,
  Flame,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Zap,
  Smartphone
} from 'lucide-react';
import { formatDistanceToNow, parseISO, isFuture } from 'date-fns';
import { api } from '../utils/api';

interface DashboardViewProps {
  reminders: Reminder[];
  routines: Routine[];
  tasks: Task[];
  contacts: Contact[];
  logs: ExecutionLog[];
  userName?: string;
  whatsAppStatus: {
    state: string;
    qrCode: string | null;
    user: any;
    isLinked?: boolean;
  };
  onOpenWhatsAppLink: () => void;
  onOpenMobileModal: () => void;
  onOpenNewReminder: (type?: 'someone_else' | 'self') => void;
  onNavigate: (view: string) => void;
  onToggleRoutineStep: (routineId: string, stepId: string) => void;
  onTriggerReminder: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reminders,
  routines,
  tasks,
  contacts,
  logs,
  userName,
  whatsAppStatus,
  onOpenWhatsAppLink,
  onOpenMobileModal,
  onOpenNewReminder,
  onNavigate,
  onToggleRoutineStep,
  onTriggerReminder
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter next upcoming reminders
  const upcomingReminders = reminders
    .filter(r => r.active && r.nextRun && isFuture(parseISO(r.nextRun)))
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
    .slice(0, 4);

  // Statistics
  const activeRemindersCount = reminders.filter(r => r.active).length;
  const whatsappRemindersCount = reminders.filter(r => r.targetType === 'someone_else' && r.active).length;
  const totalStreaks = routines.reduce((acc, r) => acc + (r.streak || 0), 0);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  // Today's Routine completion stats
  const totalRoutineSteps = routines.reduce((acc, r) => acc + r.steps.length, 0);
  const completedRoutineSteps = routines.reduce(
    (acc, r) => acc + r.steps.filter(s => s.completed).length,
    0
  );
  const routinePercentage = totalRoutineSteps > 0
    ? Math.round((completedRoutineSteps / totalRoutineSteps) * 100)
    : 0;

  // Active Morning or Current Routine
  const currentHour = currentTime.getHours();
  const currentPeriod = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
  const featuredRoutine = routines.find(r => r.timeOfDay === currentPeriod) || routines[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RoutinePulse Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Good {currentPeriod}, {userName || 'Zaid'}!
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Your daily life automation hub is running. WhatsApp reminders, self-alarms, and routine check-ins are fully synchronized.
            </p>
          </div>

          {/* Digital Clock */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-slate-400 font-medium">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap gap-3">
          <button
            onClick={() => onOpenNewReminder('someone_else')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition transform hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
            <span>Schedule WhatsApp Message</span>
          </button>

          <button
            onClick={() => onOpenNewReminder('self')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm rounded-xl transition transform hover:-translate-y-0.5"
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Set Self Reminder</span>
          </button>

          <button
            onClick={() => onNavigate('routines')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white font-medium text-sm rounded-xl transition"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Today's Routine Checklist</span>
          </button>

          <button
            onClick={() => onNavigate('planner')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white font-medium text-sm rounded-xl transition"
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Day Planner ({pendingTasks.length} pending)</span>
          </button>

          <button
            onClick={onOpenMobileModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-950/40 transition transform hover:-translate-y-0.5"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open on Phone 📱</span>
          </button>
        </div>
      </div>

      {/* Autonomous 24/7 Status & WhatsApp Linked Device Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg ${
            whatsAppStatus.state === 'connected'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
          }`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">
                {whatsAppStatus.state === 'connected'
                  ? 'WhatsApp Autonomous Sending: Active'
                  : 'WhatsApp Autonomous Device: Not Linked'}
              </h3>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                whatsAppStatus.state === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {whatsAppStatus.state === 'connected' ? '24/7 Background Live' : 'Action Needed'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {whatsAppStatus.state === 'connected'
                ? `Connected as ${whatsAppStatus.user?.name || whatsAppStatus.user?.id || 'WhatsApp User'}. Scheduled texts will send automatically in the background even if this window is closed!`
                : 'Link your WhatsApp by scanning a QR code so your scheduled messages send automatically in the background.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenWhatsAppLink}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-2 transition ${
            whatsAppStatus.state === 'connected'
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-emerald-950/40'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{whatsAppStatus.state === 'connected' ? 'Manage WhatsApp Session' : 'Link WhatsApp (Scan QR)'}</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Scheduled WhatsApp</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{whatsappRemindersCount}</p>
          <p className="text-xs text-slate-500 mt-1">To friends, family & team</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Automations</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{activeRemindersCount}</p>
          <p className="text-xs text-slate-500 mt-1">Self & people combined</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Routine Habit Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{totalStreaks} Days 🔥</p>
          <p className="text-xs text-slate-500 mt-1">{routinePercentage}% done today</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">People Directory</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{contacts.length}</p>
          <p className="text-xs text-slate-500 mt-1">Connected contacts</p>
        </div>
      </div>

      {/* Main Grid: Next Up Radar + Current Routine Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Up Live Radar (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white">Next Up: Scheduled Automation Radar</h2>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingReminders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No pending reminders queued for today.</p>
              <button
                onClick={() => onOpenNewReminder('someone_else')}
                className="mt-3 text-xs text-emerald-400 hover:underline font-medium"
              >
                + Schedule a new reminder now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingReminders.map(rem => {
                const isWhatsApp = rem.targetType === 'someone_else';
                const nextDate = parseISO(rem.nextRun!);
                const relativeTime = formatDistanceToNow(nextDate, { addSuffix: true });

                return (
                  <div
                    key={rem.id}
                    className="relative bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isWhatsApp
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {isWhatsApp ? 'WhatsApp Schedule' : 'Self Reminder'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-medium">
                          {rem.time} ({relativeTime})
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                        {rem.title}
                      </h3>

                      {isWhatsApp && (
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          To: {rem.recipientName} ({rem.recipientPhone})
                        </p>
                      )}

                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                        "{rem.message}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Repeats: {rem.scheduleType}
                      </span>
                      <button
                        onClick={() => onTriggerReminder(rem.id)}
                        className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-lg transition font-medium flex items-center space-x-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Trigger Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Routine Habit Focus (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Daily Routine Focus</h2>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {featuredRoutine?.streak || 0} Day Streak 🔥
              </span>
            </div>

            {featuredRoutine ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{featuredRoutine.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{featuredRoutine.description}</p>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {featuredRoutine.steps.slice(0, 4).map(step => (
                    <div
                      key={step.id}
                      onClick={() => onToggleRoutineStep(featuredRoutine.id, step.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        step.completed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400 line-through'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          step.completed
                            ? 'bg-emerald-500 border-emerald-400 text-black font-bold'
                            : 'border-slate-600'
                        }`}>
                          {step.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-medium">{step.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">
                        {step.durationMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 py-8 text-center text-slate-500">
                <Flame className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-xs">No daily routines set up yet.</p>
                <button
                  onClick={() => onNavigate('routines')}
                  className="mt-2 text-xs text-amber-400 hover:underline font-medium"
                >
                  + Add morning or evening routine
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('routines')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1"
            >
              <span>Open Full Routine Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Execution Logs Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Recent Automation Delivery History</h2>
          </div>
          <button
            onClick={() => onNavigate('logs')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>View Full Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No executions logged yet.</p>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reminder</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.slice(0, 5).map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.status === 'success' ? 'Delivered' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">{log.reminderTitle}</td>
                    <td className="py-3 px-3 text-slate-300">{log.recipient}</td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-mono text-[11px] text-slate-400">{log.channel}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
