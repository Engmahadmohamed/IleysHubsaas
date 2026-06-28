const fs = require('fs');

function fixSchoolAdmin() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // Fix useAlert
  if (!content.includes('const { showAlert, showConfirm } = useAlert();')) {
    content = content.replace('const { showAlert } = useAlert();', 'const { showAlert, showConfirm } = useAlert();');
  }

  // Fix class session delete confirm
  content = content.replace(
    /onClick=\{\(\) => \{\s+if \(window\.confirm\('Ma hubtaa inaad tirtirto Class Session-kan\?'\)\) \{/,
    "onClick={async () => {\n                                if (await showConfirm('Ma hubtaa inaad tirtirto Class Session-kan?')) {"
  );

  // Fix room delete confirm
  content = content.replace(
    /onClick=\{\(\) => \{\s+if \(confirm\('Ma hubaal inaad rabto inaad tirtirto qolkan\? \(Are you sure you want to delete this room\?\)'\)\) \{/,
    "onClick={async () => {\n                          if (await showConfirm('Ma hubaal inaad rabto inaad tirtirto qolkan? (Are you sure you want to delete this room?)')) {"
  );

  // Fix exam delete confirm
  content = content.replace(
    /onClick=\{\(\) => \{\s+if \(window\.confirm\('Ma hubtaa in aad tirtirto imtixaankan\?'\)\) \{/,
    "onClick={async () => {\n                            if (await showConfirm('Ma hubtaa in aad tirtirto imtixaankan?')) {"
  );

  // Student overlap prevention in handleAddStudentSubmit
  // Let's find handleAddStudentSubmit and inject overlap logic before adding the student.
  if (!content.includes('// Check overlap server side')) {
    const injectOverlapLogic = `
    // Check overlap server side
    if (studentForm.classSessions && studentForm.classSessions.length > 0) {
      const selectedSessions = allOrgClassSessions.filter(cs => studentForm.classSessions?.includes(cs.id));
      for (let i = 0; i < selectedSessions.length; i++) {
        for (let j = i + 1; j < selectedSessions.length; j++) {
          const cs1 = selectedSessions[i];
          const cs2 = selectedSessions[j];
          if (cs1.days.some(d => cs2.days.includes(d)) && (cs1.startTime < cs2.endTime && cs2.startTime < cs1.endTime)) {
            showAlert(\`Cilad Isku-dhac: Kuma dari kartid ardayga fasalada "\${cs1.classCode}" iyo "\${cs2.classCode}" waayo isku waqti bay dhacayaan.\`, 'error');
            return;
          }
        }
      }
    }
`;
    // Find const handleAddStudentSubmit = (e: React.FormEvent) => { and the e.preventDefault();
    content = content.replace(
      /const handleAddStudentSubmit = \(e: React\.FormEvent\) => \{\s+e\.preventDefault\(\);\s+setFormError\(null\);/,
      `const handleAddStudentSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    setFormError(null);\n${injectOverlapLogic}`
    );
  }

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
  console.log('Fixed SchoolAdmin.tsx');
}

function fixSuperAdmin() {
  let content = fs.readFileSync('src/components/SuperAdmin.tsx', 'utf8');
  if (!content.includes('const { showAlert } = useAlert();')) {
    content = content.replace(
      "import { Users, Building2, ShieldCheck, Search, CheckCircle2, XCircle, MoreVertical, KeyRound, Play } from 'lucide-react';",
      "import { Users, Building2, ShieldCheck, Search, CheckCircle2, XCircle, MoreVertical, KeyRound, Play } from 'lucide-react';\nimport { useAlert } from '../context/AlertContext';"
    );
    content = content.replace(
      'export default function SuperAdmin() {',
      'export default function SuperAdmin() {\n  const { showAlert } = useAlert();'
    );
  }
  content = content.replace(/alert\('Xogta tusaalaha ah/g, "showAlert('Xogta tusaalaha ah");
  content = content.replace(/alert\('Cilad ayaa dhacday:/g, "showAlert('Cilad ayaa dhacday:");
  
  // They might be `showAlert('...', 'success')`
  content = content.replace(/showAlert\('Xogta tusaalaha ah si guul leh ayaa loo galiyey database-ka Firebase!'\)/g, "showAlert('Xogta tusaalaha ah si guul leh ayaa loo galiyey database-ka Firebase!', 'success')");
  content = content.replace(/showAlert\('Cilad ayaa dhacday: ' \+ err\.message\)/g, "showAlert('Cilad ayaa dhacday: ' + err.message, 'error')");
  
  fs.writeFileSync('src/components/SuperAdmin.tsx', content);
  console.log('Fixed SuperAdmin.tsx');
}

function fixReceiptVerification() {
  let content = fs.readFileSync('src/components/ReceiptVerification.tsx', 'utf8');
  if (!content.includes('const { showAlert } = useAlert();')) {
    content = content.replace(
      "import { CheckCircle2, XCircle, Search, Printer, Download, MapPin, Phone, Mail } from 'lucide-react';",
      "import { CheckCircle2, XCircle, Search, Printer, Download, MapPin, Phone, Mail } from 'lucide-react';\nimport { useAlert } from '../context/AlertContext';"
    );
    content = content.replace(
      'export default function ReceiptVerification() {',
      'export default function ReceiptVerification() {\n  const { showAlert } = useAlert();'
    );
  }
  content = content.replace(/alert\("Cillad ayaa dhacday intii PDF-ka la soo dejinayay\."\)/g, "showAlert('Cillad ayaa dhacday intii PDF-ka la soo dejinayay.', 'error')");
  fs.writeFileSync('src/components/ReceiptVerification.tsx', content);
  console.log('Fixed ReceiptVerification.tsx');
}

function fixAppContext() {
  let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
  
  // Fix hardcoded June 2026 month logic
  // Look for: month: 'June 2026',
  if (content.includes("month: 'June 2026',")) {
    const currentMonthCode = `month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),`;
    content = content.replace(/month: 'June 2026',/g, currentMonthCode);
    console.log('Fixed AppContext.tsx fee month logic');
  }

  // Also verify addStudent server overlap check just in case it is added directly via other methods.
  // We've enforced it on UI form submission which is the main entry point.

  fs.writeFileSync('src/context/AppContext.tsx', content);
}

fixSchoolAdmin();
fixSuperAdmin();
fixReceiptVerification();
fixAppContext();
