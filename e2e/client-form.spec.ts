import { test, expect } from '@playwright/test';

test.describe('Client Form', () => {
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

  test('should navigate to new client form', async ({ page }) => {
    await page.goto('/clients');
    await page.click('a[href="/clients/new"]');
    await expect(page).toHaveURL('/clients/new');
    await expect(
      page.getByRole('heading', { name: 'New Client' })
    ).toBeVisible();
  });

  test('should display all form fields', async ({ page }) => {
    await page.goto('/clients/new');

    // Check main fields
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
    await expect(page.locator('input#vatNumber')).toBeVisible();

    // Check address fields
    await expect(page.locator('input#address\\.street')).toBeVisible();
    await expect(page.locator('input#address\\.city')).toBeVisible();
    await expect(page.locator('input#address\\.state')).toBeVisible();
    await expect(page.locator('input#address\\.postalCode')).toBeVisible();
    await expect(page.locator('input#address\\.country')).toBeVisible();

    // Check notes field
    await expect(page.locator('textarea#notes')).toBeVisible();
  });

  test('should require name field', async ({ page }) => {
    await page.goto('/clients/new');

    // Try to submit without filling required field
    await page.click('button[type="submit"]');

    // Form should not submit (still on same page)
    await expect(page).toHaveURL('/clients/new');
  });

  test('should create a new client', async ({ page }) => {
    await page.goto('/clients/new');

    // Fill in client details
    await page.fill('input#name', 'Test Client Inc.');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#phone', '+1-555-123-4567');
    await page.fill('input#vatNumber', 'BE0123456789');

    // Fill address
    await page.fill('input#address\\.street', '123 Main Street');
    await page.fill('input#address\\.city', 'Brussels');
    await page.fill('input#address\\.state', 'Brussels Capital');
    await page.fill('input#address\\.postalCode', '1000');
    await page.fill('input#address\\.country', 'Belgium');

    // Fill notes
    await page.fill('textarea#notes', 'Test client for E2E testing');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to clients list
    await expect(page).toHaveURL('/clients');

    // New client should appear in the list
    await expect(page.getByText('Test Client Inc.')).toBeVisible();
  });

  test('should cancel and return to clients list', async ({ page }) => {
    await page.goto('/clients/new');

    // Fill in some data
    await page.fill('input#name', 'Test Client');

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Should redirect to clients list
    await expect(page).toHaveURL('/clients');

    // Client should not be saved
    await expect(page.getByText('Test Client')).not.toBeVisible();
  });

  test('should edit an existing client', async ({ page }) => {
    // First create a client
    await page.goto('/clients/new');
    await page.fill('input#name', 'Original Name');
    await page.fill('input#email', 'original@example.com');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');

    // Click on the edit button for the client
    await page.click('a:has-text("Edit")');

    // Should be on edit page
    await expect(
      page.getByRole('heading', { name: 'Edit Client' })
    ).toBeVisible();

    // Change the name
    await page.fill('input#name', 'Updated Name');
    await page.click('button[type="submit"]');

    // Should redirect to clients list
    await expect(page).toHaveURL('/clients');

    // Updated name should appear
    await expect(page.getByText('Updated Name')).toBeVisible();
    await expect(page.getByText('Original Name')).not.toBeVisible();
  });

  test('should delete a client', async ({ page }) => {
    // First create a client
    await page.goto('/clients/new');
    await page.fill('input#name', 'Client To Delete');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');

    // Click edit to go to the form
    await page.click('a:has-text("Edit")');

    // Handle the confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete
    await page.click('button:has-text("Delete")');

    // Should redirect to clients list
    await expect(page).toHaveURL('/clients');

    // Client should no longer appear
    await expect(page.getByText('Client To Delete')).not.toBeVisible();
  });
});
