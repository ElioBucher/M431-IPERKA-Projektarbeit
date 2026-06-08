/* ============================================================
   homework.js – Hausaufgaben
   Datei: public/js/homework.js
   ============================================================ */

async function loadHomework() {
  const list = document.getElementById('hw-list');
  list.innerHTML = '<div class="empty-card">Lädt…</div>';
  try {
    const items = await apiFetch(`/modules/${currentModuleId}/homework`) || [];
    renderHomework(items);
  } catch (e) {
    list.innerHTML = '<div class="empty-card">Fehler beim Laden.</div>';
  }
}

function renderHomework(items) {
  const list = document.getElementById('hw-list');
  if (items.length === 0) {
    list.innerHTML = '<div class="empty-card">Noch keine Hausaufgaben eingetragen.</div>';
    return;
  }
  // Elio's API gibt dueDate zurück (camelCase)
  items.sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));

  list.innerHTML = items.map(hw => `
    <div class="card" data-id="${hw.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(hw.title)}</div>
          <div class="card-meta">Fällig: ${formatDate(hw.dueDate)} ${dueBadge(hw.dueDate)}</div>
        </div>
        <button class="btn-icon danger" onclick="deleteHomework(${hw.id})" title="Löschen">🗑</button>
      </div>
      ${hw.description ? `<div class="card-body">${escapeHtml(hw.description)}</div>` : ''}
    </div>
  `).join('');
}

document.getElementById('btn-add-hw').addEventListener('click', () => {
  document.getElementById('hw-title').value = '';
  document.getElementById('hw-desc').value  = '';
  document.getElementById('hw-due').value   = '';
  openModal('modal-add-hw');
  setTimeout(() => document.getElementById('hw-title').focus(), 100);
});

document.getElementById('confirm-add-hw').addEventListener('click', async () => {
  const title   = document.getElementById('hw-title').value.trim();
  const desc    = document.getElementById('hw-desc').value.trim();
  const dueDate = document.getElementById('hw-due').value;
  if (!title || !dueDate) { alert('Bitte Titel und Fälligkeitsdatum angeben.'); return; }
  try {
    // Elio's API erwartet: title, description, dueDate (camelCase)
    await apiFetch(`/modules/${currentModuleId}/homework`, {
      method: 'POST',
      body: JSON.stringify({ title, description: desc, dueDate })
    });
    closeModal('modal-add-hw');
    loadHomework();
  } catch (e) { alert('Fehler: ' + e.message); }
});

async function deleteHomework(id) {
  if (!confirm('Hausaufgabe wirklich löschen?')) return;
  try {
    // Elio's URL: /modules/:moduleId/homework/:id
    await apiFetch(`/modules/${currentModuleId}/homework/${id}`, { method: 'DELETE' });
    loadHomework();
  } catch (e) { alert('Fehler: ' + e.message); }
}