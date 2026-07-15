const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Delete the massive useEffect
const useEffectStart = "// 3. Authenticated Mode: Listen to tenant-scoped collections in real-time";
const useEffectEnd = "  }, [currentUser]);\n";

const startIndex = content.indexOf(useEffectStart);
const endIndex = content.indexOf(useEffectEnd, Math.max(0, startIndex));

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex + useEffectEnd.length);
  console.log('Successfully deleted the useEffect block.');
} else {
  console.error('Could not find useEffect block to delete.');
}

// Invalidate queries on writes
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

content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'attendance', record\.id\), newRecord\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'attendance', record.id), newRecord);\n      queryClient.invalidateQueries({ queryKey: ['attendanceRecords', orgId] });"
);

content = content.replace(
  /await setDoc\(doc\(db, 'organizations', orgId, 'fees', newFee\.id\), newFee\);/g,
  "await setDoc(doc(db, 'organizations', orgId, 'fees', newFee.id), newFee);\n      queryClient.invalidateQueries({ queryKey: ['feeRecords', orgId] });"
);
content = content.replace(
  /status: status,\n        updatedAt: new Date\(\)\.toISOString\(\),\n        updatedBy: currentUser\.uid\n      \}\);/g,
  "status: status,\n        updatedAt: new Date().toISOString(),\n        updatedBy: currentUser.uid\n      });\n      queryClient.invalidateQueries({ queryKey: ['feeRecords', orgId] });"
);
content = content.replace(
  /status: 'paid',\n        paymentDate: new Date\(\)\.toISOString\(\),\n        updatedAt: new Date\(\)\.toISOString\(\),\n        updatedBy: currentUser\.uid\n      \}\);/g,
  "status: 'paid',\n        paymentDate: new Date().toISOString(),\n        updatedAt: new Date().toISOString(),\n        updatedBy: currentUser.uid\n      });\n      queryClient.invalidateQueries({ queryKey: ['feeRecords', orgId] });\n      queryClient.invalidateQueries({ queryKey: ['salaryRecords', orgId] });"
);

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

content = content.replace(
  /      \}\);\n    \} catch \(error\) \{/g,
  "      });\n      queryClient.invalidateQueries({ queryKey: ['examResults', orgId] });\n    } catch (error) {"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Invalidation additions completed successfully!');
