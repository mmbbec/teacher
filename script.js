/**
 * ACADEMIC MANAGEMENT SYSTEM (AMS) - PHASE 1: STEP 1
 * Core Academic Mapping Architecture + Google Apps Script Integration
 */

// ==========================================
// PASTE YOUR GOOGLE APPS SCRIPT WEB APP LINK HERE:
// ==========================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwmL2-U9M7Q38noJonZ4q8M1l5PgD_C4n5LQaYThhxUOg3CZ4wcTJhHjwZoWsLBB55p/exec"; 
// Example format: "https://script.google.com/macros/s/AKfycbx.../exec"

/**
 * ACADEMIC MANAGEMENT SYSTEM (AMS) - PHASE 1: STEP 1
 * Core Academic Mapping + BEC Professional Subject Management
 */

// ==========================================
// 1. STORAGE ABSTRACTION LAYER
// ==========================================
const Storage = {
  KEYS: {
    ACADEMIC_YEARS: 'AMS_ACADEMIC_YEARS',
    SEMESTER_TYPES: 'AMS_SEMESTER_TYPES',
    SEMESTERS: 'AMS_SEMESTERS',
    BRANCHES: 'AMS_BRANCHES',
    DIVISIONS: 'AMS_DIVISIONS',
    CLASSES: 'AMS_CLASSES',
    SUBJECTS: 'AMS_SUBJECTS'
  },

  getCollection(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return [];
    }
  },

  saveCollection(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
      return false;
    }
  },

  findRecord(key, predicate) {
    const collection = this.getCollection(key);
    return collection.find(predicate) || null;
  },

  addRecord(key, record) {
    const collection = this.getCollection(key);
    collection.push(record);
    this.saveCollection(key, collection);
    return record;
  },

  updateRecord(key, recordId, updates) {
    const collection = this.getCollection(key);
    const idx = collection.findIndex(r => r.recordId === recordId);
    if (idx === -1) return null;
    collection[idx] = { ...collection[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCollection(key, collection);
    return collection[idx];
  },

  clearAllData() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },

  // Remote Google Apps Script bridge (optional)
  async syncToGoogleSheet(action, payload) {
    // Placeholder if you want to integrate GAS later
    console.log('Sync to GAS:', action, payload);
  }
};

// ==========================================
// 2. MASTER DATA MODULE
// ==========================================
const AcademicModule = {
  defaultMasterData: {
    academicYears: ['2026-27', '2027-28', '2028-29'],
    semesterTypes: ['ODD', 'EVEN', 'SUMMER'],
    semesters: ['1', '2', '3', '4', '5', '6', '7', '8'],
    branches: ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'CE', 'AI&ML', 'DS', 'IT', 'ECM'],
    divisions: ['A', 'B', 'C', 'D']
  },

  initMasterData() {
    if (Storage.getCollection(Storage.KEYS.ACADEMIC_YEARS).length === 0) {
      Storage.saveCollection(Storage.KEYS.ACADEMIC_YEARS, this.defaultMasterData.academicYears);
    }
    if (Storage.getCollection(Storage.KEYS.SEMESTER_TYPES).length === 0) {
      Storage.saveCollection(Storage.KEYS.SEMESTER_TYPES, this.defaultMasterData.semesterTypes);
    }
    if (Storage.getCollection(Storage.KEYS.SEMESTERS).length === 0) {
      Storage.saveCollection(Storage.KEYS.SEMESTERS, this.defaultMasterData.semesters);
    }
    if (Storage.getCollection(Storage.KEYS.BRANCHES).length === 0) {
      Storage.saveCollection(Storage.KEYS.BRANCHES, this.defaultMasterData.branches);
    }
    if (Storage.getCollection(Storage.KEYS.DIVISIONS).length === 0) {
      Storage.saveCollection(Storage.KEYS.DIVISIONS, this.defaultMasterData.divisions);
    }
  },

  getMasterData() {
    return {
      academicYears: Storage.getCollection(Storage.KEYS.ACADEMIC_YEARS),
      semesterTypes: Storage.getCollection(Storage.KEYS.SEMESTER_TYPES),
      semesters: Storage.getCollection(Storage.KEYS.SEMESTERS),
      branches: Storage.getCollection(Storage.KEYS.BRANCHES),
      divisions: Storage.getCollection(Storage.KEYS.DIVISIONS)
    };
  }
};

// ==========================================
// 3. CLASS MANAGER (unchanged)
// ==========================================
const ClassManager = {
  generateUUID() {
    return 'cls_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  },

  generateClassKey(ay, semType, sem, branch, div) {
    const compactAY = ay.replace(/[^0-9]/g, '');
    const cleanAY = compactAY.length === 6 ? compactAY.substring(2) : compactAY;
    return `${cleanAY}|${semType.toUpperCase()}|${sem}|${branch.toUpperCase()}|${div.toUpperCase()}`;
  },

  generateClassCode(ay, semType, sem, branch, div) {
    const compactAY = ay.replace(/[^0-9]/g, '');
    const cleanAY = compactAY.length === 6 ? compactAY.substring(2) : compactAY;
    const semPadded = String(sem).padStart(2, '0');
    return `AY${cleanAY}-${semType.toUpperCase()}-S${semPadded}-${branch.toUpperCase()}-${div.toUpperCase()}`;
  },

  findOrCreateClass(params) {
    const { academicYear, semesterType, semester, branch, division, studentStrength } = params;
    const classKey = this.generateClassKey(academicYear, semesterType, semester, branch, division);
    const existingClass = Storage.findRecord(Storage.KEYS.CLASSES, c => c.classKey === classKey);

    if (existingClass) {
      return { status: 'EXISTING', classRecord: existingClass, message: 'Existing Class Found' };
    }

    const newClass = {
      recordId: this.generateUUID(),
      classKey,
      classCode: this.generateClassCode(academicYear, semesterType, semester, branch, division),
      academicYear,
      semesterType: semesterType.toUpperCase(),
      semester: String(semester),
      branch: branch.toUpperCase(),
      division: division.toUpperCase(),
      studentStrength: parseInt(studentStrength, 10) || 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    Storage.addRecord(Storage.KEYS.CLASSES, newClass);
    Storage.syncToGoogleSheet('findOrCreateClass', params);
    return { status: 'CREATED', classRecord: newClass, message: 'New Class Created Successfully' };
  }
};

// ==========================================
// 4. SUBJECT MANAGER — PROFESSIONAL BEC
// ==========================================
const SubjectManager = {
  generateUUID() {
    return 'sub_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  },

  generateSubjectId(classCode, subjectCode) {
    const clean = subjectCode.trim().toUpperCase().replace(/\s+/g, '');
    return `${classCode}-${clean}`;
  },

  addSubject(classRecord, subjectData) {
    const {
      subjectCode,
      subjectName,
      category = 'ES',
      subjectType = 'Theory',
      credits = 3,
      lectureHours = 3,
      tutorialHours = 0,
      practicalHours = 0,
      prerequisites = [],
      courseOutcomes = [],
      syllabusBrief = ''
    } = subjectData;

    const cleanCode = subjectCode.trim().toUpperCase().replace(/\s+/g, '');
    const cleanName = subjectName.trim();

    if (!cleanCode || !cleanName) {
      throw new Error('Subject code and subject name are required.');
    }

    // Duplicate prevention
    const existing = Storage.findRecord(
      Storage.KEYS.SUBJECTS,
      s => s.classRecordId === classRecord.recordId && s.subjectCode === cleanCode
    );
    if (existing) {
      throw new Error('This subject already exists for this class.');
    }

    const subjectId = this.generateSubjectId(classRecord.classCode, cleanCode);
    const newSubject = {
      recordId: this.generateUUID(),
      subjectId,
      classRecordId: classRecord.recordId,
      classCode: classRecord.classCode,
      subjectCode: cleanCode,
      subjectName: cleanName,
      category,
      subjectType,
      credits: Number(credits) || 0,
      lectureHours: Number(lectureHours) || 0,
      tutorialHours: Number(tutorialHours) || 0,
      practicalHours: Number(practicalHours) || 0,
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      courseOutcomes: Array.isArray(courseOutcomes) ? courseOutcomes : [],
      syllabusBrief: syllabusBrief || '',
      teacherId: null,
      teacherName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    Storage.addRecord(Storage.KEYS.SUBJECTS, newSubject);
    Storage.syncToGoogleSheet('addSubject', newSubject);
    return newSubject;
  },

  updateSubject(recordId, updates) {
    return Storage.updateRecord(Storage.KEYS.SUBJECTS, recordId, updates);
  },

  getSubjectsByClass(classRecordId) {
    const all = Storage.getCollection(Storage.KEYS.SUBJECTS);
    return all.filter(s => s.classRecordId === classRecordId);
  },

  getSubject(recordId) {
    return Storage.findRecord(Storage.KEYS.SUBJECTS, s => s.recordId === recordId);
  }
};

// ==========================================
// 5. UI CONTROLLER (enhanced)
// ==========================================
const UIController = {
  activeClass: null,
  prereqList: [],
  outcomeList: [],
  bannerTimer: null,

  init() {
    AcademicModule.initMasterData();
    this.populateDropdowns();
    this.bindEvents();
    this.renderTables();
    this.updateSubjectFormVisibility();
  },

  populateDropdowns() {
    const master = AcademicModule.getMasterData();
    const fillSelect = (id, items) => {
      const el = document.getElementById(id);
      el.innerHTML = items.map(item => `<option value="${item}">${item}</option>`).join('');
    };
    fillSelect('academicYear', master.academicYears);
    fillSelect('semesterType', master.semesterTypes);
    fillSelect('semester', master.semesters);
    fillSelect('branch', master.branches);
    fillSelect('division', master.divisions);

    document.getElementById('academicYear').value = '2026-27';
    document.getElementById('semesterType').value = 'ODD';
    document.getElementById('semester').value = '3';
    document.getElementById('branch').value = 'CSE';
    document.getElementById('division').value = 'A';
  },

  bindEvents() {
    // Class Form
    document.getElementById('classForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        academicYear: document.getElementById('academicYear').value,
        semesterType: document.getElementById('semesterType').value,
        semester: document.getElementById('semester').value,
        branch: document.getElementById('branch').value,
        division: document.getElementById('division').value,
        studentStrength: document.getElementById('studentStrength').value
      };
      const result = ClassManager.findOrCreateClass(payload);
      this.activeClass = result.classRecord;
      this.showBanner(`${result.message} — Class Code: <strong>${result.classRecord.classCode}</strong>`, 'success');
      this.renderActiveClass();
      this.renderTables();
      this.updateSubjectFormVisibility();
    });

    // Subject Form
    document.getElementById('subjectForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.activeClass) {
        this.showBanner('Please find or create a class first.', 'error');
        return;
      }

      const subjectData = {
        subjectCode: document.getElementById('subjectCode').value,
        subjectName: document.getElementById('subjectName').value,
        category: document.getElementById('subjectCategory').value,
        subjectType: document.getElementById('subjectType').value,
        credits: document.getElementById('credits').value,
        lectureHours: document.getElementById('lectureHours').value,
        tutorialHours: document.getElementById('tutorialHours').value,
        practicalHours: document.getElementById('practicalHours').value,
        prerequisites: [...this.prereqList],
        courseOutcomes: [...this.outcomeList],
        syllabusBrief: document.getElementById('syllabusBrief').value
      };

      try {
        const created = SubjectManager.addSubject(this.activeClass, subjectData);
        this.showBanner(`Subject Added: <strong>${created.subjectId}</strong> (${created.category})`, 'success');
        // Reset fields except category/type
        document.getElementById('subjectCode').value = '';
        document.getElementById('subjectName').value = '';
        document.getElementById('credits').value = '3';
        document.getElementById('lectureHours').value = '3';
        document.getElementById('tutorialHours').value = '0';
        document.getElementById('practicalHours').value = '0';
        document.getElementById('syllabusBrief').value = '';
        this.prereqList = [];
        this.outcomeList = [];
        this.renderPrereqTags();
        this.renderOutcomeList();
        this.renderTables();
      } catch (err) {
        this.showBanner(err.message, 'error');
      }
    });

    // Prerequisites add/remove
    document.getElementById('addPrereqBtn').addEventListener('click', () => {
      const input = document.getElementById('prereqInput');
      const val = input.value.trim().toUpperCase();
      if (!val) return;
      if (this.prereqList.includes(val)) {
        this.showBanner('Prerequisite already added.', 'error');
        return;
      }
      this.prereqList.push(val);
      input.value = '';
      this.renderPrereqTags();
    });
    document.getElementById('prereqInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addPrereqBtn').click(); }
    });

    // Course Outcomes add/remove
    document.getElementById('addOutcomeBtn').addEventListener('click', () => {
      const input = document.getElementById('outcomeInput');
      const val = input.value.trim();
      if (!val) return;
      this.outcomeList.push(val);
      input.value = '';
      this.renderOutcomeList();
    });
    document.getElementById('outcomeInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addOutcomeBtn').click(); }
    });

    // Clear Data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all local test classes and subjects?')) {
        Storage.clearAllData();
        AcademicModule.initMasterData();
        this.activeClass = null;
        this.prereqList = [];
        this.outcomeList = [];
        this.renderActiveClass();
        this.renderTables();
        this.updateSubjectFormVisibility();
        this.renderPrereqTags();
        this.renderOutcomeList();
        this.showBanner('Test data cleared successfully.', 'success');
      }
    });
  },

  renderActiveClass() {
    const box = document.getElementById('activeClassDetails');
    const form = document.getElementById('subjectForm');
    if (!this.activeClass) {
      box.innerHTML = '<em>No class selected. Find or create a class above.</em>';
      box.classList.add('muted');
      form.classList.add('hidden');
      return;
    }
    box.classList.remove('muted');
    box.innerHTML = `
      <p><strong>Active Class:</strong> ${this.activeClass.classCode}</p>
      <p><strong>Strength:</strong> ${this.activeClass.studentStrength}</p>
      <p><strong>Semester:</strong> ${this.activeClass.semester} (${this.activeClass.semesterType})</p>
      <p><strong>Branch:</strong> ${this.activeClass.branch} - Div ${this.activeClass.division}</p>
      <p><strong>Record ID:</strong> <small>${this.activeClass.recordId}</small></p>
    `;
    form.classList.remove('hidden');
  },

  updateSubjectFormVisibility() {
    const form = document.getElementById('subjectForm');
    if (this.activeClass) {
      form.classList.remove('hidden');
    } else {
      form.classList.add('hidden');
    }
  },

  renderPrereqTags() {
    const container = document.getElementById('prereqTags');
    container.innerHTML = this.prereqList.map(p => `
      <span class="prereq-tag">
        ${p}
        <span class="remove-prereq" data-code="${p}">&times;</span>
      </span>
    `).join('');
    container.querySelectorAll('.remove-prereq').forEach(el => {
      el.addEventListener('click', () => {
        const code = el.dataset.code;
        this.prereqList = this.prereqList.filter(p => p !== code);
        this.renderPrereqTags();
      });
    });
  },

  renderOutcomeList() {
    const container = document.getElementById('outcomeList');
    container.innerHTML = this.outcomeList.map((o, i) => `
      <div class="outcome-item">
        <span><strong>CO${i + 1}:</strong> ${o}</span>
        <span class="remove-outcome" data-index="${i}">&times;</span>
      </div>
    `).join('');
    container.querySelectorAll('.remove-outcome').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        this.outcomeList.splice(idx, 1);
        this.renderOutcomeList();
      });
    });
  },

  renderTables() {
    const classes = Storage.getCollection(Storage.KEYS.CLASSES);
    const subjects = Storage.getCollection(Storage.KEYS.SUBJECTS);

    document.getElementById('totalClassesCount').textContent = classes.length;
    document.getElementById('totalSubjectsCount').textContent = subjects.length;

    const classTbody = document.querySelector('#classesTable tbody');
    classTbody.innerHTML = classes.map(c => `
      <tr>
        <td><strong>${c.classCode}</strong></td>
        <td>${c.academicYear}</td>
        <td>${c.semester} (${c.semesterType})</td>
        <td>${c.branch}</td>
        <td>${c.division}</td>
        <td>${c.studentStrength}</td>
      </tr>
    `).join('');

    const subTbody = document.querySelector('#subjectsTable tbody');
    subTbody.innerHTML = subjects.map(s => {
      const ltp = `${s.lectureHours || 0}/${s.tutorialHours || 0}/${s.practicalHours || 0}`;
      const catClass = (s.category || 'es').toLowerCase();
      return `
        <tr>
          <td><strong>${s.subjectId}</strong></td>
          <td>${s.subjectCode}</td>
          <td>${s.subjectName}</td>
          <td><span class="bec-badge ${catClass}">${s.category || 'ES'}</span></td>
          <td>${s.subjectType || '—'}</td>
          <td>${s.credits || 0}</td>
          <td>${ltp}</td>
          <td>${s.classCode}</td>
        </tr>
      `;
    }).join('');
  },

  showBanner(message, type) {
    const banner = document.getElementById('statusBanner');
    banner.className = `banner banner-${type}`;
    banner.innerHTML = message;
    banner.classList.remove('hidden');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => banner.classList.add('hidden'), 6000);
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  UIController.init();
});
