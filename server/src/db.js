import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const DEFAULT_USER_SETTINGS = (userId = 'user_zaid', userName = 'User', userPhone = '') => ({
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

export const GLOBAL_TEMPLATES = [
  // 1. Morning & Daily Energy
  {
    id: 'tpl_morning',
    userId: 'global',
    title: 'Morning Greeting & Energy',
    category: 'Morning & Greetings',
    text: 'Good morning {name}! ☀️ Wishing you a productive, peaceful, and highly successful day ahead!',
    placeholders: ['name']
  },
  {
    id: 'tpl_morning_vibe',
    userId: 'global',
    title: 'Rise & Shine Motivation',
    category: 'Morning & Greetings',
    text: 'Rise and shine {name}! 🌅 Today brings new possibilities and great energy. Let\'s conquer today\'s goals!',
    placeholders: ['name']
  },
  {
    id: 'tpl_gratitude',
    userId: 'global',
    title: 'Mindfulness & Positivity',
    category: 'Morning & Greetings',
    text: 'Morning {name}! ✨ Take 3 deep breaths, stay grounded, and remember how far you\'ve already come. Have an awesome day!',
    placeholders: ['name']
  },

  // 2. Health, Medication & Wellness
  {
    id: 'tpl_meds',
    userId: 'global',
    title: 'Morning Medication / Vitamins',
    category: 'Medication & Health',
    text: 'Hi {name}! 💊 Gentle reminder to take your scheduled medicine/vitamins with breakfast and water. Take care!',
    placeholders: ['name']
  },
  {
    id: 'tpl_meds_night',
    userId: 'global',
    title: 'Night Medicine Check-in',
    category: 'Medication & Health',
    text: 'Hi {name}! 🌙 Evening medication reminder: please take your prescribed dose before resting for the night.',
    placeholders: ['name']
  },
  {
    id: 'tpl_hydration',
    userId: 'global',
    title: 'Hydration & Water Break',
    category: 'Medication & Health',
    text: 'Hey {name}! 💧 Hydration check! Drink a tall glass of fresh water right now to stay alert and healthy.',
    placeholders: ['name']
  },
  {
    id: 'tpl_posture_stretch',
    userId: 'global',
    title: 'Posture & Desk Stretch',
    category: 'Medication & Health',
    text: 'Posture alert {name}! 🧘‍♂️ Stand up, stretch your arms, roll your shoulders, and give your spine a quick break.',
    placeholders: ['name']
  },
  {
    id: 'tpl_eye_strain',
    userId: 'global',
    title: '20-20-20 Screen Eye Break',
    category: 'Medication & Health',
    text: 'Hey {name}! 👀 20-20-20 rule: Look away from the screen at something 20 feet away for 20 seconds to rest your eyes.',
    placeholders: ['name']
  },

  // 3. Work, Tasks & Follow-up
  {
    id: 'tpl_work',
    userId: 'global',
    title: 'Deliverable / Task Follow-up',
    category: 'Work & Follow-up',
    text: 'Hello {name}! 💼 Just following up regarding our scheduled task. Please let me know once completed!',
    placeholders: ['name']
  },
  {
    id: 'tpl_meeting_nudge',
    userId: 'global',
    title: 'Meeting in 10 Minutes',
    category: 'Work & Follow-up',
    text: 'Hi {name}! 🗓️ Quick heads-up: our scheduled sync starts in 10 minutes. Looking forward to our discussion!',
    placeholders: ['name']
  },
  {
    id: 'tpl_client_courtesy',
    userId: 'global',
    title: 'Polite Client Check-in',
    category: 'Work & Follow-up',
    text: 'Hi {name}, hope you are having a wonderful week! Quick follow-up regarding our recent proposal. Let me know if you need any clarification.',
    placeholders: ['name']
  },
  {
    id: 'tpl_invoice_reminder',
    userId: 'global',
    title: 'Invoice / Payment Due Nudge',
    category: 'Work & Follow-up',
    text: 'Hello {name}! 🧾 Friendly reminder regarding the outstanding invoice for this period. Please share the payment confirmation once processed.',
    placeholders: ['name']
  },

  // 4. Gym, Fitness & Sports
  {
    id: 'tpl_workout',
    userId: 'global',
    title: 'Gym & Workout Session',
    category: 'Fitness & Sports',
    text: 'Hey {name}! 🏋️‍♂️ Time for today\'s workout session! Pack your sneakers and water bottle—consistency creates champions!',
    placeholders: ['name']
  },
  {
    id: 'tpl_evening_walk',
    userId: 'global',
    title: 'Daily 10k Steps / Evening Walk',
    category: 'Fitness & Sports',
    text: 'Time to step out {name}! 👟 30 minutes of brisk walking for mental clarity and meeting your daily step goal.',
    placeholders: ['name']
  },
  {
    id: 'tpl_protein_post',
    userId: 'global',
    title: 'Post-Workout Fuel & Nutrition',
    category: 'Fitness & Sports',
    text: 'Post-workout check {name}! 🥤 Have your protein shake and nutrient-dense meal to fuel recovery.',
    placeholders: ['name']
  },

  // 5. Family, Friends & Celebrations
  {
    id: 'tpl_birthday',
    userId: 'global',
    title: 'Birthday Celebration Wishes',
    category: 'Family & Friends',
    text: '🎉 Happy Birthday {name}! 🎂 Wishing you wonderful health, great achievements, and lots of joy this year!',
    placeholders: ['name']
  },
  {
    id: 'tpl_anniversary',
    userId: 'global',
    title: 'Anniversary Wishes',
    category: 'Family & Friends',
    text: '💐 Happy Anniversary {name}! 🥂 Wishing you both a lifetime of love, laughter, and beautiful memories together!',
    placeholders: ['name']
  },
  {
    id: 'tpl_call_parents',
    userId: 'global',
    title: 'Call Parents / Family Check-in',
    category: 'Family & Friends',
    text: 'Warm reminder {name}! 📞 Take 5 minutes today to call your parents/family and ask how their day was.',
    placeholders: ['name']
  },
  {
    id: 'tpl_safe_travel',
    userId: 'global',
    title: 'Travel Safely Check-in',
    category: 'Family & Friends',
    text: 'Have a safe journey {name}! 🚗 Please let me know once you arrive safely at your destination.',
    placeholders: ['name']
  },

  // 6. Household, Bills & Utilities
  {
    id: 'tpl_bill_utility',
    userId: 'global',
    title: 'Utility Bill Due Reminder',
    category: 'Household & Bills',
    text: 'Friendly reminder {name}! ⚡ Your utility / Wi-Fi / electricity bill is due soon. Please pay to ensure uninterrupted service.',
    placeholders: ['name']
  },
  {
    id: 'tpl_rent_due',
    userId: 'global',
    title: 'Monthly Rent Payment',
    category: 'Household & Bills',
    text: 'Hello {name}! 🏠 Gentle reminder regarding the monthly house rent payment due for this month. Thank you!',
    placeholders: ['name']
  },
  {
    id: 'tpl_groceries',
    userId: 'global',
    title: 'Groceries & Essentials Checklist',
    category: 'Household & Bills',
    text: 'Quick errand reminder {name}! 🛒 Don\'t forget to pick up the household groceries and items on your checklist today.',
    placeholders: ['name']
  },

  // 7. Study, Exams & Self-Improvement
  {
    id: 'tpl_study_focus',
    userId: 'global',
    title: 'Deep Study / Pomodoro Session',
    category: 'Study & Learning',
    text: 'Focus mode {name}! ⏱️ 25 minutes of deep study/revision starts now. Put your phone on silent and dive in!',
    placeholders: ['name']
  },
  {
    id: 'tpl_exam_prep',
    userId: 'global',
    title: 'Exam Revision Check-in',
    category: 'Study & Learning',
    text: 'Exam prep check {name}! 📚 Complete today\'s scheduled chapter revision and practice problems. You\'ve got this!',
    placeholders: ['name']
  }
];

const INITIAL_DATA = {
  users: [],
  settings: {
    user_zaid: DEFAULT_USER_SETTINGS('user_zaid', 'Zaid', '+918767353773')
  },
  contacts: [],
  templates: GLOBAL_TEMPLATES,
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
    if (!data.templates || data.templates.length < 10) {
      data.templates = GLOBAL_TEMPLATES;
      writeDb(data);
    }
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
  if (!db.settings || typeof db.settings !== 'object') db.settings = {};

  // Migrate legacy flat db.settings (if userName exists at the root)
  if (db.settings.userName !== undefined && !db.settings['user_zaid']) {
    const legacy = { ...db.settings };
    db.settings = {
      user_zaid: { ...legacy, userId: 'user_zaid' }
    };
    writeDb(db);
  }

  if (db.settings[userId]) {
    return db.settings[userId];
  }

  // Find user in users list to fill name/phone
  const user = (db.users || []).find(u => u.id === userId);
  const isMaster = userId === 'user_zaid' || user?.username === 'zaid17';
  const created = DEFAULT_USER_SETTINGS(
    userId,
    user?.name || (isMaster ? 'Zaid' : 'User'),
    user?.phone || (isMaster ? '+918767353773' : '')
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
