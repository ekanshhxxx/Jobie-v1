const fs = require('fs');

const filePath = 'E:\\Projects\\jobie\\frontend\\app\\candidate\\dashboard\\page.tsx';
const backupPath = 'E:\\Projects\\jobie\\frontend\\app\\candidate\\dashboard\\page.tsx.old-backup';

let content = fs.readFileSync(backupPath, 'utf8');

// 1. Remove double radial gradient background (line 457)
content = content.replace(
  '<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,242,254,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(79,172,254,0.16),transparent_34%)]" />',
  '<!-- Removed flashy gradient -->'
);

// 2. Simplify hero section styling - remove heavy gradient & shadow
content = content.replace(
  'bg-[linear-gradient(135deg,rgba(16,28,64,0.96),rgba(10,18,35,0.92))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.24)]',
  'bg-[rgba(15,20,39,0.6)] backdrop-blur-md p-6 shadow-lg'
);

// 3. Replace gradient buttons with solid colors
content = content.replace(
  /bg-\[linear-gradient\(135deg,var\(--blue-1\),var\(--blue-2\)\)\]/g,
  'bg-blue-600 hover:bg-blue-500'
);

// 4. Remove hover lift effect (-translate-y-1) 
content = content.replace(
  /hover:-translate-y-1/g,
  ''
);

// 5. Reduce border opacity for consistency (0.2 -> 0.1, 0.28 -> 0.12)
content = content.replace(
  /border-\[rgba\(79,172,254,0\.2\)\]/g,
  'border-[rgba(79,172,254,0.1)]'
);
content = content.replace(
  /border-\[rgba\(79,172,254,0\.28\)\]/g,
  'border-[rgba(79,172,254,0.12)]'
);

// 6. Simplify badge colors - reduce saturation
content = content.replace(
  /bg-\[rgba\(79,172,254,0\.12\)\]/g,
  'bg-[rgba(59,130,246,0.08)]'
);
content = content.replace(
  /bg-\[rgba\(245,166,35,0\.12\)\]/g,
  'bg-[rgba(245,158,11,0.08)]'
);

// 7. Remove feature card gradient
content = content.replace(
  /bg-\[linear-gradient\(145deg,rgba\(20,37,78,0\.72\),rgba\(10,18,37,0\.9\)\)\]/g,
  'bg-[rgba(20,30,55,0.5)]'
);

// 8. Simplify shadows
content = content.replace(
  /shadow-\[0_22px_70px_rgba\(0,0,0,0\.24\)\]/g,
  'shadow-lg'
);

// 9. Reduce rounded corners slightly
content = content.replace(
  /rounded-\[32px\]/g,
  'rounded-2xl'
);
content = content.replace(
  /rounded-\[28px\]/g,
  'rounded-xl'
);

fs.writeFileSync(filePath, content);
console.log('✅ Dashboard updated - removed flashy effects');
console.log('\nChanges made:');
console.log('  • Removed double radial gradient background');
console.log('  • Replaced gradient buttons with solid colors');
console.log('  • Removed hover lift animations');
console.log('  • Reduced border brightness');
console.log('  • Simplified shadows');
console.log('  • Muted badge colors');
console.log('\nThe UI is now cleaner and less flashy!');
