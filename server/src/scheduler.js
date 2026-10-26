import cron from 'node-cron';
import { readDb, updateSection } from './db.js';
import { dispatchReminder } from './dispatcher.js';

// Connected SSE clients for real-time frontend notification
export const activeSseClients = new Set();

export function broadcastSse(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of activeSseClients) {
    try {
      client.write(payload);
    } catch {
      activeSseClients.delete(client);
    }
  }
}

/**
 * Format Date to YYYY-MM-DD
 */
function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Format Date to HH:mm (24-hour local time)
 */
function toTimeStr(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Compute the next run ISO string for a reminder
 */
export function calculateNextRun(reminder, fromDate = new Date()) {
  const [targetH, targetM] = (reminder.time || '09:00').split(':').map(Number);
  const now = fromDate;

  if (reminder.scheduleType === 'interval') {
    const mins = reminder.intervalMinutes || 60;
    return new Date(now.getTime() + mins * 60 * 1000).toISOString();
  }

  if (reminder.scheduleType === 'once') {
    if (!reminder.date) return null;
    const [y, m, d] = reminder.date.split('-').map(Number);
    const target = new Date(y, m - 1, d, targetH, targetM, 0);
    return target > now ? target.toISOString() : null;
  }

  // Daily, Weekdays, or Custom Days
  const candidate = new Date(now);
  candidate.setHours(targetH, targetM, 0, 0);

  // If candidate is already in the past today, start looking from tomorrow
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const dayOfWeek = candidate.getDay(); // 0 = Sun, 1 = Mon ...
    let matches = false;

    if (reminder.scheduleType === 'daily') {
      matches = true;
    } else if (reminder.scheduleType === 'weekdays') {
      matches = dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (reminder.scheduleType === 'custom_days') {
      matches = Array.isArray(reminder.daysOfWeek) && reminder.daysOfWeek.includes(dayOfWeek);
    }

    if (matches) {
      return candidate.toISOString();
    }
    candidate.setDate(candidate.getDate() + 1);
  }

  return null;
}

// Keep track of reminders fired within the current minute to avoid double triggers
const firedInCurrentMinute = new Set();
let currentMinuteKey = '';

export async function checkRemindersTick() {
  const now = new Date();
  const minuteKey = `${toDateStr(now)}_${toTimeStr(now)}`;

  if (minuteKey !== currentMinuteKey) {
    firedInCurrentMinute.clear();
    currentMinuteKey = minuteKey;
  }

  const db = readDb();
  const reminders = db.reminders || [];
  const currentTime = toTimeStr(now);
  const currentDate = toDateStr(now);
  const currentDayOfWeek = now.getDay();

  for (const reminder of reminders) {
    if (!reminder.active) continue;

    // Check if already fired in this exact minute
    if (firedInCurrentMinute.has(reminder.id)) continue;

    let shouldTrigger = false;

    if (reminder.scheduleType === 'interval') {
      const intervalMs = (reminder.intervalMinutes || 60) * 60 * 1000;
      if (!reminder.lastRun) {
        shouldTrigger = true;
      } else {
        const lastRunTime = new Date(reminder.lastRun).getTime();
        if (now.getTime() - lastRunTime >= intervalMs) {
          shouldTrigger = true;
        }
      }
    } else if (reminder.time === currentTime) {
      if (reminder.scheduleType === 'once') {
        if (reminder.date === currentDate) {
          shouldTrigger = true;
        }
      } else if (reminder.scheduleType === 'daily') {
        shouldTrigger = true;
      } else if (reminder.scheduleType === 'weekdays') {
        if (currentDayOfWeek >= 1 && currentDayOfWeek <= 5) {
          shouldTrigger = true;
        }
      } else if (reminder.scheduleType === 'custom_days') {
        if (Array.isArray(reminder.daysOfWeek) && reminder.daysOfWeek.includes(currentDayOfWeek)) {
          shouldTrigger = true;
        }
      }
    }

    if (shouldTrigger) {
      firedInCurrentMinute.add(reminder.id);
      console.log(`[Scheduler Trigger] Running "${reminder.title}" for ${reminder.recipientName}`);

      // Dispatch
      const result = await dispatchReminder(reminder);

      // Update lastRun & nextRun
      updateSection('reminders', (list = []) => {
        return list.map(item => {
          if (item.id === reminder.id) {
            const isOnce = item.scheduleType === 'once';
            return {
              ...item,
              active: isOnce ? false : item.active,
              lastRun: now.toISOString(),
              nextRun: calculateNextRun(item, now)
            };
          }
          return item;
        });
      });

      // Broadcast to connected frontend clients
      broadcastSse('reminder_fired', {
        reminder,
        result,
        timestamp: now.toISOString()
      });
    }
  }
}

let schedulerInterval = null;

export function startScheduler() {
  console.log('[Scheduler Daemon] Initializing background reminder engine...');
  // Run immediate tick check
  checkRemindersTick().catch(console.error);

  // Tick every 15 seconds for timely execution
  schedulerInterval = setInterval(() => {
    checkRemindersTick().catch(console.error);
  }, 15000);

  // Daily midnight cleanup and nextRun recalculation
  cron.schedule('0 0 * * *', () => {
    console.log('[Scheduler Daemon] Recalculating daily nextRun times...');
    updateSection('reminders', (list = []) => {
      const now = new Date();
      return list.map(r => ({
        ...r,
        nextRun: calculateNextRun(r, now)
      }));
    });
  });
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
