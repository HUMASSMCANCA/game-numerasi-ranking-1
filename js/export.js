/* ============================================================
   Export Module — PDF & CSV Download
   Game Numerasi Ranking 1
   ============================================================ */

const ExportModule = {

  // --- Export to CSV ---
  exportCSV(players, sessionTitle, gameCode) {
    const headers = ['Rank', 'Nama', 'Skor', 'Jawaban Benar', 'Jawaban Salah', 'Streak Terbaik', 'Akurasi (%)'];
    const rows = players.map((p, i) => {
      const total = p.correct_answers + p.wrong_answers;
      const accuracy = total > 0 ? ((p.correct_answers / total) * 100).toFixed(1) : '0.0';
      return [
        i + 1,
        `"${p.name}"`,
        p.score,
        p.correct_answers,
        p.wrong_answers,
        p.max_streak,
        accuracy
      ];
    });

    const csvContent = [
      `Game Numerasi Ranking 1 — ${sessionTitle}`,
      `Kode Game: ${gameCode}`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      `Total Pemain: ${players.length}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    this.downloadFile(csvContent, `hasil-game-${gameCode}.csv`, 'text/csv;charset=utf-8;');
    showToast('CSV berhasil didownload! 📄', 'success');
  },

  // --- Export to PDF (HTML-based) ---
  exportPDF(players, sessionTitle, gameCode) {
    const totalPlayers = players.length;
    const totalCorrect = players.reduce((s, p) => s + p.correct_answers, 0);
    const totalWrong = players.reduce((s, p) => s + p.wrong_answers, 0);
    const avgScore = totalPlayers > 0 ? Math.round(players.reduce((s, p) => s + p.score, 0) / totalPlayers) : 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Hasil Game — ${escapeHtml(sessionTitle)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #1a1a2e;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 3px solid #6C63FF;
      margin-bottom: 32px;
    }
    .header h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 2rem;
      color: #6C63FF;
      margin-bottom: 8px;
    }
    .header p { color: #666; font-size: 0.95rem; }
    .stats-row {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-box {
      flex: 1;
      background: #f8f9ff;
      border: 1px solid #e0e0ff;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .stat-box .value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.8rem;
      font-weight: 800;
      color: #6C63FF;
    }
    .stat-box .label { font-size: 0.8rem; color: #888; margin-top: 4px; }
    .podium-section { text-align: center; margin-bottom: 32px; }
    .podium-section h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.3rem;
      margin-bottom: 16px;
      color: #333;
    }
    .top3 { display: flex; justify-content: center; gap: 24px; }
    .top3-item {
      background: #f8f9ff;
      border: 2px solid #e0e0ff;
      border-radius: 16px;
      padding: 20px 24px;
      text-align: center;
      min-width: 140px;
    }
    .top3-item.gold { border-color: #FFD93D; background: #fffef5; }
    .top3-item.silver { border-color: #C0C0C0; background: #fafafa; }
    .top3-item.bronze { border-color: #CD7F32; background: #fef9f3; }
    .top3-item .medal { font-size: 2rem; margin-bottom: 8px; }
    .top3-item .name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
    .top3-item .score { font-family: 'Outfit'; font-weight: 800; font-size: 1.5rem; color: #6C63FF; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #6C63FF;
      color: #fff;
      padding: 12px 16px;
      text-align: left;
      font-family: 'Outfit';
      font-weight: 600;
      font-size: 0.85rem;
    }
    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; }
    td {
      padding: 10px 16px;
      border-bottom: 1px solid #eee;
      font-size: 0.9rem;
    }
    tr:nth-child(even) { background: #f8f9ff; }
    tr:first-child td { font-weight: 600; }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 0.8rem;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏆 Hasil Game Numerasi</h1>
    <p><strong>${escapeHtml(sessionTitle)}</strong> — Kode Game: ${escapeHtml(gameCode)}</p>
    <p>${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="stats-row">
    <div class="stat-box">
      <div class="value">${totalPlayers}</div>
      <div class="label">Total Pemain</div>
    </div>
    <div class="stat-box">
      <div class="value">${totalCorrect}</div>
      <div class="label">Jawaban Benar</div>
    </div>
    <div class="stat-box">
      <div class="value">${avgScore}</div>
      <div class="label">Skor Rata-rata</div>
    </div>
  </div>

  ${players.length >= 1 ? `
  <div class="podium-section">
    <h2>🏅 Pemenang</h2>
    <div class="top3">
      ${players[0] ? `<div class="top3-item gold"><div class="medal">🥇</div><div class="name">${escapeHtml(players[0].name)}</div><div class="score">${players[0].score} pts</div></div>` : ''}
      ${players[1] ? `<div class="top3-item silver"><div class="medal">🥈</div><div class="name">${escapeHtml(players[1].name)}</div><div class="score">${players[1].score} pts</div></div>` : ''}
      ${players[2] ? `<div class="top3-item bronze"><div class="medal">🥉</div><div class="name">${escapeHtml(players[2].name)}</div><div class="score">${players[2].score} pts</div></div>` : ''}
    </div>
  </div>
  ` : ''}

  <h2 style="font-family:'Outfit';margin-bottom:12px;font-size:1.2rem;">📊 Ranking Lengkap</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Nama Pemain</th>
        <th>Skor</th>
        <th>Benar</th>
        <th>Salah</th>
        <th>Streak</th>
        <th>Akurasi</th>
      </tr>
    </thead>
    <tbody>
      ${players.map((p, i) => {
        const total = p.correct_answers + p.wrong_answers;
        const accuracy = total > 0 ? ((p.correct_answers / total) * 100).toFixed(1) : '0.0';
        return `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(p.name)}</td>
          <td><strong>${p.score}</strong></td>
          <td>${p.correct_answers}</td>
          <td>${p.wrong_answers}</td>
          <td>${p.max_streak}</td>
          <td>${accuracy}%</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Game Numerasi Ranking 1 — Development Ahmad Sahrul Aziz</p>
    <p class="no-print" style="margin-top:12px;"><button onclick="window.print()" style="background:#6C63FF;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:600;">🖨️ Print / Save as PDF</button></p>
  </div>
</body>
</html>`;

    // Open in new window for printing/saving
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      showToast('Halaman hasil dibuka! Gunakan Ctrl+P untuk save PDF 📄', 'success');
    } else {
      // Fallback: download as HTML
      this.downloadFile(htmlContent, `hasil-game-${gameCode}.html`, 'text/html;charset=utf-8;');
      showToast('File hasil didownload sebagai HTML', 'info');
    }
  },

  // --- Download File Helper ---
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
