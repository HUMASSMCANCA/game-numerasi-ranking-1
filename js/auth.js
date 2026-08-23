/* ============================================================
   Authentication Module — Supabase Auth
   Game Numerasi Ranking 1
   ============================================================ */

const Auth = {
  // Current admin user
  currentUser: null,

  // Initialize auth state
  async init() {
    try {
      if (!supabaseClient) return;

      // Check existing session
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        this.currentUser = session.user;
      }

      // Listen for auth changes
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.currentUser = session.user;
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
        }
      });
    } catch (err) {
      console.error('Auth init error:', err);
    }
  },

  // Admin login
  async login(email, password) {
    try {
      if (!supabaseClient) {
        showToast('Supabase belum dimuat!', 'error');
        return { error: { message: 'Supabase not loaded' } };
      }

      console.log('Attempting login for:', email);

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        showToast(`Login gagal: ${error.message}`, 'error');
        return { error };
      }

      console.log('Login success:', data.user.email);
      this.currentUser = data.user;
      showToast('Login berhasil! 🎉', 'success');
      return { data };
    } catch (err) {
      console.error('Login exception:', err);
      showToast(`Login error: ${err.message}`, 'error');
      return { error: { message: err.message } };
    }
  },

  // Admin register
  async register(email, password, name) {
    try {
      if (!supabaseClient) {
        showToast('Supabase belum dimuat!', 'error');
        return { error: { message: 'Supabase not loaded' } };
      }

      const { data, error } = await supabaseClient.auth.signUp({
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

      // Registration success
      if (data.user) {
        console.log('User registered:', data.user.email);
      }

      showToast('Registrasi berhasil! Silakan login.', 'success');
      return { data };
    } catch (err) {
      console.error('Register exception:', err);
      showToast(`Register error: ${err.message}`, 'error');
      return { error: { message: err.message } };
    }
  },

  // Logout
  async logout() {
    try {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      this.currentUser = null;
      showToast('Berhasil logout', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
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
