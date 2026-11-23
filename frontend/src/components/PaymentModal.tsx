import React, { useState } from 'react';
import { Bill } from '../types';
import { billingApi } from '../services/api';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Heart,
  ExternalLink,
} from 'lucide-react';

interface PaymentModalProps {
  bill: Bill;
  onClose: () => void;
  onPaymentSuccess: (paidBill: Bill) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bill,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [tipPercentage, setTipPercentage] = useState<number | null>(10);
  const [customTip, setCustomTip] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashRequested, setCashRequested] = useState(false);

  // Tip calculation
  let calculatedTip = 0;
  if (tipPercentage !== null) {
    calculatedTip = Math.round((bill.subtotal * (tipPercentage / 100)) * 100) / 100;
  } else if (customTip) {
    calculatedTip = parseFloat(customTip) || 0;
  }

  const payableTotal = Math.round((bill.finalPayableAmount + calculatedTip) * 100) / 100;

  // Mock Card fields
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('742');

  const handleApplyTipAndPay = async () => {
    setIsProcessing(true);

    try {
      // 1. Apply tip if chosen
      if (calculatedTip > 0) {
        await billingApi.applyTip(bill.id, {
          tipType: tipPercentage !== null ? 'PERCENTAGE' : 'CUSTOM',
          percentageValue: tipPercentage || undefined,
          customTipAmount: calculatedTip,
        });
      }

      if (selectedMethod === 'CASH') {
        // Cash payment flow
        setCashRequested(true);
        setIsProcessing(false);
        return;
      }

      // 2. Online Payment flow (UPI or Card)
      // Step A: Initiate payment on backend
      const initRes = await billingApi.initiatePayment({
        billId: bill.id,
        amount: payableTotal,
        paymentMethod: selectedMethod,
      });

      const payment = initRes.data;

      // Step B: Verify payment on backend securely with signature
      const verifyRes = await billingApi.verifyPayment({
        paymentReference: payment.paymentReference,
        razorpayOrderId: payment.gatewayOrderId,
        razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
        razorpaySignature: 'sig_mock_verified',
      });

      const updatedBill = verifyRes.data;

      // Trigger celebration confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      onPaymentSuccess(updatedBill);
    } catch (err) {
      console.error(err);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashConfirm = async () => {
    setIsProcessing(true);
    try {
      const res = await billingApi.recordCashPayment({
        billId: bill.id,
        amount: payableTotal,
      });
      confetti({ particleCount: 50, spread: 45 });
      onPaymentSuccess(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {cashRequested ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Banknote className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-stone-900">
                Cash Payment Requested
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Please have <strong>₹{payableTotal}</strong> ready. Your waiter has been notified and is coming to Table #{bill.tableNumber} to collect cash and present your receipt.
              </p>
            </div>

            <button
              onClick={handleCashConfirm}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Staff Collected Cash (Simulate Confirmation)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-stone-900">
                  Checkout & Payment
                </h3>
                <p className="text-xs text-stone-500">Bill #{bill.billNumber} • Table #{bill.tableNumber}</p>
              </div>
            </div>

            {/* Tip Management */}
            <div className="mb-5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Add Server Gratuity / Tip
                </span>
                <span className="text-xs font-extrabold text-stone-900">
                  {calculatedTip > 0 ? `+₹${calculatedTip}` : 'No tip'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setTipPercentage(pct === 0 ? null : pct);
                      setCustomTip('');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      (pct === 0 && tipPercentage === null && !customTip) || tipPercentage === pct
                        ? 'border-brand-500 bg-brand-500 text-stone-950 font-extrabold shadow-sm'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-stone-700 block mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'UPI'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'CARD'
                      ? 'border-brand-500 bg-brand-50/60 text-brand-900 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-brand-600" />
                  <span className="text-xs">Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CASH')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'CASH'
                      ? 'border-amber-500 bg-amber-50/60 text-amber-900 font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span className="text-xs">Cash</span>
                </button>
              </div>
            </div>

            {/* Payment Method Details Preview */}
            <div className="mb-5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              {selectedMethod === 'UPI' && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-inner border border-stone-200 mb-2 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&color=000000&bgcolor=ffffff&data=${encodeURIComponent(`upi://pay?pa=lowkeycafe@upi&pn=Lowkey%20Cafe&am=${payableTotal}&cu=INR`)}`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-stone-600 font-semibold">
                    UPI ID: lowkeycafe@upi
                  </span>
                  <p className="text-[10px] text-stone-400 mt-0.5">Scan with Google Pay, PhonePe, Paytm, or CRED</p>
                </div>
              )}

              {selectedMethod === 'CARD' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full text-xs font-mono p-2 rounded-xl border border-stone-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full text-xs font-mono p-2 rounded-xl border border-stone-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'CASH' && (
                <div className="text-center py-2">
                  <p className="text-xs text-stone-600 font-medium">
                    Pay in cash directly to your server at Table #{bill.tableNumber}.
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">Exact change is appreciated.</p>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={handleApplyTipAndPay}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-brand-600 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-between shadow-xl transition-all active:scale-98 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {selectedMethod === 'CASH' ? 'Request Cash Collection' : `Pay ₹${payableTotal.toFixed(2)}`}
              </span>
              <span className="text-xs text-amber-300 font-mono font-bold">100% Secure</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
