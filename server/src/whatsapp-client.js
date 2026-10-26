import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';
import { broadcastSse } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_AUTH_DIR = path.join(__dirname, '..', 'data', 'baileys_auth');

// Map of active user sessions: userId -> session state
const userSessions = new Map();

function getOrCreateUserSession(userId = 'user_zaid') {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      sock: null,
      state: 'disconnected',
      qrCode: null,
      pairingCode: null,
      user: null,
      reconnectTimer: null,
      isInitializing: false
    });
  }
  return userSessions.get(userId);
}

function getUserAuthDir(userId = 'user_zaid') {
  if (userId === 'user_zaid') {
    // If credentials already exist directly in BASE_AUTH_DIR (from previous run)
    if (fs.existsSync(path.join(BASE_AUTH_DIR, 'creds.json'))) {
      return BASE_AUTH_DIR;
    }
  }
  const userDir = path.join(BASE_AUTH_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

export function getWhatsAppStatus(userId = 'user_zaid') {
  const session = getOrCreateUserSession(userId);
  const authDir = getUserAuthDir(userId);
  const isLinked = fs.existsSync(authDir) && fs.existsSync(path.join(authDir, 'creds.json'));

  return {
    userId,
    state: session.state,
    qrCode: session.qrCode,
    pairingCode: session.pairingCode,
    user: session.user,
    isLinked
  };
}

export function sanitizePhoneNumber(phone, defaultCountry = '91') {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d]/g, '');

  // Strip leading 0 if 11 digits (e.g. 09876543210 in India)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // If 10 digits and starts with 6,7,8,9 (Standard Indian mobile number), prepend defaultCountry (+91)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = `${defaultCountry}${cleaned}`;
  }

  return cleaned;
}

export async function initWhatsAppClient(userId = 'user_zaid', phoneNumberForPairing = null) {
  const session = getOrCreateUserSession(userId);

  if (session.isInitializing) {
    console.log(`[WhatsApp Socket ${userId}] Initialization already in progress.`);
    return getWhatsAppStatus(userId);
  }

  session.isInitializing = true;

  // Clean up any stale socket for this user
  if (session.sock) {
    try {
      session.sock.ev.removeAllListeners();
      session.sock.end();
    } catch (e) {}
    session.sock = null;
  }

  const authDir = getUserAuthDir(userId);

  try {
    session.state = 'connecting';
    broadcastSse('whatsapp_status', { userId, state: 'connecting' });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: userId === 'user_zaid',
      browser: Browsers.windows('Desktop'),
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000
    });

    session.sock = sock;
    sock.ev.on('creds.update', saveCreds);

    // If pairing code requested and not yet registered
    if (phoneNumberForPairing && !sock.authState.creds.registered) {
      const cleanPhone = sanitizePhoneNumber(phoneNumberForPairing);
      setTimeout(async () => {
        try {
          if (session.sock && !session.sock.authState.creds.registered) {
            console.log(`[WhatsApp Socket ${userId}] Requesting Pairing Code for +${cleanPhone}...`);
            const code = await session.sock.requestPairingCode(cleanPhone);
            session.pairingCode = code;
            session.state = 'pairing_code';
            console.log(`[WhatsApp Socket ${userId}] Pairing Code Generated: ${code}`);
            broadcastSse('whatsapp_status', { userId, state: 'pairing_code', pairingCode: code });
          }
        } catch (pairErr) {
          console.error(`[WhatsApp Pairing Code Error ${userId}]`, pairErr);
        }
      }, 2000);
    }

    sock.ev.on('connection.update', async update => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !phoneNumberForPairing) {
        try {
          session.qrCode = await QRCode.toDataURL(qr);
          session.pairingCode = null;
          session.state = 'scan_qr';
          console.log(`[WhatsApp Socket ${userId}] QR Code ready.`);
          broadcastSse('whatsapp_qr', { userId, qrCode: session.qrCode });
          broadcastSse('whatsapp_status', { userId, state: 'scan_qr', qrCode: session.qrCode });
        } catch (qrErr) {
          console.error(`[WhatsApp QR Error ${userId}]`, qrErr);
        }
      }

      if (connection === 'open') {
        session.state = 'connected';
        session.qrCode = null;
        session.pairingCode = null;
        session.user = sock.user || { id: 'unknown', name: 'WhatsApp User' };
        console.log(`====================================================`);
        console.log(`[WhatsApp Socket ${userId}] Connected & Authenticated!`);
        console.log(`Phone ID: ${session.user.id}`);
        console.log(`User:     ${session.user.name || 'Active'}`);
        console.log(`====================================================`);
        broadcastSse('whatsapp_status', { userId, state: 'connected', user: session.user });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`[WhatsApp Socket ${userId}] Connection closed: statusCode=${statusCode}`);

        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        if (isLoggedOut) {
          console.log(`[WhatsApp Socket ${userId}] Logged out. Clearing auth directory.`);
          session.state = 'disconnected';
          session.user = null;
          session.qrCode = null;
          session.pairingCode = null;
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {}
          broadcastSse('whatsapp_status', { userId, state: 'disconnected' });
        } else {
          console.log(`[WhatsApp Socket ${userId}] Reconnecting with saved credentials...`);
          session.state = 'connecting';
          broadcastSse('whatsapp_status', { userId, state: 'connecting' });

          if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
          session.reconnectTimer = setTimeout(() => {
            initWhatsAppClient(userId).catch(console.error);
          }, 2000);
        }
      }
    });

    session.isInitializing = false;
    return getWhatsAppStatus(userId);
  } catch (err) {
    console.error(`[WhatsApp Init Error ${userId}]`, err);
    session.isInitializing = false;
    session.state = 'disconnected';
    broadcastSse('whatsapp_status', { userId, state: 'disconnected', error: err.message });
    return getWhatsAppStatus(userId);
  }
}

/**
 * Send an autonomous WhatsApp message directly via user's socket
 */
export async function sendDirectWhatsAppMessage(phoneNumber, message, userId = 'user_zaid') {
  const session = getOrCreateUserSession(userId);

  if (session.state !== 'connected' || !session.sock) {
    throw new Error('Your WhatsApp is not linked. Please link your WhatsApp in Settings first.');
  }

  const cleanPhone = sanitizePhoneNumber(phoneNumber);
  if (!cleanPhone) {
    throw new Error('Invalid phone number provided');
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;
  console.log(`[WhatsApp Direct Dispatch for ${userId}] Sending to ${jid}`);

  const result = await session.sock.sendMessage(jid, { text: message });
  return result;
}

/**
 * Disconnect and unlink current user session
 */
export async function disconnectWhatsAppSession(userId = 'user_zaid') {
  const session = getOrCreateUserSession(userId);
  try {
    if (session.sock) {
      session.sock.ev.removeAllListeners();
      session.sock.end();
      session.sock = null;
    }
    session.state = 'disconnected';
    session.qrCode = null;
    session.pairingCode = null;
    session.user = null;

    const authDir = getUserAuthDir(userId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    broadcastSse('whatsapp_status', { userId, state: 'disconnected' });
    return { success: true };
  } catch (err) {
    console.error(`[WhatsApp Logout Error ${userId}]`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Auto-reconnect all active sessions found on disk on server startup
 */
export async function reconnectAllActiveWhatsAppSessions() {
  if (!fs.existsSync(BASE_AUTH_DIR)) return;

  // 1. Check default user_zaid at root of baileys_auth
  if (fs.existsSync(path.join(BASE_AUTH_DIR, 'creds.json'))) {
    console.log('[Startup] Found linked session for user_zaid. Auto-reconnecting...');
    initWhatsAppClient('user_zaid').catch(err => console.error('[Startup Reconnect user_zaid]', err.message));
  }

  // 2. Check any subdirectories for other users
  try {
    const entries = fs.readdirSync(BASE_AUTH_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(BASE_AUTH_DIR, entry.name);
        if (fs.existsSync(path.join(subDir, 'creds.json'))) {
          console.log(`[Startup] Found linked session for user ${entry.name}. Auto-reconnecting...`);
          initWhatsAppClient(entry.name).catch(err => console.error(`[Startup Reconnect ${entry.name}]`, err.message));
        }
      }
    }
  } catch (e) {
    console.error('[Startup Reconnect Scan Error]', e.message);
  }
}
