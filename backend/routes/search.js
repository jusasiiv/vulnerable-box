'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/search?q=  — search public notes by title or body.
router.get('/', (req, res, next) => {
  const q = req.query.q != null ? String(req.query.q) : '';
  const sql =
    "SELECT id, owner_id, title, body FROM notes " +
    "WHERE is_public = 1 AND (title LIKE '%" + q + "%' OR body LIKE '%" + q + "%')";
  try {
    const rows = db.all(sql);
    res.json({ query: q, count: rows.length, results: rows });
  } catch (e) {
    res.status(500).json({ error: e.message, sql: sql });
  }
});

module.exports = router;
