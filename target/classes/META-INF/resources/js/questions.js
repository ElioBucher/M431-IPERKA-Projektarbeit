/* ============================================================
   questions.js – Fragen und Antworten
   ============================================================ */

let answerTargetQuestionId = null;

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
      <div class="card-header card-toggle">
        <div style="flex:1;cursor:pointer">
          <div class="card-title">${escapeHtml(q.questionText)}</div>
          <div class="card-meta">
            ${q.authorName ? `<span>${escapeHtml(q.authorName)}</span> &middot;` : ''}
            ${formatDate(q.createdAt)} &middot; ${q.answers?.length ?? 0} Antwort(en)
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;flex-shrink:0">
          <span class="card-chevron">▾</span>
          <button class="btn-link" onclick="event.stopPropagation();openAnswerModal(${q.id}, \`${escapeHtml(q.questionText).replace(/`/g, "'")}\`)">Antworten</button>
          <button class="btn-delete" onclick="event.stopPropagation();deleteQuestion(${q.id})">Löschen</button>
        </div>
      </div>
      <div class="card-expandable" style="display:none">
        ${q.answers && q.answers.length > 0 ? `
          <div class="answers-section">
            ${q.answers.map(a => `
              <div class="answer-item">
                <div class="answer-item-body">
                  <div>${escapeHtml(a.answerText)}</div>
                  <div class="answer-meta">${a.authorName ? escapeHtml(a.authorName) + ' · ' : ''}${formatDate(a.createdAt)}</div>
                </div>
                <button class="btn-delete" onclick="deleteAnswer(${a.id})">Löschen</button>
              </div>
            `).join('')}
          </div>
        ` : '<div style="padding-top:12px;font-size:.88rem;color:var(--text-3)">Noch keine Antworten.</div>'}
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

document.getElementById('btn-add-question').addEventListener('click', () => {
  document.getElementById('question-author').value = '';
  document.getElementById('question-text').value = '';
  openModal('modal-add-question');
  setTimeout(() => document.getElementById('question-author').focus(), 100);
});

document.getElementById('confirm-add-question').addEventListener('click', async function() {
  const authorName   = document.getElementById('question-author').value.trim();
  const questionText = document.getElementById('question-text').value.trim();
  if (!authorName) { alert('Bitte deinen Namen angeben.'); return; }
  if (!questionText) { alert('Bitte eine Frage eingeben.'); return; }
  if (this.disabled) return;
  this.disabled = true;
  try {
    await apiFetch(`/modules/${currentModuleId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ questionText, authorName })
    });
    closeModal('modal-add-question');
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

function openAnswerModal(questionId, questionText) {
  answerTargetQuestionId = questionId;
  document.getElementById('answer-question-preview').textContent = questionText;
  document.getElementById('answer-author').value = '';
  document.getElementById('answer-text').value = '';
  openModal('modal-add-answer');
  setTimeout(() => document.getElementById('answer-author').focus(), 100);
}

document.getElementById('confirm-add-answer').addEventListener('click', async function() {
  const authorName = document.getElementById('answer-author').value.trim();
  const answerText = document.getElementById('answer-text').value.trim();
  if (!authorName) { alert('Bitte deinen Namen angeben.'); return; }
  if (!answerText || !answerTargetQuestionId) return;
  if (this.disabled) return;
  this.disabled = true;
  try {
    await apiFetch(`/modules/${currentModuleId}/questions/${answerTargetQuestionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ answerText, authorName })
    });
    closeModal('modal-add-answer');
    answerTargetQuestionId = null;
    loadQuestions();
  } catch (e) { alert('Fehler: ' + e.message); }
  finally { this.disabled = false; }
});

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

function deleteAnswer(id) {
  confirmDelete(
    'Antwort löschen?',
    'Diese Antwort wird unwiderruflich gelöscht.',
    async () => {
      await apiFetch(`/modules/${currentModuleId}/answers/${id}`, { method: 'DELETE' });
      loadQuestions();
    }
  );
}
