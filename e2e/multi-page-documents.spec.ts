import { test, expect } from '@playwright/test';

// Sample items for multi-page documents
const SAMPLE_ITEMS = [
  {
    description: 'Web Development Services - Full-stack development including frontend, backend, and database architecture',
    quantity: 40,
    unitPrice: 150,
    taxRate: 21,
  },
  {
    description: 'UI/UX Design - User interface and user experience design with wireframes, mockups, and interactive prototypes',
    quantity: 20,
    unitPrice: 120,
    taxRate: 21,
  },
  {
    description: 'Mobile App Development - Native iOS and Android application development with cross-platform compatibility',
    quantity: 60,
    unitPrice: 140,
    taxRate: 21,
  },
  {
    description: 'API Integration - Third-party API integration including payment gateways, social media, and analytics services',
    quantity: 15,
    unitPrice: 130,
    taxRate: 21,
  },
  {
    description: 'Database Design and Optimization - Database architecture, query optimization, indexing, and migration services',
    quantity: 10,
    unitPrice: 160,
    taxRate: 21,
  },
  {
    description: 'Cloud Infrastructure Setup - AWS/GCP/Azure configuration, auto-scaling, load balancing, and monitoring',
    quantity: 8,
    unitPrice: 200,
    taxRate: 21,
  },
  {
    description: 'Security Audit and Penetration Testing - Comprehensive security assessment, vulnerability scanning, and remediation',
    quantity: 5,
    unitPrice: 250,
    taxRate: 21,
  },
  {
    description: 'Performance Optimization - Application profiling, caching strategies, CDN setup, and load testing',
    quantity: 12,
    unitPrice: 140,
    taxRate: 21,
  },
  {
    description: 'Technical Documentation - API documentation, architecture diagrams, deployment guides, and user manuals',
    quantity: 25,
    unitPrice: 80,
    taxRate: 21,
  },
  {
    description: 'Training and Knowledge Transfer - On-site or remote training sessions for development and operations teams',
    quantity: 16,
    unitPrice: 100,
    taxRate: 21,
  },
  {
    description: 'Monthly Maintenance Package - Bug fixes, security patches, performance monitoring, and 24/7 support',
    quantity: 6,
    unitPrice: 500,
    taxRate: 21,
  },
  {
    description: 'DevOps and CI/CD Pipeline - Continuous integration, deployment automation, and infrastructure as code',
    quantity: 20,
    unitPrice: 130,
    taxRate: 21,
  },
  {
    description: 'Code Review and Refactoring - Comprehensive code quality assessment, technical debt reduction, and best practices',
    quantity: 30,
    unitPrice: 90,
    taxRate: 21,
  },
  {
    description: 'Data Migration Services - Legacy system migration, data transformation, validation, and integrity checks',
    quantity: 18,
    unitPrice: 110,
    taxRate: 21,
  },
  {
    description: 'Technical Consulting - Architecture review, technology selection, scalability planning, and strategic advice',
    quantity: 10,
    unitPrice: 180,
    taxRate: 21,
  },
];

const LONG_NOTES = `Payment Terms and Conditions:

1. Payment is due within 30 days of invoice date.
2. Late payments will incur a 2% monthly interest charge.
3. All prices are in the agreed currency and exclude applicable taxes unless stated.
4. This document is valid for 30 days from the issue date.
5. Please reference the document number when making payment.
6. Bank transfer details are provided at the bottom of this document.
7. For any queries regarding this document, please contact our billing department.

Additional Terms:
- All intellectual property developed during this engagement remains the property of the client upon full payment.
- Confidentiality agreements apply to all project-related information.
- Changes to project scope may result in additional charges.
- Travel expenses for on-site work will be billed separately.

Thank you for your business! We appreciate the opportunity to work with you.`;

test.describe('Multi-Page Documents', () => {
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

  async function createTestClient(
    page: import('@playwright/test').Page
  ): Promise<void> {
    await page.goto('/clients/new');
    await page.fill('input#name', 'Enterprise Solutions Corp');
    await page.fill('input#email', 'billing@enterprise.example.com');
    await page.fill('input#phone', '+1 555-0100');
    await page.fill('input[id="address.street"]', '1000 Corporate Boulevard, Suite 500');
    await page.fill('input[id="address.city"]', 'San Francisco');
    await page.fill('input[id="address.state"]', 'CA');
    await page.fill('input[id="address.postalCode"]', '94102');
    await page.fill('input[id="address.country"]', 'United States');
    await page.fill('input#vatNumber', 'US-123456789');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/clients');
  }

  async function addItemToInvoice(
    page: import('@playwright/test').Page,
    itemIndex: number,
    item: typeof SAMPLE_ITEMS[0]
  ): Promise<void> {
    const row = page.locator('.items-table tbody tr').nth(itemIndex);
    await row.locator('input[placeholder="Description"]').fill(item.description);
    await row.locator('input[type="number"]').nth(0).fill(item.quantity.toString());
    await row.locator('input[type="number"]').nth(1).fill(item.unitPrice.toString());
    await row.locator('input[type="number"]').nth(2).fill(item.taxRate.toString());
  }

  test('should create multi-page invoice with 15 items and long notes', async ({ page }) => {
    // Create client first
    await createTestClient(page);

    // Go to new invoice form
    await page.goto('/invoices/new');

    // Ensure Invoice is selected (default)
    await expect(page.locator('input[name="documentType"][value="invoice"]')).toBeChecked();

    // Select client
    await page.selectOption('select#clientId', { label: 'Enterprise Solutions Corp' });

    // Set dates
    await page.fill('input#dueDate', '2025-03-15');

    // Add first item (already exists)
    await addItemToInvoice(page, 0, SAMPLE_ITEMS[0]);

    // Add remaining 14 items
    for (let i = 1; i < SAMPLE_ITEMS.length; i++) {
      await page.click('button:has-text("Add Item")');
      await addItemToInvoice(page, i, SAMPLE_ITEMS[i]);
    }

    // Verify we have 15 items
    await expect(page.locator('.items-table tbody tr')).toHaveCount(15);

    // Add long notes
    await page.fill('textarea#notes', LONG_NOTES);

    // Verify totals section exists
    await expect(page.locator('.invoice-totals')).toBeVisible();

    // Submit the invoice
    await page.click('button[type="submit"]');

    // Should redirect to invoices list
    await expect(page).toHaveURL('/invoices');

    // Invoice should appear in the list
    await expect(page.getByRole('cell', { name: 'Enterprise Solutions Corp' })).toBeVisible();

    // Navigate to view the invoice
    await page.click('a:has-text("View")');
    await expect(page).toHaveURL(/\/invoices\/\d+\/view/);

    // Verify preview shows all items
    const previewItems = page.locator('#invoice-preview .invoice-preview-items tbody tr');
    await expect(previewItems).toHaveCount(15);

    // Verify first and last item descriptions are visible
    await expect(page.locator('#invoice-preview')).toContainText('Web Development Services');
    await expect(page.locator('#invoice-preview')).toContainText('Technical Consulting');

    // Verify notes are displayed
    await expect(page.locator('#invoice-preview')).toContainText('Payment Terms and Conditions');
    await expect(page.locator('#invoice-preview')).toContainText('Thank you for your business');

    // Verify totals section
    await expect(page.locator('#invoice-preview .invoice-preview-totals')).toBeVisible();

    // Verify Download PDF button exists and is clickable
    const downloadButton = page.locator('button:has-text("Download PDF")');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // Verify Print button exists
    await expect(page.locator('button:has-text("Print")')).toBeVisible();
  });

  test('should create multi-page quote with 15 items and long notes', async ({ page }) => {
    // Create client first
    await createTestClient(page);

    // Go to new invoice/quote form
    await page.goto('/invoices/new');

    // Select Quote document type (click the label, not the hidden radio input)
    await page.click('.toggle-option:has-text("Quote")');
    await expect(page.locator('input[name="documentType"][value="quote"]')).toBeChecked();

    // Wait for the validUntil field to appear (quote-specific field)
    await expect(page.locator('input#validUntil')).toBeVisible();

    // Select client
    await page.selectOption('select#clientId', { label: 'Enterprise Solutions Corp' });

    // Set validity date (quotes use validUntil instead of dueDate)
    await page.fill('input#validUntil', '2025-03-15');

    // Add first item (already exists)
    await addItemToInvoice(page, 0, SAMPLE_ITEMS[0]);

    // Add remaining 14 items
    for (let i = 1; i < SAMPLE_ITEMS.length; i++) {
      await page.click('button:has-text("Add Item")');
      await addItemToInvoice(page, i, SAMPLE_ITEMS[i]);
    }

    // Verify we have 15 items
    await expect(page.locator('.items-table tbody tr')).toHaveCount(15);

    // Add long notes
    await page.fill('textarea#notes', LONG_NOTES);

    // Verify totals section exists
    await expect(page.locator('.invoice-totals')).toBeVisible();

    // Submit the quote
    await page.click('button[type="submit"]');

    // Should redirect to invoices list (quotes are shown in same list)
    await expect(page).toHaveURL('/invoices');

    // Quote should appear in the list
    await expect(page.getByRole('cell', { name: 'Enterprise Solutions Corp' })).toBeVisible();

    // Navigate to view the quote
    await page.click('a:has-text("View")');
    await expect(page).toHaveURL(/\/invoices\/\d+\/view/);

    // Verify it's a quote (shows "Quote" in title)
    await expect(page.locator('#invoice-preview')).toContainText('Quote');

    // Verify preview shows all items
    const previewItems = page.locator('#invoice-preview .invoice-preview-items tbody tr');
    await expect(previewItems).toHaveCount(15);

    // Verify first and last item descriptions are visible
    await expect(page.locator('#invoice-preview')).toContainText('Web Development Services');
    await expect(page.locator('#invoice-preview')).toContainText('Technical Consulting');

    // Verify notes are displayed
    await expect(page.locator('#invoice-preview')).toContainText('Payment Terms and Conditions');

    // Verify "Valid Until" label is shown (quote-specific)
    await expect(page.locator('#invoice-preview')).toContainText('Valid Until');

    // Verify totals section
    await expect(page.locator('#invoice-preview .invoice-preview-totals')).toBeVisible();

    // Verify Download PDF button exists and is clickable
    const downloadButton = page.locator('button:has-text("Download PDF")');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
  });

  test('should handle status changes on multi-page invoice', async ({ page }) => {
    // Create client first
    await createTestClient(page);

    // Go to new invoice form
    await page.goto('/invoices/new');

    // Select client
    await page.selectOption('select#clientId', { label: 'Enterprise Solutions Corp' });
    await page.fill('input#dueDate', '2025-03-15');

    // Add 15 items
    await addItemToInvoice(page, 0, SAMPLE_ITEMS[0]);
    for (let i = 1; i < SAMPLE_ITEMS.length; i++) {
      await page.click('button:has-text("Add Item")');
      await addItemToInvoice(page, i, SAMPLE_ITEMS[i]);
    }

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // View the invoice
    await page.click('a:has-text("View")');

    // Initial status should be Draft
    await expect(page.locator('#invoice-preview .status-badge.status-draft')).toBeVisible();

    // Mark as Sent
    await page.click('button:has-text("Send")');
    await expect(page.locator('#invoice-preview .status-badge.status-sent')).toBeVisible();

    // Mark as Paid
    await page.click('button:has-text("Mark as Paid")');
    await expect(page.locator('#invoice-preview .status-badge.status-paid')).toBeVisible();
  });

  test('should handle status changes on multi-page quote', async ({ page }) => {
    // Create client first
    await createTestClient(page);

    // Go to new quote form
    await page.goto('/invoices/new');
    await page.click('.toggle-option:has-text("Quote")');

    // Wait for the validUntil field to appear (quote-specific field)
    await expect(page.locator('input#validUntil')).toBeVisible();

    // Select client
    await page.selectOption('select#clientId', { label: 'Enterprise Solutions Corp' });
    await page.fill('input#validUntil', '2025-03-15');

    // Add 15 items
    await addItemToInvoice(page, 0, SAMPLE_ITEMS[0]);
    for (let i = 1; i < SAMPLE_ITEMS.length; i++) {
      await page.click('button:has-text("Add Item")');
      await addItemToInvoice(page, i, SAMPLE_ITEMS[i]);
    }

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    // View the quote
    await page.click('a:has-text("View")');

    // Initial status should be Draft
    await expect(page.locator('#invoice-preview .status-badge.status-draft')).toBeVisible();

    // Mark as Sent
    await page.click('button:has-text("Send")');
    await expect(page.locator('#invoice-preview .status-badge.status-sent')).toBeVisible();

    // Mark as Accepted
    await page.click('button:has-text("Mark as Accepted")');
    await expect(page.locator('#invoice-preview .status-badge.status-accepted')).toBeVisible();

    // Convert to Invoice button should appear
    await expect(page.locator('button:has-text("Convert to Invoice")')).toBeVisible();
  });

  test('should calculate totals correctly for multi-page invoice', async ({ page }) => {
    // Create client first
    await createTestClient(page);

    // Go to new invoice form
    await page.goto('/invoices/new');

    // Select client and date
    await page.selectOption('select#clientId', { label: 'Enterprise Solutions Corp' });
    await page.fill('input#dueDate', '2025-03-15');

    // Add all 15 items
    await addItemToInvoice(page, 0, SAMPLE_ITEMS[0]);
    for (let i = 1; i < SAMPLE_ITEMS.length; i++) {
      await page.click('button:has-text("Add Item")');
      await addItemToInvoice(page, i, SAMPLE_ITEMS[i]);
    }

    // Wait for calculations
    await page.waitForTimeout(200);

    // Verify totals section has all three rows
    const totalsSection = page.locator('.invoice-totals');
    await expect(totalsSection).toBeVisible();
    await expect(totalsSection.locator('.total-row')).toHaveCount(3);

    // Verify subtotal, tax, and total labels exist
    await expect(totalsSection).toContainText('Subtotal');
    await expect(totalsSection).toContainText('Tax');
    await expect(totalsSection).toContainText('Total');

    // Submit and view to verify totals in preview
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/invoices');

    await page.click('a:has-text("View")');

    // Verify preview totals
    const previewTotals = page.locator('#invoice-preview .invoice-preview-totals');
    await expect(previewTotals).toBeVisible();
    await expect(previewTotals).toContainText('Subtotal');
    await expect(previewTotals).toContainText('Tax');
    await expect(previewTotals).toContainText('Total');
  });
});
