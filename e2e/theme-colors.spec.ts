import { test, expect } from '@playwright/test';

// Helper to compare RGB colors with tolerance for browser rounding differences
function rgbColorsMatch(actual: string, expected: string, tolerance = 2): boolean {
  const parseRgb = (rgb: string): number[] => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [];
  };
  const actualRgb = parseRgb(actual);
  const expectedRgb = parseRgb(expected);
  if (actualRgb.length !== 3 || expectedRgb.length !== 3) return false;
  return actualRgb.every((val, i) => Math.abs(val - expectedRgb[i]) <= tolerance);
}

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

    // RGB for #dc2626 (with tolerance for browser rounding)
    expect(rgbColorsMatch(bgColor, 'rgb(220, 38, 38)')).toBe(true);
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

    // RGB for #ea580c (allow ±2 for browser rendering differences)
    const match = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
    expect(match).toBeTruthy();
    const [, r, g, b] = match!.map(Number);
    expect(r).toBeGreaterThanOrEqual(232);
    expect(r).toBeLessThanOrEqual(236);
    expect(g).toBeGreaterThanOrEqual(86);
    expect(g).toBeLessThanOrEqual(90);
    expect(b).toBeGreaterThanOrEqual(10);
    expect(b).toBeLessThanOrEqual(14);
  });
});

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display dark mode toggle with three options', async ({ page }) => {
    const darkModeToggle = page.locator('.dark-mode-toggle');
    await expect(darkModeToggle).toBeVisible();

    // Check all three options exist (labels are visible)
    await expect(darkModeToggle.getByText('Light')).toBeVisible();
    await expect(darkModeToggle.getByText('Dark')).toBeVisible();
    await expect(darkModeToggle.getByText('System')).toBeVisible();
  });

  test('should have system as default selection', async ({ page }) => {
    const systemOption = page.locator('.dark-mode-toggle input[value="system"]');
    await expect(systemOption).toBeChecked();
  });

  test('should switch to dark mode when dark option is selected', async ({ page }) => {
    // Click on the Dark label text
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Check that data-theme attribute is set to dark
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });

  test('should switch to light mode when light option is selected', async ({ page }) => {
    // First switch to dark mode
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Then switch to light mode
    await page.locator('.dark-mode-toggle').getByText('Light').click();
    await page.waitForTimeout(100);

    // Check that data-theme attribute is set to light
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('light');
  });

  test('should apply dark background color in dark mode', async ({ page }) => {
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Check the background color CSS variable
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg')
        .trim();
    });

    // Dark mode background should be a dark color (#111827)
    expect(bgColor).toBe('#111827');
  });

  test('should apply light text color in dark mode', async ({ page }) => {
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Check the text color CSS variable
    const textColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-text')
        .trim();
    });

    // Dark mode text should be a light color (#f3f4f6)
    expect(textColor).toBe('#f3f4f6');
  });

  test('should persist dark mode preference after navigation', async ({ page }) => {
    // Switch to dark mode
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForTimeout(100);

    // Check that dark mode is still applied
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });

  test('should persist dark mode preference after page reload', async ({ page }) => {
    // Switch to dark mode
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(200);

    // Check that dark mode is still applied
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });

  test('should apply dark surface color in dark mode', async ({ page }) => {
    await page.locator('.dark-mode-toggle').getByText('Dark').click();
    await page.waitForTimeout(100);

    // Check the surface color CSS variable
    const surfaceColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-surface')
        .trim();
    });

    // Dark mode surface should be a dark color (#1f2937)
    expect(surfaceColor).toBe('#1f2937');
  });
});
