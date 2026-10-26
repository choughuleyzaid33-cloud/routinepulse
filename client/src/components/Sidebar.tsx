import React from 'react';
import {
  LayoutDashboard,
  Bell,
  Zap,
  CalendarCheck,
  Users,
  MessageSquareText,
  ShieldCheck,
  Settings,
  Send,
  Radio,
  Smartphone,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNewReminder: (type?: 'someone_else' | 'self') => void;
  onOpenMobileModal: () => void;
  activeRemindersCount: number;
  routineStreak: number;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenNewReminder,
  onOpenMobileModal,
  activeRemindersCount,
  routineStreak,
  currentUser,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reminders', label: 'Reminders Hub', icon: Bell, badge: activeRemindersCount > 0 ? activeRemindersCount : null },
    { id: 'routines', label: 'Daily Routines', icon: Zap, badge: routineStreak > 0 ? `${routineStreak}🔥` : null },
    { id: 'planner', label: 'Day Planner', icon: CalendarCheck },
    { id: 'contacts', label: 'People Directory', icon: Users },
    { id: 'templates', label: 'Smart Templates', icon: MessageSquareText },
    { id: 'logs', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* App Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950/50">
            <Radio className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-1">
              <span>Routine</span>
              <span className="text-emerald-400">Pulse</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Life Automation Cloud
            </p>
          </div>
        </div>

        {/* Quick Schedule Button */}
        <div className="px-4 py-4">
          <button
            onClick={() => onOpenNewReminder('someone_else')}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition transform hover:-translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Schedule WhatsApp</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    typeof item.badge === 'string' && item.badge.includes('🔥')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Open on Phone Button */}
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={onOpenMobileModal}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/40 hover:to-cyan-600/40 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open on Phone 📱</span>
          </button>
        </div>
      </div>

      {/* User Profile & Daemon Status Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {currentUser && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email || currentUser.phone}</p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5 flex items-center space-x-3">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute inset-0 opacity-75" />
          </div>
          <div className="truncate">
            <p className="text-[11px] font-bold text-white leading-tight">24/7 Engine Active</p>
            <p className="text-[10px] text-slate-400 font-mono">Continuous Cloud Cron</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
