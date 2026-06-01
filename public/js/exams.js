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

  items.sort((a, b) => (a.exam_date < b.exam_date ? -1 : 1));

  list.innerHTML = items.map(ex => `
    <div class="card" data-id="${ex.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(ex.title)}</div>
          <div class="card-meta">📅 ${formatDate(ex.exam_date)} ${dueBadge(ex.exam_date)}</div>
        </div>
        <button class="btn-icon danger" onclick="deleteExam(${ex.id})" title="Löschen">🗑</button>
      </div>
      ${ex.topics ? `<div class="card-body"><strong style="font-size:.8rem;color:var(--text-dim)">Lernziele</strong><br>${escapeHtml(ex.topics)}</div>` : ''}
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
  const title    = document.getElementById('exam-title').value.trim();
  const examDate = document.getElementById('exam-date').value;
  const topics   = document.getElementById('exam-topics').value.trim();

  if (!title || !examDate) {
    alert('Bitte Titel und Prüfungsdatum angeben.');
    return;
  }

  try {
    await apiFetch(`/modules/${currentModuleId}/exams`, {
      method: 'POST',
      body: JSON.stringify({ title, exam_date: examDate, topics })
    });
    closeModal('modal-add-exam');
    loadExams();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
});

async function deleteExam(id) {
  if (!confirm('Prüfung wirklich löschen?')) return;
  try {
    await apiFetch(`/exams/${id}`, { method: 'DELETE' });
    loadExams();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
}