import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, FoodItem, CartCustomization, SpiceLevel } from '../types';

interface CartContextType {
  items: CartItem[];
  tableNumber: number | null;
  tableToken: string | null;
  setTableInfo: (tableNum: number, token?: string) => void;
  addItem: (
    foodItem: FoodItem,
    portion: string,
    spice: SpiceLevel,
    customizations: CartCustomization[],
    removedIngredients?: string,
    notes?: string,
    quantity?: number
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  appliedCoupon: any | null;
  setAppliedCoupon: (coupon: any | null) => void;
  loyaltyDiscount: number;
  setLoyaltyDiscount: (discount: number) => void;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  grandTotal: number;
  activeOrderCode: string | null;
  setActiveOrderCode: (code: string | null) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('lowkey_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumber] = useState<number | null>(() => {
    const saved = localStorage.getItem('lowkey_table');
    return saved ? parseInt(saved, 10) : 5; // default table 5 if not in url
  });

  const [tableToken, setTableToken] = useState<string | null>(() => {
    return localStorage.getItem('lowkey_table_token');
  });

  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);
  const [activeOrderCode, setActiveOrderCode] = useState<string | null>(() => {
    return localStorage.getItem('lowkey_active_order');
  });

  useEffect(() => {
    localStorage.setItem('lowkey_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (activeOrderCode) {
      localStorage.setItem('lowkey_active_order', activeOrderCode);
    } else {
      localStorage.removeItem('lowkey_active_order');
    }
  }, [activeOrderCode]);

  const setTableInfo = (num: number, token?: string) => {
    setTableNumber(num);
    localStorage.setItem('lowkey_table', num.toString());
    if (token) {
      setTableToken(token);
      localStorage.setItem('lowkey_table_token', token);
    }
  };

  const addItem = (
    foodItem: FoodItem,
    portion: string,
    spice: SpiceLevel,
    customizations: CartCustomization[],
    removedIngredients?: string,
    notes?: string,
    quantity = 1
  ) => {
    const extraPrice = customizations.reduce((sum, c) => sum + (c.additionalPrice || 0), 0);
    const unitTotal = foodItem.price + extraPrice;
    const lineTotal = unitTotal * quantity;

    const cartId = `${foodItem.id}_${portion}_${spice}_${customizations.map(c => c.optionId).sort().join('-')}_${removedIngredients || ''}_${notes || ''}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === cartId);
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + quantity;
        next[existingIdx].quantity = newQty;
        next[existingIdx].lineTotal = next[existingIdx].unitTotal * newQty;
        return next;
      } else {
        const newItem: CartItem = {
          id: cartId,
          foodItem,
          quantity,
          selectedPortion: portion,
          selectedSpiceLevel: spice,
          removedIngredients,
          itemNotes: notes,
          customizations,
          unitTotal,
          lineTotal,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((i) => {
          if (i.id === cartItemId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...i,
              quantity: nextQty,
              lineTotal: i.unitTotal * nextQty,
            };
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setLoyaltyDiscount(0);
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= (appliedCoupon.minOrderAmount || 0)) {
    const rawDisc = (subtotal * appliedCoupon.discountPercentage) / 100;
    discountAmount = appliedCoupon.maxDiscountAmount && rawDisc > appliedCoupon.maxDiscountAmount
      ? appliedCoupon.maxDiscountAmount
      : rawDisc;
  }
  discountAmount += loyaltyDiscount;

  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxable * 0.05 * 100) / 100;
  const serviceCharge = Math.round(taxable * 0.05 * 100) / 100;
  const grandTotal = Math.round((taxable + taxAmount + serviceCharge) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        tableNumber,
        tableToken,
        setTableInfo,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        itemCount,
        appliedCoupon,
        setAppliedCoupon,
        loyaltyDiscount,
        setLoyaltyDiscount,
        taxAmount,
        serviceCharge,
        discountAmount,
        grandTotal,
        activeOrderCode,
        setActiveOrderCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
