/* ============================================================
   Game Engine — Supabase Backend + Realtime
   Game Numerasi Ranking 1
   
   Uses SupabaseDB for data and Supabase Realtime for live updates
   ============================================================ */

const GameEngine = {
  // State
  sessionId: null,
  gameCode: null,
  playerId: null,
  playerName: null,
  playerColor: null,
  currentQuestionIndex: 0,
  questions: [],
  players: [],
  status: 'idle', // idle, waiting, playing, paused, finished
  questionStartTime: null,
  timerInterval: null,
  sessionSubscription: null,
  playersSubscription: null,
  answersSubscription: null,
  playerPollingInterval: null,

  // Callbacks (set by play.js or admin.js)
  onPlayersUpdate: null,
  onGameStart: null,
  onNextQuestion: null,
  onGameEnd: null,
  onAnswerReceived: null,
  onStatusChange: null,

  // --- Create Game Session (Admin) ---
  async createSession(title, questionIds) {
    try {
      const data = await SupabaseDB.createSession(title, questionIds, Auth.getUserId());

      this.sessionId = data.id;
      this.gameCode = data.game_code;
      this.status = 'waiting';

      // Load questions
      await this.loadQuestions(questionIds);

      // Subscribe to realtime updates
      this.subscribeToSession();
      this.subscribeToPlayers();
      this.subscribeToAnswers();

      showToast(`Game dibuat! PIN: ${data.game_code}`, 'success');
      return data;
    } catch (err) {
      showToast(`Gagal membuat game: ${err.message}`, 'error');
      return null;
    }
  },

  // --- Join Game (Player) ---
  async joinGame(gameCode, playerName, playerColor) {
    try {
      // Find game session
      const session = await SupabaseDB.getSession(gameCode);

      if (!session || (session.status !== 'waiting' && session.status !== 'playing')) {
        showToast('Game tidak ditemukan atau sudah selesai!', 'error');
        return null;
      }

      this.sessionId = session.id;
      this.gameCode = gameCode;
      this.status = session.status;

      // Register player
      const player = await SupabaseDB.joinGame(session.id, playerName, playerColor);

      this.playerId = player.id;
      this.playerName = playerName;
      this.playerColor = playerColor;

      // Save to local storage for reconnection
      saveLocal('player', { id: player.id, name: playerName, color: playerColor, sessionId: session.id });

      // Load questions
      await this.loadQuestions(session.question_ids);

      // Subscribe to realtime updates
      this.subscribeToSession();
      this.subscribeToPlayers();

      // Also poll players as backup (realtime might miss some updates)
      this.startPlayerPolling();

      showToast(`Bergabung ke game! 🎮`, 'success');
      return { session, player };
    } catch (err) {
      showToast(`Gagal bergabung: ${err.message}`, 'error');
      return null;
    }
  },

  // --- Load Questions ---
  async loadQuestions(questionIds) {
    if (!questionIds || questionIds.length === 0) return;

    try {
      const data = await SupabaseDB.getQuestionsByIds(questionIds);
      // Maintain order from questionIds
      this.questions = questionIds.map(id => data.find(q => q.id === id)).filter(Boolean);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  },

  // --- Realtime: Subscribe to Session Changes ---
  subscribeToSession() {
    if (!this.sessionId) return;

    this.sessionSubscription = SupabaseDB.subscribeToSession(this.sessionId, (session) => {
      if (!session) return;

      const oldStatus = this.status;
      const oldIndex = this.currentQuestionIndex;

      this.status = session.status;
      this.currentQuestionIndex = session.current_question_index;

      // Status changed
      if (session.status !== oldStatus) {
        if (this.onStatusChange) this.onStatusChange(session.status, oldStatus);

        if (session.status === 'playing' && oldStatus === 'waiting') {
          if (this.onGameStart) this.onGameStart();
        }

        if (session.status === 'finished') {
          if (this.onGameEnd) this.onGameEnd();
          this.cleanup();
        }
      }

      // Question index changed
      if (session.status === 'playing' && session.current_question_index !== oldIndex) {
        if (this.onNextQuestion) {
          this.onNextQuestion(this.questions[session.current_question_index], session.current_question_index);
        }
      }
    });
  },

  // --- Realtime: Subscribe to Players Changes ---
  subscribeToPlayers() {
    if (!this.sessionId) return;

    this.playersSubscription = SupabaseDB.subscribeToPlayers(this.sessionId, async () => {
      // On any player change, refresh the full list
      await this.refreshPlayers();
    });
  },

  // --- Realtime: Subscribe to Answers (Admin) ---
  subscribeToAnswers() {
    if (!this.sessionId) return;

    this.answersSubscription = SupabaseDB.subscribeToAnswers(this.sessionId, (answer) => {
      if (this.onAnswerReceived) this.onAnswerReceived(answer);
    });
  },

  // --- Backup polling for players ---
  startPlayerPolling() {
    if (this.playerPollingInterval) clearInterval(this.playerPollingInterval);
    this.playerPollingInterval = setInterval(async () => {
      await this.refreshPlayers();
    }, 5000); // Every 5s as backup
  },

  // --- Refresh Players List ---
  async refreshPlayers() {
    if (!this.sessionId) return;

    try {
      const data = await SupabaseDB.getPlayers(this.sessionId);
      this.players = data || [];
      if (this.onPlayersUpdate) {
        this.onPlayersUpdate(this.players);
      }
    } catch (err) {
      console.error('Refresh players error:', err);
    }
  },

  // --- Start Game (Admin) ---
  async startGame() {
    if (!this.sessionId) return;

    try {
      await SupabaseDB.updateSession(this.sessionId, {
        status: 'playing',
        current_question_index: 0,
        started_at: new Date().toISOString()
      });
      this.status = 'playing';
      this.currentQuestionIndex = 0;
    } catch (err) {
      showToast(`Gagal memulai game: ${err.message}`, 'error');
    }
  },

  // --- Next Question (Admin) ---
  async nextQuestion() {
    if (!this.sessionId) return;

    const nextIndex = this.currentQuestionIndex + 1;

    if (nextIndex >= this.questions.length) {
      await this.endGame();
      return;
    }

    try {
      await SupabaseDB.updateSession(this.sessionId, {
        current_question_index: nextIndex
      });
      this.currentQuestionIndex = nextIndex;
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- Pause Game (Admin) ---
  async pauseGame() {
    if (!this.sessionId) return;

    const newStatus = this.status === 'paused' ? 'playing' : 'paused';

    try {
      await SupabaseDB.updateSession(this.sessionId, { status: newStatus });
      this.status = newStatus;
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- End Game (Admin) ---
  async endGame() {
    if (!this.sessionId) return;

    try {
      await SupabaseDB.updateSession(this.sessionId, {
        status: 'finished',
        finished_at: new Date().toISOString()
      });
      this.status = 'finished';
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  },

  // --- Submit Answer (Player) ---
  async submitAnswer(questionId, answer, timeTaken) {
    if (!this.playerId) return null;

    const question = this.questions.find(q => q.id === questionId);
    if (!question) return null;

    const isCorrect = answer.toString().trim().toLowerCase() === question.correct_answer.toString().trim().toLowerCase();

    // Get current player data for streak
    const currentPlayer = this.players.find(p => p.id === this.playerId);
    const currentStreak = currentPlayer ? (isCorrect ? currentPlayer.streak + 1 : 0) : (isCorrect ? 1 : 0);
    const maxStreak = currentPlayer ? Math.max(currentPlayer.max_streak, currentStreak) : currentStreak;

    const points = calculatePoints(question.points || 10, question.time_limit || 30, timeTaken, isCorrect, currentStreak);

    try {
      // Submit answer
      await SupabaseDB.submitAnswer(
        this.sessionId, this.playerId, questionId,
        answer.toString(), isCorrect, timeTaken, points
      );

      // Update player stats
      const updates = {
        score: (currentPlayer?.score || 0) + points,
        streak: currentStreak,
        max_streak: maxStreak
      };

      if (isCorrect) {
        updates.correct_answers = (currentPlayer?.correct_answers || 0) + 1;
      } else {
        updates.wrong_answers = (currentPlayer?.wrong_answers || 0) + 1;
      }

      await SupabaseDB.updatePlayer(this.playerId, updates);

      return { isCorrect, points, streak: currentStreak };
    } catch (err) {
      console.error('Failed to submit answer:', err);
      return null;
    }
  },

  // --- Get Current Question ---
  getCurrentQuestion() {
    if (this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  },

  // --- Get Results ---
  async getResults() {
    if (!this.sessionId) return null;

    try {
      const players = await SupabaseDB.getPlayers(this.sessionId);
      const session = await SupabaseDB.getSession(this.gameCode);
      return { players: players || [], session };
    } catch (err) {
      console.error('Get results error:', err);
      return null;
    }
  },

  // --- Get Answer Stats for a Question ---
  async getQuestionStats(questionId) {
    if (!this.sessionId) return null;

    try {
      const answers = await SupabaseDB.getAnswers(this.sessionId);
      const qAnswers = answers.filter(a => a.question_id === questionId);

      const total = qAnswers.length;
      const correct = qAnswers.filter(a => a.is_correct).length;
      const avgTime = qAnswers.reduce((sum, a) => sum + (a.time_taken || 0), 0) / (total || 1);

      return { total, correct, wrong: total - correct, avgTime };
    } catch (err) {
      return null;
    }
  },

  // --- Cleanup ---
  cleanup() {
    // Unsubscribe realtime
    SupabaseDB.unsubscribeAll();
    this.sessionSubscription = null;
    this.playersSubscription = null;
    this.answersSubscription = null;

    // Stop polling
    if (this.playerPollingInterval) {
      clearInterval(this.playerPollingInterval);
      this.playerPollingInterval = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
};
