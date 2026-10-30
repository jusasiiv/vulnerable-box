'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');

// POST /api/fetch-url  { url }  — import note content from a URL.
router.post('/fetch-url', requireAuth, async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });
    const resp = await fetch(url, { redirect: 'follow' });
    const body = await resp.text();
    res.json({
      url,
      status: resp.status,
      contentType: resp.headers.get('content-type'),
      body: body.slice(0, 20000),
    });
  } catch (e) {
    res.status(502).json({ error: 'fetch failed', detail: e.message, url: (req.body || {}).url });
  }
});

module.exports = router;
