const fs = require('fs');
const path = require('path');

const dashboardDir = 'E:\\Projects\\jobie\\frontend\\app\\candidate\\dashboard';
const oldFile = path.join(dashboardDir, 'page.tsx');
const glassFile = path.join(dashboardDir, 'page-glass.tsx');
const backupFile = path.join(dashboardDir, 'page.tsx.old-backup');

try {
  // Backup old file
  if (fs.existsSync(oldFile)) {
    fs.copyFileSync(oldFile, backupFile);
    console.log('✓ Backed up old dashboard to page.tsx.old-backup');
  }
  
  // Replace with new glass version
  if (fs.existsSync(glassFile)) {
    fs.copyFileSync(glassFile, oldFile);
    console.log('✓ Replaced dashboard with new glass version');
    console.log('  (Original backed up to page.tsx.old-backup)');
  } else {
    console.error('✗ page-glass.tsx not found');
    process.exit(1);
  }
  
  console.log('\n✅ Dashboard replacement complete!');
  console.log('\nThe new dashboard features:');
  console.log('  • All original features kept');
  console.log('  • Professional glassmorphism design');
  console.log('  • Better organization in glass containers');
  console.log('  • Cleaner, more spacious layout');
  console.log('\nRun: npm run dev');
  console.log('Visit: http://localhost:3000/candidate/dashboard');
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
