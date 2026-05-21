const fs = require('fs');
const path = require('path');

const dashboardDir = 'E:\\Projects\\jobie\\frontend\\app\\candidate\\dashboard';
const currentFile = path.join(dashboardDir, 'page.tsx');
const backupFile = path.join(dashboardDir, 'page.tsx.old-backup');

try {
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, currentFile);
    console.log('✓ Reverted to original dashboard');
    console.log('\nNow I will make subtle improvements to reduce flashiness.');
  } else {
    console.error('✗ Backup file not found');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
