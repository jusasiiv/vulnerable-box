'use strict';

// Minimal SPA for the notes service. Uses the API on the same origin.
const api = (p) => '/api' + p;
let session = { jwt: null, api_token: null, username: null };

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (session.jwt) h['Authorization'] = 'Bearer ' + session.jwt;
  return h;
}

function setWhoami() {
  const el = document.getElementById('whoami');
  if (session.username) {
    el.textContent = 'signed in as ' + session.username;
    document.getElementById('mine-section').classList.remove('hidden');
  } else {
    el.textContent = 'not signed in';
  }
}

// ---- auth ----
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const r = await fetch(api('/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await r.json();
  const msg = document.getElementById('auth-msg');
  if (r.ok) {
    session = { jwt: data.jwt, api_token: data.api_token, username: data.username };
    msg.textContent = 'welcome ' + data.username;
    setWhoami();
    loadMyNotes();

    const next = new URLSearchParams(location.search).get('next');
    if (next) window.location = next;
  } else {
    msg.textContent = data.error || 'login failed';
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const r = await fetch(api('/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await r.json();
  const msg = document.getElementById('auth-msg');
  if (r.ok) {
    session = { jwt: data.jwt, api_token: data.api_token, username: data.username };
    msg.textContent = 'registered as ' + data.username;
    setWhoami();
  } else {
    msg.textContent = data.error || 'registration failed';
  }
});

// ---- search ----
document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = document.getElementById('search-input').value;
  const r = await fetch(api('/search?q=') + encodeURIComponent(q));
  const data = await r.json();
  document.getElementById('search-summary').innerHTML =
    'Results for <b>' + q + '</b>: ' + (data.count != null ? data.count : 0);
  const box = document.getElementById('search-results');
  box.innerHTML = '';
  (data.results || []).forEach((n) => box.appendChild(renderNote(n)));
});

// ---- public notes ----
async function loadPublic() {
  const r = await fetch(api('/notes/public'));
  const notes = await r.json();
  const box = document.getElementById('public-notes');
  box.innerHTML = '';
  notes.forEach((n) => box.appendChild(renderNote(n)));
}
document.getElementById('load-public').addEventListener('click', loadPublic);

// ---- my notes ----
async function loadMyNotes() {
  if (!session.jwt) return;
  const r = await fetch(api('/notes'), { headers: authHeaders() });
  if (!r.ok) return;
  const notes = await r.json();
  const box = document.getElementById('my-notes');
  box.innerHTML = '';
  notes.forEach((n) => box.appendChild(renderNote(n)));
}

document.getElementById('note-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('note-title').value;
  const body = document.getElementById('note-body').value;
  const is_public = document.getElementById('note-public').checked;
  await fetch(api('/notes'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title, body, is_public }),
  });
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
  loadMyNotes();
});

// Render a note card.
function renderNote(n) {
  const div = document.createElement('div');
  div.className = 'note';
  div.innerHTML =
    '<h3>' + (n.title || '') + '</h3>' +
    '<div class="body">' + (n.body || '') + '</div>' +
    '<div class="meta">#' + n.id + (n.is_public ? ' · public' : '') + '</div>';
  return div;
}

setWhoami();
loadPublic();
