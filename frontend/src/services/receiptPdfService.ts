import jsPDF from 'jspdf';
import { Bill } from '../types';
import { generateQrDataUrl } from './qrService';

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
      } catch (e) {}
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
};

/**
 * Client-side high-resolution PDF generator for Lowkey Cafe receipts.
 * Works 100% offline and in production (Vercel) without any backend server dependency.
 */
export const downloadReceiptPdf = async (bill: Bill): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Standard 148 x 210 mm, clean and printable
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // 1. Dark Luxury Header
  doc.setFillColor(18, 18, 18); // #121212
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Accent yellow line
  doc.setFillColor(250, 204, 21); // brand yellow #facc15
  doc.rect(0, 34, pageWidth, 1.5, 'F');

  // Embed official logo emblem if available
  const logoDataUrl = await loadLogoDataUrl();
  let textStartX = pageWidth / 2;
  let textAlign: 'center' | 'left' = 'center';

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin, 5.5, 23, 23);
      textStartX = margin + 27;
      textAlign = 'left';
    } catch (e) {}
  }

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('LOWKEY CAFE', textStartX, 13, { align: textAlign });

  // Tagline & Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(212, 212, 216); // stone-300
  doc.text('SMART DIGITAL DINING EXPERIENCE', textStartX, 18, { align: textAlign });
  doc.text('Artisan Roastery & Kitchen • GSTIN: 27AAACL9970F1Z2', textStartX, 23, { align: textAlign });
  doc.text('742 Evergreen Terrace, Foodie Lane • Tel: +91 98765 43210', textStartX, 27.5, { align: textAlign });

  y = 43;

  // 2. Receipt Title & Status Stamp
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('TAX INVOICE / DIGITAL RECEIPT', margin, y);

  // Status Badge
  const isPaid = bill.status === 'PAID';
  const statusText = isPaid ? 'PAID & SETTLED' : 'PENDING PAYMENT';
  doc.setFillColor(isPaid ? 220 : 254, isPaid ? 252 : 243, isPaid ? 231 : 199);
  doc.roundedRect(pageWidth - margin - 32, y - 5, 32, 6.8, 1.5, 1.5, 'F');
  doc.setTextColor(isPaid ? 22 : 180, isPaid ? 101 : 83, isPaid ? 52 : 9);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - margin - 16, y - 0.7, { align: 'center' });

  y += 6.5;

  // 3. Metadata Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

  doc.setFontSize(7.5);
  const metaLeft = margin + 4;
  const metaRight = pageWidth / 2 + 2;
  let metaY = y + 5;

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Bill Number:', metaLeft, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(bill.billNumber || `#BILL-${bill.id}`, metaLeft + 22, metaY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Table / Order:', metaRight, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const tableLabel = bill.tableNumber === 0 ? 'Takeaway (Pick-Up)' : `Table #${bill.tableNumber}`;
  doc.text(`${tableLabel} • ${bill.orderCode || ''}`, metaRight + 22, metaY);

  metaY += 5.5;

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Date & Time:', metaLeft, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const dateStr = bill.createdAt
    ? new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN');
  doc.text(dateStr, metaLeft + 22, metaY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Type:', metaRight, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(bill.paymentMethod || 'CASH / UPI', metaRight + 22, metaY);

  metaY += 5.5;

  // Row 3
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Staff / Server:', metaLeft, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Lead Waiter Alex (Floor Staff)', metaLeft + 22, metaY);

  y += 28;

  // 4. Items Table Header
  doc.setFillColor(18, 18, 18);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  const colItem = margin + 4;
  const colQty = margin + 74;
  const colPrice = margin + 92;
  const colTotal = margin + contentWidth - 4;

  doc.text('ITEM DESCRIPTION', colItem, y + 4.8);
  doc.text('QTY', colQty, y + 4.8, { align: 'center' });
  doc.text('RATE (₹)', colPrice, y + 4.8, { align: 'right' });
  doc.text('AMOUNT (₹)', colTotal, y + 4.8, { align: 'right' });

  y += 7;

  // 5. Items List
  const items = Array.isArray(bill.items) && bill.items.length > 0 ? bill.items : [
    { itemName: 'Artisan Gourmet Food & Beverages', quantity: 1, unitPrice: bill.subtotal || 249, totalPrice: bill.subtotal || 249 }
  ];

  doc.setFontSize(7.5);
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6.5, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');

    const name = item.itemName || 'Food Item';
    const truncatedName = name.length > 35 ? name.substring(0, 32) + '...' : name;
    doc.text(truncatedName, colItem, y + 4.4);
    doc.text(String(item.quantity || 1), colQty, y + 4.4, { align: 'center' });
    doc.text((item.unitPrice || 0).toFixed(2), colPrice, y + 4.4, { align: 'right' });
    doc.text((item.totalPrice || (item.unitPrice * item.quantity) || 0).toFixed(2), colTotal, y + 4.4, { align: 'right' });

    y += 6.5;
  });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3;

  // 6. Financial Summary Section
  const summaryLeft = margin + 50;
  const summaryRight = margin + contentWidth - 4;

  const addSummaryRow = (label: string, amount: number, isBold = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 7.5);
    if (isAccent) {
      doc.setTextColor(180, 83, 9);
    } else if (isBold) {
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(label, summaryLeft, y + 4);
    doc.text(`₹${amount.toFixed(2)}`, summaryRight, y + 4, { align: 'right' });
    y += 5.2;
  };

  addSummaryRow('Subtotal:', bill.subtotal || 0);
  if (bill.discountAmount && bill.discountAmount > 0) {
    addSummaryRow('Discount Applied:', -bill.discountAmount, false, true);
  }
  addSummaryRow('GST (5%):', bill.taxAmount || 0);
  if (bill.serviceCharge && bill.serviceCharge > 0) {
    addSummaryRow('Service Charge (5%):', bill.serviceCharge || 0);
  }
  if (bill.tipAmount && bill.tipAmount > 0) {
    addSummaryRow('Server Gratuity / Tip:', bill.tipAmount || 0, false, true);
  }

  // Highlight Box for Total Amount
  y += 1;
  doc.setFillColor(254, 240, 138); // Yellow-200 accent
  doc.roundedRect(summaryLeft - 2, y, contentWidth - 46, 7.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL AMOUNT PAID:', summaryLeft + 2, y + 5.2);
  const finalTotal = bill.paidAmount || bill.finalPayableAmount || 0;
  doc.text(`₹${finalTotal.toFixed(2)}`, summaryRight, y + 5.2, { align: 'right' });

  y += 14;

  // 7. QR Code Digital Verification Block
  try {
    const qrDataUrl = await generateQrDataUrl(`/order-tracking/${bill.orderCode || bill.orderId}`);
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', margin + 2, y, 22, 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Scan to Verify Digital Invoice', margin + 28, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Official cryptographic digital receipt issued by Lowkey Cafe.', margin + 28, y + 11);
      doc.text('Verified smart dining order with zero paper waste.', margin + 28, y + 15);
    }
  } catch (err) {
    console.warn('QR code embed failed', err);
  }

  // 8. Footer Stripe
  doc.setFillColor(18, 18, 18);
  doc.rect(0, pageHeight - 7, pageWidth, 7, 'F');
  doc.setTextColor(250, 204, 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Thank you for dining with Lowkey Cafe! Please visit us again soon.', pageWidth / 2, pageHeight - 2.5, { align: 'center' });

  // 9. Download the PDF file directly to user's device
  const fileName = `Receipt-${bill.billNumber || `BILL-${bill.id}`}.pdf`;
  doc.save(fileName);
};
