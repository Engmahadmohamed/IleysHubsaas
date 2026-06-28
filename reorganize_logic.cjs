const fs = require('fs');

function reorganizeLogic() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // 1. Remove Room, Teacher, Start Time, End Time, Days from Add Subject Modal
  // I will just locate the exact JSX structure and delete it.
  
  const addSubjectModalStart = content.indexOf('activeModal === \'addSubject\' && (');
  if (addSubjectModalStart !== -1) {
    const nextModalIndex = content.indexOf('activeModal === \'addClassSession\' && (');
    let modalCode = content.substring(addSubjectModalStart, nextModalIndex);
    
    // We want to delete:
    // <div className="grid grid-cols-2 gap-4"> (which contains Assign Room and Assign Teacher)
    // <div className="grid grid-cols-3 gap-4"> (which contains Start Time and End Time)
    // <div className="grid grid-cols-2 gap-4"> could be another one, let's just use regex to remove them.
    
    modalCode = modalCode.replace(/<div className="grid grid-cols-2 gap-4">\s*<div>\s*<label className="block text-\[11px\] font-semibold text-slate-500 mb-1">Assign Room<\/label>[\s\S]*?<\/div>\s*<\/div>/, '');
    
    modalCode = modalCode.replace(/<div className="grid grid-cols-3 gap-4">\s*<div>\s*<label className="block text-\[11px\] font-semibold text-slate-500 mb-1">Start Time<\/label>[\s\S]*?<\/div>\s*<\/div>/, '');
    
    modalCode = modalCode.replace(/<div>\s*<label className="block text-\[11px\] font-bold text-slate-500 uppercase tracking-wider mb-2">Days \(Maalmaha\) \*<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

    content = content.substring(0, addSubjectModalStart) + modalCode + content.substring(nextModalIndex);
  }

  // 2. Remove columns from Subjects table
  const subjectsTabStart = content.indexOf('activeTab === \'subjects\' && (');
  if (subjectsTabStart !== -1) {
    const nextTabStart = content.indexOf('activeTab === \'class-sessions\' && (');
    let tabCode = content.substring(subjectsTabStart, nextTabStart);
    
    // Remove table headers
    tabCode = tabCode.replace(/<th className="p-4">Instructor<\/th>/, '');
    tabCode = tabCode.replace(/<th className="p-4">Room Location<\/th>/, '');
    tabCode = tabCode.replace(/<th className="p-4">Class Time<\/th>/, '');
    tabCode = tabCode.replace(/<th className="p-4">Days<\/th>/, '');
    
    // Remove table cells
    tabCode = tabCode.replace(/<td className="p-4">\s*<div className="flex items-center gap-2">[\s\S]*?<\/div>\s*<\/td>/, ''); // Instructor cell
    tabCode = tabCode.replace(/<td className="p-4">\s*<span className="inline-flex items-center gap-1[^>]*>[\s\S]*?<\/span>\s*<\/td>/g, ''); // Room Location and Class Time cells often use inline-flex spans. Let's be more specific.
    
    // Let's manually replace the map function block for subjects
    const mapStart = tabCode.indexOf('{orgSubjects.map(sub => {');
    const tbodyEnd = tabCode.indexOf('</tbody>', mapStart);
    if (mapStart !== -1 && tbodyEnd !== -1) {
       let mapCode = tabCode.substring(mapStart, tbodyEnd);
       // Remove teacher definition
       mapCode = mapCode.replace(/const t = orgTeachers\.find\(t => t\.id === sub\.teacherId\);/, '');
       mapCode = mapCode.replace(/const rm = orgRooms\.find\(r => r\.id === sub\.roomId\);/, '');
       
       // Rebuild the <tr> cleanly.
       const newTr = `
                      return (
                        <tr key={sub.id} className="border-b border-gray-50 hover:bg-[#fcfcfd] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <BookOpen size={14} />
                              </div>
                              <span className="font-bold text-slate-800">{sub.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-600">{sub.capacity} Arday</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedSubject(sub);
                                  setSubjectForm({ name: sub.name, teacherId: sub.teacherId || '', roomId: sub.roomId || '', startTime: sub.startTime || '08:00', endTime: sub.endTime || '09:30', capacity: sub.capacity || 30, days: sub.days || [] });
                                  setActiveModal('addSubject');
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-black rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (await showConfirm('Ma hubtaa inaad tirtirto maaddadan? (Are you sure you want to delete this subject?)')) {
                                    deleteSubject(sub.id);
                                    setSuccessMessage('Maaddada waa la tirtiray (Subject deleted successfully).');
                                  }
                                }}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );`;
       
       mapCode = `{orgSubjects.map(sub => {` + newTr + `\n                    })}`;
       tabCode = tabCode.substring(0, mapStart) + mapCode + tabCode.substring(tbodyEnd);
    }
    
    // Also remove the Fee header if it exists. Actually in my replacement I just kept capacity and actions.
    tabCode = tabCode.replace(/<th className="p-4">Fee<\/th>/, '<th className="p-4">Capacity<\/th>');
    
    content = content.substring(0, subjectsTabStart) + tabCode + content.substring(nextTabStart);
  }

  // 3. Remove Room/Time display from Teacher's Subject Checkboxes
  content = content.replace(
    /const rm = orgRooms\.find\(r => r\.id === sub\.roomId\);/g,
    ''
  );
  content = content.replace(
    /\{rm \? \`Qolka: \$\{rm\.roomNumber\}\` : 'Qolka: No Room'\} \| \{sub\.startTime\} - \{sub\.endTime\}/g,
    'Maaddada Asaasiga ah (Core Subject)'
  );

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
  console.log('Logic reorganization completed successfully!');
}

reorganizeLogic();
