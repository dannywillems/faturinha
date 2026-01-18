import { test, expect } from '@playwright/test';

test.describe('Multi-Company Support', () => {
  test.beforeEach(async ({ page }) => {
    // Enter test mode which seeds two test companies
    await page.goto('/');
    await page.waitForTimeout(500);

    // Check if already in test mode
    const testBanner = page.locator('.test-mode-banner');
    const isTestMode = await testBanner.isVisible().catch(() => false);

    if (!isTestMode) {
      // Enter test mode
      const testModeButton = page.locator('button:has-text("Enter Test Mode")');
      if (await testModeButton.isVisible()) {
        await testModeButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test.describe('Company Switcher', () => {
    test('should display company switcher in sidebar', async ({ page }) => {
      const companySwitcher = page.locator('.company-switcher');
      await expect(companySwitcher).toBeVisible();
    });

    test('should show both test companies in dropdown', async ({ page }) => {
      const companySelect = page.locator('.company-select');
      await expect(companySelect).toBeVisible();

      // Check for both companies
      await expect(
        companySelect.locator('option:has-text("Demo Freelancer")')
      ).toBeAttached();
      await expect(
        companySelect.locator('option:has-text("Second Business")')
      ).toBeAttached();
    });

    test('should switch between companies', async ({ page }) => {
      const companySelect = page.locator('.company-select');

      // Initially should be on first company
      await expect(companySelect).toHaveValue('test-company-1');

      // Switch to second company
      await companySelect.selectOption('test-company-2');
      await page.waitForTimeout(500);

      // Verify switch happened
      await expect(companySelect).toHaveValue('test-company-2');
    });
  });

  test.describe('Data Isolation - Clients', () => {
    test('first company should have its own clients', async ({ page }) => {
      const companySelect = page.locator('.company-select');

      // Make sure we're on first company
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);

      // Go to clients page
      await page.goto('/clients');
      await page.waitForTimeout(500);

      // First company should have Acme Corporation
      await expect(page.locator('text=Acme Corporation')).toBeVisible();
      await expect(page.locator('text=TechStart Solutions')).toBeVisible();

      // Should NOT have second company's clients
      await expect(page.locator('text=Alpha Industries')).not.toBeVisible();
      await expect(page.locator('text=Beta Services')).not.toBeVisible();
    });

    test('second company should have its own clients', async ({ page }) => {
      const companySelect = page.locator('.company-select');

      // Switch to second company
      await companySelect.selectOption('test-company-2');
      await page.waitForTimeout(500);

      // Go to clients page
      await page.goto('/clients');
      await page.waitForTimeout(500);

      // Second company should have Alpha Industries and Beta Services
      await expect(page.locator('text=Alpha Industries')).toBeVisible();
      await expect(page.locator('text=Beta Services')).toBeVisible();

      // Should NOT have first company's clients
      await expect(page.locator('text=Acme Corporation')).not.toBeVisible();
      await expect(page.locator('text=TechStart Solutions')).not.toBeVisible();
    });
  });

  test.describe('Data Isolation - Invoices', () => {
    test('first company should have its own invoices', async ({ page }) => {
      const companySelect = page.locator('.company-select');

      // Make sure we're on first company
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);

      // Go to invoices page
      await page.goto('/invoices');
      await page.waitForTimeout(500);

      // First company should have EUR invoices with INV- prefix
      await expect(page.locator('text=INV-EUR-').first()).toBeVisible();

      // Should NOT have second company's invoices
      await expect(page.locator('text=SB-USD-').first()).not.toBeVisible();
    });

    test('second company should have its own invoices', async ({ page }) => {
      const companySelect = page.locator('.company-select');

      // Switch to second company
      await companySelect.selectOption('test-company-2');
      await page.waitForTimeout(500);

      // Go to invoices page
      await page.goto('/invoices');
      await page.waitForTimeout(500);

      // Second company should have SB- prefix invoices
      await expect(page.locator('text=SB-USD-').first()).toBeVisible();

      // Should NOT have first company's invoices
      await expect(page.locator('text=INV-EUR-').first()).not.toBeVisible();
    });
  });

  test.describe('Data Isolation - Settings', () => {
    test('first company should have its own business settings', async ({
      page,
    }) => {
      const companySelect = page.locator('.company-select');

      // Make sure we're on first company
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);

      // Go to settings page
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // First company business name should be "Demo Freelancer"
      const businessNameInput = page
        .locator('.settings-section')
        .filter({ hasText: 'Business Information' })
        .locator('input[type="text"]')
        .first();
      await expect(businessNameInput).toHaveValue('Demo Freelancer');
    });

    test('second company should have its own business settings', async ({
      page,
    }) => {
      const companySelect = page.locator('.company-select');

      // Switch to second company
      await companySelect.selectOption('test-company-2');
      await page.waitForTimeout(500);

      // Go to settings page
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Second company business name should be "Second Business LLC"
      const businessNameInput = page
        .locator('.settings-section')
        .filter({ hasText: 'Business Information' })
        .locator('input[type="text"]')
        .first();
      await expect(businessNameInput).toHaveValue('Second Business LLC');
    });

    test('changing business name in one company should not affect another', async ({
      page,
    }) => {
      const companySelect = page.locator('.company-select');

      // Go to settings and change first company's business name
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);
      await page.goto('/settings');
      await page.waitForTimeout(500);

      const businessNameInput = page
        .locator('.settings-section')
        .filter({ hasText: 'Business Information' })
        .locator('input[type="text"]')
        .first();

      await businessNameInput.fill('Modified First Company');
      await page.waitForTimeout(300);

      // Switch to second company
      await companySelect.selectOption('test-company-2');
      await page.waitForTimeout(500);

      // Refresh settings page for second company
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Second company's business name should still be unchanged
      const secondBusinessNameInput = page
        .locator('.settings-section')
        .filter({ hasText: 'Business Information' })
        .locator('input[type="text"]')
        .first();
      await expect(secondBusinessNameInput).toHaveValue('Second Business LLC');

      // Switch back to first company and verify change persisted
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);
      await page.goto('/settings');
      await page.waitForTimeout(500);

      const firstBusinessNameInput = page
        .locator('.settings-section')
        .filter({ hasText: 'Business Information' })
        .locator('input[type="text"]')
        .first();
      await expect(firstBusinessNameInput).toHaveValue(
        'Modified First Company'
      );
    });
  });

  test.describe('Company Management', () => {
    test('should display company management section in settings', async ({
      page,
    }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      const companiesSection = page
        .locator('.settings-section')
        .filter({ hasText: 'Companies' });
      await expect(companiesSection).toBeVisible();
    });

    test('should list both test companies', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      await expect(page.locator('.company-item')).toHaveCount(2);
      await expect(
        page.locator('.company-item:has-text("Demo Freelancer")')
      ).toBeVisible();
      await expect(
        page.locator('.company-item:has-text("Second Business")')
      ).toBeVisible();
    });

    test('should show active badge on current company', async ({ page }) => {
      const companySelect = page.locator('.company-select');
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);

      await page.goto('/settings');
      await page.waitForTimeout(500);

      // First company should have active badge
      const firstCompanyItem = page
        .locator('.company-item')
        .filter({ hasText: 'Demo Freelancer' });
      await expect(firstCompanyItem.locator('.active-badge')).toBeVisible();
    });

    test('should rename a company', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Click edit button on second company (second item in list)
      const secondCompanyItem = page.locator('.company-item').nth(1);
      await secondCompanyItem.locator('button:has-text("Edit")').click();
      await page.waitForTimeout(300);

      // Input field should appear in the company edit form
      const editInput = page.locator('.company-edit input[type="text"]');
      await expect(editInput).toBeVisible();

      // Clear and type new name
      await editInput.fill('Renamed Company');
      await page.locator('.company-edit button:has-text("Save")').click();
      await page.waitForTimeout(500);

      // Verify the name changed
      await expect(page.locator('.company-item')).toHaveCount(2);
      await expect(
        page.locator('.company-item:has-text("Renamed Company")')
      ).toBeVisible();

      // Verify it's also updated in the dropdown
      const companySelect = page.locator('.company-select');
      await expect(
        companySelect.locator('option:has-text("Renamed Company")')
      ).toBeAttached();
    });

    test('should create a new company', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Initially should have 2 companies
      await expect(page.locator('.company-item')).toHaveCount(2);

      // Fill in new company name
      const newCompanyInput = page
        .locator('.company-create-form')
        .locator('input');
      await newCompanyInput.fill('Third Company');

      // Click create button
      await page
        .locator('.company-create-form')
        .locator('button:has-text("Create")')
        .click();
      await page.waitForTimeout(500);

      // Should now have 3 companies
      await expect(page.locator('.company-item')).toHaveCount(3);
      await expect(
        page.locator('.company-item:has-text("Third Company")')
      ).toBeVisible();

      // Should also appear in dropdown
      const companySelect = page.locator('.company-select');
      await expect(
        companySelect.locator('option:has-text("Third Company")')
      ).toBeAttached();
    });

    test('should delete a company', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Initially should have 2 companies
      await expect(page.locator('.company-item')).toHaveCount(2);

      // Delete second company
      const secondCompanyItem = page
        .locator('.company-item')
        .filter({ hasText: 'Second Business' });

      // Set up dialog handler before clicking delete
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await secondCompanyItem.locator('button:has-text("Delete")').click();
      await page.waitForTimeout(500);

      // Should now have 1 company
      await expect(page.locator('.company-item')).toHaveCount(1);
      await expect(
        page.locator('.company-item:has-text("Second Business")')
      ).not.toBeVisible();
    });

    test('should not allow deleting the last company', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForTimeout(500);

      // Delete second company first
      const secondCompanyItem = page
        .locator('.company-item')
        .filter({ hasText: 'Second Business' });

      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await secondCompanyItem.locator('button:has-text("Delete")').click();
      await page.waitForTimeout(500);

      // Now only one company remains
      await expect(page.locator('.company-item')).toHaveCount(1);

      // Delete button should not be visible for the last company
      const lastCompanyItem = page.locator('.company-item').first();
      await expect(
        lastCompanyItem.locator('button:has-text("Delete")')
      ).not.toBeVisible();
    });
  });

  test.describe('Adding Data to One Company', () => {
    test('adding a client to one company should not appear in another', async ({
      page,
    }) => {
      const companySelect = page.locator('.company-select');

      // Switch to second company and add a new client
      await companySelect.selectOption('test-company-2');
      await page.waitForTimeout(500);

      await page.goto('/clients/new');
      await page.waitForTimeout(500);

      // Fill in client form
      await page.locator('input#name').fill('Exclusive Client');
      await page.locator('input#email').fill('exclusive@example.com');
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(500);

      // Verify client appears in second company
      await page.goto('/clients');
      await page.waitForTimeout(500);
      await expect(page.locator('text=Exclusive Client')).toBeVisible();

      // Switch to first company
      await companySelect.selectOption('test-company-1');
      await page.waitForTimeout(500);

      // Go to clients and verify the new client is NOT there
      await page.goto('/clients');
      await page.waitForTimeout(500);
      await expect(page.locator('text=Exclusive Client')).not.toBeVisible();
    });
  });
});
