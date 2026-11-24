import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi, billingApi, kitchenApi } from '../services/api';
import { Order, Bill, OrderStatus } from '../types';
import wsService from '../services/websocket';
import cloudSync from '../services/cloudSyncService';
import { downloadReceiptPdf } from '../services/receiptPdfService';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import SplitBillModal from '../components/SplitBillModal';
import ReceiptModal from '../components/ReceiptModal';
import ReviewModal from '../components/ReviewModal';
import CallWaiterModal from '../components/CallWaiterModal';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  Receipt,
  Star,
  Users,
  ChevronLeft,
  Flame,
  ArrowRight,
  Loader2,
  Download,
} from 'lucide-react';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'NEW_ORDER', label: 'Order Received', desc: 'Sent straight to the kitchen line', icon: Clock },
  { status: 'ACCEPTED', label: 'Order Accepted', desc: 'Kitchen acknowledged ticket', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Preparing Food', desc: 'Chef is crafting your dishes', icon: ChefHat },
  { status: 'READY', label: 'Food Ready', desc: 'Plated and ready for server pickup', icon: Bell },
  { status: 'SERVED', label: 'Served at Table', desc: 'Bon appétit! Enjoy your meal', icon: CheckCircle2 },
];

const TAKEAWAY_STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'NEW_ORDER', label: 'Order Received', desc: 'Sent straight to the kitchen line', icon: Clock },
  { status: 'ACCEPTED', label: 'Order Confirmed', desc: 'Kitchen acknowledged takeaway ticket', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Preparing Food', desc: 'Chef is crafting your takeaway', icon: ChefHat },
  { status: 'READY', label: 'Ready for Pickup', desc: 'Packed and waiting at the counter', icon: Bell },
  { status: 'SERVED', label: 'Order Collected', desc: 'Handed over! Enjoy your meal', icon: CheckCircle2 },
];

export const OrderTracking: React.FC = () => {
  const { orderCode } = useParams<{ orderCode: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPayment, setShowPayment] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showCallWaiter, setShowCallWaiter] = useState(false);

  // Fetch Order
  const fetchOrder = () => {
    if (!orderCode) return;
    orderApi.trackOrder(orderCode)
      .then((res) => {
        setOrder(res.data);
        // Also fetch Bill if order is active or completed
        billingApi.getBillForOrder(res.data.id)
          .then((bRes) => setBill(bRes.data))
          .catch(() => {});
      })
      .catch((err) => console.error('Error fetching order', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();

    // 1. Refresh on tab focus (instant mobile refresh when returning to screen)
    const handleFocus = () => {
      fetchOrder();
    };
    window.addEventListener('focus', handleFocus);

    // 2. Fallback heartbeat (20s relaxed interval to prevent any broker 429 rate limit)
    const pollId = setInterval(() => {
      if (orderCode) {
        fetchOrder();
      }
    }, 20000);

    // 3. Real-time cloud subscription (instant cross-device SSE sync)
    const unsubCloud = cloudSync.subscribeToOrders((orders) => {
      const match = orders.find((o) => o.orderCode === orderCode);
      if (match) {
        setOrder(match);
        if (match.id) {
          billingApi.getBillForOrder(match.id).then((bRes) => setBill(bRes.data)).catch(() => {});
        }
      }
    });

    // 4. Subscribe to live WebSocket updates for this specific order
    const subId = wsService.subscribe(`/topic/orders/${orderCode}`, (updatedOrder: Order) => {
      console.log('⚡ Live Order Update received via WebSocket:', updatedOrder);
      setOrder(updatedOrder);
      if (updatedOrder.id) {
        billingApi.getBillForOrder(updatedOrder.id)
          .then((bRes) => setBill(bRes.data))
          .catch(() => {});
      }
    });

    // 5. Instant local synchronization across tabs and windows (0ms latency)
    const handleOrderSync = (e: any) => {
      const updated = e.detail;
      if (updated && updated.orderCode === orderCode) {
        setOrder(updated);
        if (updated.id) {
          billingApi.getBillForOrder(updated.id).then((bRes) => setBill(bRes.data)).catch(() => {});
        }
      }
    };
    const handleBillSync = (e: any) => {
      const updatedBill = e.detail;
      if (updatedBill && (updatedBill.orderCode === orderCode || (order && updatedBill.orderId === order.id))) {
        setBill(updatedBill);
      }
    };
    window.addEventListener('lowkey_order_update', handleOrderSync);
    window.addEventListener('lowkey_bill_update', handleBillSync);

    return () => {
      clearInterval(pollId);
      window.removeEventListener('focus', handleFocus);
      unsubCloud();
      wsService.unsubscribe(subId);
      window.removeEventListener('lowkey_order_update', handleOrderSync);
      window.removeEventListener('lowkey_bill_update', handleBillSync);
    };
  }, [orderCode, order?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
          <p className="text-xs text-neutral-400 font-medium tracking-wide">Connecting to Live Kitchen...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white">Order Not Found</h2>
          <p className="text-xs text-neutral-400 mt-2">Could not locate order code {orderCode}</p>
          <Link to="/" className="mt-5 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl text-xs font-black shadow-lg shadow-yellow-400/20 active:scale-95 transition-all">
            Return to Menu
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine takeaway vs dine-in stepper and status
  const isTakeaway = order.tableNumber === 0;
  const statusSteps = isTakeaway ? TAKEAWAY_STATUS_STEPS : STATUS_STEPS;
  const currentStepIdx = statusSteps.findIndex((s) => s.status === order.status);
  // Order completion is determined by actual food preparation & handover, NOT by payment alone!
  const isCompleted = order.status === 'COMPLETED' || order.status === 'SERVED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white selection:bg-yellow-400 selection:text-black">
      <Navbar />

      <main className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 flex-1 w-full space-y-5">
        
        {/* Top Back Navigation & Table/Order Pill */}
        <div className="flex items-center justify-between">
          <Link
            to={order.tableNumber === 0 ? '/takeaway' : `/table/${order.tableNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-yellow-400" />
            <span>Add More Items</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">
              {order.tableNumber === 0 ? '🥡 Takeaway' : `Table #${order.tableNumber}`}
            </span>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-yellow-400 shadow-inner">
              {order.orderCode}
            </span>
          </div>
        </div>

        {/* Live Status Hero Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 text-white p-5 sm:p-7 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-bold mb-2.5">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{isTakeaway ? 'Takeaway Picked Up' : 'Dining Complete'}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                    <span>Live Kitchen Tracking</span>
                  </>
                )}
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                {isCancelled
                  ? 'Order Cancelled'
                  : isCompleted
                  ? (isTakeaway ? 'Takeaway Picked Up' : 'Dining Completed')
                  : order.status === 'READY'
                  ? (isTakeaway ? 'Ready for Pickup!' : 'Your Food is Ready!')
                  : order.status === 'PREPARING'
                  ? 'Cooking Your Meal'
                  : 'Order Confirmed'}
              </h1>
              {isCompleted ? (
                <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                  {isTakeaway
                    ? 'Takeaway order packed & handed over. Thank you for dining with Lowkey Cafe!'
                    : 'All dishes served & dining settled. Thank you for dining with Lowkey Cafe!'}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Estimated preparation: <strong className="text-yellow-400 font-bold">{order.estimatedPrepMinutes} minutes</strong>
                </p>
              )}
            </div>

            {/* Quick Actions (Call Waiter only for Dine-in tables; customer cannot advance status) */}
            {!isCompleted && !isCancelled && !isTakeaway && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCallWaiter(true)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition-colors active:scale-95"
                >
                  <Bell className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Call Waiter</span>
                </button>
              </div>
            )}
          </div>

          {/* Stepper Timeline */}
          {!isCancelled && (
            <div className="mt-7 pt-6 border-t border-neutral-800/80">
              <div className="relative flex justify-between">
                
                {/* Connecting Line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-800 -z-0">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                    style={{
                      width: isCompleted
                        ? '100%'
                        : `${Math.max(0, (currentStepIdx / (statusSteps.length - 1)) * 100)}%`,
                    }}
                  ></div>
                </div>

                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = isCompleted || currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx && !isCompleted;

                  return (
                    <div key={step.status} className="flex flex-col items-center relative z-10 text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-yellow-400 text-black font-black shadow-md shadow-yellow-400/30'
                            : isCurrent
                            ? 'bg-yellow-400 text-black font-black ring-4 ring-yellow-400/25'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold mt-2 max-w-[60px] sm:max-w-none leading-tight ${
                          isCurrent
                            ? 'text-yellow-400 font-extrabold'
                            : isDone
                            ? 'text-neutral-200'
                            : 'text-neutral-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Items Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 sm:p-7 rounded-3xl shadow-xl space-y-4 text-white">
          <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
            <h3 className="font-display font-extrabold text-base text-white">
              Ordered Dishes ({order.items.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Diner: <strong className="text-yellow-400">{order.customerName}</strong>
            </span>
          </div>

          <div className="divide-y divide-neutral-800/80">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/60 overflow-hidden shrink-0">
                    <img
                      src={item.foodItemImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                      alt={item.foodItemName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">
                      {item.foodItemName}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Qty: {item.quantity} • {item.selectedPortion} • {item.selectedSpiceLevel}
                    </p>
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[10px] text-yellow-400 font-medium">
                        {item.customizations.map((c) => `+${c.optionName}`).join(', ')}
                      </p>
                    )}
                    {item.removedIngredients && (
                      <p className="text-[10px] text-rose-400 italic">
                        No: {item.removedIngredients}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-sm text-yellow-400 font-mono">
                  ₹{item.subtotal}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-200">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({order.appliedCouponCode})</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes (5% GST)</span>
              <span className="text-neutral-200">₹{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge {isTakeaway ? '(0% Takeaway)' : '(5%)'}</span>
              <span className="text-neutral-200">₹{order.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white pt-2.5 border-t border-neutral-800">
              <span>Grand Total</span>
              <span className="font-display font-black text-yellow-400 text-lg">
                ₹{order.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Billing & Settlement Actions */}
        {bill && (
          <div className="bg-neutral-900/90 border border-yellow-400/30 p-5 sm:p-7 rounded-3xl shadow-xl shadow-yellow-400/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="font-display font-extrabold text-base text-white">
                  Digital Bill: #{bill.billNumber}
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1.5">
                <span>Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    bill.status === 'PAID'
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-500/15 border border-amber-500/40 text-yellow-300'
                  }`}
                >
                  {bill.status}
                </span>
                <span>{bill.status === 'PAID' ? '(Thank you!)' : `• Amount Due: ₹${bill.finalPayableAmount}`}</span>
              </p>
            </div>

            <div className="w-full sm:w-auto">
              {bill.status !== 'PAID' ? (
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                  <button
                    onClick={() => setShowSplit(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span>Split Bill</span>
                  </button>

                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/20 transition-all active:scale-95"
                  >
                    <span>Pay Bill (₹{bill.finalPayableAmount})</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full">
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"
                  >
                    <Receipt className="w-4 h-4 text-yellow-400" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    onClick={() => downloadReceiptPdf(bill)}
                    className="px-3.5 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/20 active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => setShowReview(true)}
                    className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-yellow-300 border border-neutral-800 hover:border-yellow-400/40 text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>Rate Dining</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showPayment && bill && (
        <PaymentModal
          bill={bill}
          onClose={() => setShowPayment(false)}
          onPaymentSuccess={(paidBill) => {
            setBill(paidBill);
            setShowPayment(false);
            setShowReceipt(true);
          }}
        />
      )}

      {showSplit && bill && (
        <SplitBillModal
          bill={bill}
          onClose={() => setShowSplit(false)}
          onSplitUpdated={(updatedBill) => setBill(updatedBill)}
        />
      )}

      {showReceipt && bill && (
        <ReceiptModal
          bill={bill}
          onClose={() => setShowReceipt(false)}
          onOpenReview={() => setShowReview(true)}
        />
      )}

      {showReview && (
        <ReviewModal
          orderCode={order.orderCode}
          onClose={() => setShowReview(false)}
        />
      )}

      {showCallWaiter && (
        <CallWaiterModal
          tableNumber={order.tableNumber}
          onClose={() => setShowCallWaiter(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default OrderTracking;
