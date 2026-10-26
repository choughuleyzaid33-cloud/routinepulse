import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb, DEFAULT_USER_SETTINGS } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'routinepulse_master_secret_jwt_2026_cloud';

// Seed or update Zaid's master account with username 'zaid17' and password 'Ortonrox@007'
export function ensureDefaultUser() {
  const db = readDb();
  if (!db.users) {
    db.users = [];
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Ortonrox@007', salt);

  const existingZaidIndex = db.users.findIndex(
    u => u.id === 'user_zaid' || u.username === 'zaid17' || u.phone === '+918767353773' || u.email === 'zaid@routinepulse.com'
  );

  const zaidUser = {
    id: 'user_zaid',
    username: 'zaid17',
    name: 'Zaid',
    email: 'zaid@routinepulse.com',
    phone: '+918767353773',
    passwordHash,
    createdAt: new Date().toISOString()
  };

  if (existingZaidIndex >= 0) {
    db.users[existingZaidIndex] = {
      ...db.users[existingZaidIndex],
      ...zaidUser
    };
    console.log('[Auth] Master account for zaid17 updated with requested credentials.');
  } else {
    db.users.push(zaidUser);
    console.log('[Auth] Master account for zaid17 created.');
  }

  writeDb(db);
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username || user.email,
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Register new user
export async function registerUser({ username, name, email, phone, password }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const db = readDb();
  if (!db.users) db.users = [];

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = (username || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

  if (normalizedUsername.length < 3) {
    throw new Error('Username must be at least 3 alphanumeric characters');
  }

  const existingEmail = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingEmail) {
    throw new Error('An account with this email already exists');
  }

  const existingUsername = db.users.find(u => u.username && u.username.toLowerCase() === normalizedUsername);
  if (existingUsername) {
    throw new Error('This username is already taken. Please choose another.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const userId = `usr_${uuidv4().substring(0, 8)}`;

  const newUser = {
    id: userId,
    username: normalizedUsername,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  if (!db.settings || typeof db.settings !== 'object') db.settings = {};
  db.settings[userId] = DEFAULT_USER_SETTINGS(userId, newUser.name, newUser.phone);
  writeDb(db);

  const token = generateToken(newUser);
  return {
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      createdAt: newUser.createdAt
    }
  };
}

// Login user (supports username, email, or phone)
export async function loginUser({ usernameOrEmail, emailOrPhone, password }) {
  const query = (usernameOrEmail || emailOrPhone || '').trim().toLowerCase();
  if (!query || !password) {
    throw new Error('Username/email and password are required');
  }

  const db = readDb();
  if (!db.users) db.users = [];

  const cleanDigits = query.replace(/[^\d]/g, '');

  const user = db.users.find(u => {
    if (u.username && u.username.toLowerCase() === query) return true;
    if (u.email && u.email.toLowerCase() === query) return true;
    if (cleanDigits.length >= 7 && u.phone && u.phone.replace(/[^\d]/g, '').includes(cleanDigits)) return true;
    return false;
  });

  if (!user) {
    throw new Error('Invalid username/email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid username/email or password');
  }

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user.id,
      username: user.username || user.email,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt
    }
  };
}

// Authentication Middleware
export function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

// Optional Auth Middleware
export function optionalAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}
