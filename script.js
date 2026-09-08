const API_URL =
  'https://script.google.com/macros/s/AKfycbx5HI0dTYaAW4xSAkyLaTZLbk2JLPkBTPpcwGnJKgVNS_gykr3aydu3omtgM3xPJXrV/exec';


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(payload) {

  const response = await fetch(API_URL, {

    method: 'POST',

    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },

    body: JSON.stringify(payload)

  });


  const result = await response.json();

  return result;
}


/* =========================================================
   LOAD SUBJECTS
   ========================================================= */

async function loadSubjects() {

  const tableBody =
    document.getElementById('subjectTableBody');

  try {

    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          Loading...
        </td>
      </tr>
    `;


    const result = await apiRequest({

      action: 'getSubjects'

    });


    if (!result.success) {
      throw new Error(result.message);
    }


    displaySubjects(result.data);


  } catch (error) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;

  }
}


/* =========================================================
   DISPLAY SUBJECTS
   ========================================================= */

function displaySubjects(subjects) {

  const tableBody =
    document.getElementById('subjectTableBody');

  const count =
    document.getElementById('subjectCount');


  count.textContent = subjects.length;


  if (subjects.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">
          No subjects added yet.
        </td>
      </tr>
    `;

    return;
  }


  tableBody.innerHTML = subjects.map(function(subject) {

    return `
      <tr>

        <td>
          ${escapeHtml(subject.subjectCode)}
        </td>

        <td>
          ${escapeHtml(subject.subjectName)}
        </td>

        <td>
          ${escapeHtml(subject.semester)}
        </td>

        <td>
          ${escapeHtml(subject.division)}
        </td>

        <td>

          <button
            class="delete-button"
            onclick="deleteSubject('${subject.id}')"
          >
            Delete
          </button>

        </td>

      </tr>
    `;

  }).join('');
}


/* =========================================================
   SAVE SUBJECT
   ========================================================= */

async function handleSaveSubject(event) {

  event.preventDefault();


  const button =
    document.getElementById('saveButton');

  const message =
    document.getElementById('message');


  const data = {

    subjectCode:
      document.getElementById('subjectCode')
        .value
        .trim(),

    subjectName:
      document.getElementById('subjectName')
        .value
        .trim(),

    semester:
      document.getElementById('semester')
        .value,

    division:
      document.getElementById('division')
        .value

  };


  try {

    button.disabled = true;
    button.textContent = 'Saving...';

    message.textContent = '';


    const result = await apiRequest({

      action: 'saveSubject',

      data: data

    });


    if (!result.success) {
      throw new Error(result.message);
    }


    message.textContent =
      'Subject saved successfully.';


    document
      .getElementById('subjectForm')
      .reset();


    await loadSubjects();


  } catch (error) {

    message.textContent =
      error.message;


  } finally {

    button.disabled = false;
    button.textContent = 'Save Subject';

  }
}


/* =========================================================
   DELETE SUBJECT
   ========================================================= */

async function deleteSubject(id) {

  if (!confirm(
    'Are you sure you want to delete this subject?'
  )) {
    return;
  }


  const message =
    document.getElementById('message');


  try {

    const result = await apiRequest({

      action: 'deleteSubject',

      id: id

    });


    if (!result.success) {
      throw new Error(result.message);
    }


    message.textContent =
      'Subject deleted successfully.';


    await loadSubjects();


  } catch (error) {

    message.textContent =
      error.message;

  }
}


/* =========================================================
   SECURITY HELPER
   ========================================================= */

function escapeHtml(value) {

  return String(value)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#039;');

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

document
  .getElementById('subjectForm')
  .addEventListener(
    'submit',
    handleSaveSubject
  );


document
  .getElementById('refreshButton')
  .addEventListener(
    'click',
    loadSubjects
  );


/* =========================================================
   START APPLICATION
   ========================================================= */

loadSubjects();
