# Academic Management System (AMS) — Phase 1: Step 1

Core Academic Mapping, Deterministic Class ID, Subject ID Generation, and Duplicate Prevention.

---

## 1. Files in this Step

- `index.html`: Responsive, semantic testing interface containing the Class Setup card, Subject Setup card, Live Status Banner, and Real-Time Data Tables.
- `style.css`: Clean, professional, framework-free stylesheet with CSS grid layout and visual hierarchy.
- `script.js`: Modular Vanilla JS architecture separating Storage, Academic Master Data, Class Management, Subject Management, and UI Controller.
- `code.gs`: Google Apps Script implementation illustrating equivalent enterprise sheet/database persistence.

---

## 2. Architecture & Design Principles

### Class ID Generation
The teacher **never** inputs a Class ID. It is generated deterministically by `ClassManager.generateClassCode()`:
`AY{cleanAY}-{SEMTYPE}-S{PaddedSem}-{BRANCH}-{DIV}`

*Example:* `2026-27` + `ODD` + `3` + `CSE` + `A` $\rightarrow$ `AY2627-ODD-S03-CSE-A`.

### Duplicate Class Prevention
A normalized string key is built:
`{cleanAY}|{SEMTYPE}|{Sem}|{BRANCH}|{DIV}` (e.g., `2627|ODD|3|CSE|A`).
Before adding a record, the system queries the storage layer with `findRecord()`. If this normalized key exists:
1. It retrieves the **existing** Class record.
2. It does **not** insert a duplicate row.
3. It sets that class as the active target for subject attachments.

### Subject ID Generation
Generated automatically from the parent Class Code and Subject Code:
`{ClassCode}-{SubjectCode}`

*Example:* `AY2627-ODD-S03-CSE-A-21MAT301`.

### Duplicate Subject Prevention
When adding a subject, `SubjectManager.addSubject()` validates two rules:
1. Searches the database for matching `classRecordId` and `subjectCode`.
2. If found, throws an explicit error: `"This subject already exists for this class."` and rejects creation.

### Student Strength Ownership
Student strength is stored strictly on the `Class` entity (`AMS_CLASSES`), not per subject or per teacher. When different teachers select the same academic parameters to add their respective subjects, they bind to the existing class and inherit the class-level strength.

---

## 3. Step-by-Step Test Procedure

Open `index.html` in any modern web browser:

1. **Test 1 (Initial Creation):** Select `2026-27`, `ODD`, `3`, `CSE`, `A`, strength `60`. Click **[Find / Create Class]**.
   - Result: Creates `AY2627-ODD-S03-CSE-A`.
2. **Test 2 (Idempotency):** Click **[Find / Create Class]** again with same values.
   - Result: Returns "Existing Class Found", total classes count remains `1`.
3. **Test 3 (Subject Add):** Add `21MAT301` / `Mathematics`.
   - Result: Generates `AY2627-ODD-S03-CSE-A-21MAT301`. Total subjects = `1`.
4. **Test 4 (Duplicate Subject Rejection):** Attempt to add `21MAT301` again.
   - Result: Rejection banner: *"This subject already exists for this class."* Total subjects remains `1`.
5. **Test 5 (Multiple Subjects under same Class):** Add `21PHY302` / `Physics`.
   - Result: Generates `AY2627-ODD-S03-CSE-A-21PHY302`. Total subjects = `2`.
6. **Test 6 (Division Isolation):** Change Division to `B` and click Find/Create.
   - Result: Creates separate class `AY2627-ODD-S03-CSE-B`.
7. **Test 7 (Branch Isolation):** Change Branch to `ISE` and click Find/Create.
   - Result: Creates separate class `AY2627-ODD-S03-ISE-A`.
8. **Test 8 (Semester Isolation):** Change Semester to `5` and click Find/Create.
   - Result: Creates `AY2627-ODD-S05-CSE-A`.
9. **Test 9 (Semester Type Isolation):** Change Semester Type to `EVEN` and Semester to `4`.
   - Result: Creates `AY2627-EVEN-S04-CSE-A`.
10. **Test 10 (Academic Year Isolation):** Change Academic Year to `2027-28`.
    - Result: Creates `AY2728-ODD-S03-CSE-A`.
