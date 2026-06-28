const fs = require('fs');

function cleanSubjectForm() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // Find the addSubject modal form and replace it entirely
  const formStart = `<form onSubmit={handleAddSubjectSubmit} className="space-y-4 text-xs">`;
  const formEnd = `</form>\n          </div>\n        </div>\n      )}\n\n      {/* Modal - Create/Edit Class Session */}`;
  
  const startIdx = content.indexOf(formStart);
  const endIdx = content.indexOf(`{/* Modal - Create/Edit Class Session */}`);
  
  if (startIdx === -1 || endIdx === -1) {
    console.log('Could not find form bounds');
    console.log('startIdx:', startIdx, 'endIdx:', endIdx);
    return;
  }
  
  const newForm = `<form onSubmit={handleAddSubjectSubmit} className="space-y-4 text-xs">
              {/* Info hint */}
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">i</div>
                <div>
                  <p className="font-bold text-blue-800 text-[11px]">Maaddada (Subject) waa Koodh kaliya</p>
                  <p className="text-blue-600 text-[10px] mt-0.5">Waqtiga, Qolka, iyo Macallinka waxaad ku xiri doontaa markii aad abuureysid <strong>Class Session</strong>.</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Magaca Maaddada (Subject Name) *</label>
                <input
                  type="text" required
                  placeholder="Tusaale: English Language, Mathematics, Quran..."
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tirada Ardayda ugu Badan (Max Capacity)</label>
                <input
                  type="number" required min={1} max={500}
                  value={subjectForm.capacity}
                  onChange={(e) => setSubjectForm({ ...subjectForm, capacity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-black focus:outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setActiveModal(null); setSelectedSubject(null); setFormError(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-black hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                  {selectedSubject ? 'Xaqiiji Bedelaada (Save Changes)' : 'Kaydi Maaddada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Create/Edit Class Session */}`;
  
  content = content.substring(0, startIdx) + newForm + content.substring(endIdx + `{/* Modal - Create/Edit Class Session */}`.length);
  
  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
  console.log('Subject form cleaned successfully!');
}

cleanSubjectForm();
