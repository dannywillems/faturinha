import { jsPDF } from 'jspdf';
import type { Invoice, Client, Settings, Address } from '../types';
import { hexToRgb } from './themePresets';

// A4 dimensions in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// Colors (static)
const DEFAULT_PRIMARY: [number, number, number] = [37, 99, 235]; // #2563eb
const COLOR_TEXT = [17, 24, 39]; // #111827
const COLOR_TEXT_SECONDARY = [107, 114, 128]; // #6b7280
const COLOR_BORDER = [229, 231, 235]; // #e5e7eb
const COLOR_SUCCESS = [34, 197, 94]; // #22c55e
const COLOR_ERROR = [239, 68, 68]; // #ef4444

function getPrimaryColor(settings: Settings | null): [number, number, number] {
  if (settings?.themeColor) {
    return hexToRgb(settings.themeColor);
  }
  return DEFAULT_PRIMARY;
}

// Font sizes
const FONT_SIZE_TITLE = 24;
const FONT_SIZE_HEADING = 14;
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL = 9;

// Line heights
const LINE_HEIGHT = 5;
const SECTION_GAP = 10;

interface PDFContext {
  pdf: jsPDF;
  y: number;
  pageNumber: number;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatAddress(address: Address | undefined): string[] {
  if (!address) return [];
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityLine = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  if (cityLine) lines.push(cityLine);
  if (address.country) lines.push(address.country);
  return lines;
}

function setColor(pdf: jsPDF, color: number[]): void {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function setDrawColor(pdf: jsPDF, color: number[]): void {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

function setFillColor(pdf: jsPDF, color: number[]): void {
  pdf.setFillColor(color[0], color[1], color[2]);
}

function checkPageBreak(ctx: PDFContext, neededHeight: number): void {
  if (ctx.y + neededHeight > PAGE_HEIGHT - MARGIN) {
    ctx.pdf.addPage();
    ctx.pageNumber++;
    ctx.y = MARGIN;
  }
}

function drawLine(
  ctx: PDFContext,
  x1: number,
  x2: number,
  color: number[] = COLOR_BORDER
): void {
  setDrawColor(ctx.pdf, color);
  ctx.pdf.setLineWidth(0.3);
  ctx.pdf.line(x1, ctx.y, x2, ctx.y);
}

function getStatusColor(status: string, primaryColor: number[]): number[] {
  switch (status) {
    case 'paid':
    case 'accepted':
      return COLOR_SUCCESS;
    case 'sent':
      return primaryColor;
    case 'overdue':
    case 'declined':
    case 'expired':
      return COLOR_ERROR;
    case 'draft':
    default:
      return COLOR_TEXT_SECONDARY;
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
  };
  return statusMap[status] || status;
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth =
        (pdf.getStringUnitWidth(testLine) * pdf.getFontSize()) /
        pdf.internal.scaleFactor;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function drawHeader(
  ctx: PDFContext,
  invoice: Invoice,
  settings: Settings | null,
  isQuote: boolean,
  primaryColor: number[]
): void {
  const startY = ctx.y;

  // Business info (left side)
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_HEADING);
  setColor(ctx.pdf, COLOR_TEXT);

  if (settings?.businessName) {
    ctx.pdf.text(settings.businessName, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT + 1;
  }

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);

  const businessAddressLines = formatAddress(settings?.businessAddress);
  for (const line of businessAddressLines) {
    ctx.pdf.text(line, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  if (settings?.businessEmail) {
    ctx.pdf.text(settings.businessEmail, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  if (settings?.businessPhone) {
    ctx.pdf.text(settings.businessPhone, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  if (settings?.businessVatNumber) {
    ctx.pdf.text(`VAT: ${settings.businessVatNumber}`, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  // Document title and number (right side)
  const rightX = PAGE_WIDTH - MARGIN;

  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_TITLE);
  setColor(ctx.pdf, primaryColor);
  ctx.pdf.text(isQuote ? 'Quote' : 'Invoice', rightX, startY, {
    align: 'right',
  });

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_NORMAL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text(invoice.invoiceNumber, rightX, startY + 8, { align: 'right' });

  ctx.y = Math.max(ctx.y, startY + 25);
  ctx.y += SECTION_GAP;
}

function drawClientAndMeta(
  ctx: PDFContext,
  invoice: Invoice,
  client: Client,
  isQuote: boolean,
  primaryColor: number[]
): void {
  const startY = ctx.y;
  const midX = PAGE_WIDTH / 2;

  // Bill To (left side)
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text('BILL TO', MARGIN, ctx.y);
  ctx.y += LINE_HEIGHT + 1;

  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_NORMAL);
  setColor(ctx.pdf, COLOR_TEXT);
  ctx.pdf.text(client.name, MARGIN, ctx.y);
  ctx.y += LINE_HEIGHT + 1;

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);

  const clientAddressLines = formatAddress(client.address);
  for (const line of clientAddressLines) {
    ctx.pdf.text(line, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  if (client.email) {
    ctx.pdf.text(client.email, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  if (client.vatNumber) {
    ctx.pdf.text(`VAT: ${client.vatNumber}`, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  const leftEndY = ctx.y;

  // Invoice meta (right side)
  ctx.y = startY;
  const labelX = midX + 20;
  const valueX = PAGE_WIDTH - MARGIN;

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);

  // Issue Date
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text('Issue Date:', labelX, ctx.y);
  setColor(ctx.pdf, COLOR_TEXT);
  ctx.pdf.text(formatDate(invoice.issueDate), valueX, ctx.y, {
    align: 'right',
  });
  ctx.y += LINE_HEIGHT + 2;

  // Due Date / Valid Until
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text(isQuote ? 'Valid Until:' : 'Due Date:', labelX, ctx.y);
  setColor(ctx.pdf, COLOR_TEXT);
  const dateValue =
    isQuote && invoice.validUntil ? invoice.validUntil : invoice.dueDate;
  ctx.pdf.text(formatDate(dateValue), valueX, ctx.y, { align: 'right' });
  ctx.y += LINE_HEIGHT + 2;

  // Status
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text('Status:', labelX, ctx.y);
  const statusColor = getStatusColor(invoice.status, primaryColor);
  setColor(ctx.pdf, statusColor);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(getStatusText(invoice.status), valueX, ctx.y, {
    align: 'right',
  });

  ctx.y = Math.max(leftEndY, ctx.y + LINE_HEIGHT);
  ctx.y += SECTION_GAP;
}

function drawItemsTable(ctx: PDFContext, invoice: Invoice): void {
  const colWidths = {
    description: CONTENT_WIDTH * 0.4,
    quantity: CONTENT_WIDTH * 0.12,
    unitPrice: CONTENT_WIDTH * 0.18,
    taxRate: CONTENT_WIDTH * 0.12,
    total: CONTENT_WIDTH * 0.18,
  };

  const colX = {
    description: MARGIN,
    quantity: MARGIN + colWidths.description,
    unitPrice: MARGIN + colWidths.description + colWidths.quantity,
    taxRate:
      MARGIN + colWidths.description + colWidths.quantity + colWidths.unitPrice,
    total:
      MARGIN +
      colWidths.description +
      colWidths.quantity +
      colWidths.unitPrice +
      colWidths.taxRate,
  };

  // Table header
  const headerHeight = 8;
  setFillColor(ctx.pdf, [249, 250, 251]); // Light gray background
  ctx.pdf.rect(MARGIN, ctx.y, CONTENT_WIDTH, headerHeight, 'F');

  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);

  const headerY = ctx.y + 5.5;
  ctx.pdf.text('Description', colX.description + 2, headerY);
  ctx.pdf.text('Qty', colX.quantity + colWidths.quantity / 2, headerY, {
    align: 'center',
  });
  ctx.pdf.text(
    'Unit Price',
    colX.unitPrice + colWidths.unitPrice - 2,
    headerY,
    { align: 'right' }
  );
  ctx.pdf.text('Tax', colX.taxRate + colWidths.taxRate / 2, headerY, {
    align: 'center',
  });
  ctx.pdf.text('Total', colX.total + colWidths.total - 2, headerY, {
    align: 'right',
  });

  ctx.y += headerHeight;

  // Draw header bottom border
  drawLine(ctx, MARGIN, PAGE_WIDTH - MARGIN);
  ctx.y += 1;

  // Table rows
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];

    // Wrap description text
    const wrappedDesc = wrapText(
      ctx.pdf,
      item.description,
      colWidths.description - 4
    );
    const rowHeight = Math.max(wrappedDesc.length * LINE_HEIGHT + 3, 8);

    // Check for page break
    checkPageBreak(ctx, rowHeight);

    // Alternating row background
    if (i % 2 === 1) {
      setFillColor(ctx.pdf, [249, 250, 251]);
      ctx.pdf.rect(MARGIN, ctx.y, CONTENT_WIDTH, rowHeight, 'F');
    }

    const textY = ctx.y + 5;

    // Description (with text wrapping)
    setColor(ctx.pdf, COLOR_TEXT);
    for (let j = 0; j < wrappedDesc.length; j++) {
      ctx.pdf.text(
        wrappedDesc[j],
        colX.description + 2,
        textY + j * LINE_HEIGHT
      );
    }

    // Quantity
    ctx.pdf.text(
      item.quantity.toString(),
      colX.quantity + colWidths.quantity / 2,
      textY,
      { align: 'center' }
    );

    // Unit Price
    ctx.pdf.text(
      formatCurrency(item.unitPrice, invoice.currency),
      colX.unitPrice + colWidths.unitPrice - 2,
      textY,
      { align: 'right' }
    );

    // Tax Rate
    ctx.pdf.text(
      `${item.taxRate ?? 0}%`,
      colX.taxRate + colWidths.taxRate / 2,
      textY,
      { align: 'center' }
    );

    // Total
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemTax = itemSubtotal * ((item.taxRate ?? 0) / 100);
    const itemTotal = itemSubtotal + itemTax;
    ctx.pdf.text(
      formatCurrency(itemTotal, invoice.currency),
      colX.total + colWidths.total - 2,
      textY,
      { align: 'right' }
    );

    ctx.y += rowHeight;
  }

  // Draw table bottom border
  drawLine(ctx, MARGIN, PAGE_WIDTH - MARGIN);
  ctx.y += SECTION_GAP;
}

function drawTotals(ctx: PDFContext, invoice: Invoice): void {
  const totalsWidth = 100;
  const labelX = PAGE_WIDTH - MARGIN - totalsWidth;
  const valueX = PAGE_WIDTH - MARGIN;

  checkPageBreak(ctx, 30);

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_NORMAL);

  // Subtotal
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text('Subtotal:', labelX, ctx.y);
  setColor(ctx.pdf, COLOR_TEXT);
  ctx.pdf.text(
    formatCurrency(invoice.subtotal, invoice.currency),
    valueX,
    ctx.y,
    { align: 'right' }
  );
  ctx.y += LINE_HEIGHT + 2;

  // Tax
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text('Tax:', labelX, ctx.y);
  setColor(ctx.pdf, COLOR_TEXT);
  ctx.pdf.text(
    formatCurrency(invoice.taxTotal, invoice.currency),
    valueX,
    ctx.y,
    { align: 'right' }
  );
  ctx.y += LINE_HEIGHT + 3;

  // Total (with top border line, matching web preview style)
  setDrawColor(ctx.pdf, COLOR_TEXT);
  ctx.pdf.setLineWidth(0.5);
  ctx.pdf.line(labelX, ctx.y - 1, valueX, ctx.y - 1);

  ctx.y += 3;
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_HEADING);
  setColor(ctx.pdf, COLOR_TEXT);
  ctx.pdf.text('Total:', labelX, ctx.y);
  ctx.pdf.text(formatCurrency(invoice.total, invoice.currency), valueX, ctx.y, {
    align: 'right',
  });

  ctx.y += LINE_HEIGHT + SECTION_GAP;
}

function drawNotes(ctx: PDFContext, notes: string): void {
  checkPageBreak(ctx, 30);

  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);
  ctx.pdf.text('Notes', MARGIN, ctx.y);
  ctx.y += LINE_HEIGHT + 1;

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT);

  const wrappedNotes = wrapText(ctx.pdf, notes, CONTENT_WIDTH);
  for (const line of wrappedNotes) {
    checkPageBreak(ctx, LINE_HEIGHT);
    ctx.pdf.text(line, MARGIN, ctx.y);
    ctx.y += LINE_HEIGHT;
  }

  ctx.y += SECTION_GAP;
}

function drawFooter(ctx: PDFContext, invoice: Invoice, isQuote: boolean): void {
  // Draw footer at bottom of each page
  const footerY = PAGE_HEIGHT - 10;

  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setFontSize(FONT_SIZE_SMALL);
  setColor(ctx.pdf, COLOR_TEXT_SECONDARY);

  const dateLabel = isQuote ? 'Valid Until' : 'Due Date';
  const dateValue =
    isQuote && invoice.validUntil ? invoice.validUntil : invoice.dueDate;
  ctx.pdf.text(
    `${dateLabel}: ${formatDate(dateValue)}`,
    PAGE_WIDTH / 2,
    footerY,
    { align: 'center' }
  );
}

export function generateInvoicePDF(
  invoice: Invoice,
  client: Client,
  settings: Settings | null
): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isQuote = invoice.documentType === 'quote';
  const primaryColor = getPrimaryColor(settings);

  const ctx: PDFContext = {
    pdf,
    y: MARGIN,
    pageNumber: 1,
  };

  // Draw content
  drawHeader(ctx, invoice, settings, isQuote, primaryColor);
  drawClientAndMeta(ctx, invoice, client, isQuote, primaryColor);
  drawItemsTable(ctx, invoice);
  drawTotals(ctx, invoice);

  if (invoice.notes) {
    drawNotes(ctx, invoice.notes);
  }

  // Draw footer on all pages
  const totalPages = ctx.pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    ctx.pdf.setPage(i);
    drawFooter(ctx, invoice, isQuote);
  }

  return pdf;
}

export function downloadInvoicePDF(
  invoice: Invoice,
  client: Client,
  settings: Settings | null
): void {
  const pdf = generateInvoicePDF(invoice, client, settings);
  pdf.save(`${invoice.invoiceNumber}.pdf`);
}
