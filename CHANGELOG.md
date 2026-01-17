# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- PDF generation with consistent A4 layout (#6)
  - Dedicated print-ready preview with fixed A4 dimensions
  - PDF output is now consistent regardless of screen size (mobile or desktop)
  - Hidden off-screen container ensures PDF captures full A4 layout
  - Print-specific CSS for proper margins and spacing
- Improved invoice items UI/UX (#7, #16)
  - Alternating row colors with hover effects
  - Currency symbol prefix on price inputs (dynamic based on selected currency)
  - Percentage suffix on tax rate input
  - SVG icons for delete and add buttons
  - Card-style totals section with visual separation
  - Auto-focus on description field when adding new item
  - Card-based layout for items on mobile devices
  - Touch-friendly delete button on mobile
  - ARIA labels for all form inputs
  - Fixed TEST badge alignment with Faturinha logo
- Quote/estimate system with full workflow support (#10)
  - Document type toggle (Invoice/Quote) when creating new documents
  - Separate numbering sequence for quotes (QUO-EUR-2024-0001)
  - Quote-specific statuses: draft, sent, accepted, declined, expired
  - "Valid Until" date for quotes instead of "Due Date"
  - "Convert to Invoice" button to create invoice from accepted quote
  - Quote preview shows "Quote" title and appropriate labels
  - Sample quotes included in test mode demo data
- Test/demo mode with separate IndexedDB database for trying the app without
  affecting real data (#11)
  - "Enter Test Mode" button in sidebar
  - Visual banner indicator when in test mode
  - Pre-populated sample data (5 clients, 8 invoices, 2 quotes, business settings)
  - "Reset Test Data" button to restore demo state
  - Test mode persists across page reloads
- Initial project setup with React + Vite + TypeScript
- IndexedDB storage with Dexie.js for offline-first data persistence
- i18n support with English as default language
- Dashboard page with invoice statistics
- Invoices list page with status badges
- Clients list page
- Settings page with business info, invoice defaults, and data export/import
- SCSS with comprehensive theming variables for paid template support
- Mobile-responsive layout with sidebar navigation
- Multi-currency support (USD, EUR, GBP, BRL, JPY, CAD, AUD, CHF)
- GPL-3.0 license

### Infrastructure

- Makefile with standard development targets
- EditorConfig for consistent formatting
- ESLint + TypeScript configuration
- Prettier for code formatting
