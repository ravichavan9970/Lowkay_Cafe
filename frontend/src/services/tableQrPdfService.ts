import jsPDF from 'jspdf';
import { Table } from '../types';
import { generateQrDataUrl, PRODUCTION_ORIGIN } from './qrService';

const loadLogoDataUrl = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Canvas conversion failed for logo', e);
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
};

/**
 * Generates and downloads a print-ready multi-page serial PDF containing
 * high-contrast QR table stands for Tables 1 through 10 (or custom table list).
 *
 * Each sheet is formatted serially with:
 * 1. Cafe Logo & Official Cafe Name ("Lowkey Cafe")
 * 2. Prominent Table Number ("TABLE #01", "TABLE #02", ...)
 * 3. Clear customer instruction message ("Scan to browse menu & order directly to your table")
 * 4. High-contrast, scannable QR code linking straight to live mobile table dining
 */
export const downloadAllTablesQrPdf = async (
  tables: Table[],
  customBaseUrl?: string
): Promise<void> => {
  if (!tables || tables.length === 0) return;

  // Sort serially by table number (1, 2, 3...)
  const sortedTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);

  // A5 format: 148mm width x 210mm height (ideal for restaurant acrylic stands & tent cards)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const logoDataUrl = await loadLogoDataUrl();

  const baseUrl = customBaseUrl || PRODUCTION_ORIGIN;

  for (let index = 0; index < sortedTables.length; index++) {
    const table = sortedTables[index];
    const tableNumStr = table.tableNumber < 10 ? `0${table.tableNumber}` : `${table.tableNumber}`;

    if (index > 0) {
      doc.addPage();
    }

    // Outer decorative border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.roundedRect(6, 6, pageWidth - 12, pageHeight - 12, 4, 4, 'S');

    // Inner gold accent corner ticks
    doc.setDrawColor(234, 179, 8); // amber-500
    doc.setLineWidth(1.2);
    // Top-left corner
    doc.line(8, 8, 16, 8);
    doc.line(8, 8, 8, 16);
    // Top-right corner
    doc.line(pageWidth - 8, 8, pageWidth - 16, 8);
    doc.line(pageWidth - 8, 8, pageWidth - 8, 16);
    // Bottom-left corner
    doc.line(8, pageHeight - 8, 16, pageHeight - 8);
    doc.line(8, pageHeight - 8, 8, pageHeight - 16);
    // Bottom-right corner
    doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 16, pageHeight - 8);
    doc.line(pageWidth - 8, pageHeight - 8, pageWidth - 8, pageHeight - 16);

    // 1. Cafe Logo
    let headerY = 14;
    if (logoDataUrl) {
      try {
        const logoSize = 22;
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(logoDataUrl, 'PNG', logoX, headerY, logoSize, logoSize);
        headerY += logoSize + 4;
      } catch (err) {
        console.warn('Failed to embed logo in PDF', err);
        headerY += 4;
      }
    } else {
      headerY += 6;
    }

    // 2. Cafe Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(18, 18, 18);
    doc.text('LOWKEY CAFE', pageWidth / 2, headerY, { align: 'center' });
    headerY += 5;

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(115, 115, 115);
    doc.text('ARTISAN ROASTERY & GOURMET BISTRO', pageWidth / 2, headerY, { align: 'center' });
    headerY += 5;

    // Gold divider
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.line((pageWidth - 60) / 2, headerY, (pageWidth + 60) / 2, headerY);
    headerY += 6;

    // 3. Table Number (Prominent Badge)
    const badgeWidth = 92;
    const badgeHeight = 18;
    const badgeX = (pageWidth - badgeWidth) / 2;

    doc.setFillColor(18, 18, 18); // Dark obsidian card
    doc.roundedRect(badgeX, headerY, badgeWidth, badgeHeight, 3.5, 3.5, 'F');

    // Table title inside badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(250, 204, 21); // Bright yellow/gold
    doc.text(`TABLE #${tableNumStr}`, pageWidth / 2, headerY + 8, { align: 'center' });

    // Table zone info inside badge
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(215, 215, 215);
    const zoneInfo = table.floorZone ? `${table.floorZone} · Capacity ${table.seatingCapacity || 4} Guests` : 'Dine-In Guest Table';
    doc.text(zoneInfo, pageWidth / 2, headerY + 14, { align: 'center' });
    headerY += badgeHeight + 7;

    // 4. Instructions Message
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 20);
    doc.text('SCAN TO ORDER DIRECTLY TO YOUR TABLE', pageWidth / 2, headerY, { align: 'center' });
    headerY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const message = 'Point your phone camera at the QR code below to explore our live handcrafted menu, customize dishes & order without waiting.';
    const splitMessage = doc.splitTextToSize(message, 114);
    doc.text(splitMessage, pageWidth / 2, headerY, { align: 'center' });
    headerY += (splitMessage.length * 4) + 3;

    // 5. QR Code Generation
    const targetUrl = `${baseUrl}/table/${table.tableNumber}`;
    try {
      const qrDataUrl = await generateQrDataUrl(targetUrl);
      const qrSize = 64;
      const qrX = (pageWidth - qrSize) / 2;

      // QR white backing frame with gold border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(0.8);
      doc.roundedRect(qrX - 2.5, headerY - 2.5, qrSize + 5, qrSize + 5, 2.5, 2.5, 'FD');

      // Draw QR Image
      doc.addImage(qrDataUrl, 'PNG', qrX, headerY, qrSize, qrSize);
      headerY += qrSize + 6;
    } catch (qrErr) {
      console.error('Failed to add QR image to PDF', qrErr);
      headerY += 66;
    }

    // 6. Target URL (small clean text below QR)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text(targetUrl, pageWidth / 2, headerY, { align: 'center' });
    headerY += 6;

    // 7. Footer Bar
    const footerWidth = 110;
    const footerHeight = 10;
    const footerX = (pageWidth - footerWidth) / 2;
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.4);
    doc.roundedRect(footerX, headerY, footerWidth, footerHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text('Smart QR Dining · Zero Wait Time · Lowkey Cafe', pageWidth / 2, headerY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(140, 140, 140);
    doc.text(`Sheet Serial #${tableNumStr} of ${sortedTables.length < 10 ? '0' + sortedTables.length : sortedTables.length}`, pageWidth / 2, headerY + 8, { align: 'center' });
  }

  // Trigger download with descriptive filename
  doc.save('Lowkey_Cafe_All_Tables_QRs_Serially.pdf');
};

/**
 * Downloads a single table QR stand PDF for quick reprints of an individual table.
 */
export const downloadSingleTableQrPdf = async (
  table: Table,
  customBaseUrl?: string
): Promise<void> => {
  await downloadAllTablesQrPdf([table], customBaseUrl);
};
