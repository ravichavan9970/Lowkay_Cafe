import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderApi, couponApi, loyaltyApi } from '../services/api';
import { X, Trash2, Plus, Minus, Tag, Gift, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    items,
    tableNumber,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxAmount,
    serviceCharge,
    discountAmount,
    grandTotal,
    appliedCoupon,
    setAppliedCoupon,
    loyaltyDiscount,
    setLoyaltyDiscount,
    setActiveOrderCode,
  } = useCart();

  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('Guest Diner');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Loyalty points state
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [isCheckingLoyalty, setIsCheckingLoyalty] = useState(false);

  // Submitting order
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await couponApi.validateCoupon(couponInput.trim().toUpperCase());
      const data = res.data;
      if (data.valid) {
        const disc = Math.min((subtotal * data.discountPercentage) / 100, data.maxDiscountAmount || 150);
        setAppliedCoupon({ code: data.code, discount: disc });
        setCouponSuccess(`Coupon applied! Saved ₹${disc.toFixed(2)}`);
      } else {
        setCouponError('Invalid or expired coupon code.');
      }
    } catch {
      setCouponError('Could not apply coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckLoyalty = async () => {
    if (!loyaltyPhone.trim()) return;
    setIsCheckingLoyalty(true);
    try {
      const res = await loyaltyApi.getBalance(loyaltyPhone.trim());
      setAvailablePoints(res.data.balance);
    } catch {
      setAvailablePoints(0);
    } finally {
      setIsCheckingLoyalty(false);
    }
  };

  const handleRedeemLoyalty = async () => {
    if (!availablePoints || availablePoints <= 0) return;
    try {
      const res = await loyaltyApi.redeemPoints(loyaltyPhone, availablePoints);
      setLoyaltyDiscount(res.data.discount);
      setAvailablePoints(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        tableNumber: tableNumber || 1,
        customerName: customerName.trim() || 'Guest Diner',
        customerPhone: customerPhone.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        items: items.map((item) => ({
          foodItemId: item.foodItem.id,
          quantity: item.quantity,
          selectedPortion: item.selectedPortion,
          selectedSpiceLevel: item.selectedSpiceLevel,
          removedIngredients: item.removedIngredients,
          itemNotes: item.itemNotes,
          customizations: item.customizations,
        })),
      };

      const res = await orderApi.createOrder(payload);
      const newOrder = res.data;

      // Clear cart & set active order
      clearCart();
      setActiveOrderCode(newOrder.orderCode);
      onClose();

      // Navigate to order tracking
      navigate(`/order-tracking/${newOrder.orderCode}`);
    } catch (err) {
      console.error('Failed to submit order', err);
      alert('Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-950 text-white border-l border-neutral-800 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-black text-white border-b border-neutral-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-black text-lg text-white">
                Your Order
              </h2>
              {tableNumber && (
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 text-[11px] font-bold">
                  Table {tableNumber}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="py-24 text-center text-neutral-500">
                <p className="text-sm font-bold text-neutral-300">Your cart is empty.</p>
                <p className="text-xs text-neutral-500 mt-1">Explore our chef special menu and add delicious food!</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-white">
                        {item.foodItem.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {item.selectedPortion} • {item.selectedSpiceLevel}
                      </p>
                    </div>
                    <span className="font-black text-sm text-yellow-400">
                      ₹{item.lineTotal}
                    </span>
                  </div>

                  {/* Customizations tags */}
                  {item.customizations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.customizations.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-black/60 text-yellow-300 border border-neutral-800 px-1.5 py-0.5 rounded"
                        >
                          +{c.optionName} (₹{c.additionalPrice})
                        </span>
                      ))}
                    </div>
                  )}

                  {item.removedIngredients && (
                    <p className="text-[10px] text-rose-400 italic">
                      No: {item.removedIngredients}
                    </p>
                  )}

                  {/* Quantity and Remove */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 mt-1">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 text-xs transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 bg-black border border-neutral-800 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-800 text-neutral-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs px-1 text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-800 text-neutral-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {items.length > 0 && (
              <div className="space-y-4 pt-2">
                {/* Coupon Code Section */}
                <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-yellow-400" /> Have a Coupon?
                    </span>
                    <span className="text-[10px] text-neutral-400">Try LOWKEY20</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white uppercase font-mono tracking-wider focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                      className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black disabled:opacity-50"
                    >
                      {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>

                  {couponSuccess && (
                    <p className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {couponSuccess}
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-400 font-medium mt-2">
                      {couponError}
                    </p>
                  )}
                </div>

                {/* Loyalty Points Section */}
                <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-sm">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                    <Gift className="w-3.5 h-3.5 text-yellow-400" /> Redeem Reward Points
                  </span>
                  
                  {availablePoints === null ? (
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={loyaltyPhone}
                        onChange={(e) => setLoyaltyPhone(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white focus:outline-none focus:border-yellow-400"
                      />
                      <button
                        onClick={handleCheckLoyalty}
                        disabled={isCheckingLoyalty}
                        className="px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs"
                      >
                        {isCheckingLoyalty ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">
                          {availablePoints} points available
                        </span>
                        <p className="text-[10px] text-neutral-400">Worth ₹{availablePoints} discount</p>
                      </div>
                      {availablePoints > 0 ? (
                        <button
                          onClick={handleRedeemLoyalty}
                          className="px-3 py-1.5 bg-yellow-400 text-black rounded-lg text-xs font-black"
                        >
                          Redeem All
                        </button>
                      ) : (
                        <span className="text-neutral-500 text-xs">No points</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Diner Information */}
                <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-white block">
                    Diner Information
                  </span>
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number for bill / receipt"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <textarea
                    rows={2}
                    placeholder="Special cooking notes or allergies..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white focus:outline-none focus:border-yellow-400 resize-none"
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Checkout & Bill Summary Bar */}
          {items.length > 0 && (
            <div className="p-4 bg-black border-t border-neutral-800 shadow-lg space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxes (5% GST)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (5%)</span>
                  <span>₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-neutral-800">
                  <span>Total Amount</span>
                  <span className="text-yellow-400 font-display font-black text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/25 transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Send to Kitchen</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
