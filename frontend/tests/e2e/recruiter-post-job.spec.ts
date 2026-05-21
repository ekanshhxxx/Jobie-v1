import { expect, test } from '@playwright/test';

test.describe('Recruiter Post Job', () => {
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

  test('publishes a recruiter job and redirects back to the dashboard', async ({ page }) => {
    await seedAuth(page);

    let postedBody: Record<string, unknown> | null = null;
    let publishedTitle = 'Senior Frontend Engineer';

    await page.route('**/api/jobs', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      postedBody = route.request().postDataJSON() as Record<string, unknown>;
      publishedTitle = String(postedBody.title ?? publishedTitle);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 88,
          ...postedBody,
          lifecycleStatus: 'published',
          approvalStatus: 'approved',
          status: 'approved',
          createdAt: '2026-03-26T16:20:00.000Z',
        }),
      });
    });

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
            totalApplicants: 0,
            newApplicants: 0,
            activePipeline: 0,
            interviewing: 0,
            offers: 0,
            hired: 0,
          },
          roles: [
            {
              id: 88,
              title: publishedTitle,
              company: 'Acme',
              location: 'Remote India',
              status: 'approved',
              lifecycleStatus: 'published',
              approvalStatus: 'approved',
              applicantCount: 0,
              newApplicantCount: 0,
              requiredSkills: ['Stakeholder communication'],
              createdAt: '2026-03-26T16:20:00.000Z',
            },
          ],
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

    await page.goto('/recruiter/post-job', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Job title')).toBeVisible({ timeout: 15000 });

    await page.getByLabel('Job title').fill('Senior Frontend Engineer');
    await page.getByLabel('Location').fill('Remote India');
    await page.getByLabel('Salary').fill('28-35 LPA');
    await page.getByLabel('Experience level').selectOption('senior');

    await page.getByLabel('Soft skills').fill('Stakeholder communication');
    await page.getByLabel('Soft skills').press('Enter');

    await page.getByLabel('Tech stack').fill('React');
    await page.getByLabel('Tech stack').press('Enter');
    await page.getByLabel('Tech stack').fill('TypeScript');
    await page.getByLabel('Tech stack').press('Enter');

    await page.getByLabel('Description').fill(
      'You will own our frontend platform, partner closely with product and design, improve core workflows, and help ship a more reliable recruiter experience across the hiring workspace.'
    );

    await page.getByRole('button', { name: 'Publish job' }).click();

    await expect.poll(() => postedBody).not.toBeNull();
    expect(postedBody).toMatchObject({
      title: 'Senior Frontend Engineer',
      company: 'Acme',
      location: 'Remote India',
      salary: '28-35 LPA',
      experienceLevel: 'senior',
      recruiterId: 9,
      requiredSkills: ['Stakeholder communication'],
      techStack: ['React', 'TypeScript'],
    });

    await expect(page).toHaveURL(/\/recruiter\/dashboard$/);
    await expect(page.getByText('Senior Frontend Engineer', { exact: true })).toBeVisible();
  });
});
