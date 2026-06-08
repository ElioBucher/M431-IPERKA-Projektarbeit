/* ============================================================
   info.js – Informationen
   ============================================================ */

let _editingInfoId = null;

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
          <button class="btn-edit" onclick="event.stopPropagation();openEditInfo(${inf.id}, \`${escapeHtml(inf.title).replace(/`/g,"'")}\`, \`${escapeHtml(inf.content || '').replace(/`/g,"'")}\`)">Bearbeiten</button>
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
  _editingInfoId = null;
  document.getElementById('modal-info-title').textContent = 'Information hinzufügen';
  document.getElementById('confirm-add-info').textContent = 'Speichern';
  document.getElementById('info-title').value   = '';
  document.getElementById('info-content').value = '';
  openModal('modal-add-info');
  setTimeout(() => document.getElementById('info-title').focus(), 100);
});

function openEditInfo(id, title, content) {
  _editingInfoId = id;
  document.getElementById('modal-info-title').textContent = 'Information bearbeiten';
  document.getElementById('confirm-add-info').textContent = 'Speichern';
  document.getElementById('info-title').value   = title;
  document.getElementById('info-content').value = content;
  openModal('modal-add-info');
  setTimeout(() => document.getElementById('info-title').focus(), 100);
}

document.getElementById('confirm-add-info').addEventListener('click', async function() {
  const title   = document.getElementById('info-title').value.trim();
  const content = document.getElementById('info-content').value.trim();
  if (!title) { alert('Bitte einen Titel angeben.'); return; }
  if (this.disabled) return;
  this.disabled = true;
  try {
    if (_editingInfoId) {
      await apiFetch(`/modules/${currentModuleId}/infos/${_editingInfoId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content })
      });
    } else {
      await apiFetch(`/modules/${currentModuleId}/infos`, {
        method: 'POST',
        body: JSON.stringify({ title, content })
      });
    }
    closeModal('modal-add-info');
    loadInfos();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
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
