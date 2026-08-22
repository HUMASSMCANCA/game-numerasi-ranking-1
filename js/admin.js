/* ============================================================
   Admin Panel Controller
   Game Numerasi Ranking 1
   
   Auth: Supabase | Data: Supabase (SupabaseDB)
   ============================================================ */

const AdminController = {
  currentSection: 'dashboard',
  editingQuestionId: null,
  activeGameSession: null,

  // --- Initialize ---
  async init() {
    // Check auth (Supabase)
    await Auth.init();

    if (!Auth.isLoggedIn()) {
      this.showLogin();
      return;
    }

    this.showDashboard();
    this.loadDashboardStats();
    this.loadQuestions();

    // Setup nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => {
        this.switchSection(item.dataset.section);
      });
    });

    // Game engine callbacks for admin
    GameEngine.onPlayersUpdate = (players) => this.updateMonitorPlayers(players);
    GameEngine.onAnswerReceived = (answer) => this.onAnswerReceived(answer);
  },

  // --- Show Login ---
  showLogin() {
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
  },

  // --- Show Dashboard ---
  showDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';

    const nameEl = document.getElementById('admin-name');
    if (nameEl) nameEl.textContent = Auth.getUserName();
  },

  // --- Login (Supabase Auth) ---
  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showToast('Masukkan email dan password!', 'error');
      return;
    }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Masuk...';

    const result = await Auth.login(email, password);

    if (!result.error) {
      this.showDashboard();
      this.loadDashboardStats();
      this.loadQuestions();
    }

    btn.disabled = false;
    btn.innerHTML = '🔐 MASUK';
  },

  // --- Register (Supabase Auth) ---
  async handleRegister() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const name = prompt('Masukkan nama Anda:');

    if (!email || !password || !name) {
      showToast('Semua field harus diisi!', 'error');
      return;
    }

    const result = await Auth.register(email, password, name);
    if (!result.error) {
      showToast('Registrasi berhasil! Silakan login.', 'success');
    }
  },

  // --- Logout ---
  async handleLogout() {
    await Auth.logout();
    this.showLogin();
  },

  // --- Switch Section ---
  switchSection(section) {
    this.currentSection = section;

    // Update nav
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    document.querySelectorAll('.admin-section').forEach(s => {
      s.classList.toggle('active', s.id === `section-${section}`);
    });

    // Update topbar title
    const titles = {
      'dashboard': '📊 Dashboard',
      'questions': '📝 Kelola Soal',
      'game': '🎮 Kelola Game',
      'results': '📈 Hasil & Export'
    };
    document.getElementById('topbar-title').textContent = titles[section] || section;

    // Close mobile sidebar
    document.getElementById('admin-sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');

    // Load data for section
    if (section === 'dashboard') this.loadDashboardStats();
    if (section === 'questions') this.loadQuestions();
    if (section === 'results') this.loadResults();
  },

  // ========================
  // DASHBOARD (Supabase)
  // ========================
  async loadDashboardStats() {
    try {
      const stats = await SupabaseDB.getStats();
      document.getElementById('stat-questions').textContent = stats.questionCount || 0;
      document.getElementById('stat-sessions').textContent = stats.sessionCount || 0;
      document.getElementById('stat-players').textContent = stats.playerCount || 0;

      // Recent games
      const sessions = await SupabaseDB.getSessions();
      const recentList = document.getElementById('recent-games');
      if (recentList && sessions) {
        const recent = sessions.slice(0, 5);
        if (recent.length === 0) {
          recentList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Belum ada game</p>';
        } else {
          recentList.innerHTML = recent.map(s => `
            <div class="monitor-player">
              <span class="badge badge-${s.status === 'finished' ? 'success' : s.status === 'playing' ? 'primary' : 'info'}">${s.status}</span>
              <span style="flex:1;font-weight:500;">${escapeHtml(s.title)}</span>
              <span style="color:var(--text-muted);font-size:0.85rem;">${s.game_code}</span>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Dashboard stats error:', err);
    }
  },

  // ========================
  // QUESTIONS CRUD (Supabase)
  // ========================
  async loadQuestions(search = '', category = '') {
    try {
      const data = await SupabaseDB.getQuestions(search || undefined, category || undefined);
      this.renderQuestionsList(data || []);
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  renderQuestionsList(questions) {
    const tbody = document.getElementById('questions-tbody');
    if (!tbody) return;

    if (questions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
            Belum ada soal. Klik "Tambah Soal" untuk memulai.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = questions.map(q => {
      const categoryLabels = {
        'penjumlahan': '➕ Penjumlahan',
        'pengurangan': '➖ Pengurangan',
        'perkalian': '✖️ Perkalian',
        'pembagian': '➗ Pembagian',
        'campuran': '🔢 Campuran',
        'cerita': '📖 Cerita'
      };
      const difficultyStars = '⭐'.repeat(q.difficulty || 1);

      return `
        <tr>
          <td style="max-width:300px;">
            <div style="font-weight:600;">${escapeHtml(q.question_text)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
              Jawaban: <span style="color:var(--accent-green);font-weight:600;">${escapeHtml(q.correct_answer)}</span>
            </div>
          </td>
          <td><span class="badge badge-primary">${categoryLabels[q.category] || q.category}</span></td>
          <td>${difficultyStars}</td>
          <td><span class="badge badge-gold">${q.points || 10} pts</span></td>
          <td>${q.time_limit || 30}s</td>
          <td>
            <div class="flex gap-sm">
              <button class="btn btn-ghost btn-icon" onclick="AdminController.editQuestion('${q.id}')" title="Edit">✏️</button>
              <button class="btn btn-ghost btn-icon" onclick="AdminController.deleteQuestion('${q.id}')" title="Hapus">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // --- Open Add/Edit Question Modal ---
  openQuestionModal(question = null) {
    this.editingQuestionId = question ? question.id : null;

    const modal = document.getElementById('question-modal');
    const title = document.getElementById('modal-title');

    title.textContent = question ? 'Edit Soal' : 'Tambah Soal Baru';

    // Fill form
    document.getElementById('q-text').value = question?.question_text || '';
    document.getElementById('q-category').value = question?.category || 'penjumlahan';
    document.getElementById('q-difficulty').value = question?.difficulty || 1;
    document.getElementById('q-points').value = question?.points || 10;
    document.getElementById('q-time').value = question?.time_limit || 30;

    // Fill options
    const options = question?.options || ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById(`q-option-${i}`);
      if (input) input.value = options[i] || '';
    }

    // Set correct answer radio
    const correctAnswer = question?.correct_answer || '';
    document.querySelectorAll('input[name="correct-answer"]').forEach((radio, i) => {
      radio.checked = options[i] === correctAnswer;
    });

    modal.classList.add('active');
  },

  closeQuestionModal() {
    document.getElementById('question-modal').classList.remove('active');
    this.editingQuestionId = null;
  },

  // --- Save Question (Supabase) ---
  async saveQuestion() {
    const text = document.getElementById('q-text').value.trim();
    const category = document.getElementById('q-category').value;
    const difficulty = parseInt(document.getElementById('q-difficulty').value);
    const points = parseInt(document.getElementById('q-points').value);
    const timeLimit = parseInt(document.getElementById('q-time').value);

    // Collect options
    const options = [];
    for (let i = 0; i < 4; i++) {
      const val = document.getElementById(`q-option-${i}`).value.trim();
      if (val) options.push(val);
    }

    // Get correct answer
    const correctRadio = document.querySelector('input[name="correct-answer"]:checked');
    let correctAnswer = '';
    if (correctRadio) {
      const idx = parseInt(correctRadio.value);
      correctAnswer = options[idx] || '';
    }

    // Validation
    if (!text) { showToast('Masukkan teks soal!', 'error'); return; }
    if (options.length < 2) { showToast('Minimal 2 opsi jawaban!', 'error'); return; }
    if (!correctAnswer) { showToast('Pilih jawaban yang benar!', 'error'); return; }

    const questionData = {
      question_text: text,
      question_type: 'multiple_choice',
      category,
      difficulty,
      options,
      correct_answer: correctAnswer,
      points,
      time_limit: timeLimit,
      created_by: Auth.getUserId()
    };

    try {
      if (this.editingQuestionId) {
        questionData.id = this.editingQuestionId;
        await SupabaseDB.updateQuestion(questionData);
        showToast('Soal berhasil diupdate! ✅', 'success');
      } else {
        await SupabaseDB.addQuestion(questionData);
        showToast('Soal berhasil ditambahkan! ✅', 'success');
      }

      this.closeQuestionModal();
      this.loadQuestions();
      this.loadDashboardStats();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- Edit Question ---
  async editQuestion(id) {
    try {
      const questions = await SupabaseDB.getQuestions();
      const q = questions.find(q => q.id === id);
      if (q) this.openQuestionModal(q);
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- Delete Question ---
  async deleteQuestion(id) {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;

    try {
      await SupabaseDB.deleteQuestion(id);
      showToast('Soal berhasil dihapus!', 'success');
      this.loadQuestions();
      this.loadDashboardStats();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- Search & Filter Questions ---
  searchQuestions: debounce(function () {
    const search = document.getElementById('search-questions')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    AdminController.loadQuestions(search, category);
  }, 300),

  // ========================
  // GAME MANAGEMENT
  // ========================

  // --- Create New Game ---
  async createGame() {
    const title = document.getElementById('game-title').value.trim();
    if (!title) {
      showToast('Masukkan judul game!', 'error');
      return;
    }

    // Get selected questions
    const checkboxes = document.querySelectorAll('.question-select:checked');
    const questionIds = Array.from(checkboxes).map(cb => cb.value);

    if (questionIds.length === 0) {
      showToast('Pilih minimal 1 soal untuk game!', 'error');
      return;
    }

    const session = await GameEngine.createSession(title, questionIds);
    if (session) {
      this.activeGameSession = session;
      this.showGameControl(session);
    }
  },

  // --- Load Questions for Selection ---
  async loadQuestionsForSelection() {
    try {
      const data = await SupabaseDB.getQuestions();
      const container = document.getElementById('question-selection');
      if (!container || !data) return;

      container.innerHTML = data.map(q => `
        <label class="flex gap-sm" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;align-items:center;">
          <input type="checkbox" class="question-select" value="${q.id}" style="width:20px;height:20px;accent-color:var(--primary);">
          <span style="flex:1;font-weight:500;">${escapeHtml(q.question_text)}</span>
          <span class="badge badge-primary" style="font-size:0.75rem;">${q.category}</span>
        </label>
      `).join('');

      // Select all button
      const selectAll = document.getElementById('select-all-questions');
      if (selectAll) {
        selectAll.onclick = () => {
          const cbs = container.querySelectorAll('.question-select');
          const allChecked = Array.from(cbs).every(cb => cb.checked);
          cbs.forEach(cb => cb.checked = !allChecked);
        };
      }
    } catch (err) {
      console.error('Load questions for selection error:', err);
    }
  },

  // --- Show Game Control ---
  showGameControl(session) {
    document.getElementById('game-setup').style.display = 'none';
    document.getElementById('game-live').style.display = 'block';

    document.getElementById('live-game-pin').textContent = session.game_code;
    document.getElementById('live-game-title').textContent = session.title;
    document.getElementById('live-question-count').textContent = GameEngine.questions.length;
  },

  // --- Game Control Actions ---
  async startGame() {
    await GameEngine.startGame();
    showToast('Game dimulai! 🎮', 'success');
    document.getElementById('btn-start-game').disabled = true;
    document.getElementById('btn-next-question').disabled = false;
    document.getElementById('btn-pause-game').disabled = false;
    this.updateCurrentQuestion();
  },

  async nextQuestion() {
    await GameEngine.nextQuestion();
    this.updateCurrentQuestion();
  },

  async pauseGame() {
    await GameEngine.pauseGame();
    const btn = document.getElementById('btn-pause-game');
    btn.textContent = GameEngine.status === 'paused' ? '▶️ Lanjutkan' : '⏸️ Jeda';
  },

  async endGame() {
    if (!confirm('Yakin ingin mengakhiri game?')) return;
    await GameEngine.endGame();
    showToast('Game selesai!', 'success');
  },

  async showPodium() {
    window.open(`podium.html?session=${GameEngine.sessionId}`, '_blank');
  },

  updateCurrentQuestion() {
    const el = document.getElementById('live-current-question');
    const q = GameEngine.getCurrentQuestion();
    if (el && q) {
      el.innerHTML = `
        <div style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Soal ${GameEngine.currentQuestionIndex + 1}/${GameEngine.questions.length}</div>
        <div style="color:var(--text-secondary);">${escapeHtml(q.question_text)}</div>
        <div style="margin-top:8px;color:var(--accent-green);font-weight:600;">Jawaban: ${escapeHtml(q.correct_answer)}</div>
      `;
    }
  },

  // --- Monitor Players ---
  updateMonitorPlayers(players) {
    const container = document.getElementById('monitor-players');
    const countEl = document.getElementById('live-player-count');

    if (countEl) countEl.textContent = players.length;

    if (container) {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      container.innerHTML = sorted.map((p, i) => `
        <div class="monitor-player">
          <span style="width:24px;font-weight:700;color:${i < 3 ? 'var(--accent-gold)' : 'var(--text-muted)'}">${i + 1}</span>
          <div class="ranking-avatar-sm" style="background:${p.avatar_color || '#6C63FF'}">${getInitial(p.name)}</div>
          <span style="flex:1;font-weight:500;">${escapeHtml(p.name)}</span>
          <span style="font-family:var(--font-mono);font-weight:700;color:var(--primary-light);">${p.score}</span>
        </div>
      `).join('');
    }
  },

  onAnswerReceived(answer) {
    const el = document.getElementById('live-answer-count');
    if (el) {
      const current = parseInt(el.textContent) || 0;
      el.textContent = current + 1;
    }
  },

  // ========================
  // RESULTS & EXPORT (Supabase)
  // ========================
  async loadResults() {
    try {
      const sessions = await SupabaseDB.getSessions('finished');
      const container = document.getElementById('results-list');
      if (!container) return;

      if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada game yang selesai.</p>';
        return;
      }

      container.innerHTML = sessions.map(s => `
        <div class="card" style="margin-bottom:12px;">
          <div class="flex-between">
            <div>
              <h4>${escapeHtml(s.title)}</h4>
              <p style="font-size:0.85rem;">Kode: ${s.game_code} · ${formatDate(s.finished_at || s.created_at)}</p>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-ghost" onclick="AdminController.viewResult('${s.id}', '${escapeHtml(s.title)}', '${s.game_code}')">👁️ Lihat</button>
              <button class="btn btn-secondary" onclick="AdminController.exportResult('${s.id}', '${escapeHtml(s.title)}', '${s.game_code}', 'csv')">📄 CSV</button>
              <button class="btn btn-primary" onclick="AdminController.exportResult('${s.id}', '${escapeHtml(s.title)}', '${s.game_code}', 'pdf')">📊 PDF</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Load results error:', err);
    }
  },

  async viewResult(sessionId, title, gameCode) {
    window.open(`podium.html?session=${sessionId}`, '_blank');
  },

  async exportResult(sessionId, title, gameCode, format) {
    try {
      const players = await SupabaseDB.getPlayers(sessionId);

      if (!players || players.length === 0) {
        showToast('Tidak ada data pemain!', 'error');
        return;
      }

      if (typeof ExportModule !== 'undefined') {
        if (format === 'csv') {
          ExportModule.exportCSV(players, title, gameCode);
        } else {
          ExportModule.exportPDF(players, title, gameCode);
        }
      } else {
        showToast('Export module tidak tersedia', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (initSupabase()) {
    showConfigWarning();
    AdminController.init();
  } else {
    showConfigWarning();
  }
});
