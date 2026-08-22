/* ============================================================
   Google Sheets API Module
   Game Numerasi Ranking 1
   
   Handles all communication with Google Sheets 
   via Google Apps Script Web App
   ============================================================ */

const SheetsAPI = {
  // Base URL for Google Apps Script Web App
  get baseUrl() {
    return APPS_SCRIPT_URL;
  },

  // --- Generic GET request ---
  async get(params) {
    const url = new URL(this.baseUrl);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      const response = await fetch(url.toString());
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Request failed');
      return result.data;
    } catch (err) {
      console.error('SheetsAPI GET error:', err);
      throw err;
    }
  },

  // --- Generic POST request ---
  async post(body) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Request failed');
      return result.data;
    } catch (err) {
      console.error('SheetsAPI POST error:', err);
      throw err;
    }
  },

  // ========================
  // QUESTIONS
  // ========================
  
  async getQuestions(search, category) {
    return this.get({ action: 'getQuestions', search, category });
  },

  async getQuestionsByIds(ids) {
    return this.get({ action: 'getQuestions', ids: ids.join(',') });
  },

  async addQuestion(data) {
    return this.post({ action: 'addQuestion', ...data });
  },

  async updateQuestion(data) {
    return this.post({ action: 'updateQuestion', ...data });
  },

  async deleteQuestion(id) {
    return this.post({ action: 'deleteQuestion', id });
  },

  // ========================
  // GAME SESSIONS
  // ========================

  async createSession(title, questionIds, createdBy) {
    return this.post({ action: 'createSession', title, question_ids: questionIds, created_by: createdBy });
  },

  async getSession(code) {
    return this.get({ action: 'getSession', code });
  },

  async getSessions(status) {
    return this.get({ action: 'getSessions', status });
  },

  async updateSession(id, data) {
    return this.post({ action: 'updateSession', id, ...data });
  },

  // ========================
  // PLAYERS
  // ========================

  async getPlayers(sessionId) {
    return this.get({ action: 'getPlayers', sessionId });
  },

  async joinGame(sessionId, name, avatarColor) {
    return this.post({ action: 'joinGame', session_id: sessionId, name, avatar_color: avatarColor });
  },

  async updatePlayer(id, data) {
    return this.post({ action: 'updatePlayer', id, ...data });
  },

  // ========================
  // ANSWERS
  // ========================

  async submitAnswer(sessionId, playerId, questionId, answer, isCorrect, timeTaken, pointsEarned) {
    return this.post({
      action: 'submitAnswer',
      session_id: sessionId,
      player_id: playerId,
      question_id: questionId,
      answer, is_correct: isCorrect,
      time_taken: timeTaken,
      points_earned: pointsEarned
    });
  },

  async getAnswers(sessionId) {
    return this.get({ action: 'getAnswers', sessionId });
  },

  // ========================
  // STATS
  // ========================

  async getStats() {
    return this.get({ action: 'getStats' });
  },

  // ========================
  // INIT (create sheets if needed)
  // ========================

  async initSheets() {
    return this.get({ action: 'init' });
  }
};

// Check if Sheets API is configured
function isSheetsConfigured() {
  return typeof APPS_SCRIPT_URL !== 'undefined' 
    && APPS_SCRIPT_URL !== '' 
    && APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE';
}
