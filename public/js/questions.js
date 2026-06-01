/* ============================================================
   questions.js – Fragen & Antworten
   Datei: public/js/questions.js
   ============================================================ */

let answerTargetQuestionId = null;

async function loadQuestions() {
  const list = document.getElementById('question-list');
  list.innerHTML = '<div class="empty-card">Lädt…</div>';
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
  // Elio's API: createdAt (camelCase)
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  list.innerHTML = items.map(q => `
    <div class="card" data-id="${q.id}">
      <div class="card-header">
        <div>
          <div class="card-title">❓ ${escapeHtml(q.questionText)}</div>
          <div class="card-meta">${formatDate(q.createdAt)} · ${q.answers?.length ?? 0} Antwort(en)</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-link" onclick="openAnswerModal(${q.id}, \`${escapeHtml(q.questionText).replace(/`/g, "'")}\`)">Antworten</button>
          <button class="btn-icon danger" onclick="deleteQuestion(${q.id})" title="Löschen">🗑</button>
        </div>
      </div>
      ${q.answers && q.answers.length > 0 ? `
        <div class="answers-section">
          ${q.answers.map(a => `
            <div class="answer-item">
              <div>${escapeHtml(a.answerText)}</div>
              <div class="answer-meta">${formatDate(a.createdAt)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

document.getElementById('btn-add-question').addEventListener('click', () => {
  document.getElementById('question-text').value = '';
  openModal('modal-add-question');
  setTimeout(() => document.getElementById('question-text').focus(), 100);
});

document.getElementById('confirm-add-question').addEventListener('click', async () => {
  const questionText = document.getElementById('question-text').value.trim();
  if (!questionText) return;
  try {
    // Elio's API erwartet: questionText
    await apiFetch(`/modules/${currentModuleId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ questionText })
    });
    closeModal('modal-add-question');
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
});

function openAnswerModal(questionId, questionText) {
  answerTargetQuestionId = questionId;
  document.getElementById('answer-question-preview').textContent = questionText;
  document.getElementById('answer-text').value = '';
  openModal('modal-add-answer');
  setTimeout(() => document.getElementById('answer-text').focus(), 100);
}

document.getElementById('confirm-add-answer').addEventListener('click', async () => {
  const answerText = document.getElementById('answer-text').value.trim();
  if (!answerText || !answerTargetQuestionId) return;
  try {
    // Elio's URL: /modules/:moduleId/questions/:id/answers
    // Elio's API erwartet: answerText
    await apiFetch(`/modules/${currentModuleId}/questions/${answerTargetQuestionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answerText })
    });
    closeModal('modal-add-answer');
    answerTargetQuestionId = null;
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
});

async function deleteQuestion(id) {
  if (!confirm('Frage (inkl. Antworten) wirklich löschen?')) return;
  try {
    // Elio's URL: /modules/:moduleId/questions/:id
    await apiFetch(`/modules/${currentModuleId}/questions/${id}`, { method: 'DELETE' });
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
}