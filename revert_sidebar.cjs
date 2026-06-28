const fs = require('fs');

function revertSidebar() {
  let content = fs.readFileSync('src/components/SchoolAdmin.tsx', 'utf8');

  // 1. Revert Sidebar Container to white
  content = content.replace(
    /<aside className="hidden lg:block lg:col-span-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-\[0_10px_40px_-10px_rgba\(0,0,0,0\.3\)\] h-fit space-y-2">/g,
    '<aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-2xl border border-gray-100 card-shadow h-fit space-y-2">'
  );

  // 2. Revert inactive link text colors in sidebar
  // Previously we changed it to 'text-slate-400 hover:bg-slate-800 hover:text-white'
  content = content.replace(
    /text-slate-400 hover:bg-slate-800 hover:text-white/g,
    'text-slate-500 hover:bg-slate-50 hover:text-black'
  );
  
  // Just in case it's text-slate-500 (since we replaced text-slate-400 with text-slate-500 for the header)
  // Let's be careful. The user's screenshot shows the dark theme sidebar with inactive text that is very dark/blueish.
  
  // In `fix_ui.cjs` I did:
  // asideCode = asideCode.replace(/text-slate-500 hover:bg-slate-50 hover:text-black/g, 'text-slate-400 hover:bg-slate-800 hover:text-white');
  // asideCode = asideCode.replace(/bg-slate-50 text-black border-l-4 border-black/g, 'bg-slate-800 text-white border-l-4 border-indigo-500');
  // asideCode = asideCode.replace(/bg-indigo-50 text-indigo-700/g, 'bg-slate-800 text-white border-l-4 border-indigo-500');
  // asideCode = asideCode.replace(/text-slate-500 hover:bg-indigo-50 hover:text-indigo-600/g, 'text-slate-400 hover:bg-slate-800 hover:text-white');
  
  // Wait, if I look at the screenshot, the active tab "Dashboard" is currently `bg-indigo-50 text-indigo-700`.
  // Wait, no. The screenshot shows the Dashboard tab has a LIGHT background with purple text. And the sidebar itself is DARK. This means my script `fix_ui.cjs` did NOT successfully change the active tab to `bg-slate-800 text-white`, it remained `bg-indigo-50`.
  // So if the user wants the "background color-kii hore" they probably just want the WHITE sidebar back.
  
  // To revert everything in the aside to the original clean white styling:
  const asideStart = content.indexOf('<aside className="hidden lg:block lg:col-span-3');
  const asideEnd = content.indexOf('</aside>', asideStart);
  
  if (asideStart !== -1 && asideEnd !== -1) {
    let asideCode = content.substring(asideStart, asideEnd);
    
    // Revert container
    asideCode = asideCode.replace('bg-slate-900', 'bg-white');
    asideCode = asideCode.replace('border-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]', 'border-gray-100 card-shadow');
    
    // Revert text colors
    asideCode = asideCode.replace(/text-slate-400 hover:bg-slate-800 hover:text-white/g, 'text-slate-500 hover:bg-slate-50 hover:text-slate-900');
    // If they were already text-slate-500 but with slate-800 hover:
    asideCode = asideCode.replace(/text-slate-500 hover:bg-slate-800 hover:text-white/g, 'text-slate-500 hover:bg-slate-50 hover:text-slate-900');
    
    // Inactive text colors (some were changed to text-slate-500 for headers)
    // The "MANAGEMENT MODULES" text:
    asideCode = asideCode.replace(/text-\[10px\] font-bold text-slate-500 uppercase tracking-wider/g, 'text-[10px] font-bold text-slate-400 uppercase tracking-wider');

    content = content.substring(0, asideStart) + asideCode + content.substring(asideEnd);
  }

  // Also in redesign_ui.cjs I changed the main body background
  // content = content.replace(/className="flex-1 bg-slate-50 h-screen overflow-y-auto relative"/g, 'className="flex-1 bg-[#fcfcfd] h-screen overflow-y-auto relative"');
  content = content.replace(/className="flex-1 bg-slate-50 h-screen overflow-y-auto relative"/g, 'className="flex-1 bg-[#fcfcfd] h-screen overflow-y-auto relative"');

  fs.writeFileSync('src/components/SchoolAdmin.tsx', content);
  console.log('Sidebar reverted successfully');
}

revertSidebar();
