/* ============================================================
   Configuration — Supabase (Auth + Database + Realtime)
   Game Numerasi Ranking 1
   Developer: Ahmad Sahrul Aziz
   ============================================================ */

// ============================================================
// SUPABASE — Auth, Database, dan Realtime
// ============================================================
const SUPABASE_URL = 'https://idiirkgaqnnlushzfsmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaWlya2dhcW5ubHVzaHpmc21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzcwMjksImV4cCI6MjEwMjk1MzAyOX0.nqfYprxP0uZbvhd9KvDJDvKCno1KbzonOmyvFTUfmKg';

// Initialize Supabase client
var supabase = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._supabaseClient = client;
    supabase = client;
    console.log('✅ Supabase initialized');
    return true;
  } else {
    console.error('❌ Supabase JS library not loaded');
    return false;
  }
}

// Check if Supabase is configured
function isSupabaseConfigured() {
  return true; // Already configured
}

// Show configuration warning
function showConfigWarning() {
  if (!supabase) {
    const warning = document.createElement('div');
    warning.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#FF6B6B,#FF3B3B);color:#fff;padding:16px 24px;text-align:center;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.95rem;display:flex;align-items:center;justify-content:center;gap:12px;">
        <span>⚠️</span>
        <span>Supabase tidak dapat dimuat. Pastikan koneksi internet aktif.</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background:rgba(0,0,0,0.2);border:none;color:#fff;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:600;">✕</button>
      </div>
    `;
    document.body.prepend(warning);
    return true;
  }
  return false;
}
