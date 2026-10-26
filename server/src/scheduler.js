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

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'; // India Standard Time (IST)

/**
 * Get date/time parts in target timezone (e.g. Asia/Kolkata)
 */
export function getZonedTimeParts(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const m = {};
  for (const p of parts) {
    m[p.type] = p.value;
  }

  const hour = m.hour === '24' ? '00' : m.hour;
  const timeStr = `${hour}:${m.minute}`;
  const dateStr = `${m.year}-${m.month}-${m.day}`;

  const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[dayFmt.format(date)] ?? 0;

  return {
    year: Number(m.year),
    month: Number(m.month),
    day: Number(m.day),
    hour: Number(hour),
    minute: Number(m.minute),
    second: Number(m.second),
    timeStr,
    dateStr,
    dayOfWeek
  };
}

/**
 * Convert a local calendar date/time in target timezone to an exact UTC Date object
 */
export function zonedToUtc(year, month, day, hour, minute, timeZone = DEFAULT_TIMEZONE) {
  const utcEpoch = Date.UTC(year, month - 1, day, hour, minute, 0);
  const approxDate = new Date(utcEpoch);
  const utcDate = new Date(approxDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(approxDate.toLocaleString('en-US', { timeZone }));
  const offset = tzDate.getTime() - utcDate.getTime();
  return new Date(utcEpoch - offset);
}

/**
 * Compute the next run ISO string for a reminder with timezone accuracy
 */
export function calculateNextRun(reminder, fromDate = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const [targetH, targetM] = (reminder.time || '09:00').split(':').map(Number);
  const now = fromDate;

  if (reminder.scheduleType === 'interval') {
    const mins = reminder.intervalMinutes || 60;
    return new Date(now.getTime() + mins * 60 * 1000).toISOString();
  }

  if (reminder.scheduleType === 'once') {
    if (!reminder.date) return null;
    const [y, m, d] = reminder.date.split('-').map(Number);
    const target = zonedToUtc(y, m, d, targetH, targetM, timeZone);
    return target > now ? target.toISOString() : null;
  }

  // Daily, Weekdays, or Custom Days in target timezone
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const dayDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const zoned = getZonedTimeParts(dayDate, timeZone);
    const candidateUtc = zonedToUtc(zoned.year, zoned.month, zoned.day, targetH, targetM, timeZone);

    // If candidate has already passed relative to now, check next day
    if (candidateUtc <= now) {
      continue;
    }

    let matches = false;
    if (reminder.scheduleType === 'daily') {
      matches = true;
    } else if (reminder.scheduleType === 'weekdays') {
      matches = zoned.dayOfWeek >= 1 && zoned.dayOfWeek <= 5;
    } else if (reminder.scheduleType === 'custom_days') {
      matches = Array.isArray(reminder.daysOfWeek) && reminder.daysOfWeek.includes(zoned.dayOfWeek);
    }

    if (matches) {
      return candidateUtc.toISOString();
    }
  }

  return null;
}

// Keep track of reminders fired within the current minute to avoid double triggers
const firedInCurrentMinute = new Set();
let currentMinuteKey = '';

export async function checkRemindersTick() {
  const now = new Date();
  const current = getZonedTimeParts(now, DEFAULT_TIMEZONE);
  const currentTime = current.timeStr; // e.g. "20:31" in India
  const currentDate = current.dateStr; // e.g. "2026-10-26"
  const currentDayOfWeek = current.dayOfWeek;

  const minuteKey = `${currentDate}_${currentTime}`;

  if (minuteKey !== currentMinuteKey) {
    firedInCurrentMinute.clear();
    currentMinuteKey = minuteKey;
  }

  const db = readDb();
  const reminders = db.reminders || [];

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
      console.log(`[Scheduler Trigger] Running "${reminder.title}" for ${reminder.recipientName} at ${currentTime} IST`);

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
              nextRun: calculateNextRun(item, now, DEFAULT_TIMEZONE)
            };
          }
          return item;
        });
      });

      // Broadcast to connected frontend clients
      broadcastSse('reminder_fired', {
        userId: reminder.userId,
        reminder,
        result,
        timestamp: now.toISOString()
      });
    }
  }
}

let schedulerInterval = null;

export function startScheduler() {
  console.log(`[Scheduler Daemon] Initializing background reminder engine in timezone: ${DEFAULT_TIMEZONE} (IST)...`);

  // Synchronize all existing reminders to correct IST nextRun on startup
  try {
    updateSection('reminders', (list = []) => {
      const now = new Date();
      return list.map(r => ({
        ...r,
        nextRun: calculateNextRun(r, now, DEFAULT_TIMEZONE)
      }));
    });
    console.log('[Scheduler Daemon] Synchronized all existing reminders to IST timezone.');
  } catch (syncErr) {
    console.error('[Scheduler Startup Sync Error]', syncErr.message);
  }

  // Run immediate tick check
  checkRemindersTick().catch(console.error);

  // Tick every 15 seconds for timely execution
  schedulerInterval = setInterval(() => {
    checkRemindersTick().catch(console.error);
  }, 15000);

  // Daily midnight cleanup and nextRun recalculation
  cron.schedule('0 0 * * *', () => {
    console.log('[Scheduler Daemon] Recalculating daily nextRun times in IST...');
    updateSection('reminders', (list = []) => {
      const now = new Date();
      return list.map(r => ({
        ...r,
        nextRun: calculateNextRun(r, now, DEFAULT_TIMEZONE)
      }));
    });
  }, { timezone: DEFAULT_TIMEZONE });
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
