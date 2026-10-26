import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import open from 'open';
import {
  readDb,
  writeDb,
  getUserSettings,
  updateUserSettings,
  getUserItems,
  createUserItem,
  updateUserItem,
  deleteUserItem
} from './db.js';
import {
  requireAuth,
  registerUser,
  loginUser,
  ensureDefaultUser
} from './auth.js';
import { calculateNextRun, activeSseClients, broadcastSse } from './scheduler.js';
import { dispatchReminder, getWhatsAppUrls, sanitizePhoneNumber } from './dispatcher.js';
import {
  getWhatsAppStatus,
  initWhatsAppClient,
  disconnectWhatsAppSession,
  sendDirectWhatsAppMessage
} from './whatsapp-client.js';
import { getNetworkInfo, startRemoteTunnel, stopRemoteTunnel } from './network.js';

export const router = express.Router();

// Ensure Zaid's account is seeded
ensureDefaultUser();

// ----------------------------------------------------
// PUBLIC HEALTH & SSE STREAMS
// ----------------------------------------------------

// System Status / Ping (Public for UptimeRobot / Cron-Job.org 24/7 Keep-Alive)
router.get('/status', (req, res) => {
  const db = readDb();
  const reminders = db.reminders || [];
  const activeCount = reminders.filter(r => r.active).length;

  res.json({
    status: 'online',
    appName: 'RoutinePulse 24/7 Engine',
    serverTime: new Date().toISOString(),
    localTime: new Date().toLocaleTimeString(),
    activeReminders: activeCount,
    totalReminders: reminders.length,
    totalUsers: (db.users || []).length,
    activeSseClients: activeSseClients.size
  });
});

// SSE Stream for live events
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  activeSseClients.add(res);

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    activeSseClients.delete(res);
  });
});

// ----------------------------------------------------
// AUTHENTICATION (REGISTER & LOGIN)
// ----------------------------------------------------

router.post('/auth/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/auth/me', requireAuth, (req, res) => {
  const settings = getUserSettings(req.user.id);
  res.json({
    user: req.user,
    settings
  });
});

// ----------------------------------------------------
// REMINDERS (MULTI-USER)
// ----------------------------------------------------

router.get('/reminders', requireAuth, (req, res) => {
  const reminders = getUserItems('reminders', req.user.id);
  res.json(reminders);
});

router.post('/reminders', requireAuth, (req, res) => {
  const payload = req.body;
  const newReminder = {
    id: `rem_${uuidv4().slice(0, 8)}`,
    userId: req.user.id,
    title: payload.title || 'Untitled Reminder',
    targetType: payload.targetType || 'someone_else',
    recipientName: payload.recipientName || (payload.targetType === 'self' ? 'Myself' : 'Friend'),
    recipientPhone: sanitizePhoneNumber(payload.recipientPhone || ''),
    channel: payload.channel || 'whatsapp',
    category: payload.category || 'Personal',
    time: payload.time || '09:00',
    scheduleType: payload.scheduleType || 'daily',
    daysOfWeek: Array.isArray(payload.daysOfWeek) ? payload.daysOfWeek : [1, 2, 3, 4, 5],
    date: payload.date || null,
    intervalMinutes: Number(payload.intervalMinutes) || 60,
    message: payload.message || '',
    templateId: payload.templateId || null,
    soundAlert: payload.soundAlert || 'crystal',
    active: payload.active !== undefined ? payload.active : true,
    createdAt: new Date().toISOString(),
    lastRun: null,
    nextRun: null
  };

  newReminder.nextRun = calculateNextRun(newReminder);
  createUserItem('reminders', newReminder, req.user.id);

  broadcastSse('reminder_updated', { userId: req.user.id, action: 'create', reminder: newReminder });
  res.status(201).json(newReminder);
});

router.put('/reminders/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  const current = getUserItems('reminders', req.user.id).find(r => r.id === id);
  if (!current) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const updatedCandidate = {
    ...current,
    ...payload,
    id,
    userId: req.user.id,
    recipientPhone: sanitizePhoneNumber(payload.recipientPhone || current.recipientPhone)
  };

  updatedCandidate.nextRun = calculateNextRun(updatedCandidate);
  const result = updateUserItem('reminders', id, updatedCandidate, req.user.id);

  broadcastSse('reminder_updated', { userId: req.user.id, action: 'update', reminder: result });
  res.json(result);
});

router.delete('/reminders/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  deleteUserItem('reminders', id, req.user.id);
  broadcastSse('reminder_updated', { userId: req.user.id, action: 'delete', id });
  res.json({ success: true, message: 'Reminder deleted' });
});

router.post('/reminders/:id/toggle', requireAuth, (req, res) => {
  const { id } = req.params;
  const current = getUserItems('reminders', req.user.id).find(r => r.id === id);
  if (!current) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const updated = updateUserItem('reminders', id, { active: !current.active }, req.user.id);
  broadcastSse('reminder_updated', { userId: req.user.id, action: 'toggle', reminder: updated });
  res.json(updated);
});

router.post('/reminders/:id/trigger', requireAuth, async (req, res) => {
  const { id } = req.params;
  const reminder = getUserItems('reminders', req.user.id).find(r => r.id === id);
  if (!reminder) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const result = await dispatchReminder(reminder, true);
  broadcastSse('reminder_fired', { userId: req.user.id, reminder, result, manual: true });
  res.json({ success: true, result });
});

// ----------------------------------------------------
// ROUTINES & HABITS (MULTI-USER)
// ----------------------------------------------------

router.get('/routines', requireAuth, (req, res) => {
  const routines = getUserItems('routines', req.user.id);
  res.json(routines);
});

router.post('/routines', requireAuth, (req, res) => {
  const payload = req.body;
  const newRoutine = {
    id: `rtn_${uuidv4().slice(0, 8)}`,
    userId: req.user.id,
    title: payload.title || 'Untitled Routine',
    category: payload.category || 'Morning',
    targetTime: payload.targetTime || '07:00',
    streak: 0,
    steps: Array.isArray(payload.steps) ? payload.steps.map(s => ({
      id: s.id || `stp_${uuidv4().slice(0, 6)}`,
      text: s.text || s,
      completed: false,
      whatsappNudge: !!s.whatsappNudge
    })) : [],
    createdAt: new Date().toISOString()
  };

  createUserItem('routines', newRoutine, req.user.id);
  broadcastSse('routine_updated', { userId: req.user.id, action: 'create', routine: newRoutine });
  res.status(201).json(newRoutine);
});

router.put('/routines/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updated = updateUserItem('routines', id, req.body, req.user.id);
  broadcastSse('routine_updated', { userId: req.user.id, action: 'update', routine: updated });
  res.json(updated);
});

router.delete('/routines/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  deleteUserItem('routines', id, req.user.id);
  broadcastSse('routine_updated', { userId: req.user.id, action: 'delete', id });
  res.json({ success: true });
});

router.post('/routines/:id/toggle-step', requireAuth, (req, res) => {
  const { id } = req.params;
  const { stepId } = req.body;
  const routine = getUserItems('routines', req.user.id).find(r => r.id === id);
  if (!routine) return res.status(404).json({ error: 'Routine not found' });

  const updatedSteps = (routine.steps || []).map(step => {
    if (step.id === stepId) {
      return { ...step, completed: !step.completed };
    }
    return step;
  });

  const allDone = updatedSteps.length > 0 && updatedSteps.every(s => s.completed);
  const newStreak = allDone ? (routine.streak || 0) + 1 : routine.streak;

  const result = updateUserItem('routines', id, { steps: updatedSteps, streak: newStreak }, req.user.id);
  broadcastSse('routine_updated', { userId: req.user.id, action: 'step_toggle', routine: result });
  res.json(result);
});

router.post('/routines/:id/reset', requireAuth, (req, res) => {
  const { id } = req.params;
  const routine = getUserItems('routines', req.user.id).find(r => r.id === id);
  if (!routine) return res.status(404).json({ error: 'Routine not found' });

  const resetSteps = (routine.steps || []).map(s => ({ ...s, completed: false }));
  const result = updateUserItem('routines', id, { steps: resetSteps }, req.user.id);
  broadcastSse('routine_updated', { userId: req.user.id, action: 'reset', routine: result });
  res.json(result);
});

// ----------------------------------------------------
// DAY PLANNER TASKS (MULTI-USER)
// ----------------------------------------------------

router.get('/tasks', requireAuth, (req, res) => {
  const tasks = getUserItems('tasks', req.user.id);
  res.json(tasks);
});

router.post('/tasks', requireAuth, (req, res) => {
  const payload = req.body;
  const newTask = {
    id: `tsk_${uuidv4().slice(0, 8)}`,
    userId: req.user.id,
    title: payload.title || 'Untitled Task',
    startTime: payload.startTime || '09:00',
    endTime: payload.endTime || '10:00',
    category: payload.category || 'Work',
    completed: false,
    priority: payload.priority || 'medium',
    date: payload.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  createUserItem('tasks', newTask, req.user.id);
  broadcastSse('task_updated', { userId: req.user.id, action: 'create', task: newTask });
  res.status(201).json(newTask);
});

router.put('/tasks/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const updated = updateUserItem('tasks', id, req.body, req.user.id);
  broadcastSse('task_updated', { userId: req.user.id, action: 'update', task: updated });
  res.json(updated);
});

router.delete('/tasks/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  deleteUserItem('tasks', id, req.user.id);
  broadcastSse('task_updated', { userId: req.user.id, action: 'delete', id });
  res.json({ success: true });
});

// ----------------------------------------------------
// CONTACTS DIRECTORY (MULTI-USER)
// ----------------------------------------------------

router.get('/contacts', requireAuth, (req, res) => {
  const contacts = getUserItems('contacts', req.user.id);
  res.json(contacts);
});

router.post('/contacts', requireAuth, (req, res) => {
  const payload = req.body;
  const newContact = {
    id: `cnt_${uuidv4().slice(0, 8)}`,
    userId: req.user.id,
    name: payload.name || 'Unnamed Contact',
    phone: sanitizePhoneNumber(payload.phone || ''),
    email: payload.email || '',
    relationship: payload.relationship || 'Friend',
    birthday: payload.birthday || null,
    notes: payload.notes || '',
    preferredTone: payload.preferredTone || 'friendly',
    avatar: payload.avatar || null,
    createdAt: new Date().toISOString()
  };

  createUserItem('contacts', newContact, req.user.id);
  res.status(201).json(newContact);
});

router.put('/contacts/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const sanitized = {
    ...payload,
    phone: sanitizePhoneNumber(payload.phone || '')
  };
  const updated = updateUserItem('contacts', id, sanitized, req.user.id);
  res.json(updated);
});

router.delete('/contacts/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  deleteUserItem('contacts', id, req.user.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// MESSAGE TEMPLATES
// ----------------------------------------------------

router.get('/templates', requireAuth, (req, res) => {
  const templates = getUserItems('templates', req.user.id);
  res.json(templates);
});

router.post('/templates', requireAuth, (req, res) => {
  const payload = req.body;
  const newTemplate = {
    id: `tpl_${uuidv4().slice(0, 8)}`,
    userId: req.user.id,
    title: payload.title || 'Custom Template',
    category: payload.category || 'General',
    text: payload.text || '',
    placeholders: payload.placeholders || ['name'],
    createdAt: new Date().toISOString()
  };

  createUserItem('templates', newTemplate, req.user.id);
  res.status(201).json(newTemplate);
});

router.delete('/templates/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  deleteUserItem('templates', id, req.user.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// AUDIT LOGS (MULTI-USER)
// ----------------------------------------------------

router.get('/logs', requireAuth, (req, res) => {
  const logs = getUserItems('logs', req.user.id);
  res.json(logs);
});

router.delete('/logs', requireAuth, (req, res) => {
  const db = readDb();
  if (db.logs) {
    db.logs = db.logs.filter(l => l.userId !== req.user.id && (l.userId || req.user.id !== 'user_zaid'));
    writeDb(db);
  }
  res.json({ success: true, message: 'Logs cleared' });
});

// ----------------------------------------------------
// SETTINGS (MULTI-USER)
// ----------------------------------------------------

router.get('/settings', requireAuth, (req, res) => {
  const settings = getUserSettings(req.user.id);
  res.json(settings);
});

router.put('/settings', requireAuth, (req, res) => {
  const updated = updateUserSettings(req.user.id, req.body);
  res.json(updated);
});

// ----------------------------------------------------
// WHATSAPP AUTONOMOUS CLIENT (MULTI-USER)
// ----------------------------------------------------

router.get('/whatsapp/status', requireAuth, (req, res) => {
  const status = getWhatsAppStatus(req.user.id);
  res.json(status);
});

router.post('/whatsapp/connect', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    console.log(`[API WhatsApp Connect for ${req.user.name}] Initiating (phone: ${phone || 'QR'})`);
    const status = await initWhatsAppClient(req.user.id, phone);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/disconnect', requireAuth, async (req, res) => {
  try {
    const result = await disconnectWhatsAppSession(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/send-direct', requireAuth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    const result = await sendDirectWhatsAppMessage(phone, message, req.user.id);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/whatsapp/launch', requireAuth, async (req, res) => {
  try {
    const { phone, text, method } = req.body;
    const cleanPhone = sanitizePhoneNumber(phone);
    const urls = getWhatsAppUrls(cleanPhone, text);
    const targetUrl = method === 'desktop_protocol' ? urls.protocolUrl : urls.webUrl;
    try {
      await open(targetUrl);
    } catch (e) {}
    res.json({ success: true, urls, targetUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// SMART AI GENERATOR
// ----------------------------------------------------

router.post('/smart-generate', requireAuth, (req, res) => {
  const { name = 'Friend', category = 'general', tone = 'friendly', customNote = '' } = req.body;
  const recipientName = name.trim();

  const presets = {
    morning: [
      `Good morning ${recipientName}! ☀️ Hope you slept soundly. May your day be filled with focus, joy, and success!`,
      `Rise and shine ${recipientName}! 🌅 Today is packed with opportunities. Wishing you an awesome day!`,
      `Morning ${recipientName}! Just sending positive energy your way for a productive and calm day.`
    ],
    work: [
      `Hi ${recipientName}, quick follow-up reminder regarding our scheduled deliverables. Let me know if you need any input! 💼`,
      `Hi ${recipientName}, checking in on today's agenda items. Looking forward to our next milestone update!`,
      `Hello ${recipientName}, reminder regarding our upcoming check-in. Looking forward to speaking soon!`
    ],
    workout: [
      `Yo ${recipientName}! 🏋️‍♂️ Time for the daily workout session! Let's get moving and hit our goals today!`,
      `Fitness alarm for ${recipientName}! 🏃 Get your sneakers on, workout time is here. Let's make it count!`,
      `Ready to crush today's session, ${recipientName}? 💪 30 minutes of effort for 24 hours of energy!`
    ],
    birthday: [
      `🎉 Happy Birthday ${recipientName}! 🎂 Wishing you another amazing year filled with laughter, health, and big achievements!`,
      `Happy Birthday ${recipientName}! 🥳 Hope you get to celebrate in style today. Have the best day ever!`,
      `Sending warmest birthday wishes to you ${recipientName}! May all your dreams and wishes come true this year! 🌟`
    ]
  };

  const pool = presets[category] || [
    `Friendly reminder for ${recipientName}: ${customNote || 'don\'t forget your scheduled task today!'} ✨`,
    `Hi ${recipientName}, just wanted to send a quick nudge: ${customNote || 'time for your daily routine check!'} 📌`
  ];

  const randomIndex = Math.floor(Math.random() * pool.length);
  res.json({
    generatedText: pool[randomIndex],
    options: pool
  });
});

// ----------------------------------------------------
// MOBILE & NETWORK ACCESS ROUTES
// ----------------------------------------------------

router.get('/network-info', async (req, res) => {
  try {
    const info = await getNetworkInfo(5000);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tunnel/start', async (req, res) => {
  try {
    const result = await startRemoteTunnel(5000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tunnel/stop', async (req, res) => {
  try {
    const result = await stopRemoteTunnel();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
