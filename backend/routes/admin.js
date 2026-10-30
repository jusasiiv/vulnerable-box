'use strict';

const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../auth');

// GET /api/admin/users  — list all user records.
router.get('/users', requireAdmin, (req, res, next) => {
  try {
    res.json(db.all('SELECT * FROM users'));
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/audit  — per-user activity summary.
router.get('/audit', requireAdmin, (req, res, next) => {
  try {
    const users = db.all('SELECT id, username, display_name FROM users');
    const report = [];
    for (const u of users) {
      const sql =
        "SELECT COUNT(*) AS c FROM notes WHERE title LIKE '%" +
        (u.display_name || '') +
        "%'";
      let c = null;
      let error = null;
      try {
        c = db.get(sql).c;
      } catch (e) {
        error = e.message;
      }
      report.push({ user: u.username, display_name: u.display_name, matches: c, error, sql });
    }
    res.json({ report });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/exec-report  { target }  — generate a report via a shell helper.
router.post('/exec-report', requireAdmin, (req, res, next) => {
  const target = (req.body && req.body.target) || 'all';
  const cmd = 'echo "generating report for ' + target + '" && date';
  exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: err.message, cmd, stderr });
    }
    res.json({ cmd, output: stdout });
  });
});

module.exports = router;
