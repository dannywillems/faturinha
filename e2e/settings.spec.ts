import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display page title', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Settings', level: 1 })
    ).toBeVisible();
  });

  test('should display companies section', async ({ page }) => {
    const companiesSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Companies' });
    await expect(companiesSection).toBeVisible();
  });

  test('should display business information section', async ({ page }) => {
    const businessSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Business Information' });
    await expect(businessSection).toBeVisible();
  });

  test('should have business name input', async ({ page }) => {
    const businessSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Business Information' });
    const businessNameInput = businessSection.locator('input[type="text"]').first();
    await expect(businessNameInput).toBeVisible();
  });

  test('should have currency select', async ({ page }) => {
    const invoiceSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Invoice Settings' });
    const currencySelect = invoiceSection.locator('select').first();
    await expect(currencySelect).toBeVisible();

    // Check some currency options exist
    await expect(
      currencySelect.locator('option[value="USD"]')
    ).toBeAttached();
    await expect(
      currencySelect.locator('option[value="EUR"]')
    ).toBeAttached();
    await expect(
      currencySelect.locator('option[value="BRL"]')
    ).toBeAttached();
  });

  test('should have save button', async ({ page }) => {
    const saveButton = page.locator('.form-actions button.btn-primary');
    await expect(saveButton).toContainText('Save');
  });

  test('should have export data button', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
  });

  test('should be able to change business name', async ({ page }) => {
    const businessSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Business Information' });
    const businessNameInput = businessSection.locator('input[type="text"]').first();

    await businessNameInput.fill('Test Business');
    await expect(businessNameInput).toHaveValue('Test Business');
  });

  test('should be able to change default currency', async ({ page }) => {
    const invoiceSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Invoice Settings' });
    const currencySelect = invoiceSection.locator('select').first();

    await currencySelect.selectOption('BRL');
    await expect(currencySelect).toHaveValue('BRL');
  });

  test('should display all business information fields', async ({ page }) => {
    const businessSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Business Information' });

    // Business Name
    await expect(businessSection.locator('label:has-text("Business Name")')).toBeVisible();
    await expect(businessSection.locator('input[type="text"]').first()).toBeVisible();

    // Email
    await expect(businessSection.locator('label:has-text("Email")')).toBeVisible();
    await expect(businessSection.locator('input[type="email"]')).toBeVisible();

    // Phone
    await expect(businessSection.locator('label:has-text("Phone")')).toBeVisible();
    await expect(businessSection.locator('input[type="tel"]')).toBeVisible();

    // VAT Number
    await expect(businessSection.locator('label:has-text("VAT Number")')).toBeVisible();

    // Address fields
    await expect(businessSection.locator('label:has-text("Address")')).toBeVisible();
    await expect(businessSection.locator('input[id="businessAddress.street"]')).toBeVisible();
    await expect(businessSection.locator('input[id="businessAddress.city"]')).toBeVisible();
    await expect(businessSection.locator('input[id="businessAddress.state"]')).toBeVisible();
    await expect(businessSection.locator('input[id="businessAddress.postalCode"]')).toBeVisible();
    await expect(businessSection.locator('input[id="businessAddress.country"]')).toBeVisible();

    // Logo
    await expect(businessSection.locator('label:has-text("Logo")')).toBeVisible();
  });

  test('should be able to fill business address fields', async ({ page }) => {
    const businessSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Business Information' });

    // Fill address fields
    await businessSection.locator('input[id="businessAddress.street"]').fill('123 Main Street');
    await businessSection.locator('input[id="businessAddress.city"]').fill('New York');
    await businessSection.locator('input[id="businessAddress.state"]').fill('NY');
    await businessSection.locator('input[id="businessAddress.postalCode"]').fill('10001');
    await businessSection.locator('input[id="businessAddress.country"]').fill('United States');

    // Verify values are set
    await expect(businessSection.locator('input[id="businessAddress.street"]')).toHaveValue('123 Main Street');
    await expect(businessSection.locator('input[id="businessAddress.city"]')).toHaveValue('New York');
    await expect(businessSection.locator('input[id="businessAddress.state"]')).toHaveValue('NY');
    await expect(businessSection.locator('input[id="businessAddress.postalCode"]')).toHaveValue('10001');
    await expect(businessSection.locator('input[id="businessAddress.country"]')).toHaveValue('United States');
  });

  test('should persist business address after page reload', async ({ page }) => {
    const businessSection = page
      .locator('.settings-section')
      .filter({ hasText: 'Business Information' });

    // Fill address fields
    await businessSection.locator('input[id="businessAddress.street"]').fill('456 Oak Avenue');
    await businessSection.locator('input[id="businessAddress.city"]').fill('Los Angeles');
    await businessSection.locator('input[id="businessAddress.state"]').fill('CA');
    await businessSection.locator('input[id="businessAddress.postalCode"]').fill('90001');
    await businessSection.locator('input[id="businessAddress.country"]').fill('USA');

    // Wait for auto-save
    await page.waitForTimeout(200);

    // Reload page
    await page.reload();

    // Verify values persist
    await expect(businessSection.locator('input[id="businessAddress.street"]')).toHaveValue('456 Oak Avenue');
    await expect(businessSection.locator('input[id="businessAddress.city"]')).toHaveValue('Los Angeles');
    await expect(businessSection.locator('input[id="businessAddress.state"]')).toHaveValue('CA');
    await expect(businessSection.locator('input[id="businessAddress.postalCode"]')).toHaveValue('90001');
    await expect(businessSection.locator('input[id="businessAddress.country"]')).toHaveValue('USA');
  });
});
