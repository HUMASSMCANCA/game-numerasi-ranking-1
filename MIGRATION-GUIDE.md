# 📋 Migration Guide - Add Question Image Support

## ❗ Error yang Muncul:
```
Error: Could not find the 'question_image' column of 'questions' in the schema cache
```

## ✅ Solusi: Tambahkan Kolom ke Database

### Langkah 1: Buka Supabase Dashboard
1. Login ke **https://supabase.com/dashboard**
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

### Langkah 2: Jalankan SQL Migration
Copy-paste SQL berikut ke SQL Editor, lalu klik **Run**:

```sql
-- Add question_image column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_image TEXT;

-- Add comment
COMMENT ON COLUMN questions.question_image IS 'Base64 encoded image data for question (optional)';

-- Verify column added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;
```

### Langkah 3: Refresh Schema Cache (Optional)
Jika masih error setelah migration, refresh cache:

```sql
-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';
```

### Langkah 4: Restart Connection
- Refresh halaman admin panel Anda
- Coba simpan soal lagi

---

## 📄 File SQL Migration
File migration sudah tersedia di: `supabase-add-question-image.sql`

---

## 🔍 Verifikasi
Setelah migration berhasil, Anda bisa:
1. ✅ Upload gambar soal di form pembuat soal
2. ✅ Preview gambar langsung di admin panel
3. ✅ Gambar tersimpan di database
4. ✅ Gambar ditampilkan di play screen & projector

---

## 🆘 Jika Masih Error
Pastikan:
- [ ] SQL migration sudah dijalankan tanpa error
- [ ] Tabel `questions` ada di database
- [ ] User/role memiliki permission untuk ALTER TABLE
- [ ] Connection ke Supabase aktif

Jika masih bermasalah, coba:
1. Restart browser
2. Clear cache browser
3. Check Supabase logs di Dashboard → Logs

---

## 📚 Struktur Kolom `question_image`
- **Type**: TEXT
- **Nullable**: YES (opsional)
- **Content**: Base64 encoded image data
- **Format**: `data:image/png;base64,iVBORw0KGgo...`
- **Max Size**: Sesuai limit Supabase (biasanya cukup untuk gambar compressed)
