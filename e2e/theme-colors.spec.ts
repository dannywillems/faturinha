import { test, expect } from '@playwright/test';

test.describe('Theme Color Customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display theme section', async ({ page }) => {
    await expect(page.locator('.settings-section').filter({ hasText: 'Theme' })).toBeVisible();
  });

  test('should display color presets', async ({ page }) => {
    const colorPresets = page.locator('.color-presets .color-swatch');
    await expect(colorPresets).toHaveCount(6);
  });

  test('should have default blue color selected', async ({ page }) => {
    const bluePreset = page.locator('.color-swatch').first();
    await expect(bluePreset).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  });

  test('should change theme when clicking a preset color', async ({ page }) => {
    // Click on green preset (second color)
    const greenPreset = page.locator('.color-swatch').nth(1);
    await greenPreset.click();

    // Wait for the CSS variable to update
    await page.waitForTimeout(100);

    // Check that the primary color CSS variable changed
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    });

    expect(primaryColor).toBe('#059669');
  });

  test('should have custom color picker', async ({ page }) => {
    const colorPicker = page.locator('input[type="color"]');
    await expect(colorPicker).toBeVisible();
  });

  test('should have hex input field', async ({ page }) => {
    const hexInput = page.locator('.custom-color-section input[type="text"]');
    await expect(hexInput).toBeVisible();
    await expect(hexInput).toHaveAttribute('maxlength', '7');
  });

  test('should update theme when using hex input', async ({ page }) => {
    const hexInput = page.locator('.custom-color-section input[type="text"]');

    // Clear and type a new color
    await hexInput.fill('#ff5500');

    // Wait for the CSS variable to update
    await page.waitForTimeout(100);

    // Check that the primary color CSS variable changed
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    });

    expect(primaryColor).toBe('#ff5500');
  });

  test('should persist theme color after navigation', async ({ page }) => {
    // Change to purple color
    const purplePreset = page.locator('.color-swatch').nth(2);
    await purplePreset.click();
    await page.waitForTimeout(100);

    // Navigate away
    await page.goto('/');
    await page.waitForTimeout(100);

    // Check the theme is still applied
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    });

    expect(primaryColor).toBe('#7c3aed');
  });

  test('should apply theme color to navigation active state', async ({ page }) => {
    // First reset to default blue color
    const bluePreset = page.locator('.color-swatch').first();
    await bluePreset.click();
    await page.waitForTimeout(200);

    // Change to red color
    const redPreset = page.locator('.color-swatch').nth(3);
    await redPreset.click();
    await page.waitForTimeout(200);

    // Check that the settings nav link (active) has the theme color
    const activeNavLink = page.locator('.nav-links a.active');
    const bgColor = await activeNavLink.evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });

    // RGB for #dc2626
    expect(bgColor).toBe('rgb(220, 38, 38)');
  });

  test('should apply theme color to primary buttons', async ({ page }) => {
    // First reset to default blue color to ensure clean state
    const bluePreset = page.locator('.color-swatch').first();
    await bluePreset.click();
    await page.waitForTimeout(200);

    // Change to orange color
    const orangePreset = page.locator('.color-swatch').nth(4);
    await orangePreset.click();
    await page.waitForTimeout(200);

    // Check primary button color - use the Save button in form-actions
    const saveButton = page.locator('.form-actions .btn-primary');
    const bgColor = await saveButton.evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });

    // RGB for #ea580c
    expect(bgColor).toBe('rgb(234, 88, 12)');
  });
});
