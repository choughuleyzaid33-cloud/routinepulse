import open from 'open';
import { updateSection, getUserSettings } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { getWhatsAppStatus, sendDirectWhatsAppMessage } from './whatsapp-client.js';

/**
 * Format phone number for WhatsApp
 * Supports international formats and auto-formats 10-digit Indian numbers (e.g. 9876543210 -> 919876543210)
 */
export function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d]/g, '');

  // Strip leading 0 if 11 digits (e.g., 09876543210 in India)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // If 10 digits and starts with 6,7,8,9 (Indian standard mobile prefix), prepend 91
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = `91${cleaned}`;
  }

  return cleaned;
}

/**
 * Generate WhatsApp URLs
 */
export function getWhatsAppUrls(phone, text) {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return {
    webUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`,
    protocolUrl: `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`,
    apiWaMeUrl: `https://wa.me/${cleanPhone}?text=${encodedText}`
  };
}

/**
 * Dispatch message across selected channel
 */
export async function dispatchReminder(reminder, isTest = false) {
  const userId = reminder.userId || 'user_zaid';
  const settings = getUserSettings(userId);
  const isSomeoneElse = reminder.targetType === 'someone_else';
  let status = 'success';
  let details = '';
  let urls = null;

  try {
    if (isSomeoneElse && (reminder.channel === 'whatsapp' || reminder.channel === 'all')) {
      const cleanPhone = sanitizePhoneNumber(reminder.recipientPhone);
      urls = getWhatsAppUrls(cleanPhone, reminder.message);
      const waStatus = getWhatsAppStatus(userId);

      // OPTION 1: Direct Autonomous WhatsApp sending (Linked Device via Baileys)
      if (waStatus.state === 'connected') {
        try {
          console.log(`[Autonomous Dispatch for ${userId}] Sending directly via linked WhatsApp to +${cleanPhone}`);
          await sendDirectWhatsAppMessage(cleanPhone, reminder.message, userId);
          details = `Sent autonomously via Linked WhatsApp Session (+${cleanPhone}) — No browser interaction required!`;
        } catch (directErr) {
          console.warn('[Autonomous Dispatch Failed, falling back]', directErr.message);
          details = `Direct socket dispatch failed (${directErr.message}), falling back to browser`;
          await fallbackDispatch(cleanPhone, reminder, settings, urls);
        }
      } else if (settings.whatsappMethod === 'twilio' && settings.twilio?.accountSid && settings.twilio?.authToken) {
        // OPTION 2: Twilio WhatsApp API
        try {
          const auth = Buffer.from(`${settings.twilio.accountSid}:${settings.twilio.authToken}`).toString('base64');
          const body = new URLSearchParams({
            To: `whatsapp:+${cleanPhone}`,
            From: `whatsapp:${settings.twilio.fromPhone}`,
            Body: reminder.message
          });

          const resp = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio.accountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: body.toString()
            }
          );
          const data = await resp.json();
          if (resp.ok) {
            details = `Twilio WhatsApp Message Queued: SID ${data.sid}`;
          } else {
            status = 'failed';
            details = `Twilio Error: ${data.message || JSON.stringify(data)}`;
          }
        } catch (twilioErr) {
          status = 'failed';
          details = `Twilio Request Failed: ${twilioErr.message}`;
        }
      } else {
        // OPTION 3: Browser / Desktop deep link launch
        details = `WhatsApp trigger generated for ${reminder.recipientName} (${reminder.recipientPhone})`;
        if (settings.autoOpenWhatsApp) {
          try {
            const targetUrl = settings.whatsappMethod === 'desktop_protocol' ? urls.protocolUrl : urls.webUrl;
            console.log(`[Auto-Dispatcher] Opening WhatsApp URL: ${targetUrl}`);
            await open(targetUrl);
            details += ' (Automatically launched in browser/desktop app)';
          } catch (openErr) {
            console.warn('[Auto-Dispatcher] Could not auto-launch browser:', openErr.message);
            details += ' (Link created; waiting for user click)';
          }
        }
      }
    } else {
      // Self reminder or system notification
      details = `System reminder triggered for ${reminder.recipientName || 'Self'}: "${reminder.title}"`;
    }

    // Optional Telegram Integration
    if (settings.telegramBotToken && settings.telegramChatId) {
      try {
        const tgText = `🔔 *${reminder.title}*\n${reminder.message}\n_Target: ${reminder.targetType}_`;
        await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: tgText,
            parse_mode: 'Markdown'
          })
        });
        details += ' | Telegram notification sent';
      } catch (tgErr) {
        console.warn('Telegram forward error:', tgErr.message);
      }
    }

    // Optional Webhook Integration
    if (settings.webhookUrl) {
      try {
        await fetch(settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'reminder_triggered',
            reminder,
            isTest,
            timestamp: new Date().toISOString()
          })
        });
        details += ' | Webhook triggered';
      } catch (hookErr) {
        console.warn('Webhook dispatch error:', hookErr.message);
      }
    }
  } catch (err) {
    status = 'failed';
    details = `Dispatch Error: ${err.message}`;
    console.error('[Dispatcher Error]', err);
  }

  // Create audit log with userId
  const logEntry = {
    id: `log_${uuidv4().slice(0, 8)}`,
    userId,
    reminderId: reminder.id,
    reminderTitle: reminder.title,
    targetType: reminder.targetType,
    recipient: isSomeoneElse ? `${reminder.recipientName} (${reminder.recipientPhone})` : reminder.recipientName || 'Myself',
    channel: reminder.channel,
    status,
    messageSent: reminder.message,
    timestamp: new Date().toISOString(),
    details: isTest ? `[TEST TRIGGER] ${details}` : details,
    urls
  };

  updateSection('logs', (currentLogs = []) => [logEntry, ...currentLogs.slice(0, 199)]);

  return {
    success: status === 'success',
    log: logEntry,
    urls
  };
}

async function fallbackDispatch(cleanPhone, reminder, settings, urls) {
  if (settings.autoOpenWhatsApp) {
    const targetUrl = settings.whatsappMethod === 'desktop_protocol' ? urls.protocolUrl : urls.webUrl;
    await open(targetUrl);
  }
}
