/* ============================================================
   Utility Functions
   Game Numerasi Ranking 1
   ============================================================ */

// --- Toast Notifications ---
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Generate Game PIN ---
function generateGamePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Generate Random Color ---
const AVATAR_COLORS = [
  '#6C63FF', '#00D4AA', '#FF6B6B', '#FFD93D',
  '#A855F7', '#3B82F6', '#FB923C', '#EC4899',
  '#14B8A6', '#F43F5E', '#8B5CF6', '#06B6D4'
];

function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// --- Avatar Emojis (Cute Characters) ---
const AVATAR_EMOJIS = [
  '😊', '😎', '🤗', '😇', '🥳', '🤩',
  '🐻', '🐼', '🐨', '🐯', '🦁', '🐸',
  '🦊', '🐰', '🐱', '🐶', '🐵', '🐹',
  '🦄', '🐷', '🐮', '🐔', '🦉', '🐧'
];

function getRandomAvatar() {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
}

// --- Get Initial from Name ---
function getInitial(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

// --- Format Time ---
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// --- Format Date ---
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// --- Shuffle Array ---
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- Debounce ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// --- Create Particles Background ---
function createParticles(container, count = 30) {
  const particlesDiv = document.createElement('div');
  particlesDiv.className = 'particles';

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent-gold)'];
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${15 + Math.random() * 30}s;
      animation-delay: ${Math.random() * 20}s;
    `;
    particlesDiv.appendChild(particle);
  }

  container.appendChild(particlesDiv);
}

// --- Create Confetti ---
function createConfetti(container, count = 80) {
  const confettiDiv = document.createElement('div');
  confettiDiv.className = 'confetti-container';

  const colors = ['#FFD93D', '#FF6B6B', '#6C63FF', '#00D4AA', '#A855F7', '#FB923C', '#3B82F6', '#EC4899'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 10;
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${2 + Math.random() * 4}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    confettiDiv.appendChild(piece);
  }

  container.appendChild(confettiDiv);

  // Remove after animation
  setTimeout(() => confettiDiv.remove(), 7000);
}

// --- Create Floating Math Symbols ---
function createMathSymbols(container) {
  const symbols = ['+', '−', '×', '÷', '=', '%', '√', 'π', '∑', '∞', '²', '³'];
  symbols.forEach((sym, i) => {
    const el = document.createElement('div');
    el.className = 'math-float';
    el.textContent = sym;
    el.style.cssText = `
      left: ${5 + Math.random() * 90}%;
      top: ${5 + Math.random() * 90}%;
      font-size: ${1.5 + Math.random() * 2.5}rem;
      animation-duration: ${15 + Math.random() * 25}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(el);
  });
}

// --- Calculate Points ---
function calculatePoints(basePoints, timeLimit, timeTaken, isCorrect, streak) {
  if (!isCorrect) return 0;

  // Base points
  let points = basePoints;

  // Time bonus: faster = more points (up to 50% extra)
  const timeRatio = Math.max(0, 1 - (timeTaken / timeLimit));
  const timeBonus = Math.round(basePoints * 0.5 * timeRatio);
  points += timeBonus;

  // Streak bonus: consecutive correct answers
  if (streak >= 5) {
    points = Math.round(points * 1.5); // 50% bonus for 5+ streak
  } else if (streak >= 3) {
    points = Math.round(points * 1.25); // 25% bonus for 3+ streak
  }

  return points;
}

// --- Sound Effects (simple beep using AudioContext) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 0.1;

    switch(type) {
      case 'correct':
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
        break;
      case 'wrong':
        oscillator.frequency.value = 220;
        oscillator.type = 'square';
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.4);
        break;
      case 'tick':
        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.05);
        break;
      case 'victory':
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.value = 0.1;
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2 * (i + 1) + 0.3);
          osc.start(audioCtx.currentTime + 0.2 * i);
          osc.stop(audioCtx.currentTime + 0.2 * (i + 1) + 0.3);
        });
        break;
    }
  } catch (e) {
    // Audio not available
  }
}

// --- Escape HTML ---
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Local Storage Helpers ---
function saveLocal(key, value) {
  try {
    localStorage.setItem(`numerasi_${key}`, JSON.stringify(value));
  } catch (e) {}
}

function loadLocal(key) {
  try {
    const val = localStorage.getItem(`numerasi_${key}`);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
}

function removeLocal(key) {
  try {
    localStorage.removeItem(`numerasi_${key}`);
  } catch (e) {}
}
