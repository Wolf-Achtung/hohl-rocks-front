import { test, expect } from '@playwright/test';
test('home renders and news modal works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'hohl.rocks' })).toBeVisible();
  await page.getByRole('button', { name: 'News' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByText('Weekly Digest').click();
  await expect(page.getByRole('heading', { name: 'Weekly Digest (EU AI Act)' })).toBeVisible();
  await page.keyboard.press('Escape');
});
