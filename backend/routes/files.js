'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'data', 'uploads');
const SEED_UPLOADS = path.join(__dirname, '..', 'seed', 'uploads');

// Copy the seed attachments into the runtime upload dir on first boot.
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (fs.existsSync(SEED_UPLOADS)) {
  for (const f of fs.readdirSync(SEED_UPLOADS)) {
    const dest = path.join(UPLOAD_DIR, f);
    if (!fs.existsSync(dest)) fs.copyFileSync(path.join(SEED_UPLOADS, f), dest);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// GET /api/files  — list files, or download one when ?name= is supplied.
router.get('/', (req, res, next) => {
  try {
    if (req.query.name != null) {
      const target = path.join(UPLOAD_DIR, String(req.query.name));
      if (!fs.existsSync(target)) return res.status(404).json({ error: 'no such file' });
      return res.sendFile(path.resolve(target));
    }
    res.json(db.all('SELECT id, owner_id, filename, path, created_at FROM files'));
  } catch (e) {
    next(e);
  }
});

// GET /api/files/:id  — metadata for one file.
router.get('/:id', (req, res, next) => {
  try {
    const row = db.get('SELECT * FROM files WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// POST /api/files/upload  — store an uploaded file.
router.post('/upload', requireAuth, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file field required' });
    const info = db.run(
      'INSERT INTO files (owner_id, filename, path) VALUES (?, ?, ?)',
      [req.user.id, req.file.originalname, req.file.originalname]
    );
    res.json(db.get('SELECT * FROM files WHERE id = ?', [info.lastInsertRowid]));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
