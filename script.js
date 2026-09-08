const API_URL =
  'https://script.google.com/macros/s/AKfycbx5HI0dTYaAW4xSAkyLaTZLbk2JLPkBTPpcwGnJKgVNS_gykr3aydu3omtgM3xPJXrV/exec';


/**
 * BEC Bagalkote – Subject Management
 * Google Apps Script Backend
 * Replace localStorage with Google Sheets storage
 *
 * Sheet names required:
 *   - Users
 *   - Subjects
 *   - Attendance
 *   - Announcements
 *   - Settings
 */

// ─── CONFIG ──────────────────────────────────────────────
const SPREADSHEET_ID = 'AKfycbx5HI0dTYaAW4xSAkyLaTZLbk2JLPkBTPpcwGnJKgVNS_gykr3aydu3omtgM3xPJXrV'; // ← REPLACE THIS

// ─── HELPERS ─────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Initialize headers
    if (name === 'Users') {
      sheet.appendRow(['id', 'name', 'email', 'password', 'role', 'semester', 'division', 'branch']);
    } else if (name === 'Subjects') {
      sheet.appendRow(['id', 'name', 'code', 'semester', 'division', 'branch', 'strength', 'timetable', 'notes', 'resources', 'syllabus']);
    } else if (name === 'Attendance') {
      sheet.appendRow(['id', 'subjectId', 'date', 'absent']);
    } else if (name === 'Announcements') {
      sheet.appendRow(['id', 'title', 'content', 'target', 'date', 'author']);
    } else if (name === 'Settings') {
      sheet.appendRow(['key', 'value']);
    }
  }
  return sheet;
}

function getRows(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(rowData);
}

function updateRow(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) return false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      const row = data[i];
      for (const key in updates) {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) row[colIndex] = updates[key];
      }
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return true;
    }
  }
  return false;
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) return false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// ─── API HANDLERS ────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  const response = { status: 'ok', data: null, message: '' };

  try {
    switch (action) {
      case 'getUsers':
        response.data = getRows('Users');
        break;
      case 'getSubjects':
        response.data = getRows('Subjects');
        break;
      case 'getAttendance':
        response.data = getRows('Attendance');
        break;
      case 'getAnnouncements':
        response.data = getRows('Announcements');
        break;
      case 'getSettings':
        const settingsRows = getRows('Settings');
        const settings = {};
        settingsRows.forEach(row => { settings[row.key] = row.value; });
        response.data = settings;
        break;
      default:
        response.status = 'error';
        response.message = 'Unknown action: ' + action;
    }
  } catch (err) {
    response.status = 'error';
    response.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  const response = { status: 'ok', data: null, message: '' };

  try {
    switch (action) {
      case 'saveUsers': {
        const users = params.users;
        const sheet = getSheet('Users');
        sheet.clear();
        sheet.appendRow(['id', 'name', 'email', 'password', 'role', 'semester', 'division', 'branch']);
        users.forEach(u => {
          sheet.appendRow([u.id || generateId(), u.name, u.email, u.password, u.role, u.semester || '', u.division || '', u.branch || '']);
        });
        response.message = 'Users saved';
        break;
      }

      case 'saveSubjects': {
        const subjects = params.subjects;
        const sheet = getSheet('Subjects');
        sheet.clear();
        sheet.appendRow(['id', 'name', 'code', 'semester', 'division', 'branch', 'strength', 'timetable', 'notes', 'resources', 'syllabus']);
        subjects.forEach(s => {
          sheet.appendRow([
            s.id || generateId(),
            s.name,
            s.code,
            s.semester || '',
            s.division || '',
            s.branch || '',
            s.strength || 58,
            JSON.stringify(s.timetable || []),
            JSON.stringify(s.notes || []),
            JSON.stringify(s.resources || []),
            s.syllabus ? JSON.stringify(s.syllabus) : ''
          ]);
        });
        response.message = 'Subjects saved';
        break;
      }

      case 'saveAttendance': {
        const records = params.attendance; // array of {id, subjectId, date, absent}
        const sheet = getSheet('Attendance');
        sheet.clear();
        sheet.appendRow(['id', 'subjectId', 'date', 'absent']);
        records.forEach(r => {
          sheet.appendRow([
            r.id || generateId(),
            r.subjectId,
            r.date,
            JSON.stringify(r.absent || [])
          ]);
        });
        response.message = 'Attendance saved';
        break;
      }

      case 'saveAnnouncements': {
        const announcements = params.announcements;
        const sheet = getSheet('Announcements');
        sheet.clear();
        sheet.appendRow(['id', 'title', 'content', 'target', 'date', 'author']);
        announcements.forEach(a => {
          sheet.appendRow([
            a.id || generateId(),
            a.title,
            a.content,
            a.target || 'all',
            a.date || new Date().toLocaleDateString('en-IN'),
            a.author || 'Admin'
          ]);
        });
        response.message = 'Announcements saved';
        break;
      }

      case 'saveSettings': {
        const settings = params.settings; // { key: value, ... }
        const sheet = getSheet('Settings');
        sheet.clear();
        sheet.appendRow(['key', 'value']);
        for (const key in settings) {
          sheet.appendRow([key, settings[key]]);
        }
        response.message = 'Settings saved';
        break;
      }

      case 'resetPassword': {
        const email = params.email;
        const newPassword = params.newPassword;
        const users = getRows('Users');
        let found = false;
        users.forEach(u => {
          if (u.email === email) {
            // Update in sheet
            const sheet = getSheet('Users');
            const data = sheet.getDataRange().getValues();
            const headers = data[0];
            const emailIndex = headers.indexOf('email');
            const passIndex = headers.indexOf('password');
            if (emailIndex !== -1 && passIndex !== -1) {
              for (let i = 1; i < data.length; i++) {
                if (data[i][emailIndex] === email) {
                  sheet.getRange(i + 1, passIndex + 1).setValue(newPassword);
                  found = true;
                  break;
                }
              }
            }
          }
        });
        if (found) {
          response.message = 'Password updated for ' + email;
        } else {
          response.status = 'error';
          response.message = 'User not found';
        }
        break;
      }

      default:
        response.status = 'error';
        response.message = 'Unknown action: ' + action;
    }
  } catch (err) {
    response.status = 'error';
    response.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}

// ─── DEPLOYMENT ──────────────────────────────────────────
// 1. Replace YOUR_SPREADSHEET_ID_HERE with your Google Sheet ID.
// 2. Deploy as Web App (Execute as: "Me", Access: "Anyone" or "Anyone with link").
// 3. Copy the Web App URL and use it in your frontend.
