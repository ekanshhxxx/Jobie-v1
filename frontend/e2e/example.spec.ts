import { test, expect } from '@playwright/test';

test('Jobie login page loads', async ({ page }) => {

  await page.goto('http://localhost:3000/login');

  await expect(page).toHaveURL(/login/);

});