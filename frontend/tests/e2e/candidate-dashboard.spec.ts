import { test, expect } from '@playwright/test';

test.describe('Candidate Dashboard', () => {
  const seedAuth = async (page: import('@playwright/test').Page) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'e2e-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Candidate One',
        email: 'candidate@example.com',
        role: 'candidate',
      }));
    });
  };

  test('renders a professional dashboard and supports save/apply actions', async ({ page }) => {
    await seedAuth(page);

    let applyCalled = false;

    await page.route('**/api/jobs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 101, title: 'Frontend Engineer', company: 'Acme', location: 'Remote', salaryMin: 18, salaryMax: 24, type: 'Full time', createdAt: '2026-03-26T08:00:00.000Z' },
          { id: 102, title: 'Backend Engineer', company: 'Beta', location: 'Hybrid', salaryMin: 20, salaryMax: 28, type: 'Full time', createdAt: '2026-03-25T08:00:00.000Z' },
        ]),
      });
    });

    await page.route('**/api/applications/user/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 501, jobId: 102, status: 'interview_scheduled', createdAt: '2026-03-24T10:00:00.000Z' },
        ]),
      });
    });

    await page.route('**/api/profile/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 1,
          profileCompleteness: 75,
          skills: ['React', 'TypeScript'],
          githubVerifiedSkills: [{ skill: 'React', confidence: 91 }],
        }),
      });
    });

    await page.route('**/api/match/score/1/101', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matchScore: 92,
          hiringProbability: 81,
          matchedSkills: ['React'],
          missingSkills: ['Testing'],
        }),
      });
    });

    await page.route('**/api/match/score/1/102', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matchScore: 74,
          hiringProbability: 66,
          matchedSkills: ['Node'],
          missingSkills: ['GraphQL'],
        }),
      });
    });

    await page.route('**/api/applications/apply', async (route) => {
      applyCalled = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 777,
          jobId: 101,
          status: 'applied',
          createdAt: '2026-03-26T12:00:00.000Z',
        }),
      });
    });

    await page.goto('/candidate/dashboard');

    await expect(page.getByText('Candidate Dashboard')).toBeVisible();
    await expect(page.getByText('Your search is moving with direction.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Frontend Engineer' }).first()).toBeVisible();
    await expect(page.getByText('75% ready')).toBeVisible();
    await expect(page.getByText('interview scheduled')).toBeVisible();

    await expect(page.getByRole('link', { name: 'See all jobs' })).toHaveAttribute('href', '/jobs');
    await expect(page.getByRole('link', { name: 'Resume Scanner' }).first()).toHaveAttribute('href', '/resume');
    await expect(page.getByRole('link', { name: 'Edit Profile', exact: true })).toHaveAttribute('href', '/profile/edit');

    await page.getByRole('button', { name: 'Save role' }).first().click();
    await expect(page.getByRole('button', { name: 'Saved' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Apply now' }).first().click();
    await expect.poll(() => applyCalled).toBe(true);
    await expect(page.getByRole('link', { name: 'In pipeline' }).first()).toBeVisible();
  });

  test('shows polished empty states when no jobs, applications, or profile exist', async ({ page }) => {
    await seedAuth(page);

    await page.route('**/api/jobs', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/applications/user/1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/profile/1', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Profile not found' }) });
    });

    await page.goto('/candidate/dashboard');

    await expect(page.getByText('Candidate Dashboard')).toBeVisible();
    await expect(page.getByText('No recommended roles yet')).toBeVisible();
    await expect(page.getByText('Build your shortlist')).toBeVisible();
    await expect(page.getByText('No applications yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Jobs' }).first()).toHaveAttribute('href', '/jobs');
  });
});
