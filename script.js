// ============================================================
//  API CONFIG
// ============================================================
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwkGmkhK33ruglI18g4ihiacmVYuUNGHML0w1LfS-pMK3zbUMQ9RiY8YuKvCLfl5NPK/exec'; // ← REPLACE THIS

// ============================================================
//  HELPER: API CALLS
// ============================================================
async function apiCall(action, payload = {}) {
  const body = { action, ...payload };
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (result.status !== 'ok') throw new Error(result.message);
  return result.data;
}

// ============================================================
//  REPLACE localStorage FUNCTIONS WITH API CALLS
// ============================================================

// ---- USERS ----
async function getUsers() {
  return await apiCall('getUsers');
}
async function saveUsers(users) {
  await apiCall('saveUsers', { users });
}

// ---- SUBJECTS ----
async function loadData() {
  subjects = await apiCall('getSubjects');
  // parse JSON fields
  subjects = subjects.map(s => ({
    ...s,
    strength: parseInt(s.strength) || 58,
    timetable: s.timetable ? JSON.parse(s.timetable) : [],
    notes: s.notes ? JSON.parse(s.notes) : [],
    resources: s.resources ? JSON.parse(s.resources) : [],
    syllabus: s.syllabus ? JSON.parse(s.syllabus) : null,
  }));
}
async function saveData() {
  // subjects array is global
  await apiCall('saveSubjects', { subjects });
}

// ---- ATTENDANCE ----
async function loadAttendanceData() {
  const records = await apiCall('getAttendance');
  attendanceData = {};
  records.forEach(r => {
    const key = r.subjectId + '_' + r.date;
    attendanceData[key] = {
      subjectId: r.subjectId,
      date: r.date,
      absent: new Set(JSON.parse(r.absent || '[]')),
    };
  });
}
async function saveAttendanceData() {
  const toStore = [];
  for (const key in attendanceData) {
    const rec = attendanceData[key];
    toStore.push({
      id: rec.id || generateId(),
      subjectId: rec.subjectId,
      date: rec.date,
      absent: Array.from(rec.absent || []),
    });
  }
  await apiCall('saveAttendance', { attendance: toStore });
}

// ---- ANNOUNCEMENTS ----
async function loadAnnouncements() {
  announcements = await apiCall('getAnnouncements');
}
async function saveAnnouncements() {
  await apiCall('saveAnnouncements', { announcements });
}

// ---- SETTINGS ----
async function loadSettings() {
  const settings = await apiCall('getSettings');
  // write to localStorage for fallback
  if (settings.academicYear) setAcademicYear(settings.academicYear);
  if (settings.semesterType) setSemesterType(settings.semesterType);
  if (settings.branches) setBranches(JSON.parse(settings.branches));
  if (settings.divisions) setDivisions(JSON.parse(settings.divisions));
  if (settings.semesters) setSemesters(JSON.parse(settings.semesters));
}
async function saveSettingsToBackend() {
  const settings = {
    academicYear: getAcademicYear(),
    semesterType: getSemesterType(),
    branches: JSON.stringify(getBranches()),
    divisions: JSON.stringify(getDivisions()),
    semesters: JSON.stringify(getSemesters()),
  };
  await apiCall('saveSettings', { settings });
}

// ---- RESET PASSWORD ----
async function resetPassword(email, newPassword) {
  await apiCall('resetPassword', { email, newPassword });
}

// ---- GENERATE ID ----
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// ============================================================
//  MODIFY EXISTING FUNCTIONS TO USE ASYNC
// ============================================================
// You'll need to make all the functions that call these async.
// For a quick transition, you can wrap the old synchronous code
// inside async/await, but the easiest is to keep the localStorage
// version for now and only switch when you're ready.
// 
// I'll provide a full working HTML file that uses the API.
// See the final step below.
