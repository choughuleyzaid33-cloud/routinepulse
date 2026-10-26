export type TargetType = 'someone_else' | 'self';
export type ReminderChannel = 'whatsapp' | 'system' | 'all';
export type ScheduleType = 'once' | 'daily' | 'weekdays' | 'custom_days' | 'interval';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Reminder {
  id: string;
  title: string;
  targetType: TargetType;
  recipientName: string;
  recipientPhone: string;
  channel: ReminderChannel;
  message: string;
  scheduleType: ScheduleType;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  intervalMinutes?: number;
  active: boolean;
  lastRun: string | null;
  nextRun: string | null;
  priority: PriorityLevel;
  soundAlert: string;
  tags: string[];
}

export interface RoutineStep {
  id: string;
  text: string;
  completed: boolean;
  durationMinutes: number;
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  time: string;
  days: number[];
  steps: RoutineStep[];
  streak: number;
  lastCompletedDate: string | null;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'urgent_important' | 'important' | 'urgent' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  category: 'work' | 'personal' | 'health' | 'errand';
  subtasks: Subtask[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: 'Family' | 'Friends' | 'Work' | 'VIP' | 'Other';
  avatarColor: string;
  notes: string;
  defaultTemplateId?: string;
  birthday?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: string;
  text: string;
  placeholders: string[];
}

export interface ExecutionLog {
  id: string;
  reminderId: string;
  reminderTitle: string;
  targetType: TargetType;
  recipient: string;
  channel: ReminderChannel;
  status: 'success' | 'failed' | 'simulated';
  messageSent: string;
  timestamp: string;
  details: string;
  urls?: {
    webUrl: string;
    protocolUrl: string;
    apiWaMeUrl: string;
  };
}

export interface AppSettings {
  userName: string;
  userPhone: string;
  timeFormat: '12h' | '24h';
  soundAlerts: boolean;
  soundType: string;
  desktopNotifications: boolean;
  autoOpenWhatsApp: boolean;
  whatsappMethod: 'web_auto' | 'desktop_protocol' | 'twilio' | 'webhook';
  twilio?: {
    accountSid: string;
    authToken: string;
    fromPhone: string;
  };
  webhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
}
