/* ============================================================
   homework.js – Hausaufgaben
   ============================================================ */

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
          <button class="btn-delete" onclick="event.stopPropagation();deleteHomework(${hw.id})">Löschen</button>
        </div>
      </div>
      ${hw.description ? `<div class="card-expandable" style="display:none"><div class="card-body">${escapeHtml(hw.description)}</div></div>` : ''}
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
    await apiFetch(`/modules/${currentModuleId}/homework`, {
      method: 'POST',
      body: JSON.stringify({ title, description: desc, dueDate })
    });
    closeModal('modal-add-hw');
    loadHomework();
  } catch (e) { alert('Fehler: ' + e.message); }
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
