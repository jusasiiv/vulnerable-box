'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// Merge the source object into the target, recursing into nested objects.
function mergeDeep(target, source) {
  for (const key in source) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeDeep(target[key], val);
    } else {
      target[key] = val;
    }
  }
  return target;
}

// Profile fields the update endpoint persists.
const WRITABLE = ['username', 'email', 'display_name', 'bio', 'role', 'api_token', 'password_hash'];

// GET /api/users/me
router.get('/me', requireAuth, (req, res, next) => {
  try {
    res.json(db.get('SELECT * FROM users WHERE id = ?', [req.user.id]));
  } catch (e) {
    next(e);
  }
});

// PUT /api/users/me  — update the current user's profile.
router.put('/me', requireAuth, (req, res, next) => {
  try {
    const body = req.body || {};

    const settings = mergeDeep({}, body);

    const sets = [];
    const vals = [];
    for (const col of WRITABLE) {
      if (Object.prototype.hasOwnProperty.call(body, col)) {
        sets.push(col + ' = ?');
        vals.push(body[col]);
      }
    }
    if (sets.length) {
      vals.push(req.user.id);
      db.run('UPDATE users SET ' + sets.join(', ') + ' WHERE id = ?', vals);
    }

    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({
      updated: true,
      user,
      effectiveFlags: {
        adminPanel: {}.adminPanel === true,
        debug: {}.debug === true,
      },
      settingsKeys: Object.keys(settings),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
