import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the dashboard by default', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Dashboard', level: 1 })
    ).toBeVisible();
  });

  test('should navigate to invoices page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/invoices"]');
    await expect(page).toHaveURL('/invoices');
    await expect(
      page.getByRole('heading', { name: 'Invoices', level: 1 })
    ).toBeVisible();
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/clients"]');
    await expect(page).toHaveURL('/clients');
    await expect(
      page.getByRole('heading', { name: 'Clients', level: 1 })
    ).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(
      page.getByRole('heading', { name: 'Settings', level: 1 })
    ).toBeVisible();
  });

  test('should highlight active nav link', async ({ page }) => {
    await page.goto('/invoices');
    const activeLink = page.locator('nav a.active');
    await expect(activeLink).toContainText('Invoices');
  });
});
