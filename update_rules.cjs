const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Add hasPermission function
if (!rules.includes('function hasPermission(')) {
  rules = rules.replace(
    /function isStaff\(orgId\) \{\n      return belongsToOrganization\(orgId\) && getUserData\(\)\.role == 'schoolstaff';\n    \}/,
    "function isStaff(orgId) {\n      return belongsToOrganization(orgId) && getUserData().role == 'schoolstaff';\n    }\n\n    // Check if Staff member has specific permission\n    function hasPermission(orgId, permission) {\n      return isStaff(orgId) && \n             'permissions' in getUserData() && \n             (permission in getUserData().permissions || getUserData().permissions.hasAll([permission]));\n    }"
  );
}

// Function to replace with permission checks
function replaceRule(blockName, oldStr, newStr) {
  const index = rules.indexOf(blockName);
  if (index === -1) {
    console.log("Could not find block: " + blockName);
    return;
  }
  const nextBlock = rules.indexOf('// ----', index + 10);
  let chunk = nextBlock !== -1 ? rules.substring(index, nextBlock) : rules.substring(index);
  chunk = chunk.replace(oldStr, newStr);
  rules = rules.substring(0, index) + chunk + (nextBlock !== -1 ? rules.substring(nextBlock) : '');
}

// 1. STUDENTS
replaceRule('// ---- STUDENTS ----', 
  'allow read: if isSuperAdmin() || isOrganizationAdmin(organizationId) || isTeacher(organizationId) || isStaff(organizationId);',
  "allow read: if isSuperAdmin() || isOrganizationAdmin(organizationId) || isTeacher(organizationId) || hasPermission(organizationId, 'Students');"
);
replaceRule('// ---- STUDENTS ----', 
  'allow create: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || isStaff(organizationId)) &&',
  "allow create: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Students')) &&"
);
replaceRule('// ---- STUDENTS ----', 
  'allow update: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || isStaff(organizationId)) &&',
  "allow update: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Edit Students')) &&"
);
// note: delete for students doesn't have isStaff yet: allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId);
replaceRule('// ---- STUDENTS ----', 
  'allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId);',
  "allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Delete Students');"
);

// 2. TEACHERS
// doesn't have isStaff, so we add it to create, update, delete
replaceRule('// ---- TEACHERS ----', 
  'allow create: if (isSuperAdmin() || isOrganizationAdmin(organizationId)) &&',
  "allow create: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Teachers')) &&"
);
replaceRule('// ---- TEACHERS ----', 
  'allow update: if (isSuperAdmin() || isOrganizationAdmin(organizationId)) &&',
  "allow update: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Teachers')) &&"
);
replaceRule('// ---- TEACHERS ----', 
  'allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId);',
  "allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Teachers');"
);

// 3. SUBJECTS
replaceRule('// ---- SUBJECTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");
replaceRule('// ---- SUBJECTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");
replaceRule('// ---- SUBJECTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");
replaceRule('// ---- SUBJECTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')"); // Might be multiple

// 4. CLASS ROOMS
replaceRule('// ---- CLASS ROOMS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");
replaceRule('// ---- CLASS ROOMS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");

// 5. CLASS SESSIONS
replaceRule('// ---- CLASS SESSIONS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");
replaceRule('// ---- CLASS SESSIONS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'School Settings')");

// 6. ATTENDANCE RECORDS
replaceRule('// ---- ATTENDANCE RECORDS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Attendance')");
replaceRule('// ---- ATTENDANCE RECORDS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Attendance')");
replaceRule('// ---- ATTENDANCE RECORDS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Attendance')");
replaceRule('// ---- ATTENDANCE RECORDS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Attendance')");

// 7. TUITION FEES
replaceRule('// ---- TUITION FEES ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Fees')");
replaceRule('// ---- TUITION FEES ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Fees')");
replaceRule('// ---- TUITION FEES ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Fees')");

// 8. SALARIES
replaceRule('// ---- SALARIES ----', 
  'allow create: if (isSuperAdmin() || isOrganizationAdmin(organizationId)) &&',
  "allow create: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Teacher Salary')) &&"
);
replaceRule('// ---- SALARIES ----', 
  'allow update: if (isSuperAdmin() || isOrganizationAdmin(organizationId)) &&',
  "allow update: if (isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Teacher Salary')) &&"
);
replaceRule('// ---- SALARIES ----', 
  'allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId);',
  "allow delete: if isSuperAdmin() || isOrganizationAdmin(organizationId) || hasPermission(organizationId, 'Teacher Salary');"
);

// 9. EXAM SESSIONS
replaceRule('// ---- EXAM SESSIONS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");
replaceRule('// ---- EXAM SESSIONS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");
replaceRule('// ---- EXAM SESSIONS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");

// 10. EXAM RESULTS
replaceRule('// ---- EXAM RESULTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");
replaceRule('// ---- EXAM RESULTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");
replaceRule('// ---- EXAM RESULTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");
replaceRule('// ---- EXAM RESULTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");
replaceRule('// ---- EXAM RESULTS ----', 'isStaff(organizationId)', "hasPermission(organizationId, 'Exams')");

// Also replace globally any remaining isStaff(organizationId)
rules = rules.replace(/isStaff\(organizationId\)/g, "isStaff(organizationId) /* Check manually */");

fs.writeFileSync('firestore.rules', rules);
