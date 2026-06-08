/* ============================================================
   questions.js – Fragen & Antworten
   ============================================================ */

let answerTargetQuestionId = null;
let _editingQuestionId     = null;
let _editingAnswerId       = null;

async function loadQuestions() {
  const list = document.getElementById('question-list');
  list.innerHTML = '<div class="empty-card">Lädt...</div>';
  try {
    const items = await apiFetch(`/modules/${currentModuleId}/questions`) || [];
    renderQuestions(items);
  } catch (e) {
    list.innerHTML = '<div class="empty-card">Fehler beim Laden.</div>';
  }
}

function renderQuestions(items) {
  const list = document.getElementById('question-list');
  if (items.length === 0) {
    list.innerHTML = '<div class="empty-card">Noch keine Fragen gestellt.</div>';
    return;
  }
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  list.innerHTML = items.map(q => `
    <div class="card card-collapsible" data-id="${q.id}">
      <div class="card-header card-toggle" style="cursor:pointer">
        <div style="flex:1">
          <div class="card-title">❓ ${escapeHtml(q.questionText)}</div>
          <div class="card-meta">${escapeHtml(q.authorName)} · ${formatDate(q.createdAt)} · ${q.answers?.length ?? 0} Antwort(en)</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
          <span class="card-chevron">▾</span>
          <button class="btn-edit" onclick="event.stopPropagation();openEditQuestion(${q.id}, \`${escapeHtml(q.questionText).replace(/`/g,"'")}\`, \`${escapeHtml(q.authorName || '').replace(/`/g,"'")}\`)">Bearbeiten</button>
          <button class="btn-delete" onclick="event.stopPropagation();deleteQuestion(${q.id})">Löschen</button>
        </div>
      </div>
      <div class="card-expandable" style="display:none">
        <div class="answers-section">
          ${q.answers && q.answers.length > 0 ? q.answers.map(a => `
            <div class="answer-item">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <div>
                  <div>${escapeHtml(a.answerText)}</div>
                  <div class="answer-meta">${escapeHtml(a.authorName)} · ${formatDate(a.createdAt)}</div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0">
                  <button class="btn-edit btn-sm" onclick="openEditAnswer(${a.id}, \`${escapeHtml(a.answerText).replace(/`/g,"'")}\`, \`${escapeHtml(a.authorName || '').replace(/`/g,"'")}\`)">Bearbeiten</button>
                  <button class="btn-delete btn-sm" onclick="deleteAnswer(${q.id}, ${a.id})">Löschen</button>
                </div>
              </div>
            </div>
          `).join('') : '<div style="padding:8px 0;font-size:.85rem;color:var(--text-3)">Noch keine Antworten.</div>'}
          <button class="btn-link" style="margin-top:8px" onclick="openAnswerModal(${q.id}, \`${escapeHtml(q.questionText).replace(/`/g,"'")}\`)">+ Antworten</button>
        </div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.card-toggle').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.card-collapsible');
      const body = card.querySelector('.card-expandable');
      const chevron = card.querySelector('.card-chevron');
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      chevron.style.transform = open ? '' : 'rotate(180deg)';
    });
  });
}

/* ── FRAGE ERSTELLEN / BEARBEITEN ────────────────────────── */
document.getElementById('btn-add-question').addEventListener('click', () => {
  _editingQuestionId = null;
  document.getElementById('modal-question-title').textContent = 'Frage stellen';
  document.getElementById('confirm-add-question').textContent = 'Stellen';
  document.getElementById('question-author').value = '';
  document.getElementById('question-text').value   = '';
  openModal('modal-add-question');
  setTimeout(() => document.getElementById('question-author').focus(), 100);
});

function openEditQuestion(id, questionText, authorName) {
  _editingQuestionId = id;
  document.getElementById('modal-question-title').textContent = 'Frage bearbeiten';
  document.getElementById('confirm-add-question').textContent = 'Speichern';
  document.getElementById('question-author').value = authorName;
  document.getElementById('question-text').value   = questionText;
  openModal('modal-add-question');
  setTimeout(() => document.getElementById('question-text').focus(), 100);
}

document.getElementById('confirm-add-question').addEventListener('click', async function() {
  const authorName   = document.getElementById('question-author').value.trim();
  const questionText = document.getElementById('question-text').value.trim();
  if (!authorName) { alert('Bitte deinen Namen angeben.'); return; }
  if (!questionText) { alert('Bitte eine Frage eingeben.'); return; }
  if (this.disabled) return;
  this.disabled = true;
  try {
    if (_editingQuestionId) {
      await apiFetch(`/modules/${currentModuleId}/questions/${_editingQuestionId}`, {
        method: 'PUT',
        body: JSON.stringify({ questionText, authorName })
      });
    } else {
      await apiFetch(`/modules/${currentModuleId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ questionText, authorName })
      });
    }
    closeModal('modal-add-question');
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

/* ── ANTWORT ERSTELLEN / BEARBEITEN ──────────────────────── */
function openAnswerModal(questionId, questionText) {
  _editingAnswerId = null;
  answerTargetQuestionId = questionId;
  document.getElementById('modal-answer-title').textContent = 'Antwort hinzufügen';
  document.getElementById('confirm-add-answer').textContent = 'Antworten';
  document.getElementById('answer-question-preview').textContent = questionText;
  document.getElementById('answer-author').value = '';
  document.getElementById('answer-text').value   = '';
  openModal('modal-add-answer');
  setTimeout(() => document.getElementById('answer-author').focus(), 100);
}

function openEditAnswer(answerId, answerText, authorName) {
  _editingAnswerId = answerId;
  document.getElementById('modal-answer-title').textContent = 'Antwort bearbeiten';
  document.getElementById('confirm-add-answer').textContent = 'Speichern';
  document.getElementById('answer-question-preview').textContent = '';
  document.getElementById('answer-author').value = authorName;
  document.getElementById('answer-text').value   = answerText;
  openModal('modal-add-answer');
  setTimeout(() => document.getElementById('answer-text').focus(), 100);
}

document.getElementById('confirm-add-answer').addEventListener('click', async function() {
  const authorName = document.getElementById('answer-author').value.trim();
  const answerText = document.getElementById('answer-text').value.trim();
  if (!authorName) { alert('Bitte deinen Namen angeben.'); return; }
  if (!answerText) return;
  if (this.disabled) return;
  this.disabled = true;
  try {
    if (_editingAnswerId) {
      await apiFetch(`/modules/${currentModuleId}/answers/${_editingAnswerId}`, {
        method: 'PUT',
        body: JSON.stringify({ answerText, authorName })
      });
    } else {
      if (!answerTargetQuestionId) return;
      await apiFetch(`/modules/${currentModuleId}/questions/${answerTargetQuestionId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ answerText, authorName })
      });
      answerTargetQuestionId = null;
    }
    closeModal('modal-add-answer');
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

/* ── LÖSCHEN ─────────────────────────────────────────────── */
function deleteQuestion(id) {
  confirmDelete(
    'Frage löschen?',
    'Die Frage und alle Antworten werden unwiderruflich gelöscht.',
    async () => {
      await apiFetch(`/modules/${currentModuleId}/questions/${id}`, { method: 'DELETE' });
      loadQuestions();
    }
  );
}

function deleteAnswer(questionId, answerId) {
  confirmDelete(
    'Antwort löschen?',
    'Diese Antwort wird unwiderruflich gelöscht.',
    async () => {
      await apiFetch(`/modules/${currentModuleId}/answers/${answerId}`, { method: 'DELETE' });
      loadQuestions();
    }
  );
}
