const fs = require('fs');

function fixSubjectsTable() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // Find the broken table and replace entirely
  const brokenTable = `                  <table className="w-full text-left text-sm">
                     <thead>
                       <tr className="bg-[#fcfcfd] border-b border-gray-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                         <th className="p-4">Subject Title</th>
                         
                         
                         
                         })
                       )}
                     </tbody>
                   </table>`;

  const fixedTable = `                  <table className="w-full text-left text-sm">
                     <thead>
                       <tr className="bg-[#fcfcfd] border-b border-gray-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                         <th className="p-4">Magaca Maaddada</th>
                         <th className="p-4">Capacity</th>
                         <th className="p-4 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {orgSubjects.length === 0 ? (
                         <tr>
                           <td colSpan={3} className="text-center py-12 text-slate-400">
                             <div className="flex flex-col items-center gap-2">
                               <BookOpen size={32} className="text-slate-200" />
                               <p className="text-xs font-semibold">Wali maaddo la ma aburin. Guji &quot;Create Subject&quot;.</p>
                             </div>
                           </td>
                         </tr>
                       ) : (
                         orgSubjects.map(sub => {
                           return (
                             <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="p-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                     <BookOpen size={14} />
                                   </div>
                                   <span className="font-bold text-slate-800">{sub.name}</span>
                                 </div>
                               </td>
                               <td className="p-4 text-slate-600 font-semibold">{sub.capacity ?? 30} Arday</td>
                               <td className="p-4 text-right">
                                 <div className="flex items-center justify-end gap-1">
                                   <button 
                                     onClick={() => {
                                       setSelectedSubject(sub);
                                       setFormError(null);
                                       setSubjectForm({
                                         name: sub.name,
                                         teacherId: sub.teacherId || '',
                                         roomId: sub.roomId || '',
                                         startTime: sub.startTime || '08:00',
                                         endTime: sub.endTime || '09:30',
                                         capacity: sub.capacity || 30,
                                         days: sub.days || [],
                                       });
                                       setActiveModal('addSubject');
                                     }}
                                     className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-black rounded-lg cursor-pointer transition-colors"
                                     title="Bedel maaddada"
                                   >
                                     <Edit2 size={15} />
                                   </button>
                                   <button 
                                     onClick={async () => {
                                       if (await showConfirm('Ma hubtaa inaad tirtirto maaddadan?')) {
                                         deleteSubject(sub.id);
                                         setSuccessMessage('Maaddada waa la tirtiray.');
                                       }
                                     }}
                                     className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                                     title="Tirtir maaddada"
                                   >
                                     <Trash2 size={15} />
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           );
                         })
                       )}
                     </tbody>
                   </table>`;

  if (content.includes(brokenTable)) {
    content = content.replace(brokenTable, fixedTable);
    console.log('Fixed subjects table!');
  } else {
    console.log('Could not find broken table. Trying alternative...');
    // Try trimming and finding a simpler signature
    const simpleSearch = '<th className="p-4">Subject Title</th>';
    const idx = content.indexOf(simpleSearch);
    if (idx !== -1) {
      // Find the table start
      const tableStart = content.lastIndexOf('<table className="w-full text-left text-sm">', idx);
      // Find the table end - which is after the malformed tbody close
      const tableEnd = content.indexOf('</table>', tableStart) + '</table>'.length;
      if (tableStart !== -1 && tableEnd !== -1) {
        content = content.substring(0, tableStart) + fixedTable + content.substring(tableEnd);
        console.log('Fixed via alternative method!');
      }
    }
  }

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
}

fixSubjectsTable();
