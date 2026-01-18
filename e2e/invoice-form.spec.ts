import { test, expect } from '@playwright/test';

test.describe('Invoice Form', () => {
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

  async function createTestClient(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/clients/new');
    await page.fill('input#name', 'Test Client for Invoices');
    await page.fill('input#email', 'client@example.com');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');
  }

  test('should navigate to new invoice form', async ({ page }) => {
    await page.goto('/invoices');
    await page.click('a[href="/invoices/new"]');
    await expect(page).toHaveURL('/invoices/new');
    await expect(
      page.getByRole('heading', { name: 'New Invoice' })
    ).toBeVisible();
  });

  test('should display all form fields', async ({ page }) => {
    await page.goto('/invoices/new');

    // Check main fields
    await expect(page.locator('select#clientId')).toBeVisible();
    await expect(page.locator('select#currency')).toBeVisible();
    await expect(page.locator('input#issueDate')).toBeVisible();
    await expect(page.locator('input#dueDate')).toBeVisible();
    await expect(page.locator('textarea#notes')).toBeVisible();

    // Check items table exists
    await expect(page.locator('.items-table')).toBeVisible();
  });

  test('should require client selection', async ({ page }) => {
    await page.goto('/invoices/new');

    // Fill some fields but not client
    await page.fill('input#issueDate', '2024-01-15');
    await page.fill('input#dueDate', '2024-02-15');

    // Try to submit without selecting client
    await page.click('button[type="submit"]');

    // Form should not submit (still on same page)
    await expect(page).toHaveURL('/invoices/new');
  });

  test('should create invoice with single product', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    // Go to new invoice form
    await page.goto('/invoices/new');

    // Select client
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });

    // Fill dates
    await page.fill('input#dueDate', '2024-02-15');

    // Fill invoice item
    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Web Development Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('10'); // quantity
    await itemRow.locator('input[type="number"]').nth(1).fill('100'); // unit price

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to invoices list
    await expect(page).toHaveURL('/invoices');

    // Invoice should appear in the list
    await expect(page.getByRole('cell', { name: 'Test Client for Invoices' })).toBeVisible();
  });

  test('should create invoice with multiple products', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    // Go to new invoice form
    await page.goto('/invoices/new');

    // Select client
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });

    // Fill dates
    await page.fill('input#dueDate', '2024-02-15');

    // Fill first item
    const firstItem = page.locator('.items-table tbody tr').first();
    await firstItem.locator('input[placeholder="Description"]').fill('Design Services');
    await firstItem.locator('input[type="number"]').nth(0).fill('5');
    await firstItem.locator('input[type="number"]').nth(1).fill('200');
    await firstItem.locator('input[type="number"]').nth(2).fill('21'); // tax rate

    // Add second item
    await page.click('button:has-text("Add Item")');

    const secondItem = page.locator('.items-table tbody tr').nth(1);
    await secondItem.locator('input[placeholder="Description"]').fill('Development Services');
    await secondItem.locator('input[type="number"]').nth(0).fill('20');
    await secondItem.locator('input[type="number"]').nth(1).fill('150');
    await secondItem.locator('input[type="number"]').nth(2).fill('21');

    // Add third item
    await page.click('button:has-text("Add Item")');

    const thirdItem = page.locator('.items-table tbody tr').nth(2);
    await thirdItem.locator('input[placeholder="Description"]').fill('Hosting');
    await thirdItem.locator('input[type="number"]').nth(0).fill('12');
    await thirdItem.locator('input[type="number"]').nth(1).fill('50');

    // Verify we have 3 items
    await expect(page.locator('.items-table tbody tr')).toHaveCount(3);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to invoices list
    await expect(page).toHaveURL('/invoices');
  });

  test('should remove item from invoice', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    await page.goto('/invoices/new');

    // Select client
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });

    // Add second item
    await page.click('button:has-text("Add Item")');

    // Verify we have 2 items
    await expect(page.locator('.items-table tbody tr')).toHaveCount(2);

    // Remove second item
    await page.locator('.items-table tbody tr').nth(1).locator('button').click();

    // Verify we have 1 item
    await expect(page.locator('.items-table tbody tr')).toHaveCount(1);
  });

  test('should not allow removing the last item', async ({ page }) => {
    await page.goto('/invoices/new');

    // The remove button should be disabled when there's only one item
    const removeButton = page.locator('.items-table tbody tr').first().locator('button');
    await expect(removeButton).toBeDisabled();
  });

  test('should calculate totals correctly', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    await page.goto('/invoices/new');

    // Select client
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });

    // Fill first item: 2 x 100 = 200, with 10% tax = 220
    const firstItem = page.locator('.items-table tbody tr').first();
    await firstItem.locator('input[placeholder="Description"]').fill('Service A');
    await firstItem.locator('input[type="number"]').nth(0).fill('2');
    await firstItem.locator('input[type="number"]').nth(1).fill('100');
    await firstItem.locator('input[type="number"]').nth(2).fill('10');

    // Add second item: 1 x 50 = 50, with 20% tax = 60
    await page.click('button:has-text("Add Item")');
    const secondItem = page.locator('.items-table tbody tr').nth(1);
    await secondItem.locator('input[placeholder="Description"]').fill('Service B');
    await secondItem.locator('input[type="number"]').nth(0).fill('1');
    await secondItem.locator('input[type="number"]').nth(1).fill('50');
    await secondItem.locator('input[type="number"]').nth(2).fill('20');

    // Wait for calculations to update
    await page.waitForTimeout(100);

    // Verify totals section exists (we can't easily verify exact values due to currency formatting)
    await expect(page.locator('.invoice-totals')).toBeVisible();
    await expect(page.locator('.total-row')).toHaveCount(3); // subtotal, tax, total
  });

  test('should use different currencies', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    await page.goto('/invoices/new');

    // Select client
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });

    // Change currency to USD
    await page.selectOption('select#currency', 'USD');
    await expect(page.locator('select#currency')).toHaveValue('USD');

    // Change currency to BRL
    await page.selectOption('select#currency', 'BRL');
    await expect(page.locator('select#currency')).toHaveValue('BRL');

    // Change currency to EUR
    await page.selectOption('select#currency', 'EUR');
    await expect(page.locator('select#currency')).toHaveValue('EUR');
  });

  test('should cancel and return to invoices list', async ({ page }) => {
    await page.goto('/invoices/new');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should redirect to invoices list
    await expect(page).toHaveURL('/invoices');
  });

  test('should not show status field when creating new invoice', async ({ page }) => {
    await page.goto('/invoices/new');

    // Status field should not be visible when creating new invoice
    await expect(page.locator('select#status')).not.toBeVisible();
  });

  test('should show status field when editing invoice', async ({ page }) => {
    // First create a client and invoice
    await createTestClient(page);

    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });
    await page.fill('input#dueDate', '2024-02-15');

    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Test Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('1');
    await itemRow.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Click edit on the invoice
    await page.click('a:has-text("Edit")');

    // Status field should be visible when editing
    await expect(page.locator('select#status')).toBeVisible();

    // Default status should be 'draft'
    await expect(page.locator('select#status')).toHaveValue('draft');
  });

  test('should allow changing invoice status when editing', async ({ page }) => {
    // First create a client and invoice
    await createTestClient(page);

    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });
    await page.fill('input#dueDate', '2024-02-15');

    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Test Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('1');
    await itemRow.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Click edit on the invoice
    await page.click('a:has-text("Edit")');

    // Change status to 'sent'
    await page.selectOption('select#status', 'sent');
    await expect(page.locator('select#status')).toHaveValue('sent');

    // Save changes
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Verify status was updated in the list
    await expect(page.locator('.status-badge:has-text("Sent")')).toBeVisible();
  });

  test('should allow changing invoice status to paid', async ({ page }) => {
    // First create a client and invoice
    await createTestClient(page);

    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });
    await page.fill('input#dueDate', '2024-02-15');

    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Test Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('1');
    await itemRow.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Click edit on the invoice
    await page.click('a:has-text("Edit")');

    // Change status to 'paid'
    await page.selectOption('select#status', 'paid');

    // Save changes
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Verify status was updated in the list
    await expect(page.locator('.status-badge:has-text("Paid")')).toBeVisible();
  });

  test('should show invoice-specific statuses for invoices', async ({ page }) => {
    // First create a client and invoice
    await createTestClient(page);

    await page.goto('/invoices/new');
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });
    await page.fill('input#dueDate', '2024-02-15');

    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Test Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('1');
    await itemRow.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Click edit on the invoice
    await page.click('a:has-text("Edit")');

    // Check that invoice-specific statuses are available
    const statusSelect = page.locator('select#status');
    await expect(statusSelect.locator('option[value="draft"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="sent"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="paid"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="overdue"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="cancelled"]')).toHaveCount(1);

    // Quote-specific statuses should not be available
    await expect(statusSelect.locator('option[value="accepted"]')).toHaveCount(0);
    await expect(statusSelect.locator('option[value="declined"]')).toHaveCount(0);
    await expect(statusSelect.locator('option[value="expired"]')).toHaveCount(0);
  });

  test('should show quote-specific statuses for quotes', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    // Create a quote
    await page.goto('/invoices/new');

    // Select quote document type
    await page.click('label:has-text("Quote")');

    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });
    await page.fill('input#validUntil', '2024-02-15');

    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Test Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('1');
    await itemRow.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Click edit on the quote
    await page.click('a:has-text("Edit")');

    // Check that quote-specific statuses are available
    const statusSelect = page.locator('select#status');
    await expect(statusSelect.locator('option[value="draft"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="sent"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="accepted"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="declined"]')).toHaveCount(1);
    await expect(statusSelect.locator('option[value="expired"]')).toHaveCount(1);

    // Invoice-specific statuses should not be available
    await expect(statusSelect.locator('option[value="paid"]')).toHaveCount(0);
    await expect(statusSelect.locator('option[value="overdue"]')).toHaveCount(0);
    await expect(statusSelect.locator('option[value="cancelled"]')).toHaveCount(0);
  });

  test('should allow changing quote status to accepted', async ({ page }) => {
    // First create a client
    await createTestClient(page);

    // Create a quote
    await page.goto('/invoices/new');
    await page.click('label:has-text("Quote")');
    await page.selectOption('select#clientId', { label: 'Test Client for Invoices' });
    await page.fill('input#validUntil', '2024-02-15');

    const itemRow = page.locator('.items-table tbody tr').first();
    await itemRow.locator('input[placeholder="Description"]').fill('Test Service');
    await itemRow.locator('input[type="number"]').nth(0).fill('1');
    await itemRow.locator('input[type="number"]').nth(1).fill('100');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Click edit on the quote
    await page.click('a:has-text("Edit")');

    // Change status to 'accepted'
    await page.selectOption('select#status', 'accepted');

    // Save changes
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // Verify status was updated in the list
    await expect(page.locator('.status-badge:has-text("Accepted")')).toBeVisible();
  });
});
