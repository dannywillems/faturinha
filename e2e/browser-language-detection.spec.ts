import { test, expect } from '@playwright/test';

test.describe('Browser Language Detection', () => {
  test('should detect Portuguese (Brazil) from browser locale pt-BR', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'pt-BR',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify that the language selector shows pt-BR as selected
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Idioma|Language|Sprache|Lingua|Langue|Taal/ })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('pt-BR');

    await context.close();
  });

  test('should detect German from browser locale de-DE', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'de-DE',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify that the language selector shows de as selected
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Idioma|Language|Sprache|Lingua|Langue|Taal/ })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('de');

    await context.close();
  });

  test('should detect Italian from browser locale it-IT', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'it-IT',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify that the language selector shows it as selected
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Idioma|Language|Sprache|Lingua|Langue|Taal/ })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('it');

    await context.close();
  });

  test('should detect French from browser locale fr-FR', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'fr-FR',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify that the language selector shows fr as selected
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Idioma|Language|Sprache|Lingua|Langue|Taal/ })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('fr');

    await context.close();
  });

  test('should detect Dutch from browser locale nl-NL', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'nl-NL',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify that the language selector shows nl as selected
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Idioma|Language|Sprache|Lingua|Langue|Taal/ })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('nl');

    await context.close();
  });

  test('should fallback to English for unsupported browser locale (ja-JP)', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'ja-JP',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify that the language selector shows en as selected (fallback)
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: 'Language' })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('en');

    await context.close();
  });

  test('should match base language pt to variant pt-BR', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: 'pt',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Should match to pt-BR (first Portuguese variant in AVAILABLE_LANGUAGES)
    const languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Idioma|Language/ })
      .locator('select');
    
    await expect(languageSelect).toHaveValue('pt-BR');

    await context.close();
  });

  test('should preserve user-selected language over browser language', async ({
    browser,
  }) => {
    // Start with German browser locale
    const context = await browser.newContext({
      locale: 'de-DE',
    });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Initially should show German
    let languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Sprache|Language/ })
      .locator('select');
    await expect(languageSelect).toHaveValue('de');

    // Change to Italian
    await languageSelect.selectOption('it');
    await page.waitForTimeout(100);

    // Navigate away and back
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Should still be Italian (user preference overrides browser language)
    languageSelect = page
      .locator('.settings-section')
      .filter({ hasText: /Lingua|Language/ })
      .locator('select');
    await expect(languageSelect).toHaveValue('it');

    await context.close();
  });
});
