/* ============================================================
   Supabase Database API Module
   Game Numerasi Ranking 1
   
   Handles all data operations via Supabase
   (Questions, Sessions, Players, Answers)
   ============================================================ */

const SupabaseDB = {
  // ========================
  // QUESTIONS
  // ========================
  async getQuestions(search, category) {
    let query = supabaseClient.from('questions').select('*').order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('question_text', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getQuestionsByIds(ids) {
    const { data, error } = await supabaseClient
      .from('questions')
      .select('*')
      .in('id', ids);
    if (error) throw error;
    return data || [];
  },

  async addQuestion(questionData) {
    const { data, error } = await supabaseClient
      .from('questions')
      .insert(questionData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuestion(questionData) {
    const id = questionData.id;
    const updateData = { ...questionData };
    delete updateData.id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteQuestion(id) {
    const { error } = await supabaseClient
      .from('questions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // ========================
  // GAME SESSIONS
  // ========================
  async createSession(title, questionIds, createdBy) {
    const gameCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabaseClient
      .from('game_sessions')
      .insert({
        title,
        game_code: gameCode,
        question_ids: questionIds,
        status: 'waiting',
        current_question_index: 0,
        created_by: createdBy
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSession(code) {
    const { data, error } = await supabaseClient
      .from('game_sessions')
      .select('*')
      .eq('game_code', code)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data || null;
  },

  async getSessionById(id) {
    const { data, error } = await supabaseClient
      .from('game_sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getSessions(status) {
    let query = supabaseClient
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateSession(id, updateData) {
    const { data, error } = await supabaseClient
      .from('game_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ========================
  // PLAYERS
  // ========================
  async getPlayers(sessionId) {
    const { data, error } = await supabaseClient
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async joinGame(sessionId, name, avatarColor) {
    const { data, error } = await supabaseClient
      .from('players')
      .insert({
        session_id: sessionId,
        name: name,
        avatar_color: avatarColor,
        score: 0,
        correct_answers: 0,
        wrong_answers: 0,
        streak: 0,
        max_streak: 0
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePlayer(id, updateData) {
    const { data, error } = await supabaseClient
      .from('players')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ========================
  // ANSWERS
  // ========================
  async submitAnswer(sessionId, playerId, questionId, answer, isCorrect, timeTaken, pointsEarned) {
    const { data, error } = await supabaseClient
      .from('answers')
      .insert({
        session_id: sessionId,
        player_id: playerId,
        question_id: questionId,
        answer: answer,
        is_correct: isCorrect,
        time_taken: timeTaken,
        points_earned: pointsEarned
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAnswers(sessionId) {
    const { data, error } = await supabaseClient
      .from('answers')
      .select('*')
      .eq('session_id', sessionId);
    if (error) throw error;
    return data || [];
  },

  // ========================
  // STATS
  // ========================
  async getStats() {
    const [qRes, sRes, pRes] = await Promise.all([
      supabaseClient.from('questions').select('id', { count: 'exact', head: true }),
      supabaseClient.from('game_sessions').select('id', { count: 'exact', head: true }),
      supabaseClient.from('players').select('id', { count: 'exact', head: true })
    ]);

    return {
      questionCount: qRes.count || 0,
      sessionCount: sRes.count || 0,
      playerCount: pRes.count || 0
    };
  },

  // ========================
  // REALTIME SUBSCRIPTIONS
  // ========================
  subscribeToSession(sessionId, callback) {
    return supabaseClient
      .channel(`session-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  subscribeToPlayers(sessionId, callback) {
    return supabaseClient
      .channel(`players-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        callback(payload);
      })
      .subscribe();
  },

  subscribeToAnswers(sessionId, callback) {
    return supabaseClient
      .channel(`answers-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  // Unsubscribe all channels
  unsubscribeAll() {
    supabaseClient.removeAllChannels();
  }
};

// Alias for backward compatibility
const LocalDB = SupabaseDB;

// Always configured
function isSheetsConfigured() {
  return true;
}

console.log('✅ SupabaseDB module loaded');
