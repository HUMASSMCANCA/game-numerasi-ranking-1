/* ============================================================
   Podium Controller — Winner Display & Animations
   Game Numerasi Ranking 1
   
   Uses SupabaseDB for data
   ============================================================ */

const PodiumController = {
  sessionId: null,
  players: [],

  // --- Initialize ---
  async init() {
    // Get session ID from URL
    const params = new URLSearchParams(window.location.search);
    this.sessionId = params.get('session');

    if (!this.sessionId) {
      // Try from local storage
      const lastSession = loadLocal('lastSession');
      if (lastSession) {
        this.sessionId = lastSession.sessionId;
      }
    }

    if (!this.sessionId) {
      document.querySelector('.podium-title h1').textContent = 'Session tidak ditemukan';
      return;
    }

    await this.loadResults();
  },

  // --- Load Results (Supabase) ---
  async loadResults() {
    if (!this.sessionId) return;

    try {
      // Get players sorted by score
      const players = await SupabaseDB.getPlayers(this.sessionId);

      if (!players || players.length === 0) {
        document.querySelector('.podium-title p').textContent = 'Tidak ada data pemain';
        return;
      }

      this.players = players;

      // Try to get session info
      let session = null;
      try {
        session = await SupabaseDB.getSessionById(this.sessionId);
      } catch (e) { /* ignore */ }

      this.session = session;

      // Update title
      const titleEl = document.querySelector('.podium-title p');
      if (titleEl && session) {
        titleEl.textContent = session.title;
      }

      // Render podium
      this.renderPodium(players);

      // Render full rankings
      this.renderFullRankings(players);

      // Setup export buttons
      this.setupExportButtons(players, session);

      // Trigger celebrations
      setTimeout(() => {
        createConfetti(document.body, 100);
        playSound('victory');
      }, 1500);
    } catch (err) {
      console.error('Load results error:', err);
      document.querySelector('.podium-title p').textContent = 'Error memuat hasil';
    }
  },

  // --- Render Podium ---
  renderPodium(players) {
    const container = document.getElementById('podium-container');
    if (!container) return;

    const slots = [
      { rank: 1, player: players[0], class: 'slot-1' },
      { rank: 2, player: players[1], class: 'slot-2' },
      { rank: 3, player: players[2], class: 'slot-3' }
    ];

    container.innerHTML = slots.map(slot => {
      if (!slot.player) return `<div class="podium-slot ${slot.class}" style="opacity:0;"></div>`;

      const p = slot.player;
      const total = p.correct_answers + p.wrong_answers;
      const accuracy = total > 0 ? ((p.correct_answers / total) * 100).toFixed(0) : '0';
      const medal = slot.rank === 1 ? '🥇' : slot.rank === 2 ? '🥈' : '🥉';

      return `
        <div class="podium-slot ${slot.class}">
          <div class="podium-player">
            <div class="podium-avatar" style="background:${p.avatar_color || '#6C63FF'}">
              ${slot.rank === 1 ? '<div class="podium-crown">👑</div>' : ''}
              ${getInitial(p.name)}
            </div>
            <div class="podium-player-name">${escapeHtml(p.name)}</div>
            <div class="podium-player-score">${p.score} pts</div>
            <div class="podium-player-stats">${p.correct_answers}✓ · ${p.wrong_answers}✗ · ${accuracy}%</div>
          </div>
          <div class="podium-block podium-block-${slot.rank}">
            ${medal}
          </div>
        </div>
      `;
    }).join('');
  },

  // --- Render Full Rankings ---
  renderFullRankings(players) {
    const list = document.getElementById('full-ranking-list');
    if (!list) return;

    list.innerHTML = players.map((p, i) => {
      const total = p.correct_answers + p.wrong_answers;
      const accuracy = total > 0 ? ((p.correct_answers / total) * 100).toFixed(0) : '0';
      const medals = ['🥇', '🥈', '🥉'];

      return `
        <div class="full-ranking-item">
          <div class="full-rank-num">${i < 3 ? medals[i] : i + 1}</div>
          <div class="ranking-avatar-sm" style="background:${p.avatar_color || '#6C63FF'}">
            ${getInitial(p.name)}
          </div>
          <div class="full-rank-name">${escapeHtml(p.name)}</div>
          <div class="full-rank-stats">${p.correct_answers}✓ ${p.wrong_answers}✗ · ${accuracy}%</div>
          <div class="full-rank-score">${p.score} pts</div>
        </div>
      `;
    }).join('');
  },

  // --- Setup Export ---
  setupExportButtons(players, session) {
    const csvBtn = document.getElementById('btn-download-csv');
    const pdfBtn = document.getElementById('btn-download-pdf');

    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (typeof ExportModule !== 'undefined') {
          ExportModule.exportCSV(players, session?.title || 'Game', session?.game_code || '');
        }
      });
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        if (typeof ExportModule !== 'undefined') {
          ExportModule.exportPDF(players, session?.title || 'Game', session?.game_code || '');
        }
      });
    }
  },

  // --- Play Again ---
  playAgain() {
    removeLocal('lastSession');
    window.location.href = 'play.html';
  },

  // --- Back to Home ---
  goHome() {
    removeLocal('lastSession');
    window.location.href = 'index.html';
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (initSupabase()) {
    showConfigWarning();
    PodiumController.init();
  } else {
    showConfigWarning();
  }
});
