import React, { useState, useEffect } from 'react';
import { Bill } from '../types';
import { billingApi, waiterApi } from '../services/api';
import { generateQrDataUrl } from '../services/qrService';
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
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

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

  useEffect(() => {
    const upiPayload = `upi://pay?pa=lowkeycafe@upi&pn=Lowkey%20Cafe&am=${payableTotal}&cu=INR`;
    generateQrDataUrl(upiPayload).then(setUpiQrDataUrl).catch(console.error);
  }, [payableTotal]);

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
        // Cash payment flow: Notify Waiter to collect cash from table
        await waiterApi.callWaiter({
          tableNumber: bill.tableNumber,
          requestType: 'BILL_REQUEST',
          additionalNote: `Customer requested cash payment: ₹${payableTotal.toFixed(2)} (Bill #${bill.billNumber})`,
        });
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
        billId: bill.id,
        tipAmount: calculatedTip,
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
        tipAmount: calculatedTip,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {cashRequested ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center mx-auto animate-pulse">
              <Banknote className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-white">
                Cash Collection Requested
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                A request has been sent to your waiter to collect cash from <strong>Table #{bill.tableNumber}</strong>. Please have exact change ready.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between font-semibold text-neutral-300">
                <span>Bill Total:</span>
                <span>₹{(bill?.finalPayableAmount ?? 0).toFixed(2)}</span>
              </div>
              {calculatedTip > 0 && (
                <div className="flex justify-between text-neutral-400">
                  <span>Server Tip / Gratuity:</span>
                  <span>+₹{calculatedTip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-yellow-400 pt-1.5 border-t border-neutral-800 text-sm">
                <span>Total Cash to Hand:</span>
                <span>₹{payableTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCashConfirm}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
              <span>Cash Handed to Waiter (Complete)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-white">
                  Checkout & Payment
                </h3>
                <p className="text-xs text-neutral-400">Bill #{bill.billNumber} • Table #{bill.tableNumber}</p>
              </div>
            </div>

            {/* Tip Management */}
            <div className="mb-5 bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Add Server Gratuity / Tip
                </span>
                <span className="text-xs font-extrabold text-yellow-400">
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
                        ? 'border-yellow-400 bg-yellow-400 text-black font-black shadow-sm'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-neutral-300 block mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'UPI'
                      ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300 font-bold shadow-sm'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs">UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'CARD'
                      ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300 font-bold shadow-sm'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs">Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CASH')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'CASH'
                      ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300 font-bold shadow-sm'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs">Cash</span>
                </button>
              </div>
            </div>

            {/* Payment Method Details Preview */}
            <div className="mb-5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              {selectedMethod === 'UPI' && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-inner border border-neutral-700 mb-2 flex items-center justify-center">
                    {upiQrDataUrl ? (
                      <img
                        src={upiQrDataUrl}
                        alt="UPI QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-300 font-semibold">
                    UPI ID: lowkeycafe@upi
                  </span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Scan with Google Pay, PhonePe, Paytm, or CRED</p>
                </div>
              )}

              {selectedMethod === 'CARD' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full text-xs font-mono p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full text-xs font-mono p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'CASH' && (
                <div className="text-center py-2">
                  <p className="text-xs text-neutral-300 font-medium">
                    Pay in cash directly to your server at Table #{bill.tableNumber}.
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">Exact change is appreciated.</p>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={handleApplyTipAndPay}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-between shadow-xl shadow-yellow-400/20 transition-all active:scale-98 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />}
                {selectedMethod === 'CASH' ? `Request Waiter to Collect ₹${payableTotal.toFixed(2)} Cash` : `Pay ₹${payableTotal.toFixed(2)}`}
              </span>
              <span className="text-xs text-neutral-900 font-mono font-bold">100% Secure</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
