-- ============================================================
-- RESET LENGKAP DATABASE
-- Game Numerasi Ranking 1
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- HAPUS semua tabel lama (urutan penting karena foreign key)
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 1. Tabel Questions (TANPA foreign key ke admins)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  category TEXT NOT NULL DEFAULT 'campuran',
  difficulty INTEGER DEFAULT 1,
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 30,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Game Sessions (TANPA foreign key ke admins)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  current_question_index INTEGER DEFAULT 0,
  question_ids UUID[] NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- 3. Tabel Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken REAL,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_players_score ON players(session_id, score DESC);
CREATE INDEX idx_answers_session ON answers(session_id);
CREATE INDEX idx_answers_player ON answers(player_id);
CREATE INDEX idx_game_sessions_code ON game_sessions(game_code);
CREATE INDEX idx_questions_category ON questions(category);

-- RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Questions: semua bisa baca, authenticated bisa tulis
CREATE POLICY "q_select" ON questions FOR SELECT USING (true);
CREATE POLICY "q_insert" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "q_update" ON questions FOR UPDATE USING (true);
CREATE POLICY "q_delete" ON questions FOR DELETE USING (true);

-- Sessions: semua bisa baca, authenticated bisa tulis
CREATE POLICY "s_select" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "s_insert" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "s_update" ON game_sessions FOR UPDATE USING (true);

-- Players: semua bisa baca & tulis
CREATE POLICY "p_select" ON players FOR SELECT USING (true);
CREATE POLICY "p_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "p_update" ON players FOR UPDATE USING (true);

-- Answers: semua bisa baca & tulis
CREATE POLICY "a_select" ON answers FOR SELECT USING (true);
CREATE POLICY "a_insert" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "a_update" ON answers FOR UPDATE USING (true);

-- REALTIME
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE players; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE answers; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SAMPLE DATA (12 soal)
INSERT INTO questions (question_text, question_type, category, difficulty, options, correct_answer, points, time_limit) VALUES
  ('Berapa hasil dari 125 + 378?', 'multiple_choice', 'penjumlahan', 1, '["503", "493", "513", "483"]', '503', 10, 30),
  ('Berapa hasil dari 1.256 + 3.744?', 'multiple_choice', 'penjumlahan', 2, '["5.000", "4.900", "5.100", "4.800"]', '5.000', 15, 30),
  ('Berapa hasil dari 850 - 376?', 'multiple_choice', 'pengurangan', 1, '["474", "484", "464", "494"]', '474', 10, 30),
  ('Berapa hasil dari 5.000 - 2.187?', 'multiple_choice', 'pengurangan', 2, '["2.813", "2.713", "2.913", "2.887"]', '2.813', 15, 30),
  ('Berapa hasil dari 25 × 16?', 'multiple_choice', 'perkalian', 2, '["400", "350", "375", "425"]', '400', 15, 30),
  ('Berapa hasil dari 48 × 25?', 'multiple_choice', 'perkalian', 2, '["1.100", "1.200", "1.150", "1.250"]', '1.200', 15, 25),
  ('Berapa hasil dari 144 ÷ 12?', 'multiple_choice', 'pembagian', 1, '["12", "14", "11", "13"]', '12', 10, 30),
  ('Berapa hasil dari 2.450 ÷ 50?', 'multiple_choice', 'pembagian', 2, '["49", "48", "50", "47"]', '49', 15, 25),
  ('Berapa hasil dari (15 × 8) + (120 ÷ 6)?', 'multiple_choice', 'campuran', 3, '["140", "130", "150", "160"]', '140', 20, 35),
  ('Sebuah toko menjual 48 kotak berisi masing-masing 25 pensil. Berapa total pensil?', 'multiple_choice', 'cerita', 3, '["1.200", "1.100", "1.250", "1.150"]', '1.200', 20, 45),
  ('Jika luas persegi panjang 360 cm² dan panjangnya 24 cm, berapa lebarnya?', 'multiple_choice', 'cerita', 3, '["15 cm", "12 cm", "18 cm", "14 cm"]', '15 cm', 20, 40),
  ('Berapa nilai dari 3² + 4² ?', 'multiple_choice', 'campuran', 2, '["25", "24", "7", "12"]', '25', 15, 25);
