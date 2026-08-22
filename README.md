# 🧮 Game Numerasi Ranking 1

> **Game matematika interaktif real-time multiplayer dengan sistem ranking, podium pemenang, dan admin panel lengkap.**

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://pages.github.com)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase)](https://supabase.com)

**Development: Ahmad Sahrul Aziz**

---

## 🎮 Fitur Utama

### Untuk Pemain
- ⚔️ **Battle Mode** — Semua pemain berlomba menjawab soal yang sama secara real-time
- 📊 **Live Ranking** — Ranking update real-time selama permainan
- 🏆 **Podium Pemenang** — Animasi podium untuk 3 pemenang teratas dengan confetti
- 🔥 **Streak & Combo** — Bonus poin untuk jawaban berturut-turut benar
- ⏱️ **Timer** — Countdown timer per soal

### Untuk Admin
- 📝 **CRUD Soal** — Tambah, edit, hapus soal matematika
- 🏷️ **Kategori Soal** — Penjumlahan, Pengurangan, Perkalian, Pembagian, Campuran, Soal Cerita
- 🎮 **Buat Game Session** — Generate kode PIN untuk pemain
- 🕹️ **Kontrol Game Live** — Start, Pause, Next Question, End Game
- 📄 **Download Hasil** — Export hasil permainan ke PDF & CSV
- 📊 **Dashboard Statistik** — Overview soal, game, dan pemain

---

## 🚀 Cara Setup

### 1. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Buka **SQL Editor** dan jalankan file `supabase-schema.sql`
4. Pergi ke **Settings > API** dan copy:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon public key**

### 2. Konfigurasi Project

Buka file `js/supabase-config.js` dan ganti:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Buat Akun Admin

1. Buka halaman Admin (`admin.html`)
2. Klik **"Belum punya akun? Daftar"**
3. Masukkan email dan password
4. Cek email untuk verifikasi (atau matikan email confirmation di Supabase Dashboard > Authentication > Settings)

### 4. Deploy ke GitHub Pages

```bash
# Buat repository baru di GitHub
git init
git add .
git commit -m "Initial commit - Game Numerasi Ranking 1"
git branch -M main
git remote add origin https://github.com/USERNAME/development-ahmad-sahrul-aziz.git
git push -u origin main
```

Lalu di GitHub:
1. Buka **Settings > Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **root**
4. Klik **Save**

---

## 📖 Cara Bermain

### Admin
1. Login ke **Admin Panel**
2. Tambah soal di menu **"Kelola Soal"**
3. Buat game baru di menu **"Kelola Game"**
4. Bagikan **PIN 6 digit** ke pemain
5. Klik **"Mulai"** saat semua pemain bergabung
6. Kontrol navigasi soal dengan **"Soal Berikutnya"**
7. Klik **"Akhiri"** untuk menampilkan podium
8. Download hasil di menu **"Hasil & Export"**

### Pemain
1. Buka halaman **"Main"** (`play.html`)
2. Masukkan **kode game 6 digit**
3. Masukkan **nama** dan pilih **warna avatar**
4. Tunggu admin memulai game
5. Jawab soal secepat dan seakurat mungkin
6. Lihat ranking real-time di sidebar
7. Selebrasi di **podium** saat game selesai!

---

## 🏗️ Struktur Project

```
development-ahmad-sahrul-aziz/
├── index.html              # Landing page
├── play.html               # Halaman bermain (join + battle)
├── admin.html              # Admin panel
├── podium.html             # Podium pemenang
├── supabase-schema.sql     # Schema database
├── css/
│   ├── main.css            # Design system & global styles
│   ├── landing.css         # Landing page styles
│   ├── play.css            # Game play styles
│   ├── admin.css           # Admin panel styles
│   └── podium.css          # Podium animation styles
├── js/
│   ├── supabase-config.js  # Konfigurasi Supabase
│   ├── auth.js             # Authentication logic
│   ├── game-engine.js      # Core game logic & real-time
│   ├── admin.js            # Admin CRUD & game control
│   ├── play.js             # Player-side game logic
│   ├── podium.js           # Podium animations
│   ├── export.js           # PDF & CSV export
│   └── utils.js            # Utility functions
└── README.md
```

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| **HTML5** | Struktur halaman |
| **CSS3** | Styling, animasi, glassmorphism |
| **Vanilla JavaScript** | Logika game & interaksi |
| **Supabase** | Database, Auth, Realtime |
| **GitHub Pages** | Hosting static site |

---

## 📜 Lisensi

© 2026 Game Numerasi Ranking 1 — Development **Ahmad Sahrul Aziz**

---

## 🙏 Kredit

- Font: [Outfit](https://fonts.google.com/specimen/Outfit), [Inter](https://fonts.google.com/specimen/Inter), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- Backend: [Supabase](https://supabase.com)
- Hosting: [GitHub Pages](https://pages.github.com)
