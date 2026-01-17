import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display stats cards', async ({ page }) => {
    await page.goto('/');

    // Check that all stat cards are present
    await expect(page.locator('.stat-card')).toHaveCount(4);

    // Check stat card titles
    await expect(page.locator('.stat-card h3').first()).toBeVisible();
  });

  test('should display zero invoices when empty', async ({ page }) => {
    await page.goto('/');

    // Check that the total invoices stat shows 0
    const statValues = page.locator('.stat-value');
    await expect(statValues.first()).toContainText('0');
  });

  test('should show app name in sidebar', async ({ page }) => {
    await page.goto('/');

    const logo = page.locator('.sidebar .logo h1');
    await expect(logo).toContainText('Faturinha');
  });
});
