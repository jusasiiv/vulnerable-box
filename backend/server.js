'use strict';

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { attachUser } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS handling for the API.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(attachUser);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'vulnerable-box', time: new Date().toISOString() });
});

app.use('/api', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/search', require('./routes/search'));
app.use('/api/users', require('./routes/users'));
app.use('/api/files', require('./routes/files'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/tools'));

// Serve the static frontend.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

app.listen(PORT, () => {
  console.log('[vulnerable-box] listening on port ' + PORT);
});
