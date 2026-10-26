import React, { useState, useEffect } from 'react';
import {
  Reminder,
  Routine,
  Task,
  Contact,
  MessageTemplate,
  ExecutionLog,
  AppSettings,
  User
} from './types';
import { api } from './utils/api';
import { soundManager } from './utils/audio';

// Components & Views
import { Sidebar } from './components/Sidebar';
import { LiveAlertModal } from './components/LiveAlertModal';
import { NewReminderModal } from './components/NewReminderModal';
import { WhatsAppLinkModal } from './components/WhatsAppLinkModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import {
  LayoutDashboard,
  Bell,
  Zap,
  CalendarCheck,
  Settings,
  Radio,
  Send,
  LogOut,
  Download,
  Smartphone
} from 'lucide-react';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { RemindersView } from './views/RemindersView';
import { RoutinesView } from './views/RoutinesView';
import { DayPlannerView } from './views/DayPlannerView';
import { ContactsView } from './views/ContactsView';
import { TemplatesView } from './views/TemplatesView';
import { LogsView } from './views/LogsView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Modals
  const [activeAlertReminder, setActiveAlertReminder] = useState<Reminder | null>(null);
  const [isNewReminderOpen, setIsNewReminderOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isWhatsAppLinkOpen, setIsWhatsAppLinkOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [whatsAppStatus, setWhatsAppStatus] = useState<{
    state: string;
    qrCode: string | null;
    user: any;
    isLinked?: boolean;
  }>({ state: 'disconnected', qrCode: null, user: null });

  // Listen for PWA beforeinstallprompt on mobile/desktop
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Load user data
  const loadData = async () => {
    try {
      const [rems, rts, tsks, cnts, tmpls, lgs, stgs, waSt] = await Promise.all([
        api.getReminders(),
        api.getRoutines(),
        api.getTasks(),
        api.getContacts(),
        api.getTemplates(),
        api.getLogs(),
        api.getSettings(),
        api.getWhatsAppClientStatus()
      ]);

      setReminders(rems);
      setRoutines(rts);
      setTasks(tsks);
      setContacts(cnts);
      setTemplates(tmpls);
      setLogs(lgs);
      setSettings(stgs);
      if (waSt) setWhatsAppStatus(waSt);
    } catch (err) {
      console.warn('Backend loading, will retry in background:', err);
    }
  };

  // Check existing token on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('routinepulse_token');
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
        setSettings(res.settings);
        await loadData();
      } catch (err) {
        console.warn('Token validation failed, please log in:', err);
        api.logout();
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Live SSE stream connection
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('routinepulse_token');
    const eventSource = new EventSource(`/api/events${token ? `?token=${token}` : ''}`);

    eventSource.addEventListener('reminder_fired', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.userId && payload.userId !== currentUser.id) return;

        // Play audio alert
        soundManager.playAlert(payload.reminder?.soundAlert || 'crystal');

        // Show Desktop Notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const isWhatsApp = payload.reminder?.targetType === 'someone_else';
          new Notification(payload.reminder?.title || 'Reminder Alert', {
            body: isWhatsApp
              ? `WhatsApp for ${payload.reminder?.recipientName}: "${payload.reminder?.message}"`
              : payload.reminder?.message || 'Routine reminder ready.',
            icon: '/vite.svg'
          });
        }

        // Show live modal overlay
        if (payload.reminder) {
          setActiveAlertReminder(payload.reminder);
        }

        // Refresh reminders and logs
        api.getReminders().then(setReminders).catch(console.error);
        api.getLogs().then(setLogs).catch(console.error);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    });

    eventSource.addEventListener('reminder_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.userId && payload.userId !== currentUser.id) return;
        api.getReminders().then(setReminders).catch(console.error);
      } catch {
        api.getReminders().then(setReminders).catch(console.error);
      }
    });

    eventSource.addEventListener('routine_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.userId && payload.userId !== currentUser.id) return;
        api.getRoutines().then(setRoutines).catch(console.error);
      } catch {
        api.getRoutines().then(setRoutines).catch(console.error);
      }
    });

    eventSource.addEventListener('task_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.userId && payload.userId !== currentUser.id) return;
        api.getTasks().then(setTasks).catch(console.error);
      } catch {
        api.getTasks().then(setTasks).catch(console.error);
      }
    });

    eventSource.addEventListener('whatsapp_status', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.userId && payload.userId !== currentUser.id) return;
        setWhatsAppStatus(prev => ({ ...prev, ...payload }));
      } catch (err) {
        console.error('Error parsing WA status event:', err);
      }
    });

    eventSource.addEventListener('whatsapp_qr', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.userId && payload.userId !== currentUser.id) return;
        setWhatsAppStatus(prev => ({ ...prev, state: 'scan_qr', qrCode: payload.qrCode }));
      } catch (err) {
        console.error('Error parsing WA QR event:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [currentUser]);

  // Handlers
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSettings(null);
    setWhatsAppStatus({ state: 'disconnected', qrCode: null, user: null, isLinked: false });
    setReminders([]);
    setRoutines([]);
    setTasks([]);
    setContacts([]);
    setTemplates([]);
    setLogs([]);
    setCurrentView('dashboard');
  };

  const handleOpenNewReminder = (_type?: 'someone_else' | 'self') => {
    setEditingReminder(null);
    setIsNewReminderOpen(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsNewReminderOpen(true);
  };

  const handleToggleReminderActive = async (id: string) => {
    try {
      const updated = await api.toggleReminder(id);
      setReminders(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerReminder = async (id: string) => {
    try {
      await api.triggerReminder(id);
      const updatedLogs = await api.getLogs();
      setLogs(updatedLogs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRoutineStep = async (routineId: string, stepId: string) => {
    try {
      const updated = await api.toggleRoutineStep(routineId, stepId);
      setRoutines(prev => prev.map(r => (r.id === routineId ? updated : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetRoutine = async (routineId: string) => {
    try {
      const updated = await api.resetRoutine(routineId);
      setRoutines(prev => prev.map(r => (r.id === routineId ? updated : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleForContact = (contact: Contact) => {
    setEditingReminder({
      id: '',
      title: `Check-in with ${contact.name}`,
      targetType: 'someone_else',
      recipientName: contact.name,
      recipientPhone: contact.phone,
      channel: 'whatsapp',
      message: `Hey ${contact.name}! Hope you're doing well today!`,
      scheduleType: 'daily',
      time: '10:00',
      date: new Date().toISOString().split('T')[0],
      daysOfWeek: [1, 2, 3, 4, 5],
      active: true,
      lastRun: null,
      nextRun: null,
      priority: 'medium',
      soundAlert: 'crystal',
      tags: ['contact-nudge']
    });
    setIsNewReminderOpen(true);
  };

  // If loading authentication state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
          <Radio className="w-6 h-6" />
        </div>
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-medium">RoutinePulse 24/7 Cloud... Initializing</p>
      </div>
    );
  }

  // If not authenticated, render Login / Register view
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={async user => {
          setCurrentUser(user);
          setSettings(null);
          setWhatsAppStatus({ state: 'disconnected', qrCode: null, user: null, isLinked: false });
          await loadData();
        }}
      />
    );
  }

  const activeRemindersCount = reminders.filter(r => r.active).length;
  const totalStreaks = routines.reduce((acc, r) => acc + (r.streak || 0), 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Mobile Top Header (Visible on phone only) */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
            <Radio className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-sm text-white">Routine<span className="text-emerald-400">Pulse</span></span>
            <p className="text-[10px] text-slate-400 font-semibold">{currentUser.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
              } else {
                setIsInstallModalOpen(true);
              }
            }}
            title="Install App on Phone"
            className="p-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Download className="w-3 h-3" />
            <span className="text-[11px] font-bold">Install</span>
          </button>
          <button
            onClick={() => handleOpenNewReminder('someone_else')}
            className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
          >
            <Send className="w-3 h-3" />
            <span>New</span>
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenNewReminder={handleOpenNewReminder}
        activeRemindersCount={activeRemindersCount}
        routineStreak={totalStreaks}
        currentUser={currentUser}
        onLogout={handleLogout}
        onInstallApp={() => setIsInstallModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-10 overflow-y-auto max-h-screen pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              reminders={reminders}
              routines={routines}
              tasks={tasks}
              contacts={contacts}
              logs={logs}
              userName={currentUser.name || settings?.userName || 'Zaid'}
              whatsAppStatus={whatsAppStatus}
              onOpenWhatsAppLink={() => setIsWhatsAppLinkOpen(true)}
              onOpenNewReminder={handleOpenNewReminder}
              onNavigate={setCurrentView}
              onToggleRoutineStep={handleToggleRoutineStep}
              onTriggerReminder={handleTriggerReminder}
            />
          )}

          {currentView === 'reminders' && (
            <RemindersView
              reminders={reminders}
              contacts={contacts}
              onOpenNewReminder={handleOpenNewReminder}
              onEditReminder={handleEditReminder}
              onToggleActive={handleToggleReminderActive}
              onDeleteReminder={handleDeleteReminder}
              onTriggerReminder={handleTriggerReminder}
            />
          )}

          {currentView === 'routines' && (
            <RoutinesView
              routines={routines}
              onToggleStep={handleToggleRoutineStep}
              onResetRoutine={handleResetRoutine}
              onRoutineCreated={r => setRoutines(prev => [...prev, r])}
              onDeleteRoutine={id => {
                api.deleteRoutine(id);
                setRoutines(prev => prev.filter(r => r.id !== id));
              }}
            />
          )}

          {currentView === 'planner' && (
            <DayPlannerView
              tasks={tasks}
              onTaskCreated={t => setTasks(prev => [t, ...prev])}
              onTaskUpdated={t => setTasks(prev => prev.map(item => (item.id === t.id ? t : item)))}
              onTaskDeleted={id => {
                api.deleteTask(id);
                setTasks(prev => prev.filter(item => item.id !== id));
              }}
            />
          )}

          {currentView === 'contacts' && (
            <ContactsView
              contacts={contacts}
              templates={templates}
              onContactCreated={c => setContacts(prev => [...prev, c])}
              onContactUpdated={c => setContacts(prev => prev.map(item => (item.id === c.id ? c : item)))}
              onContactDeleted={id => {
                api.deleteContact(id);
                setContacts(prev => prev.filter(item => item.id !== id));
              }}
              onScheduleForContact={handleScheduleForContact}
            />
          )}

          {currentView === 'templates' && (
            <TemplatesView
              templates={templates}
              onTemplateCreated={t => setTemplates(prev => [...prev, t])}
              onTemplateDeleted={id => {
                api.deleteTemplate(id);
                setTemplates(prev => prev.filter(item => item.id !== id));
              }}
            />
          )}

          {currentView === 'logs' && (
            <LogsView
              logs={logs}
              onClearLogs={async () => {
                await api.clearLogs();
                setLogs([]);
              }}
            />
          )}

          {currentView === 'settings' && (
            settings ? (
              <SettingsView
                settings={settings}
                whatsAppStatus={whatsAppStatus}
                onOpenWhatsAppLink={() => setIsWhatsAppLinkOpen(true)}
                onSettingsUpdated={setSettings}
                onDataReset={loadData}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-3">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium">Loading your profile settings...</p>
              </div>
            )
          )}
        </div>
      </main>

      {/* WhatsApp QR & Socket Linking Modal */}
      <WhatsAppLinkModal
        isOpen={isWhatsAppLinkOpen}
        onClose={() => setIsWhatsAppLinkOpen(false)}
        status={whatsAppStatus}
        onRefresh={() => api.getWhatsAppClientStatus().then(setWhatsAppStatus)}
      />

      {/* Install Mobile PWA Modal */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onPromptAccepted={() => setDeferredPrompt(null)}
      />

      {/* Live Fired Reminder Modal Overlay */}
      <LiveAlertModal
        reminder={activeAlertReminder}
        onClose={() => setActiveAlertReminder(null)}
      />

      {/* Create / Edit Reminder Modal */}
      <NewReminderModal
        isOpen={isNewReminderOpen}
        onClose={() => {
          setIsNewReminderOpen(false);
          setEditingReminder(null);
        }}
        onSaved={saved => {
          setReminders(prev => {
            const exists = prev.some(r => r.id === saved.id);
            if (exists) {
              return prev.map(r => (r.id === saved.id ? saved : r));
            }
            return [saved, ...prev];
          });
        }}
        contacts={contacts}
        editingReminder={editingReminder}
      />

      {/* Mobile Bottom Navigation Bar (Phone Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 px-2 py-2 flex items-center justify-around safe-bottom">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentView === 'dashboard'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setCurrentView('reminders')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative ${
            currentView === 'reminders'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Remind</span>
          {activeRemindersCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('routines')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentView === 'routines'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Routines</span>
        </button>

        <button
          onClick={() => setCurrentView('planner')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentView === 'planner'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Planner</span>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            currentView === 'settings'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
