# Firestore Security Specification: Multi-Tenant School & Quran Management SaaS

This document outlines the security invariants, threat vector payloads, and the test specification for the Firestore Security Rules of the Multi-Tenant School & Quran Management SaaS.

---

## 1. Security Invariants & Core Guarantees

### Multi-Tenant Isolation
- **Organization Boundary Enclosure**: No user belonging to `Organization A` may read, list, create, update, or delete any resource housed under `Organization B`'s Firestore path (`/organizations/{orgId}/**`).
- **Data Cross-Pollination Denial**: Direct collection queries or subcollection listings must be strictly scoped to the user's registered `organizationId` from their `/users/{userId}` profile.
- **Subcollection Ownership Lock**: All nested resources (students, teachers, subjects, rooms, attendance, finance, exams) are paths relative to the organization, and validation mandates matching tenant IDs.

### Least-Privilege Role Isolation
- **Super Admin Sovereignty**: Identified only by designated UID (`oCETlElgWMNrn8ZsSELl1Vsdr0B2`) or explicitly verified `superadmin` database role, Super Admins can read, list, create, update, and delete all resources globally.
- **Organization Admin Controls**: `schooladmin` and `quranadmin` roles have read/write permissions for all collections within their own organization. They are strictly forbidden from performing hard deletes on finance, student, or teacher documents.
- **Teacher Operational Boundaries**:
  - **Student Directory Protection**: Teachers can view student directories inside their organization but cannot modify student records or tuition fees.
  - **Subject Ownership Enclosure**: Teachers can only view subjects where they are the designated `teacherId`.
  - **Attendance Record Isolation**: Teachers can only read, create, or update attendance records for subjects/classes they teach.
  - **Exam Results Gating**: Teachers can only submit or update results for exams matching subjects they teach. They cannot publish exam results or read unpublished results of subjects they do not teach.
- **Public Results Gating**: Unauthenticated users can perform a limited `collectionGroup` search on published exam results, filtering precisely by a single `studentId`. General scraping or cross-tenant query execution is strictly denied.

### Write Integrity & Validation
- **Path-Variable Verification**: Any request to write a resource must have a schema ID matching the document path ID.
- **Type and Range Hardening**: Numeric values (fees, salaries, average scores) must be positive integers or floats. Categorical strings must conform strictly to defined enumerations.
- **User Record Security**: Users can never elevate their own role or switch their organization association.

---

## 2. The "Dirty Dozen" Attack Payloads

These 12 payloads represent critical threat vectors designed to compromise tenant boundary, identity, integrity, and state transition laws. All twelve must be rejected with `PERMISSION_DENIED`.

### Vector 1: Cross-Tenant Resource Extraction
- **Target Path**: `/organizations/org-b-islamic/students/stu-malicious`
- **Identity**: Authenticated user belonging to `org-a-academy` (School Admin role).
- **Attack Intent**: School Admin of Org A tries to create or read a student document under Org B's subcollection.
- **Payload**:
  ```json
  {
    "id": "stu-malicious",
    "studentId": "STU-9999",
    "fullName": "Leaked Student Info",
    "gender": "male",
    "fee": 150,
    "organizationId": "org-b-islamic",
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

### Vector 2: Organization Association Hijacking
- **Target Path**: `/organizations/org-a-academy/students/stu-hijacked`
- **Identity**: Authenticated user belonging to `org-b-islamic` (Quran Admin role).
- **Attack Intent**: Quran Admin of Org B tries to create a student under Org A's path but injects `organizationId: "org-b-islamic"` into the payload to try and bypass path matching.
- **Payload**:
  ```json
  {
    "id": "stu-hijacked",
    "studentId": "STU-8888",
    "fullName": "Bypassed Student",
    "gender": "female",
    "fee": 100,
    "organizationId": "org-b-islamic",
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

### Vector 3: Self-Elevation of Role Claim
- **Target Path**: `/users/teacher-uid`
- **Identity**: Authenticated user `teacher-uid` (currently Teacher role).
- **Attack Intent**: A teacher attempts to update their own role profile to `schooladmin` or `superadmin` directly via Firestore client SDK.
- **Payload**:
  ```json
  {
    "uid": "teacher-uid",
    "email": "teacher@academy.org",
    "fullName": "Rebellious Teacher",
    "role": "schooladmin",
    "organizationId": "org-a-academy",
    "active": true,
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

### Vector 4: Foreign Tenant Swapping
- **Target Path**: `/users/admin-uid`
- **Identity**: Authenticated user `admin-uid` (currently School Admin of `org-a-academy`).
- **Attack Intent**: School Admin of Org A tries to change their profile's `organizationId` to `org-b-islamic` to hijack Org B's database.
- **Payload**:
  ```json
  {
    "uid": "admin-uid",
    "email": "admin@academy.org",
    "fullName": "Academy Admin",
    "role": "schooladmin",
    "organizationId": "org-b-islamic",
    "active": true,
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

### Vector 5: Teacher Hijacking Non-Assigned Subject
- **Target Path**: `/organizations/org-a-academy/subjects/sub-chemistry` (Assigned to `teacher-bob`)
- **Identity**: Authenticated user `teacher-alice` (Teacher role, belonging to `org-a-academy`).
- **Attack Intent**: Teacher Alice tries to edit/write subject details for Chemistry, which is assigned to Teacher Bob.
- **Payload**:
  ```json
  {
    "id": "sub-chemistry",
    "name": "Advanced Chemistry",
    "teacherId": "teacher-alice",
    "roomId": "room-101",
    "startTime": "09:00",
    "endTime": "10:30",
    "capacity": 30,
    "organizationId": "org-a-academy"
  }
  ```

### Vector 6: Attendance Record Teacher Forgery
- **Target Path**: `/organizations/org-a-academy/attendance/att-math-1`
- **Identity**: Authenticated user `teacher-alice` (Teacher role, belonging to `org-a-academy`).
- **Attack Intent**: Teacher Alice tries to submit an attendance record claiming to be submitted on behalf of `teacher-bob` to spoof audit trails.
- **Payload**:
  ```json
  {
    "id": "att-math-1",
    "date": "2026-06-26",
    "roomId": "room-101",
    "subjectId": "sub-math",
    "teacherId": "teacher-bob",
    "organizationId": "org-a-academy",
    "records": [],
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

### Vector 7: Mass Student Records Scraping (Public)
- **Target Path**: `/organizations/org-a-academy/students` (List query)
- **Identity**: Unauthenticated User (Public Result Portal).
- **Attack Intent**: A malicious script attempts to fetch all student profiles without filtering by a single specific student ID.
- **Query**: `db.collectionGroup('students').get()`
- **Payload**: N/A (Read listing without filtering).

### Vector 8: Unauthorized Access to Financial Tuitions
- **Target Path**: `/organizations/org-a-academy/fees/fee-stu-1`
- **Identity**: Authenticated user `teacher-alice` (Teacher role, belonging to `org-a-academy`).
- **Attack Intent**: Teacher Alice tries to read student financial ledger data (Tuition Fee documents).
- **Payload**: N/A (Unauthorized Read request).

### Vector 9: Unauthorized Destruction of Financial Record
- **Target Path**: `/organizations/org-a-academy/fees/fee-stu-1`
- **Identity**: Authenticated user `admin-uid` (School Admin role, belonging to `org-a-academy`).
- **Attack Intent**: Organization Admin tries to delete an active fee record to hide accounting discrepancies (Hard deletes are only allowed for Super Admins).
- **Payload**: N/A (Unauthorized Delete request).

### Vector 10: Unauthorized Modification of Salary Document
- **Target Path**: `/organizations/org-a-academy/salary/sal-alice-1`
- **Identity**: Authenticated user `teacher-alice` (Teacher role, belonging to `org-a-academy`).
- **Attack Intent**: Teacher Alice attempts to increase their own payroll salary value on their pending salary document.
- **Payload**:
  ```json
  {
    "id": "sal-alice-1",
    "teacherId": "teacher-alice",
    "teacherName": "Alice Cooper",
    "amount": 9500,
    "status": "pending",
    "month": "June 2026",
    "organizationId": "org-a-academy"
  }
  ```

### Vector 11: Spoofed Exam Grade Submission
- **Target Path**: `/organizations/org-a-academy/exam_results/res-math-1`
- **Identity**: Authenticated user `teacher-alice` (Teacher role, belonging to `org-a-academy`).
- **Attack Intent**: Teacher Alice tries to submit marks for Chemistry (`sub-chemistry`), which she does not teach.
- **Payload**:
  ```json
  {
    "id": "res-math-1",
    "examId": "exam-math",
    "examTitle": "Algebra Final",
    "subjectId": "sub-chemistry",
    "organizationId": "org-a-academy",
    "results": [
      { "studentId": "stu-1", "studentName": "Bob", "marks": 100, "grade": "A+" }
    ],
    "average": 100,
    "published": false,
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

### Vector 12: Super Admin Verification Email Bypass
- **Target Path**: `/organizations/org-a-academy/students/stu-1` (Create Student)
- **Identity**: Authenticated user with email `fake-admin@academy.org`, claim `superadmin`, but email is unverified.
- **Attack Intent**: A malicious user with an unverified email attempts to bypass validation. (If verification is enforced or if they are not the real Super Admin UID).
- **Payload**:
  ```json
  {
    "id": "stu-1",
    "studentId": "STU-1111",
    "fullName": "Fake Student",
    "gender": "male",
    "fee": 100,
    "organizationId": "org-a-academy",
    "createdAt": "2026-06-26T12:00:00Z"
  }
  ```

---

## 3. Test Specification

The accompanying `firestore.rules.test.ts` test suite uses the official Firebase Rules Testing Library to model, execute, and assert rejection (`PERMISSION_DENIED`) on all 12 of the above payload vectors, as well as positive permissions for valid state flows.
