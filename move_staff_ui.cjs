const fs = require('fs');

let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

const startMarker = '{/* Qaybta Maamulida Staff-ka (Staff / Sub-Admins Management) */}';
const endMarker = '</div>\n              )}';

let startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
  let sub = content.substring(startIndex);
  let endIndex = sub.indexOf(endMarker) + endMarker.length;
  
  let oldBlock = sub.substring(0, endIndex);
  
  // Remove it from settings (by replacing oldBlock with empty string)
  content = content.replace(oldBlock, '');

  // Now, we need to add the staff permissions UI to it
  let newStaffTab = \
              {/* Tab: STAFF MANAGEMENT */}
              {activeTab === 'staff' && hasPermission('User Management') && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Staff Management</h2>
                      <p className="text-xs text-slate-500">Manage sub-admins and staff members with granular permissions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 card-shadow space-y-4 h-fit">
                      <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Add New Staff</h4>
                      
                      {staffError && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-semibold">
                          {staffError}
                        </div>
                      )}

                      {staffSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
                          {staffSuccess}
                        </div>
                      )}

                      <form onSubmit={handleStaffSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Magaca Buuxa (Full Name)</label>
                          <input 
                            type="text" 
                            value={staffName}
                            onChange={(e) => setStaffName(e.target.value)}
                            placeholder="Maxamed Cali"
                            required
                            className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Sax Ah (Email)</label>
                          <input 
                            type="email" 
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            placeholder="staff@dugsi.com"
                            required
                            className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                          <input 
                            type="password" 
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            placeholder="Ugu yaraan 6 xaraf"
                            required
                            minLength={6}
                            className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Xilka (Designation)</label>
                          <input 
                            type="text" 
                            value={staffDesignation}
                            onChange={(e) => setStaffDesignation(e.target.value)}
                            placeholder="Accountant, Manager..."
                            required
                            className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          />
                        </div>

                        {/* Permissions Checkboxes */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Awoodaha (Permissions)</label>
                          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {ALL_PERMISSIONS.map(perm => (
                              <label key={perm.key} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={staffPermissions.includes(perm.key)}
                                  onChange={() => toggleStaffPermission(perm.key)}
                                  className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                                />
                                <span className="text-xs font-semibold text-slate-700">{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={staffLoading}
                          className="w-full text-xs font-semibold bg-black hover:bg-slate-800 text-white py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:bg-slate-400 mt-4"
                        >
                          {staffLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                          <span>Diiwaan Geli Staff-ka</span>
                        </button>
                      </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-2xl border border-gray-100 card-shadow overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                           <h4 className="text-sm font-bold text-slate-900">Shaqaalaha Diiwaan Gashan (Registered Staff)</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                <th className="p-4">Magaca & Xilka</th>
                                <th className="p-4">Email</th>
                                <th className="p-4 hidden sm:table-cell">Awoodaha</th>
                                <th className="p-4">Xaalada</th>
                                <th className="p-4 text-right">Waxqabad</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.filter(usr => usr.organizationId === orgId && usr.role === 'schoolstaff').length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                                    Ma jiro wax staff ah oo diiwaan gashan hadda.
                                  </td>
                                </tr>
                              ) : (
                                users.filter(usr => usr.organizationId === orgId && usr.role === 'schoolstaff').map(staff => (
                                  <tr key={staff.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-semibold text-slate-800">
                                      <div>{staff.fullName}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">{staff.staffDesignation || 'Staff'}</div>
                                    </td>
                                    <td className="p-4 text-slate-500">{staff.email}</td>
                                    <td className="p-4 hidden sm:table-cell">
                                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {staff.permissions?.slice(0, 3).map(p => (
                                          <span key={p} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{p}</span>
                                        ))}
                                        {(staff.permissions?.length || 0) > 3 && (
                                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">+{staff.permissions!.length - 3}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={\px-2 py-0.5 rounded-full text-[10px] font-bold \\}>
                                        {staff.active !== false ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right">
                                      <button
                                        onClick={() => toggleStaffActive(staff.uid, staff.active !== false)}
                                        className={\px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer \\}
                                      >
                                        {staff.active !== false ? 'Dami' : 'Daar'}
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
\

  // Find {activeTab === 'settings' && (
  let insertIndex = content.indexOf("{activeTab === 'settings' && (");
  if (insertIndex !== -1) {
    content = content.substring(0, insertIndex) + newStaffTab + "\n" + content.substring(insertIndex);
  }

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
}
