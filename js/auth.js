/* ============================================================
   Authentication Module — Supabase Auth
   Game Numerasi Ranking 1
   ============================================================ */

const Auth = {
  // Current admin user
  currentUser: null,

  // Initialize auth state
  async init() {
    if (!supabase) return;

    // Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.currentUser = session.user;
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.currentUser = session.user;
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
    });
  },

  // Admin login
  async login(email, password) {
    if (!supabase) {
      showToast('Supabase belum dimuat!', 'error');
      return { error: { message: 'Supabase not loaded' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showToast(`Login gagal: ${error.message}`, 'error');
      return { error };
    }

    this.currentUser = data.user;
    showToast('Login berhasil! 🎉', 'success');
    return { data };
  },

  // Admin register
  async register(email, password, name) {
    if (!supabase) {
      showToast('Supabase belum dimuat!', 'error');
      return { error: { message: 'Supabase not loaded' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      showToast(`Registrasi gagal: ${error.message}`, 'error');
      return { error };
    }

    // Insert into admins table
    if (data.user) {
      await supabase.from('admins').insert({
        id: data.user.id,
        email: email,
        name: name
      });
    }

    showToast('Registrasi berhasil! Silakan cek email untuk verifikasi.', 'success');
    return { data };
  },

  // Logout
  async logout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    this.currentUser = null;
    showToast('Berhasil logout', 'info');
  },

  // Check if logged in
  isLoggedIn() {
    return this.currentUser !== null;
  },

  // Get user ID
  getUserId() {
    return this.currentUser?.id || null;
  },

  // Get user name
  getUserName() {
    return this.currentUser?.user_metadata?.name || this.currentUser?.email || 'Admin';
  }
};
