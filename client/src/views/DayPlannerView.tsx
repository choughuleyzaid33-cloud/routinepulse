import React, { useState } from 'react';
import { Task, Subtask } from '../types';
import {
  Calendar,
  CheckCircle2,
  Plus,
  Clock,
  Tag,
  AlertCircle,
  Trash2,
  CheckSquare,
  Square,
  X,
  Filter
} from 'lucide-react';
import { api } from '../utils/api';

interface DayPlannerViewProps {
  tasks: Task[];
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (id: string) => void;
}

const PRIORITY_BADGES = {
  urgent_important: { label: 'Do First (Urgent & Important)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  important: { label: 'Schedule (Important)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  urgent: { label: 'Delegate (Urgent)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  low: { label: 'Casual / Low Priority', color: 'bg-slate-700/40 text-slate-300 border-slate-600' }
};

export const DayPlannerView: React.FC<DayPlannerViewProps> = ({
  tasks,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('14:00');
  const [newPriority, setNewPriority] = useState<Task['priority']>('important');
  const [newCategory, setNewCategory] = useState<Task['category']>('work');
  const [subtasksInput, setSubtasksInput] = useState('Review requirements\nFinalize implementation');

  const filteredTasks = tasks.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    return true;
  });

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) return { ...st, done: !st.done };
      return st;
    });

    const allDone = updatedSubtasks.every(s => s.done);
    const updated = await api.updateTask(task.id, {
      subtasks: updatedSubtasks,
      status: allDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status
    });
    onTaskUpdated(updated);
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updated = await api.updateTask(task.id, {
      status: nextStatus,
      subtasks: task.subtasks.map(st => ({ ...st, done: nextStatus === 'completed' }))
    });
    onTaskUpdated(updated);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtasks: Subtask[] = subtasksInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map((text, i) => ({
        id: `st_${Date.now()}_${i}`,
        text,
        done: false
      }));

    try {
      const created = await api.createTask({
        title: newTitle,
        description: newDesc,
        dueDate: newDate,
        dueTime: newTime,
        priority: newPriority,
        category: newCategory,
        status: 'pending',
        subtasks
      });
      onTaskCreated(created);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      console.error(err);
      alert('Failed to create task');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Day Planner & Priority Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize daily deliverables, time-block your schedule, and execute with clarity
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-950/40 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Daily Task</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['all', 'work', 'personal', 'health', 'errand'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-300">No tasks planned yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Prioritize your daily goals using the Eisenhower Matrix and stay in complete control of your day.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg"
          >
            + Add First Daily Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map(task => {
            const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.important;
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`relative bg-slate-900/80 border rounded-3xl p-5 shadow-xl transition flex flex-col justify-between ${
                  isCompleted ? 'border-slate-800/40 opacity-60' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </span>

                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {task.category}
                    </span>
                  </div>

                  {/* Title & Status checkbox */}
                  <div className="flex items-start space-x-3 mb-2">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className={`text-base font-bold text-white leading-tight ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Due Time & Date */}
                  <div className="flex items-center space-x-3 text-xs text-slate-400 my-3 font-mono">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{task.dueDate}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{task.dueTime}</span>
                    </span>
                  </div>

                  {/* Subtasks */}
                  {task.subtasks.length > 0 && (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                        Checklist ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})
                      </p>
                      {task.subtasks.map(st => (
                        <div
                          key={st.id}
                          onClick={() => handleToggleSubtask(task, st.id)}
                          className={`flex items-center space-x-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                            st.done ? 'text-slate-500 line-through' : 'text-slate-300 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            st.done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-600'
                          }`}>
                            {st.done && <CheckSquare className="w-3 h-3" />}
                          </div>
                          <span className="truncate">{st.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Footer */}
                <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className={`text-[11px] font-medium capitalize ${
                    isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    Status: {task.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => onTaskDeleted(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Add Daily Plan Task</h2>
            <p className="text-xs text-slate-400 mb-4">
              Schedule tasks for today and break them down into action steps
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Prepare monthly budget and invoice review"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as Task['priority'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="urgent_important">Urgent & Important (Do First)</option>
                    <option value="important">Important (Schedule)</option>
                    <option value="urgent">Urgent (Delegate)</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as Task['category'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="errand">Errand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Subtasks (One per line)</label>
                <textarea
                  rows={3}
                  value={subtasksInput}
                  onChange={e => setSubtasksInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
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
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
