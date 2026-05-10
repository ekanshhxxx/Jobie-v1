const { execSync } = require('child_process');
const fs = require('fs');

const filesToCheckout = [
  'backend/src/models/Profile.ts',
  'backend/src/services/githubService.ts',
  'backend/src/controllers/githubController.ts',
  'backend/src/routes/githubRoutes.ts',
  'backend/src/services/resumeService.ts',
  'backend/src/controllers/resumeController.ts',
  'backend/src/routes/resumeRoutes.ts',
  'frontend/app/components/types.ts',
  'frontend/app/components/SkillGraph.tsx',
  'frontend/app/profile/[userId]/page.tsx',
  'frontend/app/profile/edit/page.tsx',
  'frontend/package.json',
  'backend/.env'
];

for (const file of filesToCheckout) {
  try {
    console.log(`Checking out ${file}...`);
    execSync(`git checkout HEAD "${file}"`);
  } catch (e) {
    console.error(`Failed to checkout ${file}`);
  }
}

const filesToDelete = [
  'frontend/app/components/GitHubDeepCard.tsx',
  'frontend/app/components/ResumeReportCard.tsx'
];

for (const file of filesToDelete) {
  try {
    if (fs.existsSync(file)) {
      console.log(`Deleting ${file}...`);
      fs.unlinkSync(file);
    }
  } catch (e) {
    console.error(`Failed to delete ${file}`);
  }
}

try {
  execSync('npm install', { cwd: 'frontend', stdio: 'ignore' });
} catch(e) {}

console.log('Revert completed.');
