import React, { useState } from 'react';
import { Radio, Lock, Mail, User as UserIcon, Phone, AtSign, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(usernameOrEmail, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        username,
        name,
        email,
        phone,
        password: registerPassword
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Lovable Atmospheric Subtle Lighting */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[420px] relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center text-zinc-950 font-black shadow-xl shadow-emerald-500/20 ring-1 ring-white/20">
              <Radio className="w-6 h-6 text-zinc-950" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-sm -z-10" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-1">
            <span>Routine</span>
            <span className="text-emerald-400">Pulse</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs font-normal">
            Autonomous Daily Routines & WhatsApp Automation Engine
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle top edge specular highlight */}
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          {/* Segmented Tab Pill */}
          <div className="flex bg-zinc-950/70 p-1 rounded-xl mb-6 border border-white/[0.06] relative">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Login View */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={e => setUsernameOrEmail(e.target.value)}
                    placeholder="Username or email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-sm rounded-xl transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Registration View */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Choose Username
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. sarah_j"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  WhatsApp Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-sm rounded-xl transition-all duration-150 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Clean Security Badge Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-center space-x-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>Private & isolated WhatsApp sessions per user</span>
          </div>
        </div>
      </div>
    </div>
  );
};
