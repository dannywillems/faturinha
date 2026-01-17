import { test, expect } from '@playwright/test';

test.describe('Invoices Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices');
  });

  test('should display page title and create button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible();
    await expect(page.locator('a[href="/invoices/new"]')).toBeVisible();
  });

  test('should show empty state when no invoices', async ({ page }) => {
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No invoices yet');
  });

  test('should have create invoice button with correct text', async ({
    page,
  }) => {
    const createButton = page.locator('a[href="/invoices/new"]');
    await expect(createButton).toContainText('New Invoice');
  });
});
