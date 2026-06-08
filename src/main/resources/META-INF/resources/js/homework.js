/* ============================================================
   homework.js – Hausaufgaben
   ============================================================ */

let _editingHwId = null;

async function loadHomework() {
  const list = document.getElementById('hw-list');
  list.innerHTML = '<div class="empty-card">Lädt...</div>';
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
  items.sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));

  list.innerHTML = items.map(hw => `
    <div class="card card-collapsible" data-id="${hw.id}">
      <div class="card-header card-toggle" style="cursor:pointer">
        <div style="flex:1">
          <div class="card-title">${escapeHtml(hw.title)}</div>
          <div class="card-meta">Fällig: ${formatDate(hw.dueDate)} ${dueBadge(hw.dueDate)}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-shrink:0">
          ${hw.description ? '<span class="card-chevron">▾</span>' : ''}
          <button class="btn-edit"
            data-hw-id="${hw.id}"
            data-title="${escapeHtml(hw.title)}"
            data-desc="${escapeHtml(hw.description || '')}"
            data-due="${hw.dueDate}">Bearbeiten</button>
          <button class="btn-delete" data-hw-id="${hw.id}">Löschen</button>
        </div>
      </div>
      ${hw.description ? `<div class="card-expandable" style="display:none"><div class="card-body">${escapeHtml(hw.description)}</div></div>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.btn-edit[data-hw-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEditHw(+btn.dataset.hwId, btn.dataset.title, btn.dataset.desc, btn.dataset.due);
    });
  });

  list.querySelectorAll('.btn-delete[data-hw-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteHomework(+btn.dataset.hwId);
    });
  });

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

document.getElementById('btn-add-hw').addEventListener('click', () => {
  _editingHwId = null;
  document.getElementById('modal-hw-title').textContent = 'Hausaufgabe hinzufügen';
  document.getElementById('confirm-add-hw').textContent = 'Speichern';
  document.getElementById('hw-title').value = '';
  document.getElementById('hw-desc').value  = '';
  document.getElementById('hw-due').value   = '';
  openModal('modal-add-hw');
  setTimeout(() => document.getElementById('hw-title').focus(), 100);
});

function openEditHw(id, title, desc, dueDate) {
  _editingHwId = id;
  document.getElementById('modal-hw-title').textContent = 'Hausaufgabe bearbeiten';
  document.getElementById('confirm-add-hw').textContent = 'Speichern';
  document.getElementById('hw-title').value = title;
  document.getElementById('hw-desc').value  = desc;
  document.getElementById('hw-due').value   = dueDate;
  openModal('modal-add-hw');
  setTimeout(() => document.getElementById('hw-title').focus(), 100);
}

document.getElementById('confirm-add-hw').addEventListener('click', async function() {
  const title   = document.getElementById('hw-title').value.trim();
  const desc    = document.getElementById('hw-desc').value.trim();
  const dueDate = document.getElementById('hw-due').value;
  if (!title || !dueDate) { alert('Bitte Titel und Fälligkeitsdatum angeben.'); return; }
  if (this.disabled) return;
  this.disabled = true;
  try {
    if (_editingHwId) {
      await apiFetch(`/modules/${currentModuleId}/homework/${_editingHwId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description: desc, dueDate })
      });
    } else {
      await apiFetch(`/modules/${currentModuleId}/homework`, {
        method: 'POST',
        body: JSON.stringify({ title, description: desc, dueDate })
      });
    }
    _editingHwId = null;
    closeModal('modal-add-hw');
    loadHomework();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

function deleteHomework(id) {
  confirmDelete(
    'Hausaufgabe löschen?',
    'Diese Hausaufgabe wird unwiderruflich gelöscht.',
    async () => {
      await apiFetch(`/modules/${currentModuleId}/homework/${id}`, { method: 'DELETE' });
      loadHomework();
    }
  );
}
