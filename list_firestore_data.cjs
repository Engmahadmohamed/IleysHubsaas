const { initializeApp, getApps } = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize the Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    projectId: 'ileyshub' // Use the project ID from your config
  });
}

const db = getFirestore();

async function runDiagnostics() {
  console.log('=== FIRESTORE DIAGNOSTICS ===');
  try {
    // 1. Get Organizations
    console.log('\nFetching organizations...');
    const orgsSnap = await db.collection('organizations').get();
    console.log(`Found ${orgsSnap.size} organizations:`);
    const orgsList = [];
    orgsSnap.forEach(doc => {
      orgsList.push({ id: doc.id, ...doc.data() });
      console.log(`- Org: [${doc.id}] ${doc.data().name || 'No Name'} (${doc.data().type || 'No Type'})`);
    });

    // 2. Get Users
    console.log('\nFetching users...');
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users:`);
    usersSnap.forEach(doc => {
      const data = doc.data();
      console.log(`- User: [${doc.id}] Email: ${data.email} | Name: ${data.fullName} | Role: ${data.role} | OrgId: ${data.organizationId}`);
    });

    // 3. Get Scoped collections
    for (const org of orgsList) {
      console.log(`\n--- Org: ${org.name} (${org.id}) Details ---`);
      
      const teachersSnap = await db.collection('organizations').doc(org.id).collection('teachers').get();
      console.log(`  - Teachers (${teachersSnap.size}):`);
      teachersSnap.forEach(doc => {
        const d = doc.data();
        console.log(`    * [${doc.id}] ${d.fullName} | Email: ${d.email} | Salary: ${d.salary || 0}`);
      });

      const studentsSnap = await db.collection('organizations').doc(org.id).collection('students').get();
      console.log(`  - Students (${studentsSnap.size}):`);
      studentsSnap.forEach(doc => {
        const d = doc.data();
        console.log(`    * [${doc.id}] ${d.fullName} | Class: ${d.gradeLevel || d.classLevel || 'N/A'} | Status: ${d.status}`);
      });

      const subjectsSnap = await db.collection('organizations').doc(org.id).collection('subjects').get();
      console.log(`  - Subjects (${subjectsSnap.size}):`);
      subjectsSnap.forEach(doc => {
        const d = doc.data();
        console.log(`    * [${doc.id}] ${d.name} | TeacherId: ${d.teacherId || 'None'}`);
      });

      const roomsSnap = await db.collection('organizations').doc(org.id).collection('rooms').get();
      console.log(`  - Classrooms (${roomsSnap.size}):`);
      roomsSnap.forEach(doc => {
        const d = doc.data();
        console.log(`    * [${doc.id}] Room ${d.roomNumber} | Capacity: ${d.capacity}`);
      });
    }

  } catch (error) {
    console.error('Error during diagnostics:', error);
  }
}

runDiagnostics();
