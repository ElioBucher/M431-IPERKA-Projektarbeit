/* ============================================================
   questions.js – Fragen & Antworten
   Datei: public/js/questions.js
   ============================================================ */

let answerTargetQuestionId = null;

/* ── LADEN ───────────────────────────────────────────────── */
async function loadQuestions() {
  const list = document.getElementById('question-list');
  list.innerHTML = '<div class="empty-card">Lädt…</div>';
  try {
    // Holt Fragen inkl. Antworten in einem Aufruf
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

  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  list.innerHTML = items.map(q => `
    <div class="card" data-id="${q.id}">
      <div class="card-header">
        <div>
          <div class="card-title">❓ ${escapeHtml(q.question)}</div>
          <div class="card-meta">${formatDate(q.created_at?.split('T')[0] ?? '')} · ${q.answers?.length ?? 0} Antwort(en)</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-link" onclick="openAnswerModal(${q.id}, \`${escapeHtml(q.question).replace(/`/g, "'")}\`)">Antworten</button>
          <button class="btn-icon danger" onclick="deleteQuestion(${q.id})" title="Löschen">🗑</button>
        </div>
      </div>

      ${q.answers && q.answers.length > 0 ? `
        <div class="answers-section">
          ${q.answers.map(a => `
            <div class="answer-item">
              <div>${escapeHtml(a.answer)}</div>
              <div class="answer-meta">${formatDate(a.created_at?.split('T')[0] ?? '')}
                <button class="btn-icon danger" style="font-size:.75rem;padding:1px 4px" onclick="deleteAnswer(${a.id}, ${q.id})" title="Antwort löschen">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

/* ── FRAGE HINZUFÜGEN ─────────────────────────────────────── */
document.getElementById('btn-add-question').addEventListener('click', () => {
  document.getElementById('question-text').value = '';
  openModal('modal-add-question');
  setTimeout(() => document.getElementById('question-text').focus(), 100);
});

document.getElementById('confirm-add-question').addEventListener('click', async () => {
  const question = document.getElementById('question-text').value.trim();
  if (!question) return;

  try {
    await apiFetch(`/modules/${currentModuleId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    closeModal('modal-add-question');
    loadQuestions();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
});

/* ── ANTWORT HINZUFÜGEN ──────────────────────────────────── */
function openAnswerModal(questionId, questionText) {
  answerTargetQuestionId = questionId;
  document.getElementById('answer-question-preview').textContent = questionText;
  document.getElementById('answer-text').value = '';
  openModal('modal-add-answer');
  setTimeout(() => document.getElementById('answer-text').focus(), 100);
}

document.getElementById('confirm-add-answer').addEventListener('click', async () => {
  const answer = document.getElementById('answer-text').value.trim();
  if (!answer || !answerTargetQuestionId) return;

  try {
    await apiFetch(`/questions/${answerTargetQuestionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
    closeModal('modal-add-answer');
    answerTargetQuestionId = null;
    loadQuestions();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
});

/* ── LÖSCHEN ─────────────────────────────────────────────── */
async function deleteQuestion(id) {
  if (!confirm('Frage (inkl. Antworten) wirklich löschen?')) return;
  try {
    await apiFetch(`/questions/${id}`, { method: 'DELETE' });
    loadQuestions();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
}

async function deleteAnswer(answerId, questionId) {
  if (!confirm('Antwort wirklich löschen?')) return;
  try {
    await apiFetch(`/answers/${answerId}`, { method: 'DELETE' });
    loadQuestions();
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
}