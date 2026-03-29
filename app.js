// app.js — Tinder-Style Swipe UI + Compatibility Engine
import { QUESTIONS, SECTIONS } from './questions.js';
import { DEMO_PROFILES } from './profiles.js';
import { computeCompatibility, generateTags, selfInsightNote, generateConversationPrompts, DIMENSION_WEIGHTS } from './scoring.js';

/* ── STATE ──────────────────────────────────────────────────────────── */
let state = {
  currentPage: 'landing',
  quiz: {
    currentSection: 0,
    currentQuestionInSection: 0,
    answers: {},
  },
  profile: null,
  // Swipe deck
  deck: [],         // profiles loaded into the card stack
  deckIndex: 0,     // current top card
  liked: [],        // profiles user swiped right on
  superLiked: [],   // profiles user super-liked
  rejected: [],     // profiles user swiped left on
  // Match detail
  activeMatch: null,
  gateTimers: {},
  // Chat
  chatTarget: null,
  chatMessages: {},
};

/* ── UTILS ──────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function showPage(id) {
  $$('.page').forEach(p => p.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
  state.currentPage = id;

  // Show/hide bottom nav
  const nav = $('bottom-nav');
  const showNav = ['swipe', 'matches', 'chat', 'profile'].includes(id);
  nav.style.display = showNav ? 'flex' : 'none';

  // Highlight active nav item
  $$('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === id);
  });

  // Hide action buttons when not on swipe page
  const actionBtns = document.querySelector('.action-buttons');
  if (actionBtns) actionBtns.style.display = id === 'swipe' ? 'flex' : 'none';
}

function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function scoreColor(s) { return s >= 65 ? 'green' : s >= 40 ? 'yellow' : 'red'; }
function dimLabel(dim) {
  return { clean:'Cleanliness', sleep:'Sleep Schedule', finance:'Finance', social:'Social Habits', conflict:'Conflict Style', privacy:'Privacy', culture:'Culture & Diet', lifestyle:'Life Stage', personality:'Personality', gender:'Gender/Safety' }[dim] || dim;
}
function dimEmoji(dim) {
  return { clean:'🧹', sleep:'🌙', finance:'💸', social:'🏠', conflict:'🗣️', privacy:'🔒', culture:'🪔', lifestyle:'🎓', personality:'🧠', gender:'🛡️' }[dim] || '📊';
}

/* ── QUIZ LOGIC ────────────────────────────────────────────────────── */
function getQuestionsForSection(sectionIdx) {
  return QUESTIONS.filter(q => q.section === SECTIONS[sectionIdx].id);
}

function getCurrentQuestion() {
  return getQuestionsForSection(state.quiz.currentSection)[state.quiz.currentQuestionInSection];
}

function getTotalProgress() {
  let total = 0, current = 0;
  for (let i = 0; i < SECTIONS.length; i++) {
    const qs = getQuestionsForSection(i);
    total += qs.length;
    if (i < state.quiz.currentSection) current += qs.length;
    else if (i === state.quiz.currentSection) current += state.quiz.currentQuestionInSection;
  }
  return { current: current + 1, total };
}

function renderQuiz() {
  const q = getCurrentQuestion();
  if (!q) return;
  const sec = SECTIONS[state.quiz.currentSection];
  const { current, total } = getTotalProgress();

  // Progress bar
  const fill = $('quiz-progress-fill');
  if (fill) fill.style.width = ((current / total) * 100) + '%';
  const label = $('quiz-progress-label');
  if (label) label.textContent = `${current}/${total}`;

  // Section label
  const secLabel = $('quiz-section-label');
  if (secLabel) secLabel.textContent = `${sec.emoji}  ${sec.label}`;

  // Build question card
  const card = $('quiz-card');
  card.innerHTML = buildQuestionHTML(q);
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'card-in 0.3s ease';

  // Attach listeners
  attachQuestionListeners(q, card);

  // Update buttons
  const isLast = state.quiz.currentSection === SECTIONS.length - 1
    && state.quiz.currentQuestionInSection === getQuestionsForSection(state.quiz.currentSection).length - 1;
  $('quiz-next-btn').textContent = isLast ? 'See Results' : 'Continue';
}

function buildQuestionHTML(q) {
  const saved = state.quiz.answers[q.id];
  let html = `<div class="q-text">${q.text}</div>`;
  if (q.hint) html += `<div class="q-hint">${q.hint}</div>`;

  if (q.type === 'scenario_choice') {
    html += `<div class="choice-list">`;
    q.options.forEach((opt, i) => {
      const sel = saved === opt.value ? 'selected' : '';
      html += `<button class="choice-item ${sel}" data-idx="${i}">
        <div class="choice-radio"></div>
        <span>${opt.label}</span>
      </button>`;
    });
    html += `</div>`;
  } else if (q.type === 'mcq_multi') {
    const cur = saved || [];
    html += `<div class="choice-list">`;
    q.options.forEach(opt => {
      const sel = cur.includes(opt.value) ? 'selected' : '';
      html += `<button class="choice-item checkbox ${sel}" data-val="${opt.value}">
        <div class="choice-radio"></div>
        <span>${opt.label}</span>
      </button>`;
    });
    html += `</div>`;
  } else if (q.type === 'slider') {
    const val = saved !== undefined ? saved : q.default;
    const labelIdx = Math.round((val - q.min) / (q.max - q.min) * (q.labels.length - 1));
    const displayLabel = q.labels ? q.labels[Math.min(labelIdx, q.labels.length - 1)] : val;
    html += `<div class="slider-wrap">
      <div class="slider-value-display">${displayLabel}</div>
      <input type="range" class="styled-range" min="${q.min}" max="${q.max}" step="${q.step || 1}" value="${val}" />`;
    if (q.labels) {
      const show = [q.labels[0], q.labels[Math.floor(q.labels.length / 2)], q.labels[q.labels.length - 1]];
      html += `<div class="slider-labels">${show.map(l => `<span>${l}</span>`).join('')}</div>`;
    }
    html += `</div>`;
  }
  return html;
}

function attachQuestionListeners(q, card) {
  if (q.type === 'scenario_choice') {
    card.querySelectorAll('.choice-item').forEach(item => {
      item.addEventListener('click', () => {
        card.querySelectorAll('.choice-item').forEach(c => c.classList.remove('selected'));
        item.classList.add('selected');
        state.quiz.answers[q.id] = q.options[parseInt(item.dataset.idx)].value;
        localStorage.setItem('rm_answers', JSON.stringify(state.quiz.answers));
      });
    });
  } else if (q.type === 'mcq_multi') {
    card.querySelectorAll('.choice-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.val;
        let cur = state.quiz.answers[q.id] || [];
        if (val === 'none') { cur = cur.includes('none') ? [] : ['none']; }
        else { cur = cur.filter(v => v !== 'none'); cur.includes(val) ? cur = cur.filter(v => v !== val) : cur.push(val); }
        state.quiz.answers[q.id] = cur;
        localStorage.setItem('rm_answers', JSON.stringify(state.quiz.answers));
        card.querySelectorAll('.choice-item').forEach(c => c.classList.toggle('selected', cur.includes(c.dataset.val)));
      });
    });
  } else if (q.type === 'slider') {
    const slider = card.querySelector('.styled-range');
    const display = card.querySelector('.slider-value-display');
    const update = (val) => {
      state.quiz.answers[q.id] = parseFloat(val);
      localStorage.setItem('rm_answers', JSON.stringify(state.quiz.answers));
      if (q.labels) {
        const idx = Math.round((val - q.min) / (q.max - q.min) * (q.labels.length - 1));
        display.textContent = q.labels[Math.min(idx, q.labels.length - 1)];
      } else { display.textContent = val; }
    };
    slider.addEventListener('input', e => update(e.target.value));
    update(slider.value);
  }
}

function advanceQuiz() {
  const q = getCurrentQuestion();
  if (q && q.type === 'scenario_choice' && state.quiz.answers[q.id] === undefined) {
    showToast('Please select an answer', 'error'); return;
  }
  if (q && q.type === 'slider' && state.quiz.answers[q.id] === undefined) {
    state.quiz.answers[q.id] = q.default;
  }

  const qs = getQuestionsForSection(state.quiz.currentSection);
  if (state.quiz.currentQuestionInSection < qs.length - 1) {
    state.quiz.currentQuestionInSection++;
  } else if (state.quiz.currentSection < SECTIONS.length - 1) {
    state.quiz.currentSection++;
    state.quiz.currentQuestionInSection = 0;
  } else {
    finishQuiz(); return;
  }
  renderQuiz();
}

function backQuiz() {
  if (state.quiz.currentQuestionInSection > 0) {
    state.quiz.currentQuestionInSection--;
  } else if (state.quiz.currentSection > 0) {
    state.quiz.currentSection--;
    state.quiz.currentQuestionInSection = getQuestionsForSection(state.quiz.currentSection).length - 1;
  } else {
    showPage('landing'); return;
  }
  renderQuiz();
}

/* ── FINISH QUIZ ───────────────────────────────────────────────────── */
function finishQuiz() {
  // Fill defaults
  for (const q of QUESTIONS) {
    if (q.type === 'slider' && state.quiz.answers[q.id] === undefined) state.quiz.answers[q.id] = q.default;
    if (q.type === 'mcq_multi' && state.quiz.answers[q.id] === undefined) state.quiz.answers[q.id] = [];
  }

  const tags = generateTags(state.quiz.answers);
  const note = selfInsightNote(state.quiz.answers);
  state.profile = { tags, note, answers: { ...state.quiz.answers } };

  // Compute matches and build deck
  state.deck = DEMO_PROFILES.map(p => {
    const result = computeCompatibility(state.quiz.answers, p.answers);
    return { ...p, ...result, matchResult: result };
  }).sort((a, b) => b.overall - a.overall);

  state.deckIndex = 0;
  state.liked = [];
  state.superLiked = [];
  state.rejected = [];

  localStorage.setItem('rm_answers', JSON.stringify(state.quiz.answers));

  showPage('swipe');
  renderCardStack();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SWIPE CARD STACK
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderCardStack() {
  const container = $('card-stack');
  container.innerHTML = '';

  const remaining = state.deck.slice(state.deckIndex);
  if (remaining.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🏠</div>
      <div class="empty-title">No more profiles</div>
      <div class="empty-sub">You've seen everyone! Check your matches or come back later.</div>
    </div>`;
    return;
  }

  // Render up to 4 cards (top = first in DOM but last visually)
  const cardsToShow = remaining.slice(0, 4).reverse();
  cardsToShow.forEach((profile, i) => {
    const isTop = (i === cardsToShow.length - 1);
    const card = createSwipeCard(profile, isTop);
    container.appendChild(card);
  });
}

function createSwipeCard(profile, isTop) {
  const sc = scoreColor(profile.overall);
  const card = document.createElement('div');
  card.className = 'swipe-card';
  card.dataset.profileId = profile.id;

  card.innerHTML = `
    <div class="swipe-card-bg">
      <div class="card-avatar-large" style="background:linear-gradient(135deg, ${profile.color}22, ${profile.color}44)">${profile.initials}</div>
    </div>
    <div class="swipe-card-gradient"></div>
    <div class="card-score ${sc}">
      ${profile.overall}%
      <small>match</small>
    </div>
    <div class="swipe-card-info">
      <div class="card-name-row">
        <span class="card-name">${profile.name.split(' ')[0]}</span>
        <span class="card-age">${profile.age}</span>
        <span class="card-verified">✓</span>
      </div>
      <div class="card-profession">${profile.profession} · ${profile.area}</div>
      <div class="card-bio">${profile.bio}</div>
      <div class="card-tags">
        ${profile.tags.slice(0, 4).map(t => `<span class="card-tag">${t}</span>`).join('')}
      </div>
    </div>
  `;

  if (isTop) {
    enableSwipeGesture(card, profile);
    // Tap to open detail
    card.addEventListener('click', (e) => {
      // Don't open if swiping
      if (Math.abs(card._dragX || 0) > 10) return;
      openMatchDetail(profile);
    });
  }

  return card;
}

/* ── SWIPE GESTURE ENGINE ──────────────────────────────────────────── */
function enableSwipeGesture(card, profile) {
  let startX = 0, startY = 0, currentX = 0, currentY = 0;
  let isDragging = false;
  card._dragX = 0;

  const onStart = (e) => {
    isDragging = true;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    card.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const point = e.touches ? e.touches[0] : e;
    currentX = point.clientX - startX;
    currentY = point.clientY - startY;
    card._dragX = currentX;

    const rotation = currentX * 0.08;
    const yShift = Math.abs(currentX) * 0.05;
    card.style.transform = `translateX(${currentX}px) translateY(${-yShift}px) rotate(${rotation}deg)`;

    // Show indicators
    const threshold = 80;
    const nopeEl = $('swipe-nope');
    const likeEl = $('swipe-like');
    const superEl = $('swipe-super');

    if (currentX < -threshold) {
      nopeEl.style.opacity = Math.min(1, (-currentX - threshold) / 60);
      likeEl.style.opacity = 0;
    } else if (currentX > threshold) {
      likeEl.style.opacity = Math.min(1, (currentX - threshold) / 60);
      nopeEl.style.opacity = 0;
    } else {
      nopeEl.style.opacity = 0;
      likeEl.style.opacity = 0;
    }

    // Super like: swipe up
    if (currentY < -100 && Math.abs(currentX) < 60) {
      superEl.style.opacity = Math.min(1, (-currentY - 100) / 60);
    } else {
      superEl.style.opacity = 0;
    }
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    const swipeThreshold = 120;
    $('swipe-nope').style.opacity = 0;
    $('swipe-like').style.opacity = 0;
    $('swipe-super').style.opacity = 0;

    if (currentX > swipeThreshold) {
      animateSwipeOut(card, 'right', () => handleSwipe(profile, 'like'));
    } else if (currentX < -swipeThreshold) {
      animateSwipeOut(card, 'left', () => handleSwipe(profile, 'reject'));
    } else if (currentY < -120 && Math.abs(currentX) < 60) {
      animateSwipeOut(card, 'up', () => handleSwipe(profile, 'super'));
    } else {
      // Snap back
      card.style.transition = 'transform 0.4s cubic-bezier(0.19,1,0.22,1)';
      card.style.transform = '';
      card._dragX = 0;
    }

    currentX = 0;
    currentY = 0;
  };

  card.addEventListener('mousedown', onStart);
  card.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}

function animateSwipeOut(card, direction, callback) {
  card.style.transition = 'transform 0.5s ease, opacity 0.5s ease';

  if (direction === 'right') {
    card.style.transform = 'translateX(150%) rotate(30deg)';
  } else if (direction === 'left') {
    card.style.transform = 'translateX(-150%) rotate(-30deg)';
  } else if (direction === 'up') {
    card.style.transform = 'translateY(-150%) scale(0.8)';
  }
  card.style.opacity = '0';

  setTimeout(() => {
    callback();
  }, 400);
}

function handleSwipe(profile, action) {
  if (action === 'like') {
    state.liked.push(profile);
    showToast(`💚 You liked ${profile.name.split(' ')[0]}!`, 'success');
  } else if (action === 'super') {
    state.superLiked.push(profile);
    state.liked.push(profile); // also counts as a like
    showToast(`⭐ Super Like sent to ${profile.name.split(' ')[0]}!`, 'success');
  } else {
    state.rejected.push(profile);
  }

  state.deckIndex++;
  renderCardStack();
}

/* Button-triggered swipes */
function triggerSwipe(direction) {
  const container = $('card-stack');
  const topCard = container.querySelector('.swipe-card:last-child');
  if (!topCard) return;

  const profileId = topCard.dataset.profileId;
  const profile = state.deck.find(p => p.id === profileId);
  if (!profile) return;

  const action = direction === 'right' ? 'like' : direction === 'up' ? 'super' : 'reject';
  animateSwipeOut(topCard, direction, () => handleSwipe(profile, action));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MATCH DETAIL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function openMatchDetail(profile) {
  state.activeMatch = profile;
  showPage('match-detail');

  const sc = scoreColor(profile.overall);
  const prompts = generateConversationPrompts(profile.flags || [], profile.name);

  // Dimension rows
  const dimRows = Object.entries(profile.dimScores || {}).map(([dim, score]) => {
    const c = scoreColor(score);
    return `<div class="dim-row">
      <span class="dim-label">${dimEmoji(dim)} ${dimLabel(dim)}</span>
      <div class="dim-bar-wrap"><div class="dim-bar ${c}" style="width:${score}%"></div></div>
      <span class="dim-score score-${c}">${score}%</span>
    </div>`;
  }).join('');

  $('detail-content').innerHTML = `
    <!-- Hero -->
    <div class="detail-hero">
      <div class="detail-hero-avatar" style="background:linear-gradient(135deg, ${profile.color}22, ${profile.color}44)">${profile.initials}</div>
      <div class="detail-hero-info">
        <div class="detail-name-row">
          <span class="detail-name">${profile.name}</span>
          <span class="detail-age">${profile.age}</span>
        </div>
        <div class="detail-meta">${profile.profession} · ${profile.company} · ${profile.area}, ${profile.city}</div>
        <div class="detail-bio-text">"${profile.bio}"</div>
        <div class="detail-tags">
          ${profile.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}
        </div>
        <div class="detail-score-row">
          <div class="detail-score-num score-${sc}">${profile.overall}%</div>
          <div>
            <div class="detail-score-label">Overall Match</div>
            <div style="font-size:12px;color:var(--text-4)">Across 11 dimensions</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hard block warning -->
    ${profile.hardBlock ? `<div class="detail-section" style="border-color:rgba(239,68,68,0.3)">
      <div class="detail-section-title" style="color:var(--red)">🚫 Hard Filter Mismatch</div>
      <p style="font-size:13px;color:var(--text-3);line-height:1.7">One or more fundamental incompatibilities were detected. Review the flags below carefully.</p>
    </div>` : ''}

    <!-- Gate Timer -->
    ${!profile.hardBlock ? `<div class="detail-section" id="gate-section-${profile.id}">
      <div class="detail-section-title">🔒 Safety Review Gate</div>
      <div class="gate-box">
        <div class="gate-timer" id="gate-timer-${profile.id}">10</div>
        <div class="gate-label" id="gate-label-${profile.id}">Review the flags before sending a request…</div>
        <div class="gate-actions">
          <button class="btn-gold btn-sm" id="gate-send-${profile.id}" disabled>
            🔒 Send Request (10s)
          </button>
        </div>
      </div>
    </div>` : ''}

    <!-- Flag Breakdown -->
    <div class="detail-section">
      <div class="detail-section-title">🏳️ Compatibility Flags</div>
      ${(profile.flags || []).length === 0
        ? '<div class="flag-item green"><span class="flag-icon">✅</span><div><div class="flag-name">All Clear</div><div class="flag-detail">No significant issues across all dimensions.</div></div></div>'
        : (profile.flags || []).map(f => `
          <div class="flag-item ${f.type}">
            <span class="flag-icon">${f.type === 'hard' ? '🚫' : f.type === 'red' ? '🔴' : '⚠️'}</span>
            <div>
              <div class="flag-name">${f.label}</div>
              <div class="flag-detail">${f.detail}</div>
            </div>
          </div>`).join('')
      }
    </div>

    <!-- Dimension Breakdown -->
    <div class="detail-section">
      <div class="detail-section-title">📊 Dimension Breakdown</div>
      ${dimRows}
    </div>

    <!-- Conversation Prompts -->
    ${prompts.length > 0 ? `
    <div class="detail-section">
      <div class="detail-section-title">💬 Pre-Move-In Prompts</div>
      ${prompts.map(p => `<div class="prompt-card">
        <div class="prompt-dim" style="color:${p.color === 'red' ? 'var(--red)' : 'var(--gold)'}">${dimEmoji(p.dim)} ${dimLabel(p.dim)}</div>
        <div class="prompt-text">${p.prompt}</div>
      </div>`).join('')}
    </div>` : ''}

    <!-- 72h Cooling Off -->
    <div class="detail-section" style="border-color:rgba(212,175,55,0.2)">
      <div class="detail-section-title" style="color:var(--gold)">⏳ 72-Hour Cooling-Off Rule</div>
      <p style="font-size:13px;color:var(--text-3);line-height:1.7">After you send a request, ${profile.name.split(' ')[0]} must wait <strong style="color:var(--text)">6 hours minimum</strong> before responding. This prevents impulsive decisions and ensures both parties review compatibility flags.</p>
    </div>
  `;

  // Start gate timer
  if (!profile.hardBlock) startGateTimer(profile.id, profile.name);

  // Animate dim bars
  setTimeout(() => {
    document.querySelectorAll('.dim-bar').forEach(el => {
      const w = el.style.width; el.style.width = '0';
      setTimeout(() => el.style.width = w, 50);
    });
  }, 200);
}

function startGateTimer(matchId, name) {
  if (state.gateTimers[matchId]?.done) {
    const btn = $(`gate-send-${matchId}`);
    if (btn) { btn.disabled = false; btn.textContent = '✉️ Send Match Request'; }
    return;
  }

  let sec = 10;
  const timerEl = $(`gate-timer-${matchId}`);
  const labelEl = $(`gate-label-${matchId}`);
  const btn = $(`gate-send-${matchId}`);

  const interval = setInterval(() => {
    sec--;
    if (timerEl) timerEl.textContent = sec;
    if (btn) btn.textContent = `🔒 Send Request (${sec}s)`;
    if (sec <= 0) {
      clearInterval(interval);
      state.gateTimers[matchId] = { done: true };
      if (btn) { btn.disabled = false; btn.textContent = '✉️ Send Match Request'; }
      if (labelEl) labelEl.textContent = "You've reviewed the flags. Ready to send.";
      if (timerEl) timerEl.textContent = '✅';
      btn?.addEventListener('click', () => {
        showToast(`Request sent to ${name}! 6-hour review window started.`, 'success');
        btn.disabled = true;
        btn.textContent = '✓ Sent';
      }, { once: true });
    }
  }, 1000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MATCHES LIST
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderMatchesList() {
  const container = $('matches-list');
  if (!container) return;

  const allLiked = [...state.liked];
  if (allLiked.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">💛</div>
      <div class="empty-title">No matches yet</div>
      <div class="empty-sub">Start swiping on the Discover tab to find compatible flatmates.</div>
    </div>`;
    return;
  }

  container.innerHTML = allLiked.map(m => {
    const sc = scoreColor(m.overall);
    const isSuper = state.superLiked.some(s => s.id === m.id);
    return `<div class="match-list-item" data-id="${m.id}">
      <div class="match-avatar" style="background:${m.color}">${m.initials}</div>
      <div class="match-info">
        <div class="match-name">${m.name} ${isSuper ? '⭐' : ''}</div>
        <div class="match-last-msg">${m.profession} · ${m.area}</div>
      </div>
      <span class="match-score-sm score-${sc}">${m.overall}%</span>
    </div>`;
  }).join('');

  container.querySelectorAll('.match-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const profile = state.liked.find(m => m.id === id);
      if (profile) openMatchDetail(profile);
    });
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CHAT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function openChat(profile) {
  state.chatTarget = profile;
  showPage('chat');

  $('chat-header-info').innerHTML = `
    <div class="chat-avatar" style="background:${profile.color}">${profile.initials}</div>
    <div class="chat-name">${profile.name.split(' ')[0]}</div>
  `;

  renderChatMessages(profile.id);
}

function renderChatMessages(profileId) {
  const container = $('chat-messages');
  const msgs = state.chatMessages[profileId] || [];

  if (msgs.length === 0) {
    // Generate starter from prompts
    const profile = state.liked.find(m => m.id === profileId) || state.deck.find(m => m.id === profileId);
    const prompts = profile ? generateConversationPrompts(profile.flags || [], profile.name) : [];

    container.innerHTML = `<div class="chat-bubble system">You matched with ${profile?.name?.split(' ')[0] || 'them'}! Start the conversation.</div>`;
    if (prompts.length > 0) {
      container.innerHTML += `<div class="chat-bubble system">💡 Suggested topic: ${dimLabel(prompts[0].dim)}</div>`;
    }
    return;
  }

  container.innerHTML = msgs.map(m =>
    `<div class="chat-bubble ${m.type}">${m.text}</div>`
  ).join('');
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = $('chat-input');
  const text = input.value.trim();
  if (!text || !state.chatTarget) return;

  const profileId = state.chatTarget.id;
  if (!state.chatMessages[profileId]) state.chatMessages[profileId] = [];
  state.chatMessages[profileId].push({ type: 'sent', text });
  input.value = '';
  renderChatMessages(profileId);

  // Simulate reply after a delay
  setTimeout(() => {
    const replies = [
      "Hey! Thanks for reaching out 😊",
      "That's a great question! Let me think about it.",
      "Oh interesting, I hadn't considered that!",
      "Sounds good to me!",
      "Let's discuss this over chai sometime ☕",
    ];
    state.chatMessages[profileId].push({
      type: 'received',
      text: replies[Math.floor(Math.random() * replies.length)]
    });
    renderChatMessages(profileId);
  }, 1500 + Math.random() * 2000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EVENT LISTENERS & INIT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function init() {
  // Landing buttons
  $('landing-start-btn')?.addEventListener('click', startQuiz);
  $('landing-demo-btn')?.addEventListener('click', () => {
    // Load demo directly with random answers
    loadDemoMode();
  });

  // Quiz nav
  $('quiz-back-btn')?.addEventListener('click', backQuiz);
  $('quiz-prev-btn')?.addEventListener('click', backQuiz);
  $('quiz-next-btn')?.addEventListener('click', advanceQuiz);

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (state.currentPage === 'quiz') {
      if (e.key === 'Enter') advanceQuiz();
    }
  });

  // Swipe action buttons
  $('btn-reject')?.addEventListener('click', () => triggerSwipe('left'));
  $('btn-like')?.addEventListener('click', () => triggerSwipe('right'));
  $('btn-super')?.addEventListener('click', () => triggerSwipe('up'));

  // Detail back
  $('detail-back-btn')?.addEventListener('click', () => {
    if (state.liked.some(m => m.id === state.activeMatch?.id)) {
      showPage('matches');
      renderMatchesList();
    } else {
      showPage('swipe');
      renderCardStack();
    }
  });

  // Bottom nav
  $$('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === 'swipe') { showPage('swipe'); renderCardStack(); }
      else if (page === 'matches') { showPage('matches'); renderMatchesList(); }
      else if (page === 'chat') {
        if (state.liked.length > 0) {
          openChat(state.liked[0]);
        } else {
          showPage('chat');
          $('chat-messages').innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-title">No chats yet</div><div class="empty-sub">Match with someone first!</div></div>`;
        }
      }
      else if (page === 'profile') {
        // For now, redirect to swipe
        showPage('swipe');
        renderCardStack();
      }
    });
  });

  // Chat
  $('chat-back-btn')?.addEventListener('click', () => { showPage('matches'); renderMatchesList(); });
  $('chat-send-btn')?.addEventListener('click', sendChatMessage);
  $('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });

  // Check for saved answers
  const saved = localStorage.getItem('rm_answers');
  if (saved) {
    try { state.quiz.answers = JSON.parse(saved); } catch(e) {}
  }

  showPage('landing');
}

function startQuiz() {
  state.quiz.currentSection = 0;
  state.quiz.currentQuestionInSection = 0;
  showPage('quiz');
  renderQuiz();
}

function loadDemoMode() {
  // Generate random-ish answers for demo
  const demoAnswers = {};
  for (const q of QUESTIONS) {
    if (q.type === 'scenario_choice') {
      demoAnswers[q.id] = q.options[Math.floor(Math.random() * q.options.length)].value;
    } else if (q.type === 'slider') {
      demoAnswers[q.id] = q.default;
    } else if (q.type === 'mcq_multi') {
      demoAnswers[q.id] = q.options.slice(0, 2).map(o => o.value);
    }
  }
  state.quiz.answers = demoAnswers;
  finishQuiz();
}

init();
