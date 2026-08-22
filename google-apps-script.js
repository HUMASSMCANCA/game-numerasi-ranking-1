// ============================================================
// GOOGLE APPS SCRIPT — Game Numerasi Ranking 1
// API Bridge antara Web App dan Google Sheets
//
// CARA SETUP:
// 1. Buat Google Sheet baru
// 2. Buka Extensions → Apps Script
// 3. Paste SEMUA kode ini
// 4. Klik Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy URL deployment-nya
// 6. Paste URL ke js/supabase-config.js
// ============================================================

// ===== CONFIGURATION =====
// Sheet names (tab names in your Google Sheet)
const SHEET_QUESTIONS = 'questions';
const SHEET_SESSIONS = 'game_sessions';
const SHEET_PLAYERS = 'players';
const SHEET_ANSWERS = 'answers';

// ===== INIT: Create sheets if they don't exist =====
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Questions sheet
  let qs = ss.getSheetByName(SHEET_QUESTIONS);
  if (!qs) {
    qs = ss.insertSheet(SHEET_QUESTIONS);
    qs.appendRow(['id','question_text','question_type','category','difficulty','option_a','option_b','option_c','option_d','correct_answer','points','time_limit','created_by','created_at','updated_at']);
    // Add sample questions
    const now = new Date().toISOString();
    const samples = [
      [generateId(),'Berapa hasil dari 125 + 378?','multiple_choice','penjumlahan',1,'503','493','513','483','503',10,30,'',now,now],
      [generateId(),'Berapa hasil dari 1.256 + 3.744?','multiple_choice','penjumlahan',2,'5.000','4.900','5.100','4.800','5.000',15,30,'',now,now],
      [generateId(),'Berapa hasil dari 850 - 376?','multiple_choice','pengurangan',1,'474','484','464','494','474',10,30,'',now,now],
      [generateId(),'Berapa hasil dari 5.000 - 2.187?','multiple_choice','pengurangan',2,'2.813','2.713','2.913','2.887','2.813',15,30,'',now,now],
      [generateId(),'Berapa hasil dari 25 × 16?','multiple_choice','perkalian',2,'400','350','375','425','400',15,30,'',now,now],
      [generateId(),'Berapa hasil dari 48 × 25?','multiple_choice','perkalian',2,'1.100','1.200','1.150','1.250','1.200',15,25,'',now,now],
      [generateId(),'Berapa hasil dari 144 ÷ 12?','multiple_choice','pembagian',1,'12','14','11','13','12',10,30,'',now,now],
      [generateId(),'Berapa hasil dari 2.450 ÷ 50?','multiple_choice','pembagian',2,'49','48','50','47','49',15,25,'',now,now],
      [generateId(),'Berapa hasil dari (15 × 8) + (120 ÷ 6)?','multiple_choice','campuran',3,'140','130','150','160','140',20,35,'',now,now],
      [generateId(),'Berapa nilai dari 3² + 4²?','multiple_choice','campuran',2,'25','24','7','12','25',15,25,'',now,now],
      [generateId(),'Toko menjual 48 kotak × 25 pensil. Total?','multiple_choice','cerita',3,'1.200','1.100','1.250','1.150','1.200',20,45,'',now,now],
      [generateId(),'Luas persegi 360cm², panjang 24cm. Lebar?','multiple_choice','cerita',3,'15 cm','12 cm','18 cm','14 cm','15 cm',20,40,'',now,now]
    ];
    samples.forEach(row => qs.appendRow(row));
  }
  
  // Game Sessions sheet
  let gs = ss.getSheetByName(SHEET_SESSIONS);
  if (!gs) {
    gs = ss.insertSheet(SHEET_SESSIONS);
    gs.appendRow(['id','game_code','title','status','current_question_index','question_ids','created_by','created_at','started_at','finished_at']);
  }
  
  // Players sheet
  let ps = ss.getSheetByName(SHEET_PLAYERS);
  if (!ps) {
    ps = ss.insertSheet(SHEET_PLAYERS);
    ps.appendRow(['id','session_id','name','avatar_color','score','correct_answers','wrong_answers','streak','max_streak','joined_at']);
  }
  
  // Answers sheet
  let as = ss.getSheetByName(SHEET_ANSWERS);
  if (!as) {
    as = ss.insertSheet(SHEET_ANSWERS);
    as.appendRow(['id','session_id','player_id','question_id','answer','is_correct','time_taken','points_earned','answered_at']);
  }
  
  return 'Sheets initialized!';
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
  return Utilities.getUuid();
}

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = data[i][j];
    });
    rows.push(obj);
  }
  return rows;
}

function findRowIndex(sheetName, colName, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return -1;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(colName);
  if (colIndex === -1) return -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex].toString() === value.toString()) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
}

function updateRow(sheetName, rowIndex, colName, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(colName);
  if (colIndex !== -1) {
    sheet.getRange(rowIndex, colIndex + 1).setValue(value);
  }
}

// ===== CORS HEADERS =====
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== HTTP HANDLERS =====
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'init':
        return createJsonResponse({ success: true, message: initSheets() });
      
      case 'getQuestions':
        return createJsonResponse({ success: true, data: getQuestions(e.parameter) });
      
      case 'getSession':
        return createJsonResponse({ success: true, data: getSession(e.parameter.code) });
      
      case 'getPlayers':
        return createJsonResponse({ success: true, data: getPlayers(e.parameter.sessionId) });
      
      case 'getStats':
        return createJsonResponse({ success: true, data: getStats() });
      
      case 'getSessions':
        return createJsonResponse({ success: true, data: getSessions(e.parameter) });
      
      case 'getAnswers':
        return createJsonResponse({ success: true, data: getAnswers(e.parameter.sessionId) });
      
      default:
        return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ success: false, error: 'Invalid JSON' });
  }
  
  const action = body.action;
  
  try {
    switch (action) {
      case 'addQuestion':
        return createJsonResponse({ success: true, data: addQuestion(body) });
      
      case 'updateQuestion':
        return createJsonResponse({ success: true, data: updateQuestion(body) });
      
      case 'deleteQuestion':
        return createJsonResponse({ success: true, data: deleteQuestion(body.id) });
      
      case 'createSession':
        return createJsonResponse({ success: true, data: createSession(body) });
      
      case 'updateSession':
        return createJsonResponse({ success: true, data: updateSessionData(body) });
      
      case 'joinGame':
        return createJsonResponse({ success: true, data: joinGame(body) });
      
      case 'submitAnswer':
        return createJsonResponse({ success: true, data: submitAnswer(body) });
      
      case 'updatePlayer':
        return createJsonResponse({ success: true, data: updatePlayer(body) });
      
      default:
        return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

// ===== QUESTIONS =====
function getQuestions(params) {
  let questions = getSheetData(SHEET_QUESTIONS);
  
  if (params && params.category) {
    questions = questions.filter(q => q.category === params.category);
  }
  if (params && params.search) {
    const s = params.search.toLowerCase();
    questions = questions.filter(q => q.question_text.toString().toLowerCase().includes(s));
  }
  if (params && params.ids) {
    const ids = params.ids.split(',');
    questions = questions.filter(q => ids.includes(q.id.toString()));
    // Maintain order
    questions.sort((a, b) => ids.indexOf(a.id.toString()) - ids.indexOf(b.id.toString()));
  }
  
  // Convert to standard format
  return questions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    category: q.category,
    difficulty: Number(q.difficulty),
    options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(o => o),
    correct_answer: q.correct_answer,
    points: Number(q.points) || 10,
    time_limit: Number(q.time_limit) || 30,
    created_by: q.created_by,
    created_at: q.created_at,
    updated_at: q.updated_at
  }));
}

function addQuestion(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_QUESTIONS);
  const id = generateId();
  const now = new Date().toISOString();
  const opts = data.options || [];
  
  sheet.appendRow([
    id, data.question_text, data.question_type || 'multiple_choice',
    data.category || 'campuran', data.difficulty || 1,
    opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || '',
    data.correct_answer, data.points || 10, data.time_limit || 30,
    data.created_by || '', now, now
  ]);
  
  return { id, created_at: now };
}

function updateQuestion(data) {
  const rowIndex = findRowIndex(SHEET_QUESTIONS, 'id', data.id);
  if (rowIndex === -1) throw new Error('Question not found');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_QUESTIONS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const opts = data.options || [];
  
  const updates = {
    question_text: data.question_text,
    category: data.category,
    difficulty: data.difficulty,
    option_a: opts[0] || '',
    option_b: opts[1] || '',
    option_c: opts[2] || '',
    option_d: opts[3] || '',
    correct_answer: data.correct_answer,
    points: data.points,
    time_limit: data.time_limit,
    updated_at: new Date().toISOString()
  };
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      const colIdx = headers.indexOf(key);
      if (colIdx !== -1) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(updates[key]);
      }
    }
  });
  
  return { id: data.id, updated: true };
}

function deleteQuestion(id) {
  const rowIndex = findRowIndex(SHEET_QUESTIONS, 'id', id);
  if (rowIndex === -1) throw new Error('Question not found');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_QUESTIONS);
  sheet.deleteRow(rowIndex);
  
  return { deleted: true };
}

// ===== GAME SESSIONS =====
function getSession(code) {
  const sessions = getSheetData(SHEET_SESSIONS);
  const session = sessions.find(s => s.game_code.toString() === code.toString());
  if (!session) return null;
  
  return {
    id: session.id,
    game_code: session.game_code,
    title: session.title,
    status: session.status,
    current_question_index: Number(session.current_question_index) || 0,
    question_ids: session.question_ids ? session.question_ids.toString().split(',') : [],
    created_by: session.created_by,
    created_at: session.created_at,
    started_at: session.started_at,
    finished_at: session.finished_at
  };
}

function getSessions(params) {
  let sessions = getSheetData(SHEET_SESSIONS);
  
  if (params && params.status) {
    sessions = sessions.filter(s => s.status === params.status);
  }
  
  return sessions.map(s => ({
    id: s.id,
    game_code: s.game_code,
    title: s.title,
    status: s.status,
    current_question_index: Number(s.current_question_index) || 0,
    question_ids: s.question_ids ? s.question_ids.toString().split(',') : [],
    created_at: s.created_at,
    started_at: s.started_at,
    finished_at: s.finished_at
  })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function createSession(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SESSIONS);
  const id = generateId();
  const pin = generatePin();
  const now = new Date().toISOString();
  
  sheet.appendRow([
    id, pin, data.title, 'waiting', 0,
    (data.question_ids || []).join(','),
    data.created_by || '', now, '', ''
  ]);
  
  return { id, game_code: pin, title: data.title, status: 'waiting', created_at: now };
}

function updateSessionData(data) {
  const rowIndex = findRowIndex(SHEET_SESSIONS, 'id', data.id);
  if (rowIndex === -1) throw new Error('Session not found');
  
  if (data.status !== undefined) updateRow(SHEET_SESSIONS, rowIndex, 'status', data.status);
  if (data.current_question_index !== undefined) updateRow(SHEET_SESSIONS, rowIndex, 'current_question_index', data.current_question_index);
  if (data.started_at !== undefined) updateRow(SHEET_SESSIONS, rowIndex, 'started_at', data.started_at);
  if (data.finished_at !== undefined) updateRow(SHEET_SESSIONS, rowIndex, 'finished_at', data.finished_at);
  
  return { id: data.id, updated: true };
}

// ===== PLAYERS =====
function getPlayers(sessionId) {
  let players = getSheetData(SHEET_PLAYERS);
  
  if (sessionId) {
    players = players.filter(p => p.session_id.toString() === sessionId.toString());
  }
  
  return players.map(p => ({
    id: p.id,
    session_id: p.session_id,
    name: p.name,
    avatar_color: p.avatar_color,
    score: Number(p.score) || 0,
    correct_answers: Number(p.correct_answers) || 0,
    wrong_answers: Number(p.wrong_answers) || 0,
    streak: Number(p.streak) || 0,
    max_streak: Number(p.max_streak) || 0,
    joined_at: p.joined_at
  })).sort((a, b) => b.score - a.score);
}

function joinGame(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PLAYERS);
  const id = generateId();
  const now = new Date().toISOString();
  
  sheet.appendRow([
    id, data.session_id, data.name, data.avatar_color || '#6C63FF',
    0, 0, 0, 0, 0, now
  ]);
  
  return { id, session_id: data.session_id, name: data.name, avatar_color: data.avatar_color, score: 0 };
}

function updatePlayer(data) {
  const rowIndex = findRowIndex(SHEET_PLAYERS, 'id', data.id);
  if (rowIndex === -1) throw new Error('Player not found');
  
  if (data.score !== undefined) updateRow(SHEET_PLAYERS, rowIndex, 'score', data.score);
  if (data.correct_answers !== undefined) updateRow(SHEET_PLAYERS, rowIndex, 'correct_answers', data.correct_answers);
  if (data.wrong_answers !== undefined) updateRow(SHEET_PLAYERS, rowIndex, 'wrong_answers', data.wrong_answers);
  if (data.streak !== undefined) updateRow(SHEET_PLAYERS, rowIndex, 'streak', data.streak);
  if (data.max_streak !== undefined) updateRow(SHEET_PLAYERS, rowIndex, 'max_streak', data.max_streak);
  
  return { id: data.id, updated: true };
}

// ===== ANSWERS =====
function getAnswers(sessionId) {
  let answers = getSheetData(SHEET_ANSWERS);
  
  if (sessionId) {
    answers = answers.filter(a => a.session_id.toString() === sessionId.toString());
  }
  
  return answers.map(a => ({
    id: a.id,
    session_id: a.session_id,
    player_id: a.player_id,
    question_id: a.question_id,
    answer: a.answer,
    is_correct: a.is_correct === true || a.is_correct === 'TRUE' || a.is_correct === 'true',
    time_taken: Number(a.time_taken) || 0,
    points_earned: Number(a.points_earned) || 0,
    answered_at: a.answered_at
  }));
}

function submitAnswer(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ANSWERS);
  const id = generateId();
  const now = new Date().toISOString();
  
  sheet.appendRow([
    id, data.session_id, data.player_id, data.question_id,
    data.answer, data.is_correct, data.time_taken || 0,
    data.points_earned || 0, now
  ]);
  
  return { id, is_correct: data.is_correct, points_earned: data.points_earned };
}

// ===== STATS =====
function getStats() {
  const questions = getSheetData(SHEET_QUESTIONS);
  const sessions = getSheetData(SHEET_SESSIONS);
  const players = getSheetData(SHEET_PLAYERS);
  
  return {
    questionCount: questions.length,
    sessionCount: sessions.length,
    playerCount: players.length
  };
}
