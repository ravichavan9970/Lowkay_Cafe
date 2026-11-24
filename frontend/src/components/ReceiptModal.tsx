import React, { useState } from 'react';
import { Bill } from '../types';
import { billingApi } from '../services/api';
import { downloadReceiptPdf } from '../services/receiptPdfService';
import { X, Download, Mail, Star, CheckCircle2, Coffee, Loader2 } from 'lucide-react';

interface ReceiptModalProps {
  bill: Bill;
  onClose: () => void;
  onOpenReview: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill,
  onClose,
  onOpenReview,
}) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setIsSending(true);
    try {
      await billingApi.emailReceipt(bill.id, email.trim());
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      alert('Could not send email receipt.');
    } finally {
      setIsSending(false);
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
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-brand-600 flex items-center justify-center mx-auto mb-2">
              <Coffee className="w-6 h-6" />
            </div>
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
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Email Digital Receipt
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>Send</span>
              </button>
            </div>
            {emailSent && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Receipt emailed successfully!
              </p>
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
