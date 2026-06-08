/* ============================================================
   exams.js – Prüfungen
   ============================================================ */

async function loadExams() {
  const list = document.getElementById('exam-list');
  list.innerHTML = '<div class="empty-card">Lädt...</div>';
  try {
    const items = await apiFetch(`/modules/${currentModuleId}/exams`) || [];
    renderExams(items);
  } catch (e) {
    list.innerHTML = '<div class="empty-card">Fehler beim Laden.</div>';
  }
}

function renderExams(items) {
  const list = document.getElementById('exam-list');
  if (items.length === 0) {
    list.innerHTML = '<div class="empty-card">Noch keine Prüfungen eingetragen.</div>';
    return;
  }
  items.sort((a, b) => (a.examDate < b.examDate ? -1 : 1));

  list.innerHTML = items.map(ex => `
    <div class="card card-collapsible" data-id="${ex.id}">
      <div class="card-header card-toggle" style="cursor:pointer">
        <div style="flex:1">
          <div class="card-title">${escapeHtml(ex.topic)}</div>
          <div class="card-meta">${formatDate(ex.examDate)} ${dueBadge(ex.examDate)}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-shrink:0">
          ${ex.learningGoals ? '<span class="card-chevron">▾</span>' : ''}
          <button class="btn-delete" onclick="event.stopPropagation();deleteExam(${ex.id})">Löschen</button>
        </div>
      </div>
      ${ex.learningGoals ? `
        <div class="card-expandable" style="display:none">
          <div class="card-body">
            <span class="card-label">Lernziele</span>
            ${escapeHtml(ex.learningGoals)}
          </div>
        </div>` : ''}
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

document.getElementById('btn-add-exam').addEventListener('click', () => {
  document.getElementById('exam-title').value  = '';
  document.getElementById('exam-date').value   = '';
  document.getElementById('exam-topics').value = '';
  openModal('modal-add-exam');
  setTimeout(() => document.getElementById('exam-title').focus(), 100);
});

document.getElementById('confirm-add-exam').addEventListener('click', async () => {
  const topic         = document.getElementById('exam-title').value.trim();
  const examDate      = document.getElementById('exam-date').value;
  const learningGoals = document.getElementById('exam-topics').value.trim();
  if (!topic || !examDate) { alert('Bitte Thema und Prüfungsdatum angeben.'); return; }
  try {
    await apiFetch(`/modules/${currentModuleId}/exams`, {
      method: 'POST',
      body: JSON.stringify({ topic, examDate, learningGoals })
    });
    closeModal('modal-add-exam');
    loadExams();
  } catch (e) { alert('Fehler: ' + e.message); }
});

function deleteExam(id) {
  confirmDelete(
    'Prüfung löschen?',
    'Diese Prüfung wird unwiderruflich gelöscht.',
    async () => {
      await apiFetch(`/modules/${currentModuleId}/exams/${id}`, { method: 'DELETE' });
      loadExams();
    }
  );
}
