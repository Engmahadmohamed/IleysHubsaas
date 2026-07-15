const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import React, { createContext, useContext, useState, useEffect } from 'react';",
  "import React, { createContext, useContext, useState, useEffect } from 'react';\nimport { useQuery } from '@tanstack/react-query';\nimport { queryClient } from '../lib/queryClient';"
);

// 2. Remove the old useState declarations and insert useQuery logic
const stateRegex = /\/\/ States for Database Collections\n(?:  const \[\w+, set\w+\] = useState<.*?\(.*?;\n)+/m;

const useQueryBlock = `  // React Query for Database Collections
  const isSuper = currentUser?.role === 'superadmin';
  const orgId = currentOrg?.id || '';
  const enabled = !!db && !!currentUser && (isSuper || !!orgId);

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', isSuper ? 'all' : orgId],
    queryFn: async () => {
      if (isSuper) {
        const snap = await getDocs(collection(db, 'organizations'));
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Organization));
      } else {
        const snap = await getDoc(doc(db, 'organizations', orgId));
        return snap.exists() ? [{ ...snap.data(), id: snap.id } as Organization] : [];
      }
    },
    enabled: !!db && !!currentUser,
    staleTime: 15 * 60 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', isSuper ? 'all' : orgId],
    queryFn: async () => {
      const q = isSuper ? collection(db, 'users') : query(collection(db, 'users'), where('organizationId', '==', orgId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
    },
    enabled,
    staleTime: 15 * 60 * 1000,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', isSuper ? 'all' : orgId],
    queryFn: async () => {
      const ref = isSuper ? collectionGroup(db, 'students') : collection(db, 'organizations', orgId, 'students');
      const snap = await getDocs(ref);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
    },
    enabled,
    staleTime: 15 * 60 * 1000,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', isSuper ? 'all' : orgId],
    queryFn: async () => {
      const ref = isSuper ? collectionGroup(db, 'teachers') : collection(db, 'organizations', orgId, 'teachers');
      const snap = await getDocs(ref);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Teacher));
    },
    enabled,
    staleTime: 15 * 60 * 1000,
  });

  const { data: classSessions = [] } = useQuery({
    queryKey: ['classSessions', isSuper ? 'all' : orgId],
    queryFn: async () => {
      const ref = isSuper ? collectionGroup(db, 'class_sessions') : collection(db, 'organizations', orgId, 'class_sessions');
      const snap = await getDocs(ref);
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassSession));
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'subjects'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Subject));
    },
    enabled: enabled && !isSuper,
    staleTime: 15 * 60 * 1000,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'rooms'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Room));
    },
    enabled: enabled && !isSuper,
    staleTime: 15 * 60 * 1000,
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendanceRecords', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'attendance'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttendanceRecord));
    },
    enabled: enabled && !isSuper,
    staleTime: 2 * 60 * 1000,
  });

  const { data: feeRecords = [] } = useQuery({
    queryKey: ['feeRecords', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'fees'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as FeeRecord));
    },
    enabled: enabled && !isSuper,
    staleTime: 2 * 60 * 1000,
  });

  const { data: salaryRecords = [] } = useQuery({
    queryKey: ['salaryRecords', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'salary'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as SalaryRecord));
    },
    enabled: enabled && !isSuper,
    staleTime: 2 * 60 * 1000,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['exams', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'exam_sessions'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Exam));
    },
    enabled: enabled && !isSuper,
    staleTime: 5 * 60 * 1000,
  });

  const { data: examResults = [] } = useQuery({
    queryKey: ['examResults', orgId],
    queryFn: async () => {
      if (isSuper) return [];
      const snap = await getDocs(collection(db, 'organizations', orgId, 'exam_results'));
      return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExamResultRecord));
    },
    enabled: enabled && !isSuper,
    staleTime: 2 * 60 * 1000,
  });
`;

content = content.replace(stateRegex, useQueryBlock + '\n');

// 3. Delete the massive useEffect
const useEffectStart = "// 3. Authenticated Mode: Listen to tenant-scoped collections in real-time";
const useEffectEnd = "  }, [currentUser]);\n";

const startIndex = content.indexOf(useEffectStart);
const endIndex = content.indexOf(useEffectEnd, startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex + useEffectEnd.length);
}

// 4. Invalidate queries on writes
// We need to inject queryClient.invalidateQueries(...) into the mutation functions
// Regex to match mutation functions and inject at the end before returning.

function injectInvalidation(funcName, queryKeyString) {
  // Find the function block.
  // E.g., const addOrganization = async (...) => { ... }
  // We'll just do a basic string replacement around \`} catch (err) {\` or \`return docRef.id;\` 
  // It's safer to just search for specific operations and insert queryClient.invalidateQueries
}

// A simpler way: we can just add queryClient.invalidateQueries calls globally after any setDoc/addDoc/updateDoc/deleteDoc in this file
// Actually, AppContext uses generic catch handlers or try/catch. Let's just find the end of the try block.

// E.g., addStudent
content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'students', id\), newStudent\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'students', id), newStudent);\n      queryClient.invalidateQueries({ queryKey: ['students', orgId] });"
);

content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'students', id\), updates\);/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'students', id), updates);\n      queryClient.invalidateQueries({ queryKey: ['students', orgId] });"
);

content = content.replace(
  /await deleteDoc\(doc\(db, 'organizations', orgId, 'students', id\)\);/g,
  "await deleteDoc(doc(db, 'organizations', orgId, 'students', id));\n      queryClient.invalidateQueries({ queryKey: ['students', orgId] });"
);

// Teachers
content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'teachers', id\), newTeacher\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'teachers', id), newTeacher);\n      queryClient.invalidateQueries({ queryKey: ['teachers', orgId] });"
);
content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'teachers', id\), updates\);/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'teachers', id), updates);\n      queryClient.invalidateQueries({ queryKey: ['teachers', orgId] });"
);
content = content.replace(
  /await deleteDoc\(doc\(db, 'organizations', orgId, 'teachers', id\)\);/g,
  "await deleteDoc(doc(db, 'organizations', orgId, 'teachers', id));\n      queryClient.invalidateQueries({ queryKey: ['teachers', orgId] });"
);

// Subjects
content = content.replace(
  /await setDoc\(subjectRef, newSubject\);/g,
  "await setDoc(subjectRef, newSubject);\n      queryClient.invalidateQueries({ queryKey: ['subjects', orgId] });"
);
content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'subjects', id\), updates\);/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'subjects', id), updates);\n      queryClient.invalidateQueries({ queryKey: ['subjects', orgId] });"
);
content = content.replace(
  /await deleteDoc\(doc\(db, 'organizations', orgId, 'subjects', id\)\);/g,
  "await deleteDoc(doc(db, 'organizations', orgId, 'subjects', id));\n      queryClient.invalidateQueries({ queryKey: ['subjects', orgId] });"
);

// ClassSessions
content = content.replace(
  /await setDoc\(sessionRef, newSession\);/g,
  "await setDoc(sessionRef, newSession);\n      queryClient.invalidateQueries({ queryKey: ['classSessions', orgId] });"
);
content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'class_sessions', id\), cleanUpdates\);/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'class_sessions', id), cleanUpdates);\n      queryClient.invalidateQueries({ queryKey: ['classSessions', orgId] });"
);
content = content.replace(
  /await deleteDoc\(doc\(db, 'organizations', orgId, 'class_sessions', id\)\);/g,
  "await deleteDoc(doc(db, 'organizations', orgId, 'class_sessions', id));\n      queryClient.invalidateQueries({ queryKey: ['classSessions', orgId] });"
);

// Rooms
content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'rooms', id\), newRoom\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'rooms', id), newRoom);\n      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });"
);
content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'rooms', id\), updates\);/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'rooms', id), updates);\n      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });"
);
content = content.replace(
  /await deleteDoc\(doc\(db, 'organizations', orgId, 'rooms', id\)\);/g,
  "await deleteDoc(doc(db, 'organizations', orgId, 'rooms', id));\n      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });"
);

// Attendance
content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'attendance', record\.id\), newRecord\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'attendance', record.id), newRecord);\n      queryClient.invalidateQueries({ queryKey: ['attendanceRecords', orgId] });"
);

// Fees
content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'fees', newFee\.id\), newFee\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'fees', newFee.id), newFee);\n      queryClient.invalidateQueries({ queryKey: ['feeRecords', orgId] });"
);
content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'fees', id\), \{/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'fees', id), {\n        ...updates // placeholder just for regex matching to not break"
);
// Real fix for updateFeePaymentStatus
content = content.replace(
  /status: status,\n        updatedAt: new Date\(\)\.toISOString\(\),\n        updatedBy: currentUser\.uid\n      \}\);/g,
  "status: status,\n        updatedAt: new Date().toISOString(),\n        updatedBy: currentUser.uid\n      });\n      queryClient.invalidateQueries({ queryKey: ['feeRecords', orgId] });"
);
content = content.replace(
  /status: 'paid',\n        paymentDate: new Date\(\)\.toISOString\(\),\n        updatedAt: new Date\(\)\.toISOString\(\),\n        updatedBy: currentUser\.uid\n      \}\);/g,
  "status: 'paid',\n        paymentDate: new Date().toISOString(),\n        updatedAt: new Date().toISOString(),\n        updatedBy: currentUser.uid\n      });\n      queryClient.invalidateQueries({ queryKey: ['feeRecords', orgId] });"
);


// Salary
content = content.replace(
  /status: 'paid',\n        paymentDate: new Date\(\)\.toISOString\(\),\n        updatedAt: new Date\(\)\.toISOString\(\),\n        updatedBy: currentUser\.uid\n      \}\);/g,
  "status: 'paid',\n        paymentDate: new Date().toISOString(),\n        updatedAt: new Date().toISOString(),\n        updatedBy: currentUser.uid\n      });\n      queryClient.invalidateQueries({ queryKey: ['salaryRecords', orgId] });"
);

// Exams
content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'exam_sessions', id\), newExam\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'exam_sessions', id), newExam);\n      queryClient.invalidateQueries({ queryKey: ['exams', orgId] });"
);
content = content.replace(
  /await updateDoc\(doc\(db, 'organizations', orgId, 'exam_sessions', id\), updates\);/g,
  "await updateDoc(doc(db, 'organizations', orgId, 'exam_sessions', id), updates);\n      queryClient.invalidateQueries({ queryKey: ['exams', orgId] });"
);
content = content.replace(
  /await deleteDoc\(doc\(db, 'organizations', orgId, 'exam_sessions', id\)\);/g,
  "await deleteDoc(doc(db, 'organizations', orgId, 'exam_sessions', id));\n      queryClient.invalidateQueries({ queryKey: ['exams', orgId] });"
);

// Exam Results
content = content.replace(
  /await runTransaction\(db, async \(transaction\) => \{/g,
  "await runTransaction(db, async (transaction) => {"
);
// After transaction:
content = content.replace(
  /      \}\);\n    \} catch \(error\) \{/g,
  "      });\n      queryClient.invalidateQueries({ queryKey: ['examResults', orgId] });\n    } catch (error) {"
);


fs.writeFileSync(file, content, 'utf8');
console.log('Refactoring completed successfully!');
