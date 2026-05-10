import { expect, test } from '@playwright/test';

test.describe('Recruiter Dashboard', () => {
  const seedAuth = async (page: import('@playwright/test').Page) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'e2e-token');
      localStorage.setItem('user', JSON.stringify({
        id: 9,
        name: 'Recruiter One',
        email: 'recruiter@example.com',
        role: 'recruiter',
        companyName: 'Acme',
      }));
    });
  };

  test('renders recruiter dashboard with enterprise data blocks', async ({ page }) => {
    await seedAuth(page);

    await page.route('**/api/profile/9', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 9,
          companyName: 'Acme',
          headline: 'Lead recruiter',
        }),
      });
    });

    await page.route('**/api/dashboard/recruiter/9', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recruiterId: 9,
          summary: {
            openRoles: 1,
            draftRoles: 0,
            pendingApproval: 0,
            closedRoles: 0,
            totalApplicants: 2,
            newApplicants: 1,
            activePipeline: 2,
            interviewing: 1,
            offers: 0,
            hired: 0,
          },
          roles: [
            {
              id: 31,
              title: 'Senior Frontend Engineer',
              company: 'Acme',
              location: 'Remote',
              status: 'approved',
              lifecycleStatus: 'published',
              approvalStatus: 'approved',
              applicantCount: 2,
              newApplicantCount: 1,
              requiredSkills: ['React'],
              createdAt: '2026-03-20T10:00:00.000Z',
            },
          ],
          roleHealth: [],
          recentApplicants: [
            {
              id: 501,
              status: 'applied',
              createdAt: '2026-03-26T10:00:00.000Z',
              candidate: {
                id: 71,
                name: 'Ariana Patel',
                email: 'ariana@example.com',
                headline: 'Frontend Developer',
              },
              job: {
                id: 31,
                title: 'Senior Frontend Engineer',
              },
              matchSummary: {
                matchScore: 84,
                hiringProbability: 78,
              },
            },
          ],
          pipelinePreview: {
            applied: 1,
            shortlisted: 0,
            interview: 1,
            offer: 0,
            hired: 0,
            rejected: 0,
          },
        }),
      });
    });

    await page.goto('/recruiter/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Active Jobs')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Senior Frontend Engineer', level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Post a Job' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
    await expect(page.getByText('Pipeline Health')).toBeVisible();
  });

  test('shows recruiter empty state data cleanly', async ({ page }) => {
    await seedAuth(page);

    await page.route('**/api/profile/9', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 9,
          companyName: 'Acme',
          headline: 'Lead recruiter',
        }),
      });
    });

    await page.route('**/api/dashboard/recruiter/9', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recruiterId: 9,
          summary: {
            openRoles: 0,
            draftRoles: 0,
            pendingApproval: 0,
            closedRoles: 0,
            totalApplicants: 0,
            newApplicants: 0,
            activePipeline: 0,
            interviewing: 0,
            offers: 0,
            hired: 0,
          },
          roles: [],
          roleHealth: [],
          recentApplicants: [],
          pipelinePreview: {
            applied: 0,
            shortlisted: 0,
            interview: 0,
            offer: 0,
            hired: 0,
            rejected: 0,
          },
        }),
      });
    });

    await page.goto('/recruiter/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('No jobs posted yet')).toBeVisible();
    await expect(page.getByText('No applicants yet')).toBeVisible();
  });
});
