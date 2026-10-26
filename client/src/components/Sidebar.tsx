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
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNewReminder: (type?: 'someone_else' | 'self') => void;
  activeRemindersCount: number;
  routineStreak: number;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenNewReminder,
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
    { id: 'templates', label: 'Templates', icon: MessageSquareText },
    { id: 'logs', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-[#0c0c0e] border-r border-white/[0.06] flex-col justify-between shrink-0 h-screen sticky top-0 font-sans">
      <div>
        {/* App Logo */}
        <div className="p-5 border-b border-white/[0.06] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-emerald-500/20 ring-1 ring-white/10">
            <Radio className="w-4.5 h-4.5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1">
              <span>Routine</span>
              <span className="text-emerald-400">Pulse</span>
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
              Cloud Automation
            </p>
          </div>
        </div>

        {/* Quick Schedule Button */}
        <div className="px-4 py-4">
          <button
            onClick={() => onOpenNewReminder('someone_else')}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all duration-150 active:scale-[0.99]"
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800/80 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    typeof item.badge === 'string' && item.badge.includes('🔥')
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & 24/7 Engine Footer */}
      <div className="p-4 border-t border-white/[0.06] space-y-2.5">
        {currentUser && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-emerald-500/30">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">@{currentUser.username || currentUser.name.toLowerCase()}</p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="bg-zinc-950/60 border border-white/[0.04] rounded-2xl p-2.5 flex items-center space-x-2.5">
          <div className="relative">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute inset-0 opacity-75" />
          </div>
          <div className="truncate">
            <p className="text-[11px] font-semibold text-zinc-300 leading-tight">Live Cloud Engine</p>
            <p className="text-[10px] text-zinc-400 font-mono">24/7 Background Scheduler</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
