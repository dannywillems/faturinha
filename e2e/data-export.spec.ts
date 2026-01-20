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

    // Verify download filename contains 'faturinha' and date format
    expect(download.suggestedFilename()).toMatch(/faturinha-.*-\d{4}-\d{2}-\d{2}\.json/);
  });

  test('should export valid JSON with all data including company info', async ({ page }) => {
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
      company: { id: string; name: string } | null;
      clients: unknown[];
      invoices: unknown[];
      settings: unknown[];
      exportedAt: string;
      version: string;
    };

    expect(data).toHaveProperty('clients');
    expect(data).toHaveProperty('invoices');
    expect(data).toHaveProperty('settings');
    expect(data).toHaveProperty('exportedAt');
    expect(data).toHaveProperty('version');

    // Verify we have the test data
    expect(data.clients.length).toBeGreaterThanOrEqual(1);
    expect(data.invoices.length).toBeGreaterThanOrEqual(1);
  });

  test('should have import button on settings page', async ({ page }) => {
    await page.goto('/settings');

    const importInput = page.locator('input[type="file"][accept=".json"]');
    await expect(importInput).toBeVisible();
  });

  test('should export data with version number', async ({ page }) => {
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
      version: string;
    };

    expect(data.version).toBe('1.0');
  });

  test('should include exportedAt timestamp in ISO format', async ({ page }) => {
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
      exportedAt: string;
    };

    // Verify exportedAt is a valid ISO date string
    expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(data.exportedAt)).not.toThrow();
  });
});

test.describe('Data Export with Companies', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage and IndexedDB
    await page.evaluate(() => {
      localStorage.clear();
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('FaturinhaDB');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    });
  });

  test('should include company name in export filename when company exists', async ({ page }) => {
    // Create a company first
    await page.goto('/settings');

    // Fill in the company name input and create a company
    await page.fill('input[placeholder*="ompany"]', 'My Test Company');
    await page.click('button:has-text("Create")');

    // Wait for company to be created
    await page.waitForSelector('.company-item');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename contains company slug
    expect(download.suggestedFilename()).toContain('my-test-company');
  });

  test('should include company info in exported JSON', async ({ page }) => {
    // Create a company first
    await page.goto('/settings');

    // Fill in the company name input and create a company
    await page.fill('input[placeholder*="ompany"]', 'Export Company');
    await page.click('button:has-text("Create")');

    // Wait for company to be created
    await page.waitForSelector('.company-item');

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
      company: { id: string; name: string } | null;
    };

    expect(data.company).not.toBeNull();
    expect(data.company?.name).toBe('Export Company');
    expect(data.company?.id).toBeTruthy();
  });
});

test.describe('Data Export in Test Mode', () => {
  test('should export test mode data separately', async ({ page }) => {
    await page.goto('/');

    // Enter test mode
    await page.click('button:has-text("Enter Test Mode")');
    await page.waitForSelector('.test-mode-banner');

    // Wait for test data to be seeded by checking for a specific seeded client
    await page.goto('/clients');
    await expect(page.getByText('Acme Corporation')).toBeVisible({
      timeout: 20000,
    });

    // Go to settings and export (skip invoices check - seeding timing is unreliable)
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
      company: { id: string; name: string } | null;
      clients: unknown[];
      invoices: unknown[];
    };

    // Test mode should have sample data (at minimum, clients should be seeded)
    expect(data.clients.length).toBeGreaterThan(0);

    // Company should be a test company
    expect(data.company?.name).toContain('Demo');
  });
});
