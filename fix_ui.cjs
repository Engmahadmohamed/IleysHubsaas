const fs = require('fs');

function fixRedesign() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // Fix Sidebar Container to be dark
  content = content.replace(
    /<aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-2xl border border-gray-100 card-shadow h-fit space-y-2">/g,
    '<aside className="hidden lg:block lg:col-span-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] h-fit space-y-2">'
  );

  // For the active sidebar items that I previously changed to 'bg-slate-800 text-white border-l-4 border-indigo-500', they are actually currently like:
  // "bg-slate-800 text-white border-l-4 border-indigo-500" because I successfully updated them!
  // Wait, the screenshot shows the sidebar item "Dashboard" as `bg-indigo-50` with purple text! That means my previous script DID NOT successfully change the sidebar items to dark!
  // Let's check what the active class actually is. In my old script I replaced `bg-slate-50 text-black border-l-4 border-black` but in this app it's probably different.
  // Wait, I can see the active item has a purple-ish background in the screenshot. It probably is `bg-indigo-50 text-indigo-700` or something.
  
  // To be absolutely certain, let's just restore the normal text color for the metric cards inside the Dashboard so they are at least visible if we can't get the gradients.
  // OR let's inject the gradients directly into the 4 Dashboard cards.
  const dashboardStart = content.indexOf("activeTab === 'dashboard' && (");
  const dashboardEnd = content.indexOf("activeTab === 'students' && (");
  
  if (dashboardStart !== -1 && dashboardEnd !== -1) {
    let dashboardCode = content.substring(dashboardStart, dashboardEnd);
    
    // Replace the first 4 instances of "bg-white p-5 rounded-2xl" in the dashboard area
    let matchCount = 0;
    dashboardCode = dashboardCode.replace(/className="bg-white p-5 rounded-2xl border border-gray-100 card-shadow"/g, (match) => {
      matchCount++;
      if (matchCount === 1) return 'className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(99,102,241,0.4)] text-white border border-indigo-400"';
      if (matchCount === 2) return 'className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(59,130,246,0.4)] text-white border border-blue-400"';
      if (matchCount === 3) return 'className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(16,185,129,0.4)] text-white border border-emerald-400"';
      if (matchCount === 4) return 'className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl shadow-[0_8px_30px_-4px_rgba(245,158,11,0.4)] text-white border border-amber-400"';
      return match;
    });

    content = content.substring(0, dashboardStart) + dashboardCode + content.substring(dashboardEnd);
  }

  // Now for the sidebar, let's fix the class names. Since I don't know the exact current active class, I'll use regex.
  // The structure is usually `activeTab === 'dashboard' ? 'SOMETHING' : 'SOMETHING_ELSE'`
  // Let's replace the ternary operators in the aside element.
  // We'll just read the aside block
  const asideStart = content.indexOf('<aside className="hidden lg:block lg:col-span-3');
  const asideEnd = content.indexOf('</aside>', asideStart);
  
  if (asideStart !== -1 && asideEnd !== -1) {
    let asideCode = content.substring(asideStart, asideEnd);
    
    // Change hover states in sidebar
    // Typically `hover:bg-indigo-50 hover:text-indigo-600 text-slate-500` or similar
    asideCode = asideCode.replace(/text-slate-500 hover:bg-slate-50 hover:text-black/g, 'text-slate-400 hover:bg-slate-800 hover:text-white');
    asideCode = asideCode.replace(/bg-slate-50 text-black border-l-4 border-black/g, 'bg-slate-800 text-white border-l-4 border-indigo-500');
    
    // Some themes use indigo
    asideCode = asideCode.replace(/bg-indigo-50 text-indigo-700/g, 'bg-slate-800 text-white border-l-4 border-indigo-500');
    asideCode = asideCode.replace(/text-slate-500 hover:bg-indigo-50 hover:text-indigo-600/g, 'text-slate-400 hover:bg-slate-800 hover:text-white');
    
    // Ensure the management modules text is visible on dark bg
    asideCode = asideCode.replace(/text-slate-400/g, 'text-slate-500');

    content = content.substring(0, asideStart) + asideCode + content.substring(asideEnd);
  }

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
  console.log('Fixed UI mapping issues');
}

fixRedesign();
