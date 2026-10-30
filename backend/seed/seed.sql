-- Seed fixture. Every reset reloads this exact state so runs are comparable.

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  email         TEXT,
  api_token     TEXT UNIQUE,
  display_name  TEXT,
  bio           TEXT,
  created_at    TEXT NOT NULL DEFAULT '2026-01-01T00:00:00Z'
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id   INTEGER NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  is_public  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT '2026-01-01T00:00:00Z'
);

CREATE TABLE files (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id   INTEGER NOT NULL,
  filename   TEXT NOT NULL,
  path       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT '2026-01-01T00:00:00Z'
);

CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TEXT NOT NULL DEFAULT '2026-01-01T00:00:00Z'
);

-- Users.
INSERT INTO users (id, username, password_hash, role, email, api_token, display_name, bio) VALUES
  (1, 'admin', '0192023a7bbd73250516f069df18b500', 'admin', 'admin@vulnerable-box.local', 'tok-1001', 'Administrator', 'System administrator account.'),
  (2, 'alice', '7c6a180b36896a0a8c02787eeafb0e4c', 'user',  'alice@example.com',          'tok-1002', 'Alice',         'Just here taking notes.'),
  (3, 'bob',   '2ab96390c7dbe3439de74d0c9b0b1767', 'user',  'bob@example.com',            'tok-1003', 'Bob',           'Backend developer.'),
  (4, 'carol', '0d107d09f5bbe40cade3de5c71e9e9b7', 'user',  'carol@example.com',          'tok-1004', 'Carol',         'QA.');

-- Notes.
INSERT INTO notes (id, owner_id, title, body, is_public) VALUES
  (1, 1, 'Welcome',            'Welcome to the notes service. Public announcements appear here.', 1),
  (2, 1, 'Infra credentials',  'INTERNAL ONLY: deploy key = VB{n0te_2_pr1v4te_7f3a}. Do not share.', 0),
  (3, 2, 'Shopping list',      'milk, eggs, bread', 0),
  (4, 2, 'Public recipe',      'Pancakes: flour, milk, egg. Mix and fry.', 1),
  (5, 3, 'Deploy notes',       'remember to rotate the staging token', 0),
  (6, 4, 'Test plan',          'cover the login and search endpoints', 0);

-- Seed file attachments.
INSERT INTO files (id, owner_id, filename, path) VALUES
  (1, 1, 'readme.txt', 'readme.txt'),
  (2, 2, 'notes.txt',  'notes.txt');

INSERT INTO audit_log (user_id, action, detail) VALUES
  (1, 'seed', 'initial fixture loaded');
