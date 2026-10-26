import React, { useState } from 'react';
import { Routine, RoutineStep } from '../types';
import {
  Flame,
  Plus,
  CheckCircle2,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  Sparkles,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

interface RoutinesViewProps {
  routines: Routine[];
  onToggleStep: (routineId: string, stepId: string) => void;
  onResetRoutine: (routineId: string) => void;
  onRoutineCreated: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  morning: <Sunrise className="w-5 h-5 text-amber-400" />,
  afternoon: <Sun className="w-5 h-5 text-orange-400" />,
  evening: <Sunset className="w-5 h-5 text-indigo-400" />,
  night: <Moon className="w-5 h-5 text-purple-400" />
};

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  onToggleStep,
  onResetRoutine,
  onRoutineCreated,
  onDeleteRoutine
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [newTime, setNewTime] = useState('08:00');
  const [stepsInput, setStepsInput] = useState<string>('Drink 500ml water (2m)\n10-minute stretch (10m)\nRead 15 pages (15m)');

  const handleToggle = (routineId: string, stepId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      const willBeComplete = routine.steps.every(s => (s.id === stepId ? !s.completed : s.completed));
      if (willBeComplete) {
        // Fire confetti celebration!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    }
    onToggleStep(routineId, stepId);
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawSteps = stepsInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const steps: RoutineStep[] = rawSteps.map((text, idx) => {
      // Parse "(10m)" duration if provided
      const durationMatch = text.match(/\((\d+)m\)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 5;
      const cleanText = text.replace(/\(\d+m\)/, '').trim();
      return {
        id: `s_${Date.now()}_${idx}`,
        text: cleanText || text,
        completed: false,
        durationMinutes
      };
    });

    try {
      const created = await api.createRoutine({
        title: newTitle || 'Daily Habit Routine',
        description: newDescription,
        timeOfDay: newTimeOfDay,
        time: newTime,
        steps,
        days: [0, 1, 2, 3, 4, 5, 6]
      });
      onRoutineCreated(created);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to create routine');
    }
  };

  // Overall Stats
  const totalSteps = routines.reduce((acc, r) => acc + r.steps.length, 0);
  const completedSteps = routines.reduce((acc, r) => acc + r.steps.filter(s => s.completed).length, 0);
  const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Daily Routines & Habit Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build consistency, structure your daily flow, and celebrate streaks
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-950/40 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Daily Routine</span>
        </button>
      </div>

      {/* Daily Progress Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
            {percent}%
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Today's Routine Completion</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {completedSteps} of {totalSteps} routine steps completed today
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-1/2">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Routine Cards Grid */}
      {routines.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
          <h3 className="text-base font-bold text-slate-300">No daily routines created yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Design your morning awakenings, work sprints, and night wind-downs. Track daily streaks and build lasting consistency!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg"
          >
            + Create First Routine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines.map(routine => {
          const completedCount = routine.steps.filter(s => s.completed).length;
          const isAllDone = routine.steps.length > 0 && completedCount === routine.steps.length;
          const totalDuration = routine.steps.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

          return (
            <div
              key={routine.id}
              className={`relative bg-slate-900/80 border rounded-3xl p-6 shadow-xl transition flex flex-col justify-between ${
                isAllDone ? 'border-emerald-500/40 ring-1 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header with Icon & Streak */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-inner">
                      {ICONS_MAP[routine.timeOfDay] || <Clock className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{routine.title}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{routine.time} • ~{totalDuration} mins</span>
                      </p>
                    </div>
                  </div>

                  {/* Streak */}
                  <span className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{routine.streak || 0}</span>
                  </span>
                </div>

                {routine.description && (
                  <p className="text-xs text-slate-400 mb-4 italic">
                    {routine.description}
                  </p>
                )}

                {/* Steps Checklist */}
                <div className="space-y-2 mb-6">
                  {routine.steps.map(step => (
                    <div
                      key={step.id}
                      onClick={() => handleToggle(routine.id, step.id)}
                      className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                        step.completed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400 line-through'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 flex-1 pr-2">
                        <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center border transition shrink-0 ${
                          step.completed
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-slate-600'
                        }`}>
                          {step.completed && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium leading-tight">{step.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 shrink-0">
                        {step.durationMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Routine Card Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {completedCount}/{routine.steps.length} completed
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onResetRoutine(routine.id)}
                    title="Reset for Tomorrow"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition flex items-center space-x-1 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={() => onDeleteRoutine(routine.id)}
                    title="Delete Routine"
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

      {/* New Routine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Create New Routine</h2>
            <p className="text-xs text-slate-400 mb-4">
              Add a morning ritual, deep work habit, or evening wind-down routine
            </p>

            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Routine Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Morning Awakening Ritual"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Goal</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="e.g. Boost focus and energy before starting work"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Time of Day</label>
                  <select
                    value={newTimeOfDay}
                    onChange={e => setNewTimeOfDay(e.target.value as typeof newTimeOfDay)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="morning">Morning 🌅</option>
                    <option value="afternoon">Afternoon ☀️</option>
                    <option value="evening">Evening 🌇</option>
                    <option value="night">Night 🌙</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Start Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center justify-between">
                  <span>Steps (One per line)</span>
                  <span className="text-[10px] text-slate-500">Add (5m) for duration</span>
                </label>
                <textarea
                  rows={4}
                  value={stepsInput}
                  onChange={e => setStepsInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Create Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
