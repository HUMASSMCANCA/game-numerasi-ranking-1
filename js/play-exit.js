/* ============================================================
   Play Exit Helper
   Add exit game functionality to PlayController
   ============================================================ */

// Extend PlayController with exitGame function
if (typeof PlayController !== 'undefined') {
  PlayController.exitGame = function() {
    if (!confirm('Yakin ingin keluar dari game?\n\nSkor kamu akan tetap tersimpan.')) {
      return;
    }

    // Stop timer if exists
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Clear session storage
    try {
      sessionStorage.removeItem('gameSession');
      sessionStorage.removeItem('playerName');
      sessionStorage.removeItem('playerColor');
    } catch (e) {
      console.warn('Could not clear session:', e);
    }

    // Show toast
    if (typeof showToast === 'function') {
      showToast('👋 Keluar dari game. Terima kasih sudah bermain!', 'info');
    }

    // Redirect to home after short delay
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  };

  PlayController.endGameConfirm = function() {
    if (!confirm('⚠️ AKHIRI GAME untuk SEMUA PEMAIN?\n\n⚠️ Hanya guru/admin yang boleh mengakhiri game.\n⚠️ Game akan berakhir dan menampilkan podium.\n\nLanjutkan?')) {
      return;
    }

    // Confirm again
    if (!confirm('Yakin ingin mengakhiri game?\nIni akan mengakhiri game untuk SEMUA pemain!')) {
      return;
    }

    // End game via GameEngine
    if (typeof GameEngine !== 'undefined' && GameEngine.sessionId) {
      this.endGameForAll();
    } else {
      alert('⚠️ Tidak dapat mengakhiri game. Session tidak ditemukan.');
    }
  };

  PlayController.endGameForAll = async function() {
    try {
      // Show loading
      if (typeof showToast === 'function') {
        showToast('⏹️ Mengakhiri game...', 'info');
      }

      // Update session status to finished
      if (typeof SupabaseDB !== 'undefined') {
        await SupabaseDB.updateSessionStatus(GameEngine.sessionId, 'finished');
        
        // Show success
        if (typeof showToast === 'function') {
          showToast('✅ Game telah diakhiri untuk semua pemain!', 'success');
        }

        // Redirect to podium after delay
        setTimeout(() => {
          window.location.href = 'podium.html?pin=' + GameEngine.gameCode;
        }, 2000);
      }
    } catch (error) {
      console.error('Error ending game:', error);
      alert('❌ Gagal mengakhiri game: ' + error.message);
    }
  };
}
