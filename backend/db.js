'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'app.db');
const SEED_PATH = path.join(__dirname, 'seed', 'seed.sql');

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Load the schema and fixture on first boot (empty database).
function needsSeed() {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();
  return !row;
}

function seed() {
  const sql = fs.readFileSync(SEED_PATH, 'utf8');
  db.exec(sql);
  console.log('[db] seeded from seed.sql');
}

if (needsSeed()) seed();

// Query helpers.
function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}
function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}
function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}
function exec(sql) {
  return db.exec(sql);
}

module.exports = { db, all, get, run, exec, DB_PATH, seed };
