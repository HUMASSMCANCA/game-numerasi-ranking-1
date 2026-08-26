-- ============================================================
-- ADD QUESTION IMAGE COLUMN
-- Game Numerasi Ranking 1
--
-- Untuk menambahkan kolom question_image ke tabel questions
-- Jalankan SQL ini di Supabase SQL Editor jika tabel sudah ada
-- ============================================================

-- Add question_image column (TEXT untuk base64 image)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_image TEXT;

-- Add comment
COMMENT ON COLUMN questions.question_image IS 'Base64 encoded image data for question (optional)';
