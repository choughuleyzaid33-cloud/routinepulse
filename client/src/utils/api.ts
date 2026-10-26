import {
  Reminder,
  Routine,
  Task,
  Contact,
  MessageTemplate,
  ExecutionLog,
  AppSettings,
  User
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('routinepulse_token');
  const result: Record<string, string> = { ...headers };
  if (token) {
    result['Authorization'] = `Bearer ${token}`;
  }
  return result;
}

export const api = {
  // Authentication
  login: async (usernameOrEmail: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    localStorage.setItem('routinepulse_token', data.token);
    localStorage.setItem('routinepulse_user', JSON.stringify(data.user));
    return data;
  },

  register: async (payload: { username?: string; name: string; email: string; phone?: string; password: string }): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    localStorage.setItem('routinepulse_token', data.token);
    localStorage.setItem('routinepulse_user', JSON.stringify(data.user));
    return data;
  },

  getMe: async (): Promise<{ user: User; settings: AppSettings }> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Session expired');
    return data;
  },

  logout: () => {
    localStorage.removeItem('routinepulse_token');
    localStorage.removeItem('routinepulse_user');
  },

  // Public Status
  getStatus: async () => {
    const res = await fetch(`${BASE_URL}/status`);
    return res.json();
  },

  // Reminders
  getReminders: async (): Promise<Reminder[]> => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createReminder: async (data: Partial<Reminder>): Promise<Reminder> => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateReminder: async (id: string, data: Partial<Reminder>): Promise<Reminder> => {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteReminder: async (id: string) => {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  toggleReminder: async (id: string): Promise<Reminder> => {
    const res = await fetch(`${BASE_URL}/reminders/${id}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  triggerReminder: async (id: string) => {
    const res = await fetch(`${BASE_URL}/reminders/${id}/trigger`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Routines
  getRoutines: async (): Promise<Routine[]> => {
    const res = await fetch(`${BASE_URL}/routines`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createRoutine: async (data: Partial<Routine>): Promise<Routine> => {
    const res = await fetch(`${BASE_URL}/routines`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateRoutine: async (id: string, data: Partial<Routine>): Promise<Routine> => {
    const res = await fetch(`${BASE_URL}/routines/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteRoutine: async (id: string) => {
    const res = await fetch(`${BASE_URL}/routines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  toggleRoutineStep: async (routineId: string, stepId: string) => {
    const res = await fetch(`${BASE_URL}/routines/${routineId}/toggle-step`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ stepId })
    });
    return res.json();
  },
  resetRoutine: async (routineId: string) => {
    const res = await fetch(`${BASE_URL}/routines/${routineId}/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Day Planner Tasks
  getTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createTask: async (data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteTask: async (id: string) => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Contacts
  getContacts: async (): Promise<Contact[]> => {
    const res = await fetch(`${BASE_URL}/contacts`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createContact: async (data: Partial<Contact>): Promise<Contact> => {
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateContact: async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteContact: async (id: string) => {
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Templates
  getTemplates: async (): Promise<MessageTemplate[]> => {
    const res = await fetch(`${BASE_URL}/templates`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  createTemplate: async (data: Partial<MessageTemplate>): Promise<MessageTemplate> => {
    const res = await fetch(`${BASE_URL}/templates`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteTemplate: async (id: string) => {
    const res = await fetch(`${BASE_URL}/templates/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Logs
  getLogs: async (): Promise<ExecutionLog[]> => {
    const res = await fetch(`${BASE_URL}/logs`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  clearLogs: async () => {
    const res = await fetch(`${BASE_URL}/logs`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  updateSettings: async (data: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Smart message generation
  smartGenerate: async (name: string, category: string, tone = 'friendly', customNote = '') => {
    const res = await fetch(`${BASE_URL}/smart-generate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, category, tone, customNote })
    });
    return res.json();
  },

  // WhatsApp Autonomous Socket Client
  getWhatsAppClientStatus: async () => {
    const res = await fetch(`${BASE_URL}/whatsapp/status`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  connectWhatsAppClient: async (phone?: string, forceFresh = false) => {
    const res = await fetch(`${BASE_URL}/whatsapp/connect`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ phone, forceFresh })
    });
    return res.json();
  },
  disconnectWhatsAppClient: async () => {
    const res = await fetch(`${BASE_URL}/whatsapp/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },
  sendDirectWhatsAppMessage: async (phone: string, message: string) => {
    const res = await fetch(`${BASE_URL}/whatsapp/send-direct`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ phone, message })
    });
    return res.json();
  },
  launchWhatsApp: async (phone: string, text: string, method?: string) => {
    const res = await fetch(`${BASE_URL}/whatsapp/launch`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ phone, text, method })
    });
    return res.json();
  }
};
