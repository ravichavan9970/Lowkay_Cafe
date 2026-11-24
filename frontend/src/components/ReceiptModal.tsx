import React, { useState } from 'react';
import { Bill } from '../types';
import { billingApi } from '../services/api';
import { downloadReceiptPdf } from '../services/receiptPdfService';
import {
  X,
  Download,
  Mail,
  Star,
  CheckCircle2,
  Coffee,
  Loader2,
  Send,
  Share2,
  AlertCircle,
} from 'lucide-react';

interface ReceiptModalProps {
  bill: Bill;
  onClose: () => void;
  onOpenReview: () => void;
}

const formatReceiptText = (bill: Bill): { subject: string; body: string } => {
  const isTakeaway = bill.tableNumber === 0;
  const diningLabel = isTakeaway ? '🥡 Takeaway / Counter Pickup' : `🍽️ Table #${bill.tableNumber}`;
  const subject = `Lowkey Cafe - Dining Receipt #${bill.billNumber || bill.id}`;

  const itemsList =
    Array.isArray(bill.items) && bill.items.length > 0
      ? bill.items.map((i) => `• ${i.itemName} (x${i.quantity}) - ₹${i.totalPrice.toFixed(2)}`).join('\n')
      : `• Artisan Food & Beverages - ₹${(bill.subtotal || 249).toFixed(2)}`;

  const dateStr = bill.createdAt
    ? new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN');

  const body = `☕ LOWKEY CAFE - OFFICIAL DIGITAL DINING RECEIPT
========================================
Receipt / Bill #: ${bill.billNumber || `BILL-${bill.id}`}
Order Code: ${bill.orderCode || 'N/A'}
Dining Mode: ${diningLabel}
Date & Time: ${dateStr}
Payment Status: PAID & SETTLED (${bill.paymentMethod || 'CASH / UPI'})
========================================
ORDERED ITEMS:
${itemsList}
========================================
Subtotal: ₹${(bill.subtotal || 0).toFixed(2)}
${bill.discountAmount && bill.discountAmount > 0 ? `Discount: -₹${bill.discountAmount.toFixed(2)}\n` : ''}Taxes (GST 5%): ₹${(bill.taxAmount || 0).toFixed(2)}
Service Charge: ₹${(bill.serviceCharge || 0).toFixed(2)}
${bill.tipAmount && bill.tipAmount > 0 ? `Server Gratuity: +₹${bill.tipAmount.toFixed(2)}\n` : ''}========================================
TOTAL PAID: ₹${(bill.finalPayableAmount || bill.paidAmount || 0).toFixed(2)}
========================================

Thank you for dining with Lowkey Cafe!
Lowkey Cafe • Artisan Roastery & Kitchen
742 Evergreen Terrace, Foodie Lane, Metro City
Tel: +91 98765 43210
Official Cryptographic Digital Receipt`;

  return { subject, body };
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill,
  onClose,
  onOpenReview,
}) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gmailUrl, setGmailUrl] = useState('');
  const [mailtoUrl, setMailtoUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const canShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadReceiptPdf(bill);
    } catch (err) {
      console.error('Failed to generate PDF receipt', err);
      alert('Could not generate PDF receipt.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setIsSending(true);
    try {
      // 1. Inform API / Cloud
      await billingApi.emailReceipt(bill.id, trimmed).catch(() => {});

      // 2. Automatically generate and download the high-res official PDF receipt
      await downloadReceiptPdf(bill).catch((err) => console.warn('PDF auto-download warning', err));

      const { subject, body } = formatReceiptText(bill);
      const gUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(trimmed)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const mUrl = `mailto:${encodeURIComponent(trimmed)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setGmailUrl(gUrl);
      setMailtoUrl(mUrl);
      setEmailSent(true);

      // 3. If user entered a Gmail address, open Gmail in a new tab; otherwise trigger mailto
      if (trimmed.toLowerCase().endsWith('@gmail.com') || trimmed.toLowerCase().endsWith('@googlemail.com')) {
        window.open(gUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = mUrl;
      }
    } catch (err: any) {
      console.error('Email receipt dispatch error', err);
      setErrorMsg('Could not dispatch receipt. Please download the PDF directly below.');
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      const { subject, body } = formatReceiptText(bill);
      try {
        await navigator.share({
          title: subject,
          text: body,
        });
      } catch (err) {
        // User cancelled share dialog
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl relative text-stone-900 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Receipt Top Header */}
          <div className="text-center pb-4 border-b border-stone-200">
            <img
              src="/logo.png"
              alt="Lowkey Cafe Logo"
              className="w-16 h-16 mx-auto mb-2 object-contain"
            />
            <h2 className="font-display font-extrabold text-2xl text-stone-950">
              Lowkey Cafe
            </h2>
            <p className="text-xs text-stone-500">
              742 Evergreen Terrace, Foodie Lane, Metro City
            </p>
            <p className="text-[11px] text-stone-400">Tel: +91 98765 43210</p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Settled
            </div>
          </div>

          {/* Metadata */}
          <div className="flex justify-between text-xs text-stone-600 py-1">
            <div>
              <span className="block text-stone-400">Receipt / Bill #</span>
              <strong className="font-mono text-stone-900">{bill.billNumber}</strong>
            </div>
            <div className="text-right">
              <span className="block text-stone-400">Table</span>
              <strong className="font-bold text-stone-900">Table #{bill.tableNumber}</strong>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2 py-2 border-y border-stone-100">
            <div className="flex justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              <span>Item</span>
              <span>Total</span>
            </div>

            {bill.items && bill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-stone-900">{item.itemName}</span>
                  <span className="text-stone-400 ml-1.5">× {item.quantity}</span>
                </div>
                <span className="font-bold text-stone-900">₹{item.totalPrice}</span>
              </div>
            ))}
          </div>

          {/* Financial summary */}
          <div className="space-y-1.5 text-xs text-stone-600 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">₹{(bill?.subtotal ?? 0).toFixed(2)}</span>
            </div>
            {(bill?.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-₹{(bill.discountAmount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes (GST 5%)</span>
              <span>₹{(bill?.taxAmount ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (5%)</span>
              <span>₹{(bill?.serviceCharge ?? 0).toFixed(2)}</span>
            </div>
            {(bill?.tipAmount ?? 0) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Server Tip / Gratuity</span>
                <span>+₹{(bill.tipAmount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
              <span>Final Total Paid</span>
              <span className="font-display font-black text-brand-600">
                ₹{(bill?.finalPayableAmount ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Email receipt feature */}
          <div className="pt-3 border-t border-stone-200">
            {emailSent ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-emerald-950 truncate">
                      Receipt Prepared for {email}
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
                      Official PDF receipt downloaded. You can also view or send it directly via:
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {gmailUrl && (
                    <a
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Gmail</span>
                    </a>
                  )}

                  {mailtoUrl && (
                    <a
                      href={mailtoUrl}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mail App</span>
                    </a>
                  )}

                  {canShare && (
                    <button
                      type="button"
                      onClick={handleShare}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Receipt</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEmailSent(false);
                      setErrorMsg('');
                    }}
                    className="px-2 py-1 text-[11px] text-stone-500 hover:text-stone-800 font-medium underline transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} noValidate>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Email Digital Receipt
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors active:scale-95 shadow-sm"
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-98 disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 text-stone-600 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-stone-600" />
            )}
            <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
          </button>

          {/* One-tap review button */}
          <button
            onClick={() => {
              onClose();
              onOpenReview();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
          >
            <Star className="w-4 h-4 fill-stone-950" />
            <span>Rate Dining</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
