import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const DEFAULT_USER_SETTINGS = (userId = 'user_zaid', userName = 'Zaid', userPhone = '+918767353773') => ({
  userId,
  userName,
  userPhone,
  countryCode: '+91', // Default India
  timeFormat: '12h',
  soundAlerts: true,
  soundType: 'crystal',
  desktopNotifications: true,
  autoOpenWhatsApp: true,
  whatsappMethod: 'web_auto',
  twilio: {
    accountSid: '',
    authToken: '',
    fromPhone: ''
  },
  webhookUrl: '',
  telegramBotToken: '',
  telegramChatId: '',
  quietHours: {
    enabled: false,
    start: '23:00',
    end: '07:00'
  }
});

const INITIAL_DATA = {
  users: [],
  settings: {
    user_zaid: DEFAULT_USER_SETTINGS('user_zaid', 'Zaid', '+918767353773')
  },
  contacts: [],
  templates: [
    {
      id: 'tpl_morning',
      userId: 'global',
      title: 'Morning Greeting & Motivation',
      category: 'Morning & Greetings',
      text: 'Good morning {name}! ☀️ Wishing you a productive and joyful day ahead. Have a great day!',
      placeholders: ['name']
    },
    {
      id: 'tpl_meds',
      userId: 'global',
      title: 'Medicine / Health Reminder',
      category: 'Medication & Health',
      text: 'Hi {name}! 💊 Gentle reminder to take your scheduled medicine/vitamins. Please drink water and take care!',
      placeholders: ['name']
    },
    {
      id: 'tpl_hydration',
      userId: 'global',
      title: 'Water & Hydration Break',
      category: 'Medication & Health',
      text: 'Hey {name}! 💧 Quick reminder to drink a tall glass of water and take a quick break!',
      placeholders: ['name']
    },
    {
      id: 'tpl_work',
      userId: 'global',
      title: 'Work / Task Follow-up',
      category: 'Work & Follow-up',
      text: 'Hello {name}! 💼 Just following up regarding our scheduled task. Please let me know once done!',
      placeholders: ['name']
    },
    {
      id: 'tpl_workout',
      userId: 'global',
      title: 'Gym & Fitness Check-in',
      category: 'Household & Personal',
      text: 'Hey {name}! 💪 Time for today\'s workout session. Let\'s stay consistent with our fitness goals!',
      placeholders: ['name']
    },
    {
      id: 'tpl_birthday',
      userId: 'global',
      title: 'Birthday Celebration Wishes',
      category: 'Household & Personal',
      text: '🎉 Happy Birthday {name}! 🎂 Wishing you good health, lots of happiness, and a wonderful year ahead!',
      placeholders: ['name']
    }
  ],
  reminders: [],
  routines: [],
  tasks: [],
  logs: []
};

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function resetDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  return INITIAL_DATA;
}

if (!fs.existsSync(DB_FILE)) {
  resetDatabase();
}

export function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.users) data.users = [];
    if (!data.templates) data.templates = INITIAL_DATA.templates;
    return data;
  } catch (err) {
    console.error('Error reading DB, re-initializing fallback:', err);
    return INITIAL_DATA;
  }
}

export function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

export function updateSection(section, updater) {
  const data = readDb();
  if (typeof updater === 'function') {
    data[section] = updater(data[section]);
  } else {
    data[section] = updater;
  }
  writeDb(data);
  return data[section];
}

// ----------------------------------------------------
// MULTI-USER DATA HELPERS
// ----------------------------------------------------

export function getUserSettings(userId = 'user_zaid') {
  const db = readDb();
  if (!db.settings) db.settings = {};

  // If old flat settings format exists, migrate it
  if (db.settings.userName !== undefined && !db.settings[userId]) {
    const oldFlat = { ...db.settings, userId: 'user_zaid' };
    db.settings = { user_zaid: oldFlat };
    writeDb(db);
  }

  if (db.settings[userId]) {
    return db.settings[userId];
  }

  // Find user in users list to fill name/phone
  const user = (db.users || []).find(u => u.id === userId);
  const created = DEFAULT_USER_SETTINGS(
    userId,
    user?.name || 'User',
    user?.phone || ''
  );
  db.settings[userId] = created;
  writeDb(db);
  return created;
}

export function updateUserSettings(userId = 'user_zaid', updates = {}) {
  const db = readDb();
  if (!db.settings) db.settings = {};
  const current = getUserSettings(userId);
  const merged = { ...current, ...updates, userId };
  db.settings[userId] = merged;
  writeDb(db);
  return merged;
}

export function getUserItems(section, userId = 'user_zaid') {
  const db = readDb();
  const list = db[section] || [];
  return list.filter(item => {
    if (section === 'templates' && item.userId === 'global') return true;
    return item.userId === userId || (!item.userId && userId === 'user_zaid');
  });
}

export function createUserItem(section, item, userId = 'user_zaid') {
  const db = readDb();
  if (!db[section]) db[section] = [];
  const newItem = { ...item, userId };
  db[section].unshift(newItem);
  writeDb(db);
  return newItem;
}

export function updateUserItem(section, id, updates, userId = 'user_zaid') {
  const db = readDb();
  if (!db[section]) db[section] = [];
  let updated = null;
  db[section] = db[section].map(item => {
    if (item.id === id && (item.userId === userId || (!item.userId && userId === 'user_zaid'))) {
      updated = { ...item, ...updates, id, userId };
      return updated;
    }
    return item;
  });
  writeDb(db);
  return updated;
}

export function deleteUserItem(section, id, userId = 'user_zaid') {
  const db = readDb();
  if (!db[section]) db[section] = [];
  db[section] = db[section].filter(item => {
    if (item.id === id) {
      return !(item.userId === userId || (!item.userId && userId === 'user_zaid'));
    }
    return true;
  });
  writeDb(db);
  return true;
}
