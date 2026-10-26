import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'routinepulse_master_secret_jwt_2026_cloud';

// Seed initial account for Zaid if not already registered
export function ensureDefaultUser() {
  const db = readDb();
  if (!db.users) {
    db.users = [];
  }

  const existingZaid = db.users.find(u => u.id === 'user_zaid' || u.phone === '+918767353773' || u.email === 'zaid@routinepulse.com');
  if (!existingZaid) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('zaid123', salt);
    const zaidUser = {
      id: 'user_zaid',
      name: 'Zaid',
      email: 'zaid@routinepulse.com',
      phone: '+918767353773',
      passwordHash,
      createdAt: new Date().toISOString()
    };
    db.users.push(zaidUser);
    writeDb(db);
    console.log('[Auth] Default account for Zaid initialized (ID: user_zaid)');
  }
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Register new user
export async function registerUser({ name, email, phone, password }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const db = readDb();
  if (!db.users) db.users = [];

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const userId = `usr_${uuidv4().substring(0, 8)}`;

  const newUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : '',
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Initialize empty user data structures if needed
  writeDb(db);

  const token = generateToken(newUser);
  return {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      createdAt: newUser.createdAt
    }
  };
}

// Login user
export async function loginUser({ emailOrPhone, password }) {
  if (!emailOrPhone || !password) {
    throw new Error('Email/phone and password are required');
  }

  const db = readDb();
  if (!db.users) db.users = [];

  const query = emailOrPhone.trim().toLowerCase();
  const user = db.users.find(
    u => u.email.toLowerCase() === query || (u.phone && u.phone.replace(/[^\d]/g, '').includes(query.replace(/[^\d]/g, '')))
  );

  if (!user) {
    throw new Error('Invalid email/phone or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email/phone or password');
  }

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt
    }
  };
}

// Authentication Middleware
export function requireAuth(req, res, next) {
  // Support Bearer token header or query param token (for EventSource)
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

// Optional Auth Middleware (for public or hybrid endpoints)
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
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}
