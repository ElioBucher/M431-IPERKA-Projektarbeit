/* ============================================================
   app.js – Kern-Logik: Auth-Check, Module, Tabs, Modals
   Datei: public/js/app.js
   ============================================================

   SCHNITTSTELLE ZUM BACKEND (Elio):
   Nach dem Login setzt das Backend folgende sessionStorage-Werte:
     sessionStorage.setItem('classId',   '42');        // integer
     sessionStorage.setItem('className', 'IB2024a');   // string
     sessionStorage.setItem('token',     'eyJ...');    // JWT (optional, falls Elio JWT nutzt)

   Alle API-Aufrufe schicken automatisch den Token im Header mit.
   ============================================================ */

/* ── CONFIG ──────────────────────────────────────────────── */
const API_BASE = '/api';   // Basis-URL für alle Backend-Aufrufe

/* ── STATE ───────────────────────────────────────────────── */
let currentClassId  = null;
let currentModuleId = null;
let modules         = [];

/* ── AUTH CHECK ──────────────────────────────────────────── */
// Wenn classId fehlt → zurück zur Login-Seite
function requireAuth() {
  const classId = sessionStorage.getItem('classId');
  if (!classId) {
    window.location.href = 'index.html';
    return false;
  }
  currentClassId = parseInt(classId, 10);
  document.getElementById('class-badge').textContent = sessionStorage.getItem('className') || '–';
  return true;
}

/* ── API HELPER ──────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    // Token abgelaufen oder ungültig
    sessionStorage.clear();
    window.location.href = 'index.html';
    return null;
  }
  if (!res.ok) throw new Error(`API Fehler ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

/* ── DATUM FORMATIERUNG ──────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso + 'T00:00:00') - new Date();
  return Math.ceil(diff / 86400000);
}

function dueBadge(iso) {
  const days = daysUntil(iso);
  if (days === null) return '';
  if (days < 0)  return '<span class="badge badge-red">Überfällig</span>';
  if (days === 0) return '<span class="badge badge-red">Heute</span>';
  if (days <= 2)  return `<span class="badge badge-yellow">In ${days}d</span>`;
  return `<span class="badge badge-green">In ${days}d</span>`;
}

/* ── MODULE LADEN & RENDERN ──────────────────────────────── */
async function loadModules() {
  try {
    modules = await apiFetch(`/classes/${currentClassId}/modules`) || [];
    renderModuleList();
  } catch (e) {
    console.error('Module konnten nicht geladen werden:', e);
  }
}

function renderModuleList() {
  const ul = document.getElementById('module-list');
  ul.innerHTML = '';

  if (modules.length === 0) {
    ul.innerHTML = '<li style="padding:8px 6px;color:var(--text-dim);font-size:.82rem;">Noch keine Module</li>';
    return;
  }

  modules.forEach(m => {
    const li = document.createElement('li');
    if (m.id === currentModuleId) li.classList.add('active');
    li.innerHTML = `<button data-id="${m.id}">${escapeHtml(m.name)}</button>`;
    li.querySelector('button').addEventListener('click', () => selectModule(m));
    ul.appendChild(li);
  });
}

async function selectModule(m) {
  currentModuleId = m.id;
  renderModuleList();
  document.getElementById('empty-state').style.display  = 'none';
  document.getElementById('module-view').style.display  = 'block';
  document.getElementById('module-title').textContent   = m.name;
  document.getElementById('module-subtitle').textContent =
    `Erstellt am ${formatDate(m.created_at?.split('T')[0] ?? m.created_at)}`;

  // Aktiven Tab neu laden
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) triggerTabLoad(activeTab.dataset.tab);
}

/* ── TABS ─────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    triggerTabLoad(btn.dataset.tab);
  });
});

function triggerTabLoad(tab) {
  if (!currentModuleId) return;
  switch (tab) {
    case 'homework':  loadHomework();   break;
    case 'exams':     loadExams();      break;
    case 'info':      loadInfos();      break;
    case 'questions': loadQuestions();  break;
  }
}

/* ── MODUL HINZUFÜGEN ─────────────────────────────────────── */
document.getElementById('btn-add-module').addEventListener('click', () => {
  openModal('modal-add-module');
  document.getElementById('input-module-name').value = '';
  setTimeout(() => document.getElementById('input-module-name').focus(), 100);
});

document.getElementById('confirm-add-module').addEventListener('click', async () => {
  const name = document.getElementById('input-module-name').value.trim();
  if (!name) return;
  try {
    const m = await apiFetch(`/classes/${currentClassId}/modules`, {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    closeModal('modal-add-module');
    modules.push(m);
    renderModuleList();
    selectModule(m);
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
});

/* Enter-Taste im Modul-Input */
document.getElementById('input-module-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('confirm-add-module').click();
});

/* ── MODUL LÖSCHEN ─────────────────────────────────────────── */
document.getElementById('btn-delete-module').addEventListener('click', () => {
  openModal('modal-confirm-delete');
});

document.getElementById('confirm-delete-module').addEventListener('click', async () => {
  try {
    await apiFetch(`/modules/${currentModuleId}`, { method: 'DELETE' });
    closeModal('modal-confirm-delete');
    modules = modules.filter(m => m.id !== currentModuleId);
    currentModuleId = null;
    document.getElementById('module-view').style.display = 'none';
    document.getElementById('empty-state').style.display  = 'flex';
    renderModuleList();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
});

/* ── LOGOUT ──────────────────────────────────────────────── */
document.getElementById('btn-logout').addEventListener('click', async () => {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
  sessionStorage.clear();
  window.location.href = 'index.html';
});

/* ── EASTER EGG ──────────────────────────────────────────── */
let logoClickCount = 0;
document.getElementById('logo-click').addEventListener('click', () => {
  logoClickCount++;
  if (logoClickCount >= 10) {
    logoClickCount = 0;
    const icon = document.querySelector('.logo-icon');
    const text = document.querySelector('.logo-text');
    icon.textContent = '🍌';
    text.textContent = 'BananeHub';
    text.classList.add('banana');
    setTimeout(() => {
      icon.textContent = '📚';
      text.textContent = 'KlassenHub';
      text.classList.remove('banana');
    }, 3000);
  }
});

/* ── MODAL SYSTEM ─────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Schliessen via data-close Attribut
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// Schliessen via Klick auf Overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

/* ── HTML ESCAPE ─────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadModules();
});

/* ── EXPORTS für andere JS-Dateien ──────────────────────────
   (kein Modul-System, daher einfach globale Variablen/Funktionen)
   homework.js, exams.js, info.js, questions.js greifen auf
   currentModuleId, apiFetch, formatDate, dueBadge, escapeHtml, 
   openModal, closeModal zu.
   ============================================================ */