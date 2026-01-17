import { test, expect } from '@playwright/test';

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display language section', async ({ page }) => {
    await expect(page.locator('.settings-section').filter({ hasText: 'Language' })).toBeVisible();
  });

  test('should have language selector dropdown', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');
    await expect(languageSelect).toBeVisible();
  });

  test('should have all supported languages', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    await expect(languageSelect.locator('option[value="en"]')).toBeAttached();
    await expect(languageSelect.locator('option[value="pt-BR"]')).toBeAttached();
    await expect(languageSelect.locator('option[value="pt-PT"]')).toBeAttached();
    await expect(languageSelect.locator('option[value="it"]')).toBeAttached();
    await expect(languageSelect.locator('option[value="nl"]')).toBeAttached();
    await expect(languageSelect.locator('option[value="de"]')).toBeAttached();
  });

  test('should switch to Italian and update UI', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    await languageSelect.selectOption('it');
    await page.waitForTimeout(100);

    // Check that the main content title changed to Italian
    await expect(page.locator('.main-content h1')).toContainText('Impostazioni');

    // Check navigation also updated
    await expect(page.locator('.nav-links')).toContainText('Fatture');
    await expect(page.locator('.nav-links')).toContainText('Clienti');
  });

  test('should switch to German and update UI', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    await languageSelect.selectOption('de');
    await page.waitForTimeout(100);

    // Check that the main content title changed to German
    await expect(page.locator('.main-content h1')).toContainText('Einstellungen');

    // Check navigation also updated
    await expect(page.locator('.nav-links')).toContainText('Rechnungen');
    await expect(page.locator('.nav-links')).toContainText('Kunden');
  });

  test('should switch to Dutch and update UI', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    await languageSelect.selectOption('nl');
    await page.waitForTimeout(100);

    // Check that the main content title changed to Dutch
    await expect(page.locator('.main-content h1')).toContainText('Instellingen');

    // Check navigation also updated
    await expect(page.locator('.nav-links')).toContainText('Facturen');
    await expect(page.locator('.nav-links')).toContainText('Klanten');
  });

  test('should switch to Brazilian Portuguese and update UI', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    await languageSelect.selectOption('pt-BR');
    await page.waitForTimeout(100);

    // Check that the main content title changed to Portuguese
    await expect(page.locator('.main-content h1')).toContainText('Configuracoes');

    // Check navigation also updated
    await expect(page.locator('.nav-links')).toContainText('Faturas');
    await expect(page.locator('.nav-links')).toContainText('Clientes');
  });

  test('should switch to Portuguese (Portugal) and update UI', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    await languageSelect.selectOption('pt-PT');
    await page.waitForTimeout(100);

    // Check that the main content title changed to Portuguese
    await expect(page.locator('.main-content h1')).toContainText('Definicoes');

    // Check navigation also updated
    await expect(page.locator('.nav-links')).toContainText('Faturas');
    await expect(page.locator('.nav-links')).toContainText('Clientes');
  });

  test('should persist language after navigation', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    // Switch to German
    await languageSelect.selectOption('de');
    await page.waitForTimeout(100);

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForTimeout(100);

    // Check that the dashboard is in German
    await expect(page.locator('.main-content h1')).toContainText('Dashboard');

    // Check navigation is still in German
    await expect(page.locator('.nav-links')).toContainText('Rechnungen');
  });

  test('should update invoices page labels when language changes', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    // Switch to Italian
    await languageSelect.selectOption('it');
    await page.waitForTimeout(100);

    // Navigate to invoices
    await page.goto('/invoices');
    await page.waitForTimeout(100);

    // Check that the page title is in Italian
    await expect(page.locator('.main-content h1')).toContainText('Fatture');
  });

  test('should update clients page labels when language changes', async ({ page }) => {
    const languageSelect = page.locator('.settings-section').filter({ hasText: 'Language' }).locator('select');

    // Switch to Dutch
    await languageSelect.selectOption('nl');
    await page.waitForTimeout(100);

    // Navigate to clients
    await page.goto('/clients');
    await page.waitForTimeout(100);

    // Check that the page title is in Dutch
    await expect(page.locator('.main-content h1')).toContainText('Klanten');
  });

  test('should be able to switch back to English', async ({ page }) => {
    // Get all selects on settings page - language is one of them
    const languageSelect = page.locator('.settings-section select').nth(1);

    // Switch to German first
    await languageSelect.selectOption('de');
    await page.waitForTimeout(100);

    // Verify it switched to German
    await expect(page.locator('.main-content h1')).toContainText('Einstellungen');

    // Then switch back to English
    await languageSelect.selectOption('en');
    await page.waitForTimeout(100);

    // Check that the page is in English
    await expect(page.locator('.main-content h1')).toContainText('Settings');
    await expect(page.locator('.nav-links')).toContainText('Invoices');
    await expect(page.locator('.nav-links')).toContainText('Clients');
  });
});
