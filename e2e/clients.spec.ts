import { test, expect } from '@playwright/test';

test.describe('Clients Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clients');
  });

  test('should display page title and create button', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Clients', level: 1 })
    ).toBeVisible();
    await expect(page.locator('a[href="/clients/new"]')).toBeVisible();
  });

  test('should show empty state when no clients', async ({ page }) => {
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No clients yet');
  });

  test('should have create client button with correct text', async ({
    page,
  }) => {
    const createButton = page.locator('a[href="/clients/new"]');
    await expect(createButton).toContainText('New Client');
  });
});
