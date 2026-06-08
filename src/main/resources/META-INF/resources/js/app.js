/* ============================================================
   app.js – Kern-Logik: Auth, Module, Tabs, Modals
   ============================================================ */

const API_BASE = '/api';

let currentClassId  = null;
let currentModuleId = null;
let modules         = [];

/* ── AUTH CHECK ──────────────────────────────────────────── */
function requireAuth() {
  const classId = sessionStorage.getItem('classId');
  if (!classId) { window.location.href = 'index.html'; return false; }
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
  if (res.status === 401) { sessionStorage.clear(); window.location.href = 'index.html'; return null; }
  if (!res.ok) throw new Error(`API Fehler ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

/* ── DATUM FORMATIERUNG ──────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso + 'T00:00:00') - new Date()) / 86400000);
}

function dueBadge(iso) {
  const days = daysUntil(iso);
  if (days === null) return '';
  if (days < 0)   return '<span class="badge badge-red">Überfällig</span>';
  if (days === 0) return '<span class="badge badge-red">Heute</span>';
  if (days <= 2)  return `<span class="badge badge-yellow">In ${days}d</span>`;
  return `<span class="badge badge-green">In ${days}d</span>`;
}

/* ── MODULE ──────────────────────────────────────────────── */
async function loadModules() {
  try {
    modules = await apiFetch(`/classes/${currentClassId}/modules`) || [];
    renderModuleList();
  } catch (e) { console.error('Module konnten nicht geladen werden:', e); }
}

function renderModuleList() {
  const ul = document.getElementById('module-list');
  ul.innerHTML = '';
  if (modules.length === 0) {
    ul.innerHTML = '<li style="padding:8px 10px;color:var(--text-3);font-size:.82rem;">Noch keine Module</li>';
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
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('module-view').style.display = 'block';
  document.getElementById('module-title').textContent = m.name;
  document.getElementById('module-subtitle').textContent = `Erstellt am ${formatDate(m.createdAt)}`;
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) triggerTabLoad(activeTab.dataset.tab);
}

/* ── TABS ────────────────────────────────────────────────── */
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
    case 'homework':  loadHomework();  break;
    case 'exams':     loadExams();     break;
    case 'info':      loadInfos();     break;
    case 'questions': loadQuestions(); break;
  }
}

/* ── MODUL HINZUFÜGEN ────────────────────────────────────── */
document.getElementById('btn-add-module').addEventListener('click', () => {
  openModal('modal-add-module');
  document.getElementById('input-module-name').value = '';
  setTimeout(() => document.getElementById('input-module-name').focus(), 100);
});

document.getElementById('confirm-add-module').addEventListener('click', async function() {
  const name = document.getElementById('input-module-name').value.trim();
  if (!name || this.disabled) return;
  this.disabled = true;
  try {
    const m = await apiFetch(`/classes/${currentClassId}/modules`, { method: 'POST', body: JSON.stringify({ name }) });
    closeModal('modal-add-module');
    modules.push(m);
    renderModuleList();
    selectModule(m);
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

document.getElementById('input-module-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('confirm-add-module').click();
});

/* ── MODUL LÖSCHEN ───────────────────────────────────────── */
document.getElementById('btn-delete-module').addEventListener('click', () => openModal('modal-confirm-delete'));

document.getElementById('confirm-delete-module').addEventListener('click', async function() {
  if (this.disabled) return;
  this.disabled = true;
  try {
    await apiFetch(`/modules/${currentModuleId}`, { method: 'DELETE' });
    closeModal('modal-confirm-delete');
    modules = modules.filter(m => m.id !== currentModuleId);
    currentModuleId = null;
    document.getElementById('module-view').style.display = 'none';
    document.getElementById('empty-state').style.display = 'flex';
    renderModuleList();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

/* ── UNIVERSAL LÖSCHEN BESTÄTIGUNG ──────────────────────── */
let _deleteCallback = null;

function confirmDelete(heading, body, callback) {
  _deleteCallback = callback;
  document.getElementById('item-delete-heading').textContent = heading;
  document.getElementById('item-delete-body').textContent = body;
  openModal('modal-confirm-item-delete');
}

document.getElementById('confirm-delete-item').addEventListener('click', async () => {
  closeModal('modal-confirm-item-delete');
  if (_deleteCallback) {
    try { await _deleteCallback(); } catch (e) { alert('Fehler: ' + e.message); }
    _deleteCallback = null;
  }
});

/* ── LOGOUT ──────────────────────────────────────────────── */
document.getElementById('btn-logout').addEventListener('click', async () => {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
  sessionStorage.clear();
  window.location.href = 'index.html';
});

/* ── MODALS ──────────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
});

/* ── HILFSFUNKTIONEN ─────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadModules();
});
