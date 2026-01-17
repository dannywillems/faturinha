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

  test('should display business information section', async ({ page }) => {
    const businessSection = page.locator('.settings-section').first();
    await expect(businessSection).toContainText('Business Information');
  });

  test('should have business name input', async ({ page }) => {
    const businessNameInput = page
      .locator('input[type="text"]')
      .first();
    await expect(businessNameInput).toBeVisible();
  });

  test('should have currency select', async ({ page }) => {
    const currencySelect = page.locator('select').first();
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
    const saveButton = page.locator('button.btn-primary');
    await expect(saveButton).toContainText('Save');
  });

  test('should have export data button', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
  });

  test('should be able to change business name', async ({ page }) => {
    const businessNameInput = page
      .locator('.settings-section input[type="text"]')
      .first();

    await businessNameInput.fill('Test Business');
    await expect(businessNameInput).toHaveValue('Test Business');
  });

  test('should be able to change default currency', async ({ page }) => {
    const currencySelect = page.locator('select').first();

    await currencySelect.selectOption('BRL');
    await expect(currencySelect).toHaveValue('BRL');
  });
});
