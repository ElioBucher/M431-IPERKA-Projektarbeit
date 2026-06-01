/* ============================================================
   info.js – Informationen
   Datei: public/js/info.js
   ============================================================ */

async function loadInfos() {
  const list = document.getElementById('info-list');
  list.innerHTML = '<div class="empty-card">Lädt…</div>';
  try {
    const items = await apiFetch(`/modules/${currentModuleId}/infos`) || [];
    renderInfos(items);
  } catch (e) {
    list.innerHTML = '<div class="empty-card">Fehler beim Laden.</div>';
  }
}

function renderInfos(items) {
  const list = document.getElementById('info-list');

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-card">Noch keine Informationen eingetragen.</div>';
    return;
  }

  // Neueste zuerst
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  list.innerHTML = items.map(inf => `
    <div class="card" data-id="${inf.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(inf.title)}</div>
          <div class="card-meta">Hinzugefügt: ${formatDate(inf.created_at?.split('T')[0] ?? '')}</div>
        </div>
        <button class="btn-icon danger" onclick="deleteInfo(${inf.id})" title="Löschen">🗑</button>
      </div>
      ${inf.content ? `<div class="card-body">${escapeHtml(inf.content)}</div>` : ''}
    </div>
  `).join('');
}

document.getElementById('btn-add-info').addEventListener('click', () => {
  document.getElementById('info-title').value   = '';
  document.getElementById('info-content').value = '';
  openModal('modal-add-info');
  setTimeout(() => document.getElementById('info-title').focus(), 100);
});

document.getElementById('confirm-add-info').addEventListener('click', async () => {
  const title   = document.getElementById('info-title').value.trim();
  const content = document.getElementById('info-content').value.trim();

  if (!title) {
    alert('Bitte einen Titel angeben.');
    return;
  }

  try {
    await apiFetch(`/modules/${currentModuleId}/infos`, {
      method: 'POST',
      body: JSON.stringify({ title, content })
    });
    closeModal('modal-add-info');
    loadInfos();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
});

async function deleteInfo(id) {
  if (!confirm('Information wirklich löschen?')) return;
  try {
    await apiFetch(`/infos/${id}`, { method: 'DELETE' });
    loadInfos();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
}