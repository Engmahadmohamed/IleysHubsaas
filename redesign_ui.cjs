const fs = require('fs');

function redesignSchoolAdmin() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // 1. Fix Attendance Activity issue
  content = content.replace(
    /orgAttendance\.length === 0 \? \(/g,
    'todayAttendance.length === 0 ? ('
  );
  content = content.replace(
    /orgAttendance\.slice\(0, 3\)\.map\(att => \{/g,
    'todayAttendance.slice(0, 3).map(att => {'
  );
  console.log('Fixed Attendance Activity bug');

  // 2. Add Mobile Logout Button
  const mobileSettingsBtn = `                  <button
                    onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                    className={\`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors \${activeTab === 'settings' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}\`}
                  >
                    <Settings size={18} />
                    <span className="font-semibold">Settings</span>
                  </button>`;
  
  const mobileLogoutBtn = `
                  {/* MOBILE LOGOUT BUTTON */}
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >
                    <span className="font-semibold">Log Out</span>
                  </button>`;

  if (!content.includes('MOBILE LOGOUT BUTTON')) {
    content = content.replace(mobileSettingsBtn, mobileSettingsBtn + mobileLogoutBtn);
    console.log('Added Mobile Logout Button');
  }

  // 3. UI Overhaul: Dark Sidebar
  // Change sidebar container
  content = content.replace(
    /<div className="hidden md:flex w-64 bg-white border-r border-gray-100/g,
    '<div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800'
  );
  
  // Sidebar Header text (Logo area)
  content = content.replace(
    /text-xl font-black tracking-tighter text-slate-950/g,
    'text-xl font-black tracking-tighter text-white'
  );
  content = content.replace(
    /bg-black text-white p-1\.5 rounded-lg/g,
    'bg-indigo-500 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-500/30'
  );

  // Sidebar Sub-header (Org name)
  content = content.replace(
    /className="text-xs font-bold text-slate-800 truncate"/g,
    'className="text-xs font-bold text-white truncate"'
  );
  content = content.replace(
    /className="text-\[10px\] font-semibold text-slate-500"/g,
    'className="text-[10px] font-semibold text-slate-400"'
  );

  // Sidebar Menu Items styling
  const oldActiveNav = "bg-slate-50 text-black border-l-4 border-black";
  const newActiveNav = "bg-slate-800 text-white border-l-4 border-indigo-500";
  content = content.split(oldActiveNav).join(newActiveNav);

  const oldInactiveNav = "text-slate-500 hover:bg-slate-50 hover:text-black";
  const newInactiveNav = "text-slate-400 hover:bg-slate-800 hover:text-white";
  content = content.split(oldInactiveNav).join(newInactiveNav);

  // Sub-menu headers like "MAIN MENU"
  content = content.replace(
    /className="px-4 text-\[10px\] font-bold text-slate-400 uppercase tracking-wider mb-2"/g,
    'className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"'
  );

  // 4. Dashboard Metric Cards
  // Make them use gradients
  const metricCardOld = 'className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow"';
  
  // We'll replace the first 4 occurrences with distinct gradients
  let matchCount = 0;
  content = content.replace(/className="bg-white p-6 rounded-2xl border border-gray-100 card-shadow"/g, (match) => {
    matchCount++;
    if (matchCount === 1) return 'className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl card-shadow text-white border border-indigo-400"';
    if (matchCount === 2) return 'className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl card-shadow text-white border border-blue-400"';
    if (matchCount === 3) return 'className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl card-shadow text-white border border-emerald-400"';
    if (matchCount === 4) return 'className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl card-shadow text-white border border-amber-400"';
    return match; // Leave others as default white card
  });

  // Since metric cards are now dark gradients, we need to fix their internal text colors
  // In Dashboard tab:
  // "Total Students", "Active Teachers", "Total Subjects", "Pending Fees"
  const dashboardTabStart = content.indexOf("activeTab === 'dashboard' && (");
  const dashboardTabEnd = content.indexOf("activeTab === 'students' && (");
  
  if (dashboardTabStart !== -1 && dashboardTabEnd !== -1) {
    let dashboardPart = content.substring(dashboardTabStart, dashboardTabEnd);
    
    // Replace icon background and text inside gradients
    dashboardPart = dashboardPart.replace(/<span className="text-slate-900">/g, '<span className="text-white opacity-90">');
    // Replace label text
    dashboardPart = dashboardPart.replace(/text-\[10px\] font-bold text-slate-400 uppercase/g, 'text-[10px] font-bold text-white/80 uppercase');
    // Replace big number text
    dashboardPart = dashboardPart.replace(/text-3xl font-bold mt-1 text-slate-900/g, 'text-3xl font-bold mt-1 text-white');

    content = content.substring(0, dashboardTabStart) + dashboardPart + content.substring(dashboardTabEnd);
  }

  // Also enhance the main background
  content = content.replace(
    /className="flex-1 bg-\[\#fcfcfd\] h-screen overflow-y-auto relative"/g,
    'className="flex-1 bg-slate-50 h-screen overflow-y-auto relative"'
  );

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
  console.log('UI redesigned successfully');
}

redesignSchoolAdmin();
