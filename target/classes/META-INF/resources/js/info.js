/* ============================================================
   info.js – Informationen
   ============================================================ */

async function loadInfos() {
  const list = document.getElementById('info-list');
  list.innerHTML = '<div class="empty-card">Lädt...</div>';
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
  // API gibt created_at (snake_case) zurück
  items.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));

  list.innerHTML = items.map(inf => `
    <div class="card card-collapsible" data-id="${inf.id}">
      <div class="card-header card-toggle" style="cursor:pointer">
        <div style="flex:1">
          <div class="card-title">${escapeHtml(inf.title)}</div>
          <div class="card-meta">Hinzugefügt: ${formatDate((inf.created_at || '').split('T')[0])}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-shrink:0">
          ${inf.content ? '<span class="card-chevron">▾</span>' : ''}
          <button class="btn-delete" onclick="event.stopPropagation();deleteInfo(${inf.id})">Löschen</button>
        </div>
      </div>
      ${inf.content ? `<div class="card-expandable" style="display:none"><div class="card-body">${escapeHtml(inf.content)}</div></div>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.card-toggle').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.card-collapsible');
      const body = card.querySelector('.card-expandable');
      if (!body) return;
      const chevron = card.querySelector('.card-chevron');
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
    });
  });
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
  if (!title) { alert('Bitte einen Titel angeben.'); return; }
  try {
    await apiFetch(`/modules/${currentModuleId}/infos`, {
      method: 'POST',
      body: JSON.stringify({ title, content })
    });
    closeModal('modal-add-info');
    loadInfos();
  } catch (e) { alert('Fehler: ' + e.message); }
});

function deleteInfo(id) {
  confirmDelete(
    'Information löschen?',
    'Diese Information wird unwiderruflich gelöscht.',
    async () => {
      await apiFetch(`/modules/${currentModuleId}/infos/${id}`, { method: 'DELETE' });
      loadInfos();
    }
  );
}
