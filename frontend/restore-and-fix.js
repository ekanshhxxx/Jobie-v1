const fs = require('fs');
const path = require('path');

const dashboardDir = 'E:\\Projects\\jobie\\frontend\\app\\candidate\\dashboard';
const currentFile = path.join(dashboardDir, 'page.tsx');
const backupFile = path.join(dashboardDir, 'page.tsx.old-backup');

try {
  if (!fs.existsSync(backupFile)) {
    console.error('❌ Backup file not found!');
    process.exit(1);
  }

  // Copy the original backup to current
  fs.copyFileSync(backupFile, currentFile);
  console.log('✅ Restored original dashboard from backup');
  
  // Now read it and make it less flashy
  let content = fs.readFileSync(currentFile, 'utf8');
  
  console.log('\n🎨 Making UI less flashy...\n');
  
  // 1. Remove the double radial gradient background (the cyan glow)
  content = content.replace(
    /<div className="absolute inset-0 bg-\[radial-gradient\(circle_at_top_right,rgba\(0,242,254,0\.12\),transparent_30%\),radial-gradient\(circle_at_bottom_left,rgba\(79,172,254,0\.16\),transparent_34%\)\]" \/>/g,
    ''
  );
  
  // 2. Replace gradient buttons with solid colors
  content = content.replace(
    /bg-\[linear-gradient\(135deg,var\(--blue-1\),var\(--blue-2\)\)\]/g,
    'bg-blue-600 hover:bg-blue-500'
  );
  
  // 3. Remove hover lift effect
  content = content.replace(
    /hover:-translate-y-1 /g,
    ''
  );
  
  // 4. Reduce feature card gradient to solid
  content = content.replace(
    /bg-\[linear-gradient\(145deg,rgba\(20,37,78,0\.72\),rgba\(10,18,37,0\.9\)\)\]/g,
    'bg-[rgba(20,30,55,0.7)]'
  );
  
  // 5. Simplify hero section background
  content = content.replace(
    /bg-\[linear-gradient\(135deg,rgba\(16,28,64,0\.96\),rgba\(10,18,35,0\.92\)\)\]/g,
    'bg-[rgba(15,20,35,0.85)] backdrop-blur-sm'
  );
  
  // 6. Reduce shadow intensity
  content = content.replace(
    /shadow-\[0_22px_70px_rgba\(0,0,0,0\.24\)\]/g,
    'shadow-xl'
  );
  
  // Write the modified content
  fs.writeFileSync(currentFile, content);
  
  console.log('✅ Changes applied:');
  console.log('   • Removed cyan glow gradient');
  console.log('   • Replaced gradient buttons with solid blue');
  console.log('   • Removed floating hover effects');
  console.log('   • Simplified card backgrounds');
  console.log('   • Reduced shadow intensity');
  console.log('\n✨ Original dashboard restored and toned down!');
  console.log('\nRun: npm run dev');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
