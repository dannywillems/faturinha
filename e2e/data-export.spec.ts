import { test, expect } from '@playwright/test';

test.describe('Data Export', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('FaturinhaDB');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    });
  });

  async function createTestData(
    page: import('@playwright/test').Page
  ): Promise<void> {
    // Create a client
    await page.goto('/clients/new');
    await page.fill('input#name', 'Export Test Client');
    await page.fill('input#email', 'export@example.com');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');

    // Create an invoice
    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Export Test Client' });

    // Fill due date
    await page.fill('input#dueDate', '2024-02-15');

    const firstItem = page.locator('.items-table tbody tr').first();
    await firstItem.locator('input[placeholder="Description"]').fill('Export Test Service');
    await firstItem.locator('input[type="number"]').nth(0).fill('1');
    await firstItem.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');
  }

  test('should have export button on settings page', async ({ page }) => {
    await page.goto('/settings');

    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
  });

  test('should trigger download when clicking export', async ({ page }) => {
    // Create some data first
    await createTestData(page);

    await page.goto('/settings');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename contains 'faturinha-backup'
    expect(download.suggestedFilename()).toMatch(/faturinha-backup-.*\.json/);
  });

  test('should export valid JSON with all data', async ({ page }) => {
    // Create some data first
    await createTestData(page);

    await page.goto('/settings');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;

    // Read the downloaded file content
    const path = await download.path();
    const fs = await import('fs');
    const content = fs.readFileSync(path!, 'utf-8');

    // Parse and validate JSON structure
    const data = JSON.parse(content) as {
      clients: unknown[];
      invoices: unknown[];
      settings: unknown[];
      exportedAt: string;
    };

    expect(data).toHaveProperty('clients');
    expect(data).toHaveProperty('invoices');
    expect(data).toHaveProperty('settings');
    expect(data).toHaveProperty('exportedAt');

    // Verify we have the test data
    expect(data.clients.length).toBeGreaterThanOrEqual(1);
    expect(data.invoices.length).toBeGreaterThanOrEqual(1);
  });

  test('should have import button on settings page', async ({ page }) => {
    await page.goto('/settings');

    const importInput = page.locator('input[type="file"][accept=".json"]');
    await expect(importInput).toBeVisible();
  });
});
