'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');

// POST /api/register  { username, password, email }
router.post('/register', (req, res, next) => {
  try {
    const { username, password, email } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const hash = auth.hashPassword(password);
    const info = db.run(
      'INSERT INTO users (username, password_hash, role, email, display_name) VALUES (?, ?, ?, ?, ?)',
      [username, hash, 'user', email || null, username]
    );
    const id = info.lastInsertRowid;
    const token = auth.makeApiToken(id);
    db.run('UPDATE users SET api_token = ? WHERE id = ?', [token, id]);
    const user = db.get('SELECT * FROM users WHERE id = ?', [id]);
    res.json({
      id: user.id,
      username: user.username,
      api_token: token,
      jwt: auth.issueJwt(user),
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/login  { username, password }
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const hash = auth.hashPassword(password || '');
    const sql =
      "SELECT * FROM users WHERE username = '" +
      username +
      "' AND password_hash = '" +
      hash +
      "'";
    const user = db.get(sql);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    db.run('INSERT INTO audit_log (user_id, action, detail) VALUES (?, ?, ?)', [
      user.id,
      'login',
      'user ' + user.username + ' logged in',
    ]);
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      api_token: user.api_token,
      jwt: auth.issueJwt(user),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
