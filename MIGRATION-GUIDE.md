# 📋 Migration Guide - Add Question Image Support

## ❗ Error yang Muncul:
```
Error: Could not find the 'question_image' column of 'questions' in the schema cache
```

## ✅ Solusi: Tambahkan Kolom ke Database

### 🎯 Langkah-langkah Lengkap:

#### **Langkah 1: Buka Supabase Dashboard**
1. Buka browser, pergi ke **https://supabase.com/dashboard**
2. **Login** dengan akun Anda
3. **Pilih project** game numerasi Anda (klik nama project)

#### **Langkah 2: Buka SQL Editor**
1. Di sidebar **SEBELAH KIRI**, cari menu **"SQL Editor"**
2. Klik **"SQL Editor"** (icon seperti dokumen/code)
3. Klik tombol **"+ New query"** di bagian atas

#### **Langkah 3: Copy-Paste SQL Code**
1. Di **kotak editor yang besar** (di tengah layar), paste kode ini:

```sql
-- Add question_image column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_image TEXT;

-- Add comment
COMMENT ON COLUMN questions.question_image IS 'Base64 encoded image data for question (optional)';
```

2. **JANGAN** paste di sidebar atau tempat lain
3. Paste di **area editor besar** yang ada tulisan "Write your SQL query here..."

#### **Langkah 4: Jalankan SQL**
1. Setelah paste, klik tombol **"RUN"** di pojok kanan bawah editor
2. Atau tekan **Ctrl + Enter** (Windows) / **Cmd + Enter** (Mac)
3. Tunggu beberapa detik

#### **Langkah 5: Cek Hasil**
- Jika berhasil, akan muncul pesan **"Success. No rows returned"** atau sejenisnya
- Jika ada error, screenshot dan kirim ke saya

#### **Langkah 6: Kembali ke Admin Panel**
1. Buka tab/window **Admin Panel** game Anda
2. Refresh halaman (F5 atau Ctrl+R)
3. Coba buat soal dengan gambar lagi
4. Seharusnya **BERHASIL** ✅

---

## 📸 Petunjuk Visual:

### Tampilan Supabase Dashboard:
```
┌─────────────────────────────────────────────────────────┐
│ SUPABASE DASHBOARD                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SIDEBAR KIRI:        │  AREA TENGAH (EDITOR):         │
│  ├─ Home              │  ┌──────────────────────────┐  │
│  ├─ Table Editor      │  │                          │  │
│  ├─ SQL Editor  ◄──┐  │  │  [Paste SQL di sini]    │  │
│  ├─ Database          │  │                          │  │
│  ├─ Authentication    │  │  ALTER TABLE...          │  │
│  └─ Storage           │  │                          │  │
│                       │  └──────────────────────────┘  │
│                       │                                 │
│                       │  [RUN] ◄── Klik tombol ini     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Verifikasi (Opsional)
Untuk memastikan kolom berhasil ditambahkan, jalankan query ini:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;
```

Hasilnya harus muncul **"question_image"** di daftar kolom.

---

## 📄 Alternatif: File SQL Sudah Siap
File `supabase-add-question-image.sql` sudah berisi kode yang sama.
Anda bisa:
1. Buka file tersebut
2. Copy semua isinya
3. Paste di SQL Editor
4. Run

---

## 🆘 Jika Masih Error

### Error: "permission denied"
**Solusi:** Pastikan akun Anda memiliki akses admin ke project Supabase

### Error: "relation does not exist"
**Solusi:** Tabel `questions` belum dibuat. Jalankan dulu `supabase-schema.sql`

### Error: "column already exists"
**Solusi:** Bagus! Kolom sudah ada. Cukup refresh admin panel dan coba lagi.

### SQL Editor tidak ada / tidak muncul
**Solusi:** 
- Pastikan Anda login ke Supabase
- Pastikan sudah pilih project yang benar
- Coba logout dan login lagi

---

## ✅ Checklist Setelah Migration

- [ ] SQL migration dijalankan tanpa error
- [ ] Admin panel di-refresh
- [ ] Upload gambar soal berhasil
- [ ] Preview gambar muncul
- [ ] Simpan soal berhasil (tidak ada error)
- [ ] Gambar tampil di play screen
- [ ] Gambar tampil di projector

---

## 📚 Struktur Kolom `question_image`
- **Type**: TEXT
- **Nullable**: YES (opsional)
- **Content**: Base64 encoded image data
- **Format**: `data:image/png;base64,iVBORw0KGgo...`
- **Max Size**: Sesuai limit Supabase (biasanya cukup untuk gambar compressed)
