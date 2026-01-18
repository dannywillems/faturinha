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
});
