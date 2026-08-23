/* ============================================================
   Player-Side Game Logic
   Game Numerasi Ranking 1
   ============================================================ */

const PlayController = {
  // DOM elements
  sections: {},
  hasAnswered: false,
  timerInterval: null,
  timeRemaining: 0,

  // --- Initialize ---
  init() {
    this.sections = {
      join: document.getElementById('join-section'),
      lobby: document.getElementById('lobby-section'),
      battle: document.getElementById('battle-section'),
      waiting: document.getElementById('waiting-state'),
      question: document.getElementById('question-state')
    };

    // Setup color picker
    this.setupColorPicker();

    // Check for reconnection
    this.checkReconnect();

    // Setup game engine callbacks
    GameEngine.onPlayersUpdate = (players) => this.updatePlayersUI(players);
    GameEngine.onGameStart = () => this.onGameStart();
    GameEngine.onNextQuestion = (question, index) => this.showQuestion(question, index);
    GameEngine.onGameEnd = () => this.onGameEnd();
    GameEngine.onStatusChange = (newStatus, oldStatus) => this.onStatusChange(newStatus, oldStatus);
  },

  // --- Setup Color Picker ---
  setupColorPicker() {
    const picker = document.getElementById('color-picker');
    if (!picker) return;

    AVATAR_COLORS.forEach((color, i) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (i === 0 ? ' selected' : '');
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.addEventListener('click', () => {
        picker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
      });
      picker.appendChild(swatch);
    });
  },

  // --- Check Reconnect (Supabase) ---
  async checkReconnect() {
    const saved = loadLocal('player');
    if (saved && saved.sessionId) {
      try {
        const session = await SupabaseDB.getSessionById(saved.sessionId);

        if (session && (session.status === 'waiting' || session.status === 'playing')) {
          GameEngine.sessionId = session.id;
          GameEngine.gameCode = session.game_code;
          GameEngine.playerId = saved.id;
          GameEngine.playerName = saved.name;
          GameEngine.playerColor = saved.color;
          GameEngine.status = session.status;

          await GameEngine.loadQuestions(session.question_ids);
          GameEngine.subscribeToSession();
          GameEngine.subscribeToPlayers();
          GameEngine.startPlayerPolling();
          await GameEngine.refreshPlayers();

          if (session.status === 'waiting') {
            this.showSection('lobby');
            this.updateLobbyUI(session.game_code);
          } else if (session.status === 'playing') {
            this.showSection('battle');
            GameEngine.currentQuestionIndex = session.current_question_index;
            const currentQ = GameEngine.getCurrentQuestion();
            if (currentQ) {
              this.showQuestion(currentQ, session.current_question_index);
            }
          }
          return;
        }
      } catch (e) {
        // Session expired, clear saved data
        removeLocal('player');
      }
    }
  },

  // --- Join Game ---
  async joinGame() {
    const codeInput = document.getElementById('game-code-input');
    const nameInput = document.getElementById('player-name-input');
    const joinBtn = document.getElementById('join-btn');

    const code = codeInput.value.trim();
    const name = nameInput.value.trim();
    const colorSwatch = document.querySelector('.color-swatch.selected');
    const color = colorSwatch ? colorSwatch.dataset.color : getRandomColor();

    if (!code || code.length < 6) {
      showToast('Masukkan kode game 6 digit!', 'error');
      codeInput.focus();
      return;
    }

    if (!name || name.length < 2) {
      showToast('Masukkan nama minimal 2 karakter!', 'error');
      nameInput.focus();
      return;
    }

    // Disable button
    joinBtn.disabled = true;
    joinBtn.innerHTML = '<span class="spinner spinner-sm"></span> Bergabung...';

    const result = await GameEngine.joinGame(code, name, color);

    if (result) {
      this.showSection('lobby');
      this.updateLobbyUI(code);
      await GameEngine.refreshPlayers();
    }

    joinBtn.disabled = false;
    joinBtn.innerHTML = '🚀 GABUNG SEKARANG';
  },

  // --- Show Section ---
  showSection(name) {
    Object.values(this.sections).forEach(s => {
      if (s) s.classList.remove('active');
    });
    if (this.sections[name]) {
      this.sections[name].classList.add('active');
    }
  },

  // --- Update Lobby UI ---
  updateLobbyUI(gameCode) {
    const pinEl = document.getElementById('lobby-pin');
    if (pinEl) pinEl.textContent = gameCode;
  },

  // --- Update Players UI ---
  updatePlayersUI(players) {
    // Lobby players grid
    const grid = document.getElementById('players-grid');
    if (grid) {
      grid.innerHTML = players.map((p, i) => `
        <div class="player-card" style="animation-delay:${i * 0.05}s">
          <div class="player-avatar" style="background:${p.avatar_color || getRandomColor()}">
            ${getInitial(p.name)}
          </div>
          <div class="player-name">${escapeHtml(p.name)}</div>
        </div>
      `).join('');
    }

    // Player count
    const countEl = document.getElementById('player-count');
    if (countEl) countEl.textContent = players.length;

    // Battle sidebar ranking
    this.updateRankingUI(players);
  },

  // --- Update Ranking Sidebar ---
  updateRankingUI(players) {
    const list = document.getElementById('ranking-list');
    if (!list) return;

    const sorted = [...players].sort((a, b) => b.score - a.score);

    list.innerHTML = sorted.map((p, i) => {
      const rankClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
      const isMe = p.id === GameEngine.playerId ? 'is-me' : '';
      return `
        <div class="ranking-item ${rankClass} ${isMe}">
          <div class="ranking-position">${i + 1}</div>
          <div class="ranking-avatar-sm" style="background:${p.avatar_color || '#6C63FF'}">
            ${getInitial(p.name)}
          </div>
          <div class="ranking-info">
            <div class="ranking-name">${escapeHtml(p.name)}${isMe ? ' (Kamu)' : ''}</div>
          </div>
          <div class="ranking-score">${p.score}</div>
        </div>
      `;
    }).join('');
  },

  // --- Game Started ---
  onGameStart() {
    playSound('victory');
    this.showSection('battle');
    const q = GameEngine.getCurrentQuestion();
    if (q) {
      this.showQuestion(q, 0);
    }
  },

  // --- Show Question ---
  async showQuestion(question, index) {
    if (!question) return;

    this.hasAnswered = false;

    // Show question state, hide waiting
    const waitingState = document.getElementById('waiting-state');
    const questionState = document.getElementById('question-state');
    if (waitingState) waitingState.style.display = 'none';
    if (questionState) questionState.style.display = 'flex';

    // Update question counter
    const counter = document.getElementById('question-counter');
    if (counter) counter.innerHTML = `Soal <span>${index + 1}</span> dari <span>${GameEngine.questions.length}</span>`;

    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.width = `${((index + 1) / GameEngine.questions.length) * 100}%`;
    }

    // Update category badge
    const categoryEl = document.getElementById('question-category');
    if (categoryEl) {
      const categoryLabels = {
        'penjumlahan': '➕ Penjumlahan',
        'pengurangan': '➖ Pengurangan',
        'perkalian': '✖️ Perkalian',
        'pembagian': '➗ Pembagian',
        'campuran': '🔢 Campuran',
        'cerita': '📖 Soal Cerita'
      };
      categoryEl.textContent = categoryLabels[question.category] || question.category;
    }

    // Update question text
    const questionText = document.getElementById('question-text');
    if (questionText) {
      questionText.innerHTML = escapeHtml(question.question_text);
    }

    // Toggle essay vs multiple choice
    var essayArea = document.getElementById('essay-answer-area');
    var optionsGrid = document.getElementById('options-grid');

    if (question.question_type === 'essay') {
      // Essay mode
      if (optionsGrid) optionsGrid.style.display = 'none';
      if (essayArea) {
        essayArea.style.display = 'block';
        document.getElementById('essay-input').value = '';
        document.getElementById('essay-input').disabled = false;
        document.getElementById('btn-submit-essay').disabled = false;
        document.getElementById('btn-submit-essay').innerHTML = '📤 Kirim Jawaban';
        document.getElementById('btn-submit-essay').style.background = '';
      }
    } else {
      // Multiple choice mode
      if (essayArea) essayArea.style.display = 'none';
      if (optionsGrid) {
        optionsGrid.style.display = 'grid';
        var labels = ['A', 'B', 'C', 'D'];
        var options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;

        optionsGrid.innerHTML = options.map(function(opt, i) {
          return '<button class="option-btn" data-answer="' + escapeHtml(opt) + '" onclick="PlayController.selectAnswer(\'' + escapeHtml(opt).replace(/'/g, "\\'") + '\', this)">' +
            '<span class="option-label">' + labels[i] + '</span>' +
            '<span>' + escapeHtml(opt) + '</span>' +
          '</button>';
        }).join('');
      }
    }

    // --- CHECK: Already answered this question? ---
    var alreadyAnswered = await this.checkAlreadyAnswered(question.id);
    if (alreadyAnswered) {
      this.hasAnswered = true;
      this.stopTimer();
      this.showAlreadyAnsweredUI(question);
      return;
    }

    // --- TIMER: Calculate remaining time from server timestamp ---
    var timeLimit = question.time_limit || 30;
    var remainingTime = timeLimit;

    try {
      var session = await SupabaseDB.getSessionById(GameEngine.sessionId);
      if (session && session.question_started_at) {
        var serverStart = new Date(session.question_started_at).getTime();
        var elapsed = (Date.now() - serverStart) / 1000;
        remainingTime = Math.max(0, Math.floor(timeLimit - elapsed));
      }
    } catch (e) {
      // Fallback to full time
    }

    if (remainingTime <= 0) {
      // Time already expired
      this.hasAnswered = true;
      this.showFeedback('⏰', 'Waktu sudah habis!');
      this.disableAllInputs(question);
      return;
    }

    // Start timer with calculated remaining time
    this.startTimer(remainingTime, timeLimit);

    // Record start time (for timeTaken calculation)
    GameEngine.questionStartTime = Date.now() - ((timeLimit - remainingTime) * 1000);

    // Animate entrance
    if (questionState) {
      questionState.style.animation = 'none';
      requestAnimationFrame(() => {
        questionState.style.animation = 'fade-in-scale 0.4s ease';
      });
    }
  },

  // --- Check if player already answered this question ---
  async checkAlreadyAnswered(questionId) {
    if (!GameEngine.playerId || !GameEngine.sessionId) return false;
    try {
      var result = await supabaseClient.from('answers')
        .select('id')
        .eq('session_id', GameEngine.sessionId)
        .eq('player_id', GameEngine.playerId)
        .eq('question_id', questionId);
      return result.data && result.data.length > 0;
    } catch (e) {
      return false;
    }
  },

  // --- Show "Already Answered" UI ---
  showAlreadyAnsweredUI(question) {
    if (question.question_type === 'essay') {
      var essayInput = document.getElementById('essay-input');
      var btn = document.getElementById('btn-submit-essay');
      if (essayInput) { essayInput.value = '(Sudah dijawab)'; essayInput.disabled = true; }
      if (btn) { btn.disabled = true; btn.innerHTML = '✅ Sudah Dijawab'; }
    } else {
      document.querySelectorAll('.option-btn').forEach(function(btn) {
        btn.classList.add('disabled');
      });
    }
    this.showFeedback('✅', 'Kamu sudah menjawab soal ini');
  },

  // --- Disable all inputs ---
  disableAllInputs(question) {
    if (question.question_type === 'essay') {
      var essayInput = document.getElementById('essay-input');
      var btn = document.getElementById('btn-submit-essay');
      if (essayInput) essayInput.disabled = true;
      if (btn) { btn.disabled = true; btn.innerHTML = '⏰ Waktu Habis'; }
    } else {
      document.querySelectorAll('.option-btn').forEach(function(btn) {
        btn.classList.add('disabled');
      });
    }
  },

  // --- Submit Essay Answer ---
  async submitEssay() {
    if (this.hasAnswered) return;

    var essayInput = document.getElementById('essay-input');
    var answer = essayInput.value.trim();

    if (!answer) {
      showToast('Tulis jawabanmu dulu!', 'error');
      return;
    }

    this.hasAnswered = true;
    var timeTaken = (Date.now() - GameEngine.questionStartTime) / 1000;
    this.stopTimer();

    // Disable submit button
    var btn = document.getElementById('btn-submit-essay');
    btn.disabled = true;
    btn.innerHTML = '⏳ Memeriksa...';
    essayInput.disabled = true;

    // Submit — auto-graded against accepted answers
    var result = await GameEngine.submitAnswer(
      GameEngine.getCurrentQuestion().id,
      answer,
      timeTaken,
      true // isEssay flag
    );

    if (result) {
      if (result.isCorrect) {
        btn.innerHTML = '✅ Benar!';
        btn.style.background = 'var(--accent-green, #00D4AA)';
        playSound('correct');
        this.showFeedback('✅', '+' + result.points + ' pts' + (result.streak >= 3 ? ' 🔥 Streak ' + result.streak + '!' : ''));
      } else {
        btn.innerHTML = '❌ Salah';
        btn.style.background = 'var(--accent-red, #FF6B6B)';
        playSound('wrong');
        this.showFeedback('❌', 'Jawaban belum tepat');
      }
    }

    await GameEngine.refreshPlayers();
  },

  // --- Select Answer (Multiple Choice) ---
  async selectAnswer(answer, btnElement) {
    if (this.hasAnswered) return;
    this.hasAnswered = true;

    // Calculate time taken
    const timeTaken = (Date.now() - GameEngine.questionStartTime) / 1000;

    // Stop timer
    this.stopTimer();

    // Disable all options
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.add('disabled');
    });

    // Submit answer
    const result = await GameEngine.submitAnswer(
      GameEngine.getCurrentQuestion().id,
      answer,
      timeTaken
    );

    if (result) {
      if (result.isCorrect) {
        btnElement.classList.add('correct');
        playSound('correct');
        this.showFeedback('✅', `+${result.points} pts${result.streak >= 3 ? ` 🔥 Streak ${result.streak}!` : ''}`);
      } else {
        btnElement.classList.add('wrong');
        playSound('wrong');
        // Show correct answer
        const correctAnswer = GameEngine.getCurrentQuestion().correct_answer;
        document.querySelectorAll('.option-btn').forEach(btn => {
          if (btn.dataset.answer === correctAnswer) {
            btn.classList.add('correct');
          }
        });
        this.showFeedback('❌', `Jawaban benar: ${correctAnswer}`);
      }
    }

    // Refresh players ranking
    await GameEngine.refreshPlayers();
  },

  // --- Timer ---
  startTimer(seconds, totalSeconds) {
    this.stopTimer();
    this.timeRemaining = seconds;
    var total = totalSeconds || seconds;

    const timerText = document.getElementById('timer-text');
    const timerCircle = document.getElementById('timer-circle');
    const timerProgress = document.getElementById('timer-progress');
    const circumference = 2 * Math.PI * 44; // r=44

    if (timerProgress) {
      timerProgress.style.strokeDasharray = circumference;
      timerProgress.style.strokeDashoffset = 0;
    }

    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 1;

      if (this.timeRemaining <= 5 && timerCircle) {
        timerCircle.classList.add('timer-warning');
        playSound('tick');
      }

      if (timerProgress) {
        const progress = 1 - (this.timeRemaining / total);
        timerProgress.style.strokeDashoffset = circumference * progress;
      }

      this.updateTimerDisplay();

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        if (!this.hasAnswered) {
          this.hasAnswered = true;
          // Auto-submit wrong answer on timeout
          this.showFeedback('⏰', 'Waktu habis!');
          playSound('wrong');
          GameEngine.submitAnswer(
            GameEngine.getCurrentQuestion().id,
            '__TIMEOUT__',
            seconds
          ).then(() => GameEngine.refreshPlayers());
        }
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const timerCircle = document.getElementById('timer-circle');
    if (timerCircle) timerCircle.classList.remove('timer-warning');
  },

  updateTimerDisplay() {
    const timerText = document.getElementById('timer-text');
    if (timerText) timerText.textContent = Math.max(0, this.timeRemaining);
  },

  // --- Show Feedback ---
  showFeedback(icon, message) {
    const feedback = document.getElementById('feedback-overlay');
    if (!feedback) return;

    feedback.innerHTML = `
      <div style="text-align:center;">
        <div class="feedback-icon">${icon}</div>
        <p style="font-size:1.3rem;font-weight:700;margin-top:16px;color:var(--text-primary);">${message}</p>
      </div>
    `;
    feedback.classList.add('active');

    setTimeout(() => {
      feedback.classList.remove('active');
    }, 2000);
  },

  // --- Status Change ---
  onStatusChange(newStatus, oldStatus) {
    if (newStatus === 'paused') {
      this.stopTimer();
      this.showFeedback('⏸️', 'Game dijeda oleh admin');
    }
  },

  // --- Game End ---
  onGameEnd() {
    this.stopTimer();
    playSound('victory');

    // Store session info and redirect to podium
    saveLocal('lastSession', {
      sessionId: GameEngine.sessionId,
      gameCode: GameEngine.gameCode,
      playerId: GameEngine.playerId
    });

    removeLocal('player');

    setTimeout(() => {
      window.location.href = `podium.html?session=${GameEngine.sessionId}`;
    }, 1000);
  }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (initSupabase()) {
    showConfigWarning();
    PlayController.init();
    createParticles(document.body, 20);
  } else {
    showConfigWarning();
  }
});
