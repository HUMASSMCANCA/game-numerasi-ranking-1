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
}
