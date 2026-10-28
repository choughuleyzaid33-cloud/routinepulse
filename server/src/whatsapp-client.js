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
      sleepTimer: null,
      isInitializing: false,
      wakingPromise: null
    });
  }
  return userSessions.get(userId);
}

/**
 * Check if a user's auth directory has registered, valid WhatsApp credentials
 */
export function isUserRegistered(authDir) {
  try {
    const credsPath = path.join(authDir, 'creds.json');
    if (!fs.existsSync(credsPath)) return false;
    const raw = fs.readFileSync(credsPath, 'utf-8');
    const creds = JSON.parse(raw);
    return Boolean(creds && creds.registered === true);
  } catch {
    return false;
  }
}

/**
 * Extract saved user name / id from creds.json on disk
 */
export function getRegisteredUserInfo(authDir) {
  try {
    const credsPath = path.join(authDir, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const raw = fs.readFileSync(credsPath, 'utf-8');
    const creds = JSON.parse(raw);
    if (!creds.registered) return null;
    return creds.me || { id: 'linked_user', name: 'WhatsApp User' };
  } catch {
    return null;
  }
}

/**
 * Get dedicated auth directory for a user
 */
export function getUserAuthDir(userId = 'user_zaid') {
  const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const userDir = path.join(BASE_AUTH_DIR, safeId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

export function getWhatsAppStatus(userId = 'user_zaid') {
  const session = getOrCreateUserSession(userId);
  const authDir = getUserAuthDir(userId);
  const isLinked = isUserRegistered(authDir);
  const savedUser = isLinked ? (session.user || getRegisteredUserInfo(authDir)) : null;

  return {
    userId,
    state: isLinked ? (session.state === 'connected' ? 'connected' : 'standby') : session.state,
    qrCode: session.qrCode,
    pairingCode: session.pairingCode,
    user: savedUser,
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

/**
 * Put the user socket to sleep after inactivity so user remains 100% offline
 */
export function scheduleSessionSleep(userId = 'user_zaid', delayMs = 5000) {
  const session = getOrCreateUserSession(userId);

  if (session.sleepTimer) {
    clearTimeout(session.sleepTimer);
    session.sleepTimer = null;
  }

  session.sleepTimer = setTimeout(async () => {
    session.sleepTimer = null;

    if (session.sock) {
      try {
        try {
          await session.sock.sendPresenceUpdate('unavailable');
        } catch (e) {}

        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch (e) {}
      session.sock = null;
    }

    session.state = 'standby';
    console.log(`[WhatsApp Stealth Engine ${userId}] Socket closed. Session sleeping in standby mode. User is offline.`);
    broadcastSse('whatsapp_status', {
      userId,
      state: 'standby',
      isLinked: true,
      user: session.user || getRegisteredUserInfo(getUserAuthDir(userId))
    });
  }, delayMs);
}

/**
 * Wake or connect a socket on-demand for a registered user (Stealth Mode)
 */
export async function wakeWhatsAppSocket(userId = 'user_zaid') {
  const session = getOrCreateUserSession(userId);
  const authDir = getUserAuthDir(userId);

  if (!isUserRegistered(authDir)) {
    throw new Error('Your WhatsApp is not linked. Please link your WhatsApp in Settings first.');
  }

  // Clear any pending sleep timer
  if (session.sleepTimer) {
    clearTimeout(session.sleepTimer);
    session.sleepTimer = null;
  }

  // If already connected
  if (session.sock && session.state === 'connected') {
    return session.sock;
  }

  // If already waking, wait for existing promise
  if (session.wakingPromise) {
    return session.wakingPromise;
  }

  session.wakingPromise = new Promise(async (resolve, reject) => {
    let resolved = false;
    let wakeTimeout = null;

    try {
      session.state = 'connecting';
      console.log(`[WhatsApp Wake-on-Demand ${userId}] Initializing stealth socket (User offline)...`);

      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: false, // CRITICAL: Never mark user online
        syncFullHistory: false,
        connectTimeoutMs: 25000,
        defaultQueryTimeoutMs: 25000,
        keepAliveIntervalMs: 15000
      });

      session.sock = sock;
      sock.ev.on('creds.update', saveCreds);

      wakeTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          session.wakingPromise = null;
          try {
            sock.ev.removeAllListeners();
            sock.end();
          } catch (e) {}
          session.sock = null;
          session.state = 'standby';
          reject(new Error('Timeout waking WhatsApp socket (server did not respond in 25s)'));
        }
      }, 25000);

      sock.ev.on('connection.update', async update => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          if (!resolved) {
            resolved = true;
            clearTimeout(wakeTimeout);
            session.state = 'connected';
            session.user = sock.user || session.user || getRegisteredUserInfo(authDir);
            session.wakingPromise = null;

            // Ensure presence is explicitly set to unavailable (offline)
            try {
              await sock.sendPresenceUpdate('unavailable');
            } catch (e) {}

            console.log(`[WhatsApp Wake-on-Demand ${userId}] Socket connected & stealth active (Presence: unavailable/offline).`);
            resolve(sock);
          }
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          if (isLoggedOut) {
            console.log(`[WhatsApp Wake-on-Demand ${userId}] Device unlinked from phone.`);
            session.state = 'disconnected';
            session.user = null;
            session.sock = null;
            try {
              fs.rmSync(authDir, { recursive: true, force: true });
            } catch (e) {}
            broadcastSse('whatsapp_status', { userId, state: 'disconnected', isLinked: false });
          } else {
            session.state = 'standby';
            session.sock = null;
          }

          if (!resolved) {
            resolved = true;
            clearTimeout(wakeTimeout);
            session.wakingPromise = null;
            reject(new Error(`WhatsApp connection closed before opening (statusCode: ${statusCode})`));
          }
        }
      });
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(wakeTimeout);
        session.wakingPromise = null;
        session.state = 'standby';
        reject(err);
      }
    }
  });

  return session.wakingPromise;
}

/**
 * Initial linking flow (QR code or Pairing Code)
 */
export async function initWhatsAppClient(userId = 'user_zaid', phoneNumberForPairing = null, forceFresh = false) {
  const session = getOrCreateUserSession(userId);

  if (session.isInitializing && !forceFresh && !phoneNumberForPairing) {
    console.log(`[WhatsApp Socket ${userId}] Initialization already in progress.`);
    return getWhatsAppStatus(userId);
  }

  session.isInitializing = true;

  if (session.sleepTimer) {
    clearTimeout(session.sleepTimer);
    session.sleepTimer = null;
  }

  if (session.sock) {
    try {
      session.sock.ev.removeAllListeners();
      session.sock.end();
    } catch (e) {}
    session.sock = null;
  }

  const authDir = getUserAuthDir(userId);

  // If forcing fresh, or if not registered yet, start completely clean
  if (forceFresh || phoneNumberForPairing || !isUserRegistered(authDir)) {
    try {
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
      fs.mkdirSync(authDir, { recursive: true });
    } catch (e) {}
  }

  try {
    session.state = 'connecting';
    broadcastSse('whatsapp_status', { userId, state: 'connecting' });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false, // Never mark online
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
            session.isInitializing = false;
            console.log(`[WhatsApp Socket ${userId}] Pairing Code Generated: ${code}`);
            broadcastSse('whatsapp_status', { userId, state: 'pairing_code', pairingCode: code });
          }
        } catch (pairErr) {
          console.error(`[WhatsApp Pairing Code Error ${userId}]`, pairErr);
          session.isInitializing = false;
          broadcastSse('whatsapp_status', { userId, state: 'disconnected', error: pairErr.message });
        }
      }, 1500);
    }

    sock.ev.on('connection.update', async update => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !phoneNumberForPairing) {
        try {
          session.qrCode = await QRCode.toDataURL(qr);
          session.pairingCode = null;
          session.state = 'scan_qr';
          session.isInitializing = false;
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
        session.isInitializing = false;
        session.user = sock.user || { id: 'unknown', name: 'WhatsApp User' };

        // Ensure user is offline on WhatsApp
        try {
          await sock.sendPresenceUpdate('unavailable');
        } catch (e) {}

        console.log(`====================================================`);
        console.log(`[WhatsApp Socket ${userId}] Connected & Linked!`);
        console.log(`Phone ID: ${session.user.id}`);
        console.log(`User:     ${session.user.name || 'Active'}`);
        console.log(`====================================================`);
        broadcastSse('whatsapp_status', { userId, state: 'connected', user: session.user, isLinked: true });

        // Go to sleep after 15 seconds of idle so user is not kept online
        scheduleSessionSleep(userId, 15000);
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
          session.isInitializing = false;
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {}
          broadcastSse('whatsapp_status', { userId, state: 'disconnected', isLinked: false });
        } else {
          // If registered, put in standby mode (do NOT keep open 24/7)
          session.state = isUserRegistered(authDir) ? 'standby' : 'disconnected';
          session.isInitializing = false;
          broadcastSse('whatsapp_status', {
            userId,
            state: session.state,
            isLinked: isUserRegistered(authDir)
          });
        }
      }
    });

    session.isInitializing = false;
    return getWhatsAppStatus(userId);
  } catch (err) {
    console.error(`[WhatsApp Init Error ${userId}]`, err);
    session.isInitializing = false;
    session.state = 'disconnected';
    broadcastSse('whatsapp_status', { userId, state: 'disconnected', error: err.message, isLinked: false });
    return getWhatsAppStatus(userId);
  }
}

/**
 * Send an autonomous WhatsApp message directly via wake-on-demand
 */
export async function sendDirectWhatsAppMessage(phoneNumber, message, userId = 'user_zaid') {
  const authDir = getUserAuthDir(userId);

  if (!isUserRegistered(authDir)) {
    throw new Error('Your WhatsApp is not linked. Please link your WhatsApp in Settings first.');
  }

  const cleanPhone = sanitizePhoneNumber(phoneNumber);
  if (!cleanPhone) {
    throw new Error('Invalid phone number provided');
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;
  console.log(`[WhatsApp Stealth Dispatch for ${userId}] Waking on-demand to send to ${jid}...`);

  // 1. Wake the socket
  const sock = await wakeWhatsAppSocket(userId);

  // 2. Transmit message
  const result = await sock.sendMessage(jid, { text: message });
  console.log(`[WhatsApp Stealth Dispatch for ${userId}] Message sent successfully to ${jid}!`);

  // 3. Schedule sleep (5 seconds after message to ensure socket write/ack finishes)
  scheduleSessionSleep(userId, 5000);

  return result;
}

/**
 * Disconnect and unlink current user session
 */
export async function disconnectWhatsAppSession(userId = 'user_zaid') {
  const session = getOrCreateUserSession(userId);
  try {
    if (session.sleepTimer) {
      clearTimeout(session.sleepTimer);
      session.sleepTimer = null;
    }
    if (session.sock) {
      try {
        session.sock.ev.removeAllListeners();
        session.sock.end();
      } catch (e) {}
      session.sock = null;
    }
    session.state = 'disconnected';
    session.qrCode = null;
    session.pairingCode = null;
    session.user = null;
    session.isInitializing = false;

    const authDir = getUserAuthDir(userId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    broadcastSse('whatsapp_status', { userId, state: 'disconnected', isLinked: false });
    return { success: true };
  } catch (err) {
    console.error(`[WhatsApp Logout Error ${userId}]`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Startup helper: verifies active sessions and marks them ready in standby mode
 * (Does NOT connect live sockets or keep user online 24/7)
 */
export async function reconnectAllActiveWhatsAppSessions() {
  if (!fs.existsSync(BASE_AUTH_DIR)) return;

  try {
    const entries = fs.readdirSync(BASE_AUTH_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const userDir = path.join(BASE_AUTH_DIR, entry.name);
        if (isUserRegistered(userDir)) {
          const session = getOrCreateUserSession(entry.name);
          session.state = 'standby';
          session.user = getRegisteredUserInfo(userDir);
          console.log(`[Startup] User ${entry.name} WhatsApp session ready in Standby Mode (Wake-on-demand). User is offline.`);
        }
      }
    }
  } catch (e) {
    console.error('[Startup Reconnect Scan Error]', e.message);
  }
}
