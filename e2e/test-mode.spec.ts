import { test, expect } from '@playwright/test';

test.describe('Test Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show "Enter Test Mode" button in sidebar', async ({ page }) => {
    await page.goto('/');
    const enterButton = page.getByRole('button', { name: 'Enter Test Mode' });
    await expect(enterButton).toBeVisible();
  });

  test('should show test mode banner when entering test mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    const banner = page.locator('.test-mode-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(
      'TEST MODE - Changes will not affect your real data'
    );
  });

  test('should show TEST badge in sidebar when in test mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    const testBadge = page.locator('.test-badge');
    await expect(testBadge).toBeVisible();
    await expect(testBadge).toHaveText('TEST');
  });

  test('should hide "Enter Test Mode" button when in test mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    const enterButton = page.locator('.btn-test-mode');
    await expect(enterButton).not.toBeVisible();
  });

  test('should show "Exit Test Mode" button in banner when in test mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    const exitButton = page.getByRole('button', { name: 'Exit Test Mode' });
    await expect(exitButton).toBeVisible();
  });

  test('should show "Reset Test Data" button in banner when in test mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    const resetButton = page.getByRole('button', { name: 'Reset Test Data' });
    await expect(resetButton).toBeVisible();
  });

  test('should load sample clients in test mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Navigate to clients page
    await page.click('a[href="/clients"]');
    await expect(page).toHaveURL('/clients');

    // Check for sample client names
    await expect(page.getByText('Acme Corporation')).toBeVisible();
    await expect(page.getByText('TechStart Solutions')).toBeVisible();
    await expect(page.getByText('Green Energy Ltd')).toBeVisible();
  });

  test('should load sample invoices in test mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Navigate to invoices page
    await page.click('a[href="/invoices"]');
    await expect(page).toHaveURL('/invoices');

    // Check that invoices table has data
    const invoiceRows = page.locator('tbody tr');
    await expect(invoiceRows).not.toHaveCount(0);

    // Check for invoice statuses
    const statusBadges = page.locator('.status-badge');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should load sample settings in test mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Navigate to settings page
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');

    // Check for demo business name
    const businessNameInput = page.locator('input').first();
    await expect(businessNameInput).toHaveValue('Demo Freelancer');
  });

  test('should exit test mode and show production view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Verify in test mode
    await expect(page.locator('.test-mode-banner')).toBeVisible();

    // Exit test mode
    await page.getByRole('button', { name: 'Exit Test Mode' }).click();

    // Verify banner is gone
    await expect(page.locator('.test-mode-banner')).not.toBeVisible();

    // Verify TEST badge is gone
    await expect(page.locator('.test-badge')).not.toBeVisible();

    // Verify "Enter Test Mode" button is back
    await expect(
      page.getByRole('button', { name: 'Enter Test Mode' })
    ).toBeVisible();
  });

  test('should persist test mode across page navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Navigate to different pages and verify test mode persists
    await page.click('a[href="/invoices"]');
    await expect(page.locator('.test-mode-banner')).toBeVisible();

    await page.click('a[href="/clients"]');
    await expect(page.locator('.test-mode-banner')).toBeVisible();

    await page.click('a[href="/settings"]');
    await expect(page.locator('.test-mode-banner')).toBeVisible();
  });

  test('should persist test mode across page reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Verify in test mode
    await expect(page.locator('.test-mode-banner')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify still in test mode after reload
    await expect(page.locator('.test-mode-banner')).toBeVisible();
    await expect(page.locator('.test-badge')).toBeVisible();
  });

  test('should reset test data when clicking reset button', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Navigate to settings page
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL('/settings');

    // Verify original business name
    const businessNameInput = page.locator(
      'input[type="text"]'
    ).first();
    await expect(businessNameInput).toHaveValue('Demo Freelancer');

    // Modify the business name
    await businessNameInput.fill('Modified Business Name');
    await expect(businessNameInput).toHaveValue('Modified Business Name');

    // Set up dialog handler for the reset confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Reset test data
    await page.getByRole('button', { name: 'Reset Test Data' }).click();

    // Wait for reset to complete and verify settings are restored
    await page.waitForTimeout(500); // Give time for IndexedDB to repopulate
    await page.reload();

    // Verify business name is restored to original
    const restoredInput = page.locator('input[type="text"]').first();
    await expect(restoredInput).toHaveValue('Demo Freelancer');
  });

  test('should show dashboard with sample data metrics in test mode', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Verify we're on the dashboard
    await expect(
      page.getByRole('heading', { name: 'Dashboard', level: 1 })
    ).toBeVisible();

    // Check that dashboard shows some data (total revenue, etc.)
    // The exact values depend on seed data
    const dashboardContent = page.locator('.main-content');
    await expect(dashboardContent).not.toBeEmpty();
  });

  test('should apply test-mode class to app layout', async ({ page }) => {
    await page.goto('/');

    // Initially should not have test-mode class
    await expect(page.locator('.app-layout')).not.toHaveClass(/test-mode/);

    // Enter test mode
    await page.getByRole('button', { name: 'Enter Test Mode' }).click();

    // Should have test-mode class
    await expect(page.locator('.app-layout')).toHaveClass(/test-mode/);
  });
});
