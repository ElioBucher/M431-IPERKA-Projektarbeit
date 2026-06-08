/* ============================================================
   exams.js – Prüfungen
   ============================================================ */

let _editingExamId = null;

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
          <button class="btn-edit"
            data-exam-id="${ex.id}"
            data-topic="${escapeHtml(ex.topic)}"
            data-date="${ex.examDate}"
            data-goals="${escapeHtml(ex.learningGoals || '')}">Bearbeiten</button>
          <button class="btn-delete" data-exam-id="${ex.id}">Löschen</button>
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

  list.querySelectorAll('.btn-edit[data-exam-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEditExam(+btn.dataset.examId, btn.dataset.topic, btn.dataset.date, btn.dataset.goals);
    });
  });

  list.querySelectorAll('.btn-delete[data-exam-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteExam(+btn.dataset.examId);
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

document.getElementById('btn-add-exam').addEventListener('click', () => {
  _editingExamId = null;
  document.getElementById('modal-exam-title').textContent = 'Prüfung hinzufügen';
  document.getElementById('confirm-add-exam').textContent = 'Speichern';
  document.getElementById('exam-title').value  = '';
  document.getElementById('exam-date').value   = '';
  document.getElementById('exam-topics').value = '';
  openModal('modal-add-exam');
  setTimeout(() => document.getElementById('exam-title').focus(), 100);
});

function openEditExam(id, topic, examDate, learningGoals) {
  _editingExamId = id;
  document.getElementById('modal-exam-title').textContent = 'Prüfung bearbeiten';
  document.getElementById('confirm-add-exam').textContent = 'Speichern';
  document.getElementById('exam-title').value  = topic;
  document.getElementById('exam-date').value   = examDate;
  document.getElementById('exam-topics').value = learningGoals;
  openModal('modal-add-exam');
  setTimeout(() => document.getElementById('exam-title').focus(), 100);
}

document.getElementById('confirm-add-exam').addEventListener('click', async function() {
  const topic         = document.getElementById('exam-title').value.trim();
  const examDate      = document.getElementById('exam-date').value;
  const learningGoals = document.getElementById('exam-topics').value.trim();
  if (!topic || !examDate) { alert('Bitte Thema und Prüfungsdatum angeben.'); return; }
  if (this.disabled) return;
  this.disabled = true;
  try {
    if (_editingExamId) {
      await apiFetch(`/modules/${currentModuleId}/exams/${_editingExamId}`, {
        method: 'PUT',
        body: JSON.stringify({ topic, examDate, learningGoals })
      });
    } else {
      await apiFetch(`/modules/${currentModuleId}/exams`, {
        method: 'POST',
        body: JSON.stringify({ topic, examDate, learningGoals })
      });
    }
    _editingExamId = null;
    closeModal('modal-add-exam');
    loadExams();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
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
