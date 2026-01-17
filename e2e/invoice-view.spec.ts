import { test, expect } from '@playwright/test';

test.describe('Invoice View and Preview', () => {
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
    await page.fill('input#name', 'Preview Test Client');
    await page.fill('input#email', 'preview@example.com');
    await page.fill('input#phone', '+1234567890');
    await page.fill('input[id="address.street"]', '123 Test Street');
    await page.fill('input[id="address.city"]', 'Test City');
    await page.fill('input[id="address.country"]', 'Test Country');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');
  }

  async function createTestInvoice(
    page: import('@playwright/test').Page
  ): Promise<void> {
    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Preview Test Client' });
    await page.fill('input#dueDate', '2024-02-15');

    const firstItem = page.locator('.items-table tbody tr').first();
    await firstItem.locator('input[placeholder="Description"]').fill('Service A');
    await firstItem.locator('input[type="number"]').nth(0).fill('2');
    await firstItem.locator('input[type="number"]').nth(1).fill('150');
    await firstItem.locator('input[type="number"]').nth(2).fill('10');

    await page.click('button:has-text("Add Item")');
    const secondItem = page.locator('.items-table tbody tr').nth(1);
    await secondItem.locator('input[placeholder="Description"]').fill('Product B');
    await secondItem.locator('input[type="number"]').nth(0).fill('3');
    await secondItem.locator('input[type="number"]').nth(1).fill('50');

    await page.fill('textarea#notes', 'Test invoice notes');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');
  }

  test('should navigate to invoice view from list', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');

    // Click View button
    await page.click('a:has-text("View")');

    // Should be on view page
    await expect(page).toHaveURL(/\/invoices\/\d+\/view/);
  });

  test('should display invoice preview with all details', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Check invoice preview container exists (use #invoice-preview to select visible preview)
    await expect(page.locator('#invoice-preview')).toBeVisible();

    // Check client info is displayed
    await expect(page.locator('#invoice-preview')).toContainText(
      'Preview Test Client'
    );

    // Check items are displayed
    await expect(page.locator('#invoice-preview')).toContainText('Service A');
    await expect(page.locator('#invoice-preview')).toContainText('Product B');

    // Check notes are displayed
    await expect(page.locator('#invoice-preview')).toContainText(
      'Test invoice notes'
    );
  });

  test('should display action buttons on view page', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Check action buttons exist
    await expect(page.locator('a:has-text("Edit")')).toBeVisible();
    await expect(page.locator('a:has-text("Duplicate")')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
    await expect(page.locator('button:has-text("Print")')).toBeVisible();
    await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should navigate to edit from view page', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Click Edit button
    await page.click('.header-actions a:has-text("Edit")');

    // Should be on edit page
    await expect(page).toHaveURL(/\/invoices\/\d+\/edit/);
    await expect(
      page.getByRole('heading', { name: 'Edit Invoice' })
    ).toBeVisible();
  });

  test('should navigate to duplicate from view page', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Click Duplicate link
    await page.click('a:has-text("Duplicate")');

    // Should be on duplicate page
    await expect(page).toHaveURL(/\/invoices\/new\?duplicate=\d+/);
    await expect(
      page.getByRole('heading', { name: 'Duplicate' })
    ).toBeVisible();
  });

  test('should mark invoice as sent', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Check initial status is Draft (use #invoice-preview to select visible preview)
    await expect(page.locator('#invoice-preview .status-badge.status-draft')).toBeVisible();

    // Click Send button
    await page.click('button:has-text("Send")');

    // Status should change to Sent
    await expect(page.locator('#invoice-preview .status-badge.status-sent')).toBeVisible();
  });

  test('should mark invoice as paid', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // First mark as sent
    await page.click('button:has-text("Send")');
    await expect(page.locator('#invoice-preview .status-badge.status-sent')).toBeVisible();

    // Then mark as paid
    await page.click('button:has-text("Mark as Paid")');

    // Status should change to Paid
    await expect(page.locator('#invoice-preview .status-badge.status-paid')).toBeVisible();
  });

  test('should delete invoice from view page', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');

    await page.click('a:has-text("View")');

    // Set up dialog handler for confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Click Delete button
    await page.click('button:has-text("Delete")');

    // Should redirect to invoices list
    await expect(page).toHaveURL('/invoices');

    // After deleting the only invoice, empty state should be shown
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('should show back link to invoices list', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Check back link exists
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Invoices');

    // Click back link
    await backLink.click();
    await expect(page).toHaveURL('/invoices');
  });

  test('should click invoice number to go to view', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');

    // Click on invoice number link
    const invoiceLink = page.locator('tbody tr td:first-child a').first();
    await invoiceLink.click();

    // Should be on view page
    await expect(page).toHaveURL(/\/invoices\/\d+\/view/);
  });

  test('should display invoice totals in preview', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Check totals section exists (use #invoice-preview to select visible preview)
    await expect(page.locator('#invoice-preview .invoice-preview-totals')).toBeVisible();

    // Check Subtotal, Tax, and Total labels
    await expect(page.locator('#invoice-preview .invoice-preview-totals')).toContainText(
      'Subtotal'
    );
    await expect(page.locator('#invoice-preview .invoice-preview-totals')).toContainText('Tax');
    await expect(page.locator('#invoice-preview .invoice-preview-totals')).toContainText(
      'Total'
    );
  });

  test('should display items table in preview', async ({ page }) => {
    await createTestClient(page);
    await createTestInvoice(page);

    await page.goto('/invoices');
    await page.click('a:has-text("View")');

    // Check items table exists (use #invoice-preview to select visible preview)
    const itemsTable = page.locator('#invoice-preview .invoice-preview-items');
    await expect(itemsTable).toBeVisible();

    // Should have 2 items
    await expect(itemsTable.locator('tbody tr')).toHaveCount(2);
  });
});
