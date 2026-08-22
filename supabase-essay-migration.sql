-- ============================================================
-- ADD: Policy untuk admin bisa update jawaban (koreksi essay)
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Allow authenticated users (admin) to update answers for grading
DROP POLICY IF EXISTS "Authenticated users can update answers" ON answers;
CREATE POLICY "Authenticated users can update answers" ON answers
  FOR UPDATE USING (auth.role() = 'authenticated');
