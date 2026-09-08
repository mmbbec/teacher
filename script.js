const API_URL =
  'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';


/* =========================================================
   API
   ========================================================= */

async function apiRequest(action, data = null) {

  const payload = {
    action: action
  };

  if (data !== null) {
    payload.data = data;
  }

  const response = await fetch(API_URL, {

    method: 'POST',

    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },

    body: JSON.stringify(payload)

  });

  const result =
    await response.json();

  if (!result.success) {

    throw new Error(
      result.message || 'Request failed.'
    );

  }

  return result;

}


/* =========================================================
   HELPERS
   ========================================================= */

function byId(id) {
  return document.getElementById(id);
}


function escapeHtml(value) {

  return String(value)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#039;');

}


function showMessage(id, message) {

  const element = byId(id);

  if (element) {
    element.textContent = message;
  }

}


/* =========================================================
   LOAD TEACHERS
   ========================================================= */

async function loadTeachers() {

  try {

    const result =
      await apiRequest('getTeachers');

    window.erpTeachers =
      result.data || [];

    populateTeacherSelects();

    renderTeacherTable();

  } catch (error) {

    console.error(error);

  }

}


function populateTeacherSelects() {

  const selects = [
    byId('mappingTeacher'),
    byId('resourceTeacher')
  ];

  selects.forEach(function(select) {

    if (!select) return;

    select.innerHTML =
      '<option value="">Select Teacher</option>';

    window.erpTeachers.forEach(function(teacher) {

      select.innerHTML += `
        <option value="${teacher.id}">
          ${escapeHtml(teacher.teacherName)}
        </option>
      `;

    });

  });

}


function renderTeacherTable() {

  const table =
    byId('teacherTable');

  if (!table) return;

  table.innerHTML = '';

  window.erpTeachers.forEach(function(teacher) {

    table.innerHTML += `
      <tr>

        <td>
          ${escapeHtml(teacher.teacherName)}
        </td>

        <td>
          ${escapeHtml(teacher.department)}
        </td>

        <td>
          ${escapeHtml(teacher.email)}
        </td>

      </tr>
    `;

  });

}


/* =========================================================
   LOAD STUDENTS
   ========================================================= */

async function loadStudents() {

  try {

    const result =
      await apiRequest('getStudents');

    window.erpStudents =
      result.data || [];

    renderStudentTable();

  } catch (error) {

    console.error(error);

  }

}


function renderStudentTable() {

  const table =
    byId('studentTable');

  if (!table) return;

  table.innerHTML = '';

  window.erpStudents.forEach(function(student) {

    table.innerHTML += `
      <tr>

        <td>
          ${escapeHtml(student.studentId)}
        </td>

        <td>
          ${escapeHtml(student.branch)}
        </td>

        <td>
          ${escapeHtml(student.semester)}
        </td>

        <td>
          ${escapeHtml(student.division)}
        </td>

      </tr>
    `;

  });

}


/* =========================================================
   LOAD SUBJECTS
   ========================================================= */

async function loadSubjects() {

  try {

    const result =
      await apiRequest('getSubjects');

    window.erpSubjects =
      result.data || [];

    populateSubjectSelects();

    renderSubjectTable();

  } catch (error) {

    console.error(error);

  }

}


function populateSubjectSelects() {

  const selects = [
    byId('mappingSubject'),
    byId('resourceSubject'),
    byId('registrationSubject')
  ];

  selects.forEach(function(select) {

    if (!select) return;

    select.innerHTML =
      '<option value="">Select Subject</option>';

    window.erpSubjects.forEach(function(subject) {

      select.innerHTML += `
        <option value="${subject.id}">
          ${escapeHtml(subject.subjectCode)}
          -
          ${escapeHtml(subject.subjectName)}
        </option>
      `;

    });

  });

}


function renderSubjectTable() {

  const table =
    byId('subjectTable');

  if (!table) return;

  table.innerHTML = '';

  window.erpSubjects.forEach(function(subject) {

    table.innerHTML += `
      <tr>

        <td>
          ${escapeHtml(subject.subjectCode)}
        </td>

        <td>
          ${escapeHtml(subject.subjectName)}
        </td>

        <td>
          ${escapeHtml(subject.branch)}
        </td>

        <td>
          ${escapeHtml(subject.semester)}
        </td>

      </tr>
    `;

  });

}


/* =========================================================
   LOAD MAPPINGS
   ========================================================= */

async function loadMappings() {

  try {

    const result =
      await apiRequest('getMappings');

    window.erpMappings =
      result.data || [];

    renderMappingTable();

  } catch (error) {

    console.error(error);

  }

}


function renderMappingTable() {

  const table =
    byId('mappingTable');

  if (!table) return;

  table.innerHTML = '';

  window.erpMappings.forEach(function(mapping) {

    table.innerHTML += `
      <tr>

        <td>
          ${escapeHtml(mapping.teacherId)}
        </td>

        <td>
          ${escapeHtml(mapping.subjectId)}
        </td>

        <td>
          ${escapeHtml(mapping.branch)}
        </td>

        <td>
          ${escapeHtml(mapping.semester)}
        </td>

        <td>
          ${escapeHtml(mapping.division)}
        </td>

      </tr>
    `;

  });

}


/* =========================================================
   TEACHER FORM
   ========================================================= */

const teacherForm =
  byId('teacherForm');

if (teacherForm) {

  teacherForm.addEventListener(
    'submit',
    async function(event) {

      event.preventDefault();

      try {

        await apiRequest(
          'saveTeacher',
          {

            teacherName:
              byId('teacherName').value.trim(),

            department:
              byId('department').value.trim(),

            email:
              byId('teacherEmail').value.trim()

          }
        );

        showMessage(
          'teacherMessage',
          'Teacher registered successfully.'
        );

        teacherForm.reset();

        await loadTeachers();

      } catch (error) {

        showMessage(
          'teacherMessage',
          error.message
        );

      }

    }
  );

}


/* =========================================================
   SUBJECT FORM
   ========================================================= */

const subjectForm =
  byId('subjectForm');

if (subjectForm) {

  subjectForm.addEventListener(
    'submit',
    async function(event) {

      event.preventDefault();

      try {

        await apiRequest(
          'saveSubject',
          {

            subjectCode:
              byId('subjectCode').value.trim(),

            subjectName:
              byId('subjectName').value.trim(),

            branch:
              byId('subjectBranch').value,

            semester:
              byId('subjectSemester').value

          }
        );

        showMessage(
          'subjectMessage',
          'Subject saved successfully.'
        );

        subjectForm.reset();

        await loadSubjects();

      } catch (error) {

        showMessage(
          'subjectMessage',
          error.message
        );

      }

    }
  );

}


/* =========================================================
   STUDENT FORM
   ========================================================= */

const studentForm =
  byId('studentForm');

if (studentForm) {

  studentForm.addEventListener(
    'submit',
    async function(event) {

      event.preventDefault();

      try {

        await apiRequest(
          'saveStudent',
          {

            studentId:
              byId('studentId').value.trim(),

            branch:
              byId('studentBranch').value,

            semester:
              byId('studentSemester').value,

            division:
              byId('studentDivision').value

          }
        );

        showMessage(
          'studentMessage',
          'Student registered successfully.'
        );

        studentForm.reset();

        await loadStudents();

      } catch (error) {

        showMessage(
          'studentMessage',
          error.message
        );

      }

    }
  );

}


/* =========================================================
   TEACHER MAPPING FORM
   ========================================================= */

const mappingForm =
  byId('mappingForm');

if (mappingForm) {

  mappingForm.addEventListener(
    'submit',
    async function(event) {

      event.preventDefault();

      try {

        await apiRequest(
          'saveTeacherRegistration',
          {

            teacherId:
              byId('mappingTeacher').value,

            subjectId:
              byId('mappingSubject').value,

            branch:
              byId('mappingBranch').value,

            semester:
              byId('mappingSemester').value,

            division:
              byId('mappingDivision').value

          }
        );

        showMessage(
          'mappingMessage',
          'Teacher/class/subject mapping created.'
        );

        mappingForm.reset();

        await loadMappings();

      } catch (error) {

        showMessage(
          'mappingMessage',
          error.message
        );

      }

    }
  );

}


/* =========================================================
   STUDENT SUBJECT FORM
   ========================================================= */

const studentSubjectForm =
  byId('studentSubjectForm');

if (studentSubjectForm) {

  studentSubjectForm.addEventListener(
    'submit',
    async function(event) {

      event.preventDefault();

      try {

        await apiRequest(
          'saveStudentRegistration',
          {

            studentId:
              byId('registrationStudentId')
                .value
                .trim(),

            branch:
              byId('registrationBranch').value,

            semester:
              byId('registrationSemester').value,

            division:
              byId('registrationDivision').value,

            subjectId:
              byId('registrationSubject').value

          }
        );

        showMessage(
          'studentSubjectMessage',
          'Subject registered successfully.'
        );

        studentSubjectForm.reset();

      } catch (error) {

        showMessage(
          'studentSubjectMessage',
          error.message
        );

      }

    }
  );

}


/* =========================================================
   RESOURCE FORM
   ========================================================= */

const resourceForm =
  byId('resourceForm');

if (resourceForm) {

  resourceForm.addEventListener(
    'submit',
    async function(event) {

      event.preventDefault();

      try {

        await apiRequest(
          'saveResource',
          {

            teacherId:
              byId('resourceTeacher').value,

            subjectId:
              byId('resourceSubject').value,

            title:
              byId('resourceTitle')
                .value
                .trim(),

            resourceType:
              byId('resourceType').value,

            url:
              byId('resourceUrl')
                .value
                .trim()

          }
        );

        showMessage(
          'resourceMessage',
          'Resource saved successfully.'
        );

        resourceForm.reset();

      } catch (error) {

        showMessage(
          'resourceMessage',
          error.message
        );

      }

    }
  );

}


/* =========================================================
   LOAD RESOURCES
   ========================================================= */

async function loadStudentResources() {

  const container =
    byId('resourceList');

  if (!container) return;

  try {

    const result =
      await apiRequest('getResources');

    const resources =
      result.data || [];

    container.innerHTML = '';

    if (resources.length === 0) {

      container.innerHTML =
        '<p>No resources available.</p>';

      return;

    }

    resources.forEach(function(resource) {

      container.innerHTML += `
        <div class="resource-item">

          <h3>
            ${escapeHtml(resource.title)}
          </h3>

          <p>
            Type:
            ${escapeHtml(resource.resourceType)}
          </p>

          <a
            href="${escapeHtml(resource.url)}"
            target="_blank"
            rel="noopener"
          >
            Open Resource
          </a>

        </div>
      `;

    });

  } catch (error) {

    container.innerHTML =
      `<p>${escapeHtml(error.message)}</p>`;

  }

}


/* =========================================================
   TEACHER PAGE DATA
   ========================================================= */

async function loadTeacherData() {

  await loadTeachers();

  await loadSubjects();

  await loadMappings();

}


/* =========================================================
   ADMIN DATA
   ========================================================= */

async function loadAdminData() {

  await loadTeachers();

  await loadStudents();

  await loadSubjects();

  await loadMappings();


  if (byId('teacherCount')) {

    byId('teacherCount').textContent =
      window.erpTeachers.length;

  }


  if (byId('studentCount')) {

    byId('studentCount').textContent =
      window.erpStudents.length;

  }


  if (byId('adminSubjectCount')) {

    byId('adminSubjectCount').textContent =
      window.erpSubjects.length;

  }


  if (byId('mappingCount')) {

    byId('mappingCount').textContent =
      window.erpMappings.length;

  }

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    loadTeachers();

    loadStudents();

    loadSubjects();

    loadMappings();

    loadStudentResources();

    loadAdminData();

  }
);
