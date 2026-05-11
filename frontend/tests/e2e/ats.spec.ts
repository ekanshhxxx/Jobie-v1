import { test, expect } from '@playwright/test';

test.describe('ATS Checker Professional Flow', () => {
  test('should load the ATS diagnostic page', async ({ page }) => {
    // Navigate to the resume page
    await page.goto('/resume');

    // Verify Typographic Elements
    await expect(page.locator('text=ATS Score Analysis')).toBeVisible();
    await expect(page.locator('text=Job Description')).toBeVisible();
    await expect(page.locator('text=Your Resume')).toBeVisible();
  });

  test('should validate empty submit requirements', async ({ page }) => {
    await page.goto('/resume');
    
    // Attempt analysis without data
    const analyzeBtn = page.locator('button', { hasText: 'Analyze Match' });
    await expect(analyzeBtn).toBeDisabled();
  });

  test('should animate results successfully after inputs', async ({ page }) => {
    // We mock the API route to prevent using actual Groq tokens in CI/CD E2E tests
    await page.route('**/api/ats/evaluate-text*', async (route) => {
      const json = {
        matchScore: 89,
        matchedKeywords: ['React', 'TypeScript', 'Next.js'],
        missingKeywords: ['Docker', 'Kubernetes'],
        summary: 'Candidate presents a strong background in frontend development.',
        detailedAnalysis: 'Your strong experience with React and TypeScript aligns perfectly with the core responsibilities of this role. However, gaining exposure to containerization specifically Docker could improve your standing.',
        diagnostics: [
          { label: 'Experience Alignment', score: 92 },
          { label: 'Technical Skills Match', score: 85 }
        ],
        stats: { coverage: 80, matchedCount: 3, missingCount: 2, totalKeywords: 5 }
      };
      await route.fulfill({ json });
    });

    await page.goto('/resume');

    // Fill the JD
    await page.fill('textarea[placeholder="Paste the job description here..."]', 'Looking for a Senior Frontend dev with React and TS.');
    
    // Fill the Resume
    await page.fill('textarea[placeholder="Paste your resume here..."]', 'I am a developer who loves React, Next.js, and TypeScript.');

    // Click Analyze
    const analyzeBtn = page.locator('button', { hasText: 'Analyze Match' });
    await expect(analyzeBtn).toBeEnabled();
    await analyzeBtn.click();

    // Verify Loading starts
    await expect(page.locator('text=Analyzing...')).toBeVisible();

    // Wait for the mock results to populate
    await expect(page.locator('text=Analysis')).toBeVisible({ timeout: 10000 });
    
    // Check specific stats rendered into the UI
    await expect(page.locator('text=89')).toBeVisible();
    await expect(page.locator('text=Experience Alignment')).toBeVisible();
    await expect(page.locator('text=TypeScript')).toBeVisible();
    await expect(page.locator('text=Docker')).toBeVisible();
  });
});
