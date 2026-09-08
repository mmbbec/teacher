/**
 * ACADEMIC MANAGEMENT SYSTEM (AMS) - PHASE 1: STEP 1
 * Core Academic Mapping Architecture
 */

// ==========================================
// 1. STORAGE ABSTRACTION LAYER (storage.js equivalent)
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

  clearAllData() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// ==========================================
// 2. MASTER DATA MODULE (academic.js equivalent)
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
// 3. CLASS MANAGER (class-manager.js equivalent)
// ==========================================
const ClassManager = {
  // Generates unique recordId
  generateUUID() {
    return 'cls_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  },

  // Generates normalized search key: 2627|ODD|3|CSE|A
  generateClassKey(ay, semType, sem, branch, div) {
    const compactAY = ay.replace(/[^0-9]/g, ''); // "2026-27" -> "202627", extracts numbers
    const cleanAY = compactAY.length === 6 ? compactAY.substring(2) : compactAY; // "2627"
    return `${cleanAY}|${semType.toUpperCase()}|${sem}|${branch.toUpperCase()}|${div.toUpperCase()}`;
  },

  // Generates deterministic user-facing Class Code: AY2627-ODD-S03-CSE-A
  generateClassCode(ay, semType, sem, branch, div) {
    const compactAY = ay.replace(/[^0-9]/g, '');
    const cleanAY = compactAY.length === 6 ? compactAY.substring(2) : compactAY;
    const semPadded = String(sem).padStart(2, '0');
    return `AY${cleanAY}-${semType.toUpperCase()}-S${semPadded}-${branch.toUpperCase()}-${div.toUpperCase()}`;
  },

  /**
   * Core logic: Finds existing class or creates a new deterministic class
   */
  findOrCreateClass(params) {
    const { academicYear, semesterType, semester, branch, division, studentStrength } = params;

    const classKey = this.generateClassKey(academicYear, semesterType, semester, branch, division);
    const existingClass = Storage.findRecord(Storage.KEYS.CLASSES, c => c.classKey === classKey);

    if (existingClass) {
      return {
        status: 'EXISTING',
        classRecord: existingClass,
        message: 'Existing Class Found'
      };
    }

    const newClass = {
      recordId: this.generateUUID(),
      classKey: classKey,
      classCode: this.generateClassCode(academicYear, semesterType, semester, branch, division),
      academicYear: academicYear,
      semesterType: semesterType.toUpperCase(),
      semester: String(semester),
      branch: branch.toUpperCase(),
      division: division.toUpperCase(),
      studentStrength: parseInt(studentStrength, 10) || 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    Storage.addRecord(Storage.KEYS.CLASSES, newClass);

    return {
      status: 'CREATED',
      classRecord: newClass,
      message: 'New Class Created Successfully'
    };
  }
};

// ==========================================
// 4. SUBJECT MANAGER (subject-manager.js equivalent)
// ==========================================
const SubjectManager = {
  generateUUID() {
    return 'sub_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  },

  // Generates deterministic Subject ID: ClassCode-SubjectCode
  generateSubjectId(classCode, subjectCode) {
    const cleanSubjectCode = subjectCode.trim().toUpperCase().replace(/\s+/g, '');
    return `${classCode}-${cleanSubjectCode}`;
  },

  /**
   * Adds subject to class with strict duplicate prevention per class
   */
  addSubject(classRecord, rawCode, rawName) {
    const cleanCode = rawCode.trim().toUpperCase().replace(/\s+/g, '');
    const cleanName = rawName.trim();

    if (!cleanCode || !cleanName) {
      throw new Error('Subject code and subject name are required.');
    }

    const subjectId = this.generateSubjectId(classRecord.classCode, cleanCode);

    // Rule: Duplicate prevention within the same class
    const existingSubject = Storage.findRecord(
      Storage.KEYS.SUBJECTS,
      s => s.classRecordId === classRecord.recordId && s.subjectCode === cleanCode
    );

    if (existingSubject) {
      throw new Error('This subject already exists for this class.');
    }

    const newSubject = {
      recordId: this.generateUUID(),
      subjectId: subjectId,
      classRecordId: classRecord.recordId,
      classCode: classRecord.classCode,
      subjectCode: cleanCode,
      subjectName: cleanName,
      teacherId: null,
      teacherName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    Storage.addRecord(Storage.KEYS.SUBJECTS, newSubject);

    return newSubject;
  }
};

// ==========================================
// 5. UI CONTROLLER & TEST HARNESS
// ==========================================
const UIController = {
  activeClass: null,

  init() {
    AcademicModule.initMasterData();
    this.populateDropdowns();
    this.bindEvents();
    this.renderTables();
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

    // Defaults for testing
    document.getElementById('academicYear').value = '2026-27';
    document.getElementById('semesterType').value = 'ODD';
    document.getElementById('semester').value = '3';
    document.getElementById('branch').value = 'CSE';
    document.getElementById('division').value = 'A';
  },

  bindEvents() {
    // Class Form Submit
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
    });

    // Subject Form Submit
    document.getElementById('subjectForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.activeClass) {
        this.showBanner('Please find or create a class first.', 'error');
        return;
      }

      const code = document.getElementById('subjectCode').value;
      const name = document.getElementById('subjectName').value;

      try {
        const createdSubject = SubjectManager.addSubject(this.activeClass, code, name);
        this.showBanner(`Subject Added Successfully: <strong>${createdSubject.subjectId}</strong>`, 'success');
        document.getElementById('subjectCode').value = '';
        document.getElementById('subjectName').value = '';
        this.renderTables();
      } catch (err) {
        this.showBanner(err.message, 'error');
      }
    });

    // Clear Data Button
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all prototype classes and subjects?')) {
        Storage.clearAllData();
        AcademicModule.initMasterData();
        this.activeClass = null;
        this.renderActiveClass();
        this.renderTables();
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
      <p><strong>Record ID:</strong> <small>${this.activeClass.recordId}</small></p>
      <p><strong>Internal Key:</strong> <small>${this.activeClass.classKey}</small></p>
    `;
    form.classList.remove('hidden');
  },

  renderTables() {
    const classes = Storage.getCollection(Storage.KEYS.CLASSES);
    const subjects = Storage.getCollection(Storage.KEYS.SUBJECTS);

    document.getElementById('totalClassesCount').textContent = classes.length;
    document.getElementById('totalSubjectsCount').textContent = subjects.length;

    // Render Classes
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

    // Render Subjects
    const subTbody = document.querySelector('#subjectsTable tbody');
    subTbody.innerHTML = subjects.map(s => `
      <tr>
        <td><strong>${s.subjectId}</strong></td>
        <td>${s.subjectCode}</td>
        <td>${s.subjectName}</td>
        <td>${s.classCode}</td>
      </tr>
    `).join('');
  },

  showBanner(message, type) {
    const banner = document.getElementById('statusBanner');
    banner.className = `banner banner-${type}`;
    banner.innerHTML = message;
    banner.classList.remove('hidden');
  }
};

// Boot Application
document.addEventListener('DOMContentLoaded', () => {
  UIController.init();
});
