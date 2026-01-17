import { test, expect } from '@playwright/test';

test.describe('Invoice Duplication', () => {
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

  async function createTestClient(
    page: import('@playwright/test').Page
  ): Promise<void> {
    await page.goto('/clients/new');
    await page.fill('input#name', 'Duplication Test Client');
    await page.fill('input#email', 'dup@example.com');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');
  }

  async function createTestInvoice(
    page: import('@playwright/test').Page
  ): Promise<void> {
    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Duplication Test Client' });

    // Fill due date
    await page.fill('input#dueDate', '2024-02-15');

    const firstItem = page.locator('.items-table tbody tr').first();
    await firstItem.locator('input[placeholder="Description"]').fill('Original Service');
    await firstItem.locator('input[type="number"]').nth(0).fill('5');
    await firstItem.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button:has-text("Add Item")');
    const secondItem = page.locator('.items-table tbody tr').nth(1);
    await secondItem.locator('input[placeholder="Description"]').fill('Original Product');
    await secondItem.locator('input[type="number"]').nth(0).fill('2');
    await secondItem.locator('input[type="number"]').nth(1).fill('250');

    await page.fill('textarea#notes', 'Original invoice notes');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');
  }

  test('should navigate to duplicate form from invoice list', async ({ page }) => {
    // Create client and invoice first
    await createTestClient(page);
    await createTestInvoice(page);

    // Go to invoices page
    await page.goto('/invoices');

    // Find the first invoice and get its ID for duplication
    // Click on the edit link to get the invoice ID
    const editLink = page.locator('a:has-text("Edit")').first();
    const href = await editLink.getAttribute('href');
    const invoiceId = href?.split('/').pop();

    // Navigate to duplicate URL
    await page.goto(`/invoices/new?duplicate=${invoiceId}`);

    // Should show duplicate heading
    await expect(
      page.getByRole('heading', { name: 'Duplicate' })
    ).toBeVisible();
  });

  test('should preserve items when duplicating', async ({ page }) => {
    // Create client and invoice first
    await createTestClient(page);
    await createTestInvoice(page);

    // Go to invoices page and get invoice ID
    await page.goto('/invoices');
    const editLink = page.locator('a:has-text("Edit")').first();
    const href = await editLink.getAttribute('href');
    const invoiceId = href?.split('/').pop();

    // Navigate to duplicate URL
    await page.goto(`/invoices/new?duplicate=${invoiceId}`);

    // Verify that items are preserved
    await expect(page.locator('.items-table tbody tr')).toHaveCount(2);

    // Verify first item description is preserved
    const firstItemDesc = page
      .locator('.items-table tbody tr')
      .first()
      .locator('input[placeholder="Description"]');
    await expect(firstItemDesc).toHaveValue('Original Service');

    // Verify second item description is preserved
    const secondItemDesc = page
      .locator('.items-table tbody tr')
      .nth(1)
      .locator('input[placeholder="Description"]');
    await expect(secondItemDesc).toHaveValue('Original Product');
  });

  test('should preserve client when duplicating', async ({ page }) => {
    // Create client and invoice first
    await createTestClient(page);
    await createTestInvoice(page);

    // Go to invoices page and get invoice ID
    await page.goto('/invoices');
    const editLink = page.locator('a:has-text("Edit")').first();
    const href = await editLink.getAttribute('href');
    const invoiceId = href?.split('/').pop();

    // Navigate to duplicate URL
    await page.goto(`/invoices/new?duplicate=${invoiceId}`);

    // Verify client is preserved
    const clientSelect = page.locator('select#clientId');
    await expect(clientSelect).toHaveValue(/\d+/); // Should have a numeric value (client ID)
  });

  test('should preserve notes when duplicating', async ({ page }) => {
    // Create client and invoice first
    await createTestClient(page);
    await createTestInvoice(page);

    // Go to invoices page and get invoice ID
    await page.goto('/invoices');
    const editLink = page.locator('a:has-text("Edit")').first();
    const href = await editLink.getAttribute('href');
    const invoiceId = href?.split('/').pop();

    // Navigate to duplicate URL
    await page.goto(`/invoices/new?duplicate=${invoiceId}`);

    // Verify notes are preserved
    const notesField = page.locator('textarea#notes');
    await expect(notesField).toHaveValue('Original invoice notes');
  });

  test('should create new invoice with new number when duplicating', async ({ page }) => {
    // Create client and invoice first
    await createTestClient(page);
    await createTestInvoice(page);

    // Get original invoice count
    await page.goto('/invoices');
    const originalCount = await page.locator('tbody tr').count();

    // Get invoice ID for duplication
    const editLink = page.locator('a:has-text("Edit")').first();
    const href = await editLink.getAttribute('href');
    const invoiceId = href?.split('/').pop();

    // Navigate to duplicate URL and wait for form to load
    await page.goto(`/invoices/new?duplicate=${invoiceId}`);

    // Wait for the form to be populated with duplicated data
    await expect(page.locator('textarea#notes')).toHaveValue('Original invoice notes');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to invoices list
    await expect(page).toHaveURL('/invoices');

    // Should have one more invoice
    await expect(page.locator('tbody tr')).toHaveCount(originalCount + 1);
  });
});
