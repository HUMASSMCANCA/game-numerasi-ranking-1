-- ============================================================
-- FIX: Drop existing policies then recreate
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Drop semua policy yang sudah ada
DROP POLICY IF EXISTS "Admins can view own profile" ON admins;
DROP POLICY IF EXISTS "Admins can insert own profile" ON admins;
DROP POLICY IF EXISTS "Anyone can read questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can manage questions" ON questions;
DROP POLICY IF EXISTS "Anyone can read game sessions" ON game_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON game_sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON game_sessions;
DROP POLICY IF EXISTS "Anyone can read players" ON players;
DROP POLICY IF EXISTS "Anyone can insert players" ON players;
DROP POLICY IF EXISTS "Anyone can update players" ON players;
DROP POLICY IF EXISTS "Anyone can read answers" ON answers;
DROP POLICY IF EXISTS "Anyone can insert answers" ON answers;

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Admins can view own profile" ON admins
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can insert own profile" ON admins
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage questions" ON questions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read game sessions" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sessions" ON game_sessions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON players
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can read answers" ON answers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert answers" ON answers
  FOR INSERT WITH CHECK (true);

-- Enable Realtime (ignore error if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE players;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE answers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert sample questions (skip if already exist)
INSERT INTO questions (question_text, question_type, category, difficulty, options, correct_answer, points, time_limit)
SELECT * FROM (VALUES
  ('Berapa hasil dari 125 + 378?', 'multiple_choice', 'penjumlahan', 1, '["503", "493", "513", "483"]'::JSONB, '503', 10, 30),
  ('Berapa hasil dari 1.256 + 3.744?', 'multiple_choice', 'penjumlahan', 2, '["5.000", "4.900", "5.100", "4.800"]'::JSONB, '5.000', 15, 30),
  ('Berapa hasil dari 850 - 376?', 'multiple_choice', 'pengurangan', 1, '["474", "484", "464", "494"]'::JSONB, '474', 10, 30),
  ('Berapa hasil dari 5.000 - 2.187?', 'multiple_choice', 'pengurangan', 2, '["2.813", "2.713", "2.913", "2.887"]'::JSONB, '2.813', 15, 30),
  ('Berapa hasil dari 25 × 16?', 'multiple_choice', 'perkalian', 2, '["400", "350", "375", "425"]'::JSONB, '400', 15, 30),
  ('Berapa hasil dari 48 × 25?', 'multiple_choice', 'perkalian', 2, '["1.100", "1.200", "1.150", "1.250"]'::JSONB, '1.200', 15, 25),
  ('Berapa hasil dari 144 ÷ 12?', 'multiple_choice', 'pembagian', 1, '["12", "14", "11", "13"]'::JSONB, '12', 10, 30),
  ('Berapa hasil dari 2.450 ÷ 50?', 'multiple_choice', 'pembagian', 2, '["49", "48", "50", "47"]'::JSONB, '49', 15, 25),
  ('Berapa hasil dari (15 × 8) + (120 ÷ 6)?', 'multiple_choice', 'campuran', 3, '["140", "130", "150", "160"]'::JSONB, '140', 20, 35),
  ('Sebuah toko menjual 48 kotak berisi masing-masing 25 pensil. Berapa total pensil?', 'multiple_choice', 'cerita', 3, '["1.200", "1.100", "1.250", "1.150"]'::JSONB, '1.200', 20, 45),
  ('Jika luas persegi panjang 360 cm² dan panjangnya 24 cm, berapa lebarnya?', 'multiple_choice', 'cerita', 3, '["15 cm", "12 cm", "18 cm", "14 cm"]'::JSONB, '15 cm', 20, 40),
  ('Berapa nilai dari 3² + 4² ?', 'multiple_choice', 'campuran', 2, '["25", "24", "7", "12"]'::JSONB, '25', 15, 25)
) AS v(question_text, question_type, category, difficulty, options, correct_answer, points, time_limit)
WHERE NOT EXISTS (SELECT 1 FROM questions LIMIT 1);
