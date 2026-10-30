'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET /api/notes/public  — list all public notes.
router.get('/public', (req, res, next) => {
  try {
    const rows = db.all('SELECT id, owner_id, title, body, created_at FROM notes WHERE is_public = 1');
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/notes  — the caller's own notes.
router.get('/', requireAuth, (req, res, next) => {
  try {
    const rows = db.all('SELECT * FROM notes WHERE owner_id = ?', [req.user.id]);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/notes/:id  — fetch a single note.
router.get('/:id', (req, res, next) => {
  try {
    const row = db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// POST /api/notes  { title, body, is_public }
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { title, body, is_public } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });
    const info = db.run(
      'INSERT INTO notes (owner_id, title, body, is_public) VALUES (?, ?, ?, ?)',
      [req.user.id, title, body || '', is_public ? 1 : 0]
    );
    res.json(db.get('SELECT * FROM notes WHERE id = ?', [info.lastInsertRowid]));
  } catch (e) {
    next(e);
  }
});

// PUT /api/notes/:id  — update a note.
router.put('/:id', requireAuth, (req, res, next) => {
  try {
    const note = db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!note) return res.status(404).json({ error: 'not found' });
    if (note.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'not your note' });
    }
    const { title, body, is_public } = req.body || {};
    db.run('UPDATE notes SET title = ?, body = ?, is_public = ? WHERE id = ?', [
      title != null ? title : note.title,
      body != null ? body : note.body,
      is_public != null ? (is_public ? 1 : 0) : note.is_public,
      note.id,
    ]);
    res.json(db.get('SELECT * FROM notes WHERE id = ?', [note.id]));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/notes/:id  — remove a note.
router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    const info = db.run('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ deleted: info.changes });
  } catch (e) {
    next(e);
  }
});

// Per-note share counters. Each note may be shared up to 3 times.
const shareCounts = {};

// POST /api/notes/:id/share  — generate a share link for a note.
router.post('/:id/share', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const current = shareCounts[id] || 0;
    if (current >= 3) {
      return res.status(429).json({ error: 'share limit reached', shares: current });
    }
    // Build the share link / send notifications.
    await sleep(40);
    shareCounts[id] = current + 1;
    res.json({ shared: true, shares: shareCounts[id], link: '/api/notes/' + id });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
