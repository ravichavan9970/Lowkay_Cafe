import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi, billingApi, kitchenApi } from '../services/api';
import { Order, Bill, OrderStatus } from '../types';
import wsService from '../services/websocket';
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
  Sparkles,
} from 'lucide-react';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'NEW_ORDER', label: 'Order Received', desc: 'Sent straight to the kitchen line', icon: Clock },
  { status: 'ACCEPTED', label: 'Order Accepted', desc: 'Kitchen acknowledged ticket', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Preparing Food', desc: 'Chef is crafting your dishes', icon: ChefHat },
  { status: 'READY', label: 'Food Ready', desc: 'Plated and ready for server pickup', icon: Bell },
  { status: 'SERVED', label: 'Served at Table', desc: 'Bon appétit! Enjoy your meal', icon: CheckCircle2 },
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

    // 1. Live auto-polling from cloud (syncs across Kitchen KDS and customer's mobile phone)
    const pollId = setInterval(() => {
      if (orderCode) {
        orderApi.trackOrder(orderCode)
          .then((res) => {
            if (res.data) {
              setOrder(res.data);
              if (res.data.id) {
                billingApi.getBillForOrder(res.data.id)
                  .then((bRes) => setBill(bRes.data))
                  .catch(() => {});
              }
            }
          })
          .catch(() => {});
      }
    }, 3000);

    // 2. Subscribe to live WebSocket updates for this specific order
    const subId = wsService.subscribe(`/topic/orders/${orderCode}`, (updatedOrder: Order) => {
      console.log('⚡ Live Order Update received via WebSocket:', updatedOrder);
      setOrder(updatedOrder);
      if (updatedOrder.id) {
        billingApi.getBillForOrder(updatedOrder.id)
          .then((bRes) => setBill(bRes.data))
          .catch(() => {});
      }
    });

    return () => {
      clearInterval(pollId);
      wsService.unsubscribe(subId);
    };
  }, [orderCode]);

  // Fast-forward next status for demo simulation
  const handleFastForwardStatus = async () => {
    if (!order) return;
    let nextStatus: OrderStatus = 'READY';
    if (order.status === 'NEW_ORDER' || order.status === 'ACCEPTED') {
      nextStatus = 'PREPARING';
    } else if (order.status === 'PREPARING') {
      nextStatus = 'READY';
    } else if (order.status === 'READY') {
      nextStatus = 'SERVED';
    } else if (order.status === 'SERVED') {
      nextStatus = 'COMPLETED';
    }

    try {
      const res = await kitchenApi.updateOrderStatus(order.id, nextStatus);
      if (res.data) {
        setOrder(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-advance simulation after 35s in PREPARING so diner is never stuck
  useEffect(() => {
    if (order?.status === 'PREPARING') {
      const timer = setTimeout(() => {
        handleFastForwardStatus();
      }, 35000);
      return () => clearTimeout(timer);
    }
  }, [order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="font-display font-extrabold text-2xl text-stone-900">Order Not Found</h2>
          <p className="text-xs text-stone-500 mt-2">Could not locate order code {orderCode}</p>
          <Link to="/" className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold">
            Back to Menu
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Determine current step index
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.status === order.status);
  const isCompleted = order.status === 'COMPLETED' || (bill && bill.status === 'PAID');
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Top Back Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            to={order.tableNumber === 0 ? '/takeaway' : `/table/${order.tableNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Add More Items</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">
              {order.tableNumber === 0 ? '🥡 Takeaway / Pickup' : `Table #${order.tableNumber}`}
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
              {order.orderCode}
            </span>
          </div>
        </div>

        {/* Live Status Hero Card */}
        <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold mb-2">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Live Kitchen Tracking</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                {isCancelled
                  ? 'Order Cancelled'
                  : isCompleted
                  ? 'Dining Completed'
                  : order.status === 'READY'
                  ? 'Your Food is Ready!'
                  : order.status === 'PREPARING'
                  ? 'Cooking Your Meal'
                  : 'Order Confirmed'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Estimated preparation: <strong>{order.estimatedPrepMinutes} minutes</strong>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {!isCompleted && !isCancelled && (
                <button
                  onClick={handleFastForwardStatus}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  title="Simulate next kitchen step"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {order.status === 'PREPARING'
                      ? 'Mark Food Ready'
                      : order.status === 'READY'
                      ? 'Mark as Served'
                      : 'Advance Status'}
                  </span>
                </button>
              )}

              <button
                onClick={() => setShowCallWaiter(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center gap-1.5 border border-stone-700 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-brand-400" />
                <span>Call Waiter</span>
              </button>
            </div>
          </div>

          {/* Stepper Timeline */}
          {!isCancelled && (
            <div className="mt-8 pt-6 border-t border-stone-800">
              <div className="relative flex justify-between">
                
                {/* Connecting Line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-800 -z-0">
                  <div
                    className="h-full bg-brand-500 transition-all duration-500"
                    style={{
                      width: `${Math.max(0, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100)}%`,
                    }}
                  ></div>
                </div>

                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStepIdx >= idx || isCompleted;
                  const isCurrent = currentStepIdx === idx && !isCompleted;

                  return (
                    <div key={step.status} className="flex flex-col items-center relative z-10 text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-brand-500 text-stone-950 font-bold'
                            : isCurrent
                            ? 'bg-amber-400 text-stone-950 font-black ring-4 ring-amber-400/20'
                            : 'bg-stone-800 text-stone-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold mt-2 max-w-[60px] sm:max-w-none leading-tight ${
                          isCurrent
                            ? 'text-amber-400'
                            : isDone
                            ? 'text-stone-300'
                            : 'text-stone-600'
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
        <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-display font-extrabold text-base text-stone-900">
              Ordered Dishes ({order.items.length})
            </h3>
            <span className="text-xs text-stone-500">
              Diner: <strong>{order.customerName}</strong>
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                    <img
                      src={item.foodItemImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                      alt={item.foodItemName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-stone-900">
                      {item.foodItemName}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Qty: {item.quantity} • {item.selectedPortion} • {item.selectedSpiceLevel}
                    </p>
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[10px] text-brand-700">
                        {item.customizations.map((c) => `+${c.optionName}`).join(', ')}
                      </p>
                    )}
                    {item.removedIngredients && (
                      <p className="text-[10px] text-rose-600 italic">
                        No: {item.removedIngredients}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-sm text-stone-900">
                  ₹{item.subtotal}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({order.appliedCouponCode})</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes (5% GST)</span>
              <span>₹{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (5%)</span>
              <span>₹{order.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-200">
              <span>Grand Total</span>
              <span className="font-display font-black text-brand-600">
                ₹{order.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Billing & Settlement Actions */}
        {bill && (
          <div className="bg-gradient-to-tr from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-700" />
                <h3 className="font-display font-extrabold text-base text-stone-900">
                  Digital Bill: #{bill.billNumber}
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Status:{' '}
                <strong
                  className={
                    bill.status === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'
                  }
                >
                  {bill.status}
                </strong>
                {bill.status === 'PAID' ? ' (Thank you!)' : ` • Amount Due: ₹${bill.finalPayableAmount}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {bill.status !== 'PAID' ? (
                <>
                  <button
                    onClick={() => setShowSplit(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Users className="w-4 h-4 text-stone-600" />
                    <span>Split Bill</span>
                  </button>

                  <button
                    onClick={() => setShowPayment(true)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-brand-600 hover:to-amber-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                  >
                    <span>Pay Bill (₹{bill.finalPayableAmount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Receipt className="w-4 h-4 text-brand-600" />
                    <span>View Receipt & PDF</span>
                  </button>

                  <button
                    onClick={() => setShowReview(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-600 hover:to-brand-600 text-stone-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Star className="w-4 h-4 fill-stone-950" />
                    <span>Rate Dining</span>
                  </button>
                </>
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
