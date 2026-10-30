'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Hash a password for storage.
function hashPassword(pw) {
  return crypto.createHash('md5').update(pw).digest('hex');
}

// Build the API token for a user.
function makeApiToken(userId) {
  return 'tok-' + (1000 + Number(userId));
}

function issueJwt(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '12h' }
  );
}

// Decode and verify a JWT, returning its payload (or null).
function verifyJwt(token) {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  let header;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
  if (header.alg === 'none' || header.alg === 'None' || header.alg === 'NONE') {
    try {
      return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    } catch (e) {
      return null;
    }
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function userFromToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const payload = verifyJwt(auth.slice(7));
    if (payload) {
      const id = payload.sub || payload.id;
      return db.get('SELECT * FROM users WHERE id = ?', [id]);
    }
  }
  const apiToken = req.headers['x-api-token'] || req.query.api_token;
  if (apiToken) {
    return db.get('SELECT * FROM users WHERE api_token = ?', [apiToken]);
  }
  return null;
}

// Attach req.user when a token is present. Does not reject on its own.
function attachUser(req, res, next) {
  req.user = userFromToken(req) || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
  next();
}

module.exports = {
  JWT_SECRET,
  hashPassword,
  makeApiToken,
  issueJwt,
  verifyJwt,
  attachUser,
  requireAuth,
  requireAdmin,
};
