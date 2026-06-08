/* ============================================================
   exams.js – Prüfungen
   Datei: public/js/exams.js
   ============================================================ */

async function loadExams() {
  const list = document.getElementById('exam-list');
  list.innerHTML = '<div class="empty-card">Lädt…</div>';
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
  // Elio's API: examDate (camelCase)
  items.sort((a, b) => (a.examDate < b.examDate ? -1 : 1));

  list.innerHTML = items.map(ex => `
    <div class="card" data-id="${ex.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(ex.topic)}</div>
          <div class="card-meta">📅 ${formatDate(ex.examDate)} ${dueBadge(ex.examDate)}</div>
        </div>
        <button class="btn-icon danger" onclick="deleteExam(${ex.id})" title="Löschen">🗑</button>
      </div>
      ${ex.learningGoals ? `<div class="card-body"><strong style="font-size:.8rem;color:var(--text-dim)">Lernziele</strong><br>${escapeHtml(ex.learningGoals)}</div>` : ''}
    </div>
  `).join('');
}

document.getElementById('btn-add-exam').addEventListener('click', () => {
  document.getElementById('exam-title').value  = '';
  document.getElementById('exam-date').value   = '';
  document.getElementById('exam-topics').value = '';
  openModal('modal-add-exam');
  setTimeout(() => document.getElementById('exam-title').focus(), 100);
});

document.getElementById('confirm-add-exam').addEventListener('click', async () => {
  const topic        = document.getElementById('exam-title').value.trim();
  const examDate     = document.getElementById('exam-date').value;
  const learningGoals = document.getElementById('exam-topics').value.trim();
  if (!topic || !examDate) { alert('Bitte Thema und Prüfungsdatum angeben.'); return; }
  try {
    // Elio's API erwartet: topic, examDate, learningGoals
    await apiFetch(`/modules/${currentModuleId}/exams`, {
      method: 'POST',
      body: JSON.stringify({ topic, examDate, learningGoals })
    });
    closeModal('modal-add-exam');
    loadExams();
  } catch (e) { alert('Fehler: ' + e.message); }
});

async function deleteExam(id) {
  if (!confirm('Prüfung wirklich löschen?')) return;
  try {
    // Elio's URL: /modules/:moduleId/exams/:id
    await apiFetch(`/modules/${currentModuleId}/exams/${id}`, { method: 'DELETE' });
    loadExams();
  } catch (e) { alert('Fehler: ' + e.message); }
}