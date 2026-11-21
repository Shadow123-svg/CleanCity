require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.API_PORT || 3001);
const sessionCookie = 'cleancity_session';
const sessionDuration = 8 * 60 * 60 * 1000;

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cleancity',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

app.use(express.json({ limit: '10mb' }));

function publicUser(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    organization: row.organization,
    role: row.role,
    employee_id: row.employee_id,
    account_status: row.account_status,
    created_at: new Date(row.created_at).toISOString(),
  };
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function tokenHash(token) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(token).digest('hex');
}

async function authenticate(req, res, next) {
  try {
    const token = req.headers.cookie
      ?.split(';')
      .map(value => value.trim())
      .find(value => value.startsWith(`${sessionCookie}=`))
      ?.slice(sessionCookie.length + 1);
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.organization, u.role,
              u.employee_id, u.account_status, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.account_status = 'Active'
       LIMIT 1`,
      [tokenHash(decodeURIComponent(token))],
    );
    if (!rows.length) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    req.user = publicUser(rows[0]);
    next();
  } catch (error) {
    next(error);
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required.' });
  next();
}

function setSessionCookie(res, token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAge / 1000)}${secure}`);
}

async function initializeDatabase() {
  if (!process.env.DB_USER) throw new Error('DB_USER must be configured in .env.');
  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(254) NOT NULL UNIQUE,
        phone VARCHAR(40) NOT NULL,
        organization VARCHAR(160) NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        role ENUM('Super Admin', 'Administrator', 'Field Staff') NOT NULL DEFAULT 'Field Staff',
        employee_id VARCHAR(80) NOT NULL,
        account_status ENUM('Active', 'Pending Approval', 'Deactivated') NOT NULL DEFAULT 'Pending Approval',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX sessions_user_id_idx (user_id),
        CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_state (
        state_key VARCHAR(64) PRIMARY KEY,
        state_json JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } finally {
    connection.release();
  }

  if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) {
      throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
    }
    const [rows] = await pool.execute('SELECT id FROM users LIMIT 1');
    if (!rows.length) {
      const passwordHash = await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD, 12);
      await pool.execute(
        `INSERT INTO users (id, full_name, email, phone, organization, password_hash, role, employee_id, account_status)
         VALUES (?, ?, ?, ?, ?, ?, 'Super Admin', 'BOOTSTRAP', 'Active')`,
        [crypto.randomUUID(), process.env.BOOTSTRAP_ADMIN_NAME || 'CleanCity Administrator',
          process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(), process.env.BOOTSTRAP_ADMIN_PHONE || '',
          process.env.BOOTSTRAP_ADMIN_ORGANIZATION || 'Municipal Sanitation Wing', passwordHash],
      );
      console.log(`Created initial Super Admin account for ${process.env.BOOTSTRAP_ADMIN_EMAIL}.`);
    }
  }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { full_name, email, phone, organization, password, confirm_password, auth_code } = req.body || {};
    if (!full_name || !email || !phone || !organization || !password || !confirm_password || !auth_code) {
      return res.status(400).json({ error: 'All registration fields are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (String(password).length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters.' });
    if (password !== confirm_password) return res.status(400).json({ error: 'Passwords do not match.' });
    if (!process.env.REGISTRATION_CODE || auth_code !== process.env.REGISTRATION_CODE) {
      return res.status(403).json({ error: 'Registration is not authorized. Contact your system administrator.' });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      `INSERT INTO users (id, full_name, email, phone, organization, password_hash, role, employee_id, account_status)
       VALUES (?, ?, ?, ?, ?, ?, 'Field Staff', ?, 'Pending Approval')`,
      [id, String(full_name).trim(), String(email).trim().toLowerCase(), String(phone).trim(),
        String(organization).trim(), passwordHash, `REG-${id.slice(0, 8).toUpperCase()}`],
    );
    res.status(201).json({ message: 'Registration submitted for administrator approval.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' });
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.account_status !== 'Active') {
      return res.status(403).json({
        error: user.account_status === 'Pending Approval'
          ? 'Your account is pending administrator approval.'
          : 'This account has been deactivated.',
      });
    }

    const token = createSessionToken();
    const maxAge = req.body?.remember_me ? 30 * 24 * 60 * 60 * 1000 : sessionDuration;
    await pool.execute(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
      [tokenHash(token), user.id, new Date(Date.now() + maxAge)],
    );
    setSessionCookie(res, token, maxAge);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = req.headers.cookie
      ?.split(';')
      .map(value => value.trim())
      .find(value => value.startsWith(`${sessionCookie}=`))
      ?.slice(sessionCookie.length + 1);
    if (token) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [tokenHash(decodeURIComponent(token))]);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
    res.json({ message: 'Signed out.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/users', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'Field Staff') return res.json({ users: [req.user] });
    const userQuery = req.user.role === 'Super Admin'
      ? `SELECT id, full_name, email, phone, organization, role, employee_id, account_status, created_at
         FROM users ORDER BY created_at ASC`
      : `SELECT id, full_name, email, phone, organization, role, employee_id, account_status, created_at
         FROM users WHERE role = 'Field Staff' AND account_status = 'Active' ORDER BY created_at ASC`;
    const [rows] = await pool.execute(
      userQuery,
    );
    res.json({ users: rows.map(publicUser) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/users/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { role, account_status } = req.body || {};
    const roles = ['Super Admin', 'Administrator', 'Field Staff'];
    const statuses = ['Active', 'Pending Approval', 'Deactivated'];
    if (!roles.includes(role) || !statuses.includes(account_status)) {
      return res.status(400).json({ error: 'A valid role and account status are required.' });
    }
    if (req.params.id === req.user.id && account_status !== 'Active') {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }
    const [result] = await pool.execute(
      'UPDATE users SET role = ?, account_status = ? WHERE id = ?',
      [role, account_status, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, organization, role, employee_id, account_status, created_at
       FROM users WHERE id = ?`,
      [req.params.id],
    );
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/state', authenticate, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT state_json FROM app_state WHERE state_key = ?', ['main']);
    res.json({ state: rows.length ? rows[0].state_json : null });
  } catch (error) {
    next(error);
  }
});

app.put('/api/state', authenticate, async (req, res, next) => {
  try {
    const state = req.body;
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return res.status(400).json({ error: 'A valid application state object is required.' });
    }
    await pool.execute(
      `INSERT INTO app_state (state_key, state_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)`,
      ['main', JSON.stringify(state)],
    );
    res.json({ message: 'Application data saved.' });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' });
  res.status(500).json({ error: 'The server could not complete the request.' });
});

initializeDatabase()
  .then(() => app.listen(port, '127.0.0.1', () => console.log(`CleanCity API listening on http://127.0.0.1:${port}`)))
  .catch(error => {
    console.error('Could not initialize the CleanCity database:', error);
    process.exitCode = 1;
  });
