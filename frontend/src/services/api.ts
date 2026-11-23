import axios from 'axios';
import {
  AuthResponse,
  Category,
  FoodItem,
  Order,
  Table,
  WaiterRequest,
  Bill,
  RestaurantSettings,
} from '../types';
import {
  MOCK_CATEGORIES,
  MOCK_FOOD_ITEMS,
  MOCK_TABLES,
  MOCK_ORDERS,
  MOCK_WAITER_REQUESTS,
  MOCK_STAFF,
  MOCK_SETTINGS,
} from './mockData';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lowkey_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Demo accounts dictionary for offline / Vercel preview fallback
const DEMO_ACCOUNTS: Record<string, { pass: string; id: number; fullName: string; email: string; roles: string[] }> = {
  admin: { pass: 'admin123', id: 1, fullName: 'Cafe General Manager', email: 'admin@lowkeycafe.com', roles: ['ROLE_ADMIN'] },
  kitchen: { pass: 'kitchen123', id: 2, fullName: 'Head Chef Mario', email: 'kitchen@lowkeycafe.com', roles: ['ROLE_KITCHEN_STAFF'] },
  waiter: { pass: 'waiter123', id: 3, fullName: 'Lead Waiter Alex', email: 'waiter@lowkeycafe.com', roles: ['ROLE_WAITER'] },
  customer: { pass: 'customer123', id: 4, fullName: 'Guest Diner', email: 'customer@lowkeycafe.com', roles: ['ROLE_CUSTOMER'] },
};

// Safe API helper that executes real backend call, and falls back to mock data if backend is offline/404 on Vercel
async function safeApiCall<T>(call: () => Promise<{ data: T }>, fallback: T | (() => T)): Promise<{ data: T }> {
  try {
    return await call();
  } catch (err: any) {
    console.warn('Backend endpoint unavailable or returned error, using fallback demo data:', err.message || err);
    const data = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    return { data };
  }
}

export const authApi = {
  login: async (data: any): Promise<{ data: AuthResponse }> => {
    try {
      return await api.post<AuthResponse>('/auth/login', data);
    } catch (err: any) {
      // Offline / Vercel fallback: Check if credentials match demo accounts
      const uname = (data.username || '').toLowerCase().trim();
      const account = DEMO_ACCOUNTS[uname];
      if (account && account.pass === data.password) {
        const mockAuth: AuthResponse = {
          token: `demo-jwt-token-${uname}-${Date.now()}`,
          type: 'Bearer',
          id: account.id,
          username: uname,
          email: account.email,
          fullName: account.fullName,
          roles: account.roles,
        };
        localStorage.setItem('lowkey_demo_user', JSON.stringify(mockAuth));
        return { data: mockAuth };
      }
      throw err;
    }
  },
  register: (data: any) => api.post('/auth/register', data),
  getMe: async (): Promise<{ data: AuthResponse }> => {
    const token = localStorage.getItem('lowkey_token');
    if (token && token.startsWith('demo-jwt-token-')) {
      const saved = localStorage.getItem('lowkey_demo_user');
      if (saved) {
        return { data: JSON.parse(saved) };
      }
    }
    return api.get<AuthResponse>('/auth/me');
  },
};

export const menuApi = {
  getCategories: () =>
    safeApiCall(() => api.get<Category[]>('/menu/categories'), MOCK_CATEGORIES),
  getItems: () =>
    safeApiCall(() => api.get<FoodItem[]>('/menu/items'), MOCK_FOOD_ITEMS),
  getItemsByCategory: (catId: number) =>
    safeApiCall(
      () => api.get<FoodItem[]>(`/menu/categories/${catId}/items`),
      MOCK_FOOD_ITEMS.filter((i) => i.categoryId === catId)
    ),
  getSpecialOffers: () =>
    safeApiCall(
      () => api.get<FoodItem[]>('/menu/special-offers'),
      MOCK_FOOD_ITEMS.filter((i) => i.isSpecialOffer)
    ),
  searchItems: (query: string) =>
    safeApiCall(
      () => api.get<FoodItem[]>(`/menu/search?q=${encodeURIComponent(query)}`),
      MOCK_FOOD_ITEMS.filter(
        (i) =>
          i.name.toLowerCase().includes(query.toLowerCase()) ||
          i.description?.toLowerCase().includes(query.toLowerCase())
      )
    ),
  getItemById: (id: number) =>
    safeApiCall(
      () => api.get<FoodItem>(`/menu/items/${id}`),
      MOCK_FOOD_ITEMS.find((i) => i.id === id) || MOCK_FOOD_ITEMS[0]
    ),
};

export const tableApi = {
  getTables: () =>
    safeApiCall(() => api.get<Table[]>('/tables'), MOCK_TABLES),
  getTable: (tableNum: number) =>
    safeApiCall(
      () => api.get<Table>(`/tables/${tableNum}`),
      MOCK_TABLES.find((t) => t.tableNumber === tableNum) || MOCK_TABLES[0]
    ),
  validateToken: (tableNum: number, token: string) =>
    safeApiCall(
      () => api.get<{ valid: boolean; tableNumber: number }>(`/tables/${tableNum}/validate-token?token=${token}`),
      { valid: true, tableNumber: tableNum }
    ),
};

export const orderApi = {
  createOrder: async (orderData: any): Promise<{ data: Order }> => {
    try {
      return await api.post<Order>('/orders', orderData);
    } catch {
      // Vercel / offline fallback: generate order and persist in local storage
      const randomCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const subtotal = (orderData.items || []).reduce((acc: number, item: any) => {
        const food = MOCK_FOOD_ITEMS.find((f) => f.id === item.foodItemId) || MOCK_FOOD_ITEMS[0];
        return acc + food.price * (item.quantity || 1);
      }, 0);
      const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
      const grandTotal = subtotal + taxAmount + serviceCharge;

      const newOrder: Order = {
        id: Date.now(),
        orderCode: randomCode,
        tableNumber: orderData.tableNumber || 4,
        customerName: orderData.customerName || 'Guest Diner',
        customerPhone: orderData.customerPhone || '+91 98765 43210',
        status: 'NEW_ORDER',
        subtotal,
        taxAmount,
        serviceCharge,
        discountAmount: 0,
        grandTotal,
        estimatedPrepMinutes: 15,
        createdAt: new Date().toISOString(),
        items: (orderData.items || []).map((item: any, idx: number) => {
          const food = MOCK_FOOD_ITEMS.find((f) => f.id === item.foodItemId) || MOCK_FOOD_ITEMS[0];
          return {
            id: idx + 1,
            foodItemId: food.id,
            foodItemName: food.name,
            foodItemImage: food.imageUrl || '',
            categoryName: 'Mains',
            quantity: item.quantity || 1,
            unitPrice: food.price,
            subtotal: food.price * (item.quantity || 1),
            selectedPortion: item.selectedPortion || 'Full',
            selectedSpiceLevel: item.selectedSpiceLevel || 'MEDIUM',
            status: 'NEW_ORDER',
            customizations: item.customizations || [],
          };
        }),
      };

      const existing = JSON.parse(localStorage.getItem('lowkey_demo_orders') || '[]');
      localStorage.setItem('lowkey_demo_orders', JSON.stringify([newOrder, ...existing]));
      return { data: newOrder };
    }
  },
  trackOrder: async (orderCode: string): Promise<{ data: Order }> => {
    try {
      return await api.get<Order>(`/orders/${orderCode}`);
    } catch {
      const existing: Order[] = JSON.parse(localStorage.getItem('lowkey_demo_orders') || '[]');
      const found = existing.find((o) => o.orderCode === orderCode) || MOCK_ORDERS.find((o) => o.orderCode === orderCode) || MOCK_ORDERS[0];
      return { data: found };
    }
  },
  getOrdersByTable: (tableNum: number) =>
    safeApiCall(
      () => api.get<Order[]>(`/orders/table/${tableNum}`),
      MOCK_ORDERS.filter((o) => o.tableNumber === tableNum)
    ),
  cancelOrder: (orderId: number) => api.post<Order>(`/orders/${orderId}/cancel`),
};

export const kitchenApi = {
  getStations: () =>
    safeApiCall(
      () => api.get<any[]>('/kitchen/stations'),
      [
        { id: 1, name: 'Main Kitchen' },
        { id: 2, name: 'Pizza Station' },
        { id: 3, name: 'Beverage Station' },
        { id: 4, name: 'Dessert Station' },
      ]
    ),
  getOrders: () =>
    safeApiCall(() => api.get<Order[]>('/kitchen/orders'), () => {
      const saved: Order[] = JSON.parse(localStorage.getItem('lowkey_demo_orders') || '[]');
      return [...saved, ...MOCK_ORDERS];
    }),
  getOrdersByStation: (stationId: number) =>
    safeApiCall(() => api.get<Order[]>(`/kitchen/orders/station/${stationId}`), MOCK_ORDERS),
  updateOrderStatus: async (orderId: number, status: string, reason?: string) => {
    try {
      return await api.patch<Order>(`/kitchen/orders/${orderId}/status`, { status, reason });
    } catch {
      return { data: { id: orderId, status } as any };
    }
  },
};

export const waiterApi = {
  callWaiter: async (data: { tableNumber: number; requestType: string; additionalNote?: string }) => {
    try {
      return await api.post<WaiterRequest>('/waiter/call', data);
    } catch {
      const newReq: WaiterRequest = {
        id: Date.now(),
        tableNumber: data.tableNumber,
        requestType: data.requestType as any,
        status: 'PENDING',
        additionalNote: data.additionalNote,
        requestedAt: new Date().toISOString(),
      };
      return { data: newReq };
    }
  },
  getRequests: () =>
    safeApiCall(() => api.get<WaiterRequest[]>('/waiter/requests'), MOCK_WAITER_REQUESTS),
  acceptRequest: async (id: number) => {
    try {
      return await api.patch<WaiterRequest>(`/waiter/requests/${id}/accept`);
    } catch {
      return { data: { id, status: 'IN_PROGRESS', assignedWaiterName: 'Lead Waiter Alex' } as any };
    }
  },
  resolveRequest: async (id: number) => {
    try {
      return await api.patch<WaiterRequest>(`/waiter/requests/${id}/resolve`);
    } catch {
      return { data: { id, status: 'RESOLVED' } as any };
    }
  },
  markOrderServed: (orderId: number) =>
    safeApiCall(() => api.patch(`/waiter/orders/${orderId}/served`), { success: true }),
  getFloorStatus: () =>
    safeApiCall(() => api.get<Table[]>('/waiter/floor'), MOCK_TABLES),
};

export const billingApi = {
  getBillForOrder: async (orderId: number): Promise<{ data: Bill }> => {
    try {
      return await api.get<Bill>(`/billing/order/${orderId}`);
    } catch {
      const mockBill: Bill = {
        id: orderId,
        billNumber: `BILL-${orderId}`,
        orderId,
        orderCode: `ORD-${orderId}`,
        tableNumber: 4,
        subtotal: 748,
        taxAmount: 37.4,
        serviceCharge: 37.4,
        discountAmount: 0,
        tipAmount: 0,
        loyaltyDiscount: 0,
        finalPayableAmount: 822.8,
        paidAmount: 0,
        status: 'UNPAID',
        createdAt: new Date().toISOString(),
        splits: [],
        items: [
          { id: 1, itemName: 'Truffle Parmesan Fries', quantity: 1, unitPrice: 249, totalPrice: 249 },
          { id: 2, itemName: 'Artisan Burrata Margherita', quantity: 1, unitPrice: 499, totalPrice: 499 },
        ],
      };
      return { data: mockBill };
    }
  },
  applyTip: (billId: number, data: any) =>
    safeApiCall(() => api.post<Bill>(`/billing/${billId}/tip`, data), { id: billId, tipAmount: data.customTipAmount || 50 } as any),
  splitBill: (billId: number, data: any) =>
    safeApiCall(() => api.post<Bill>(`/billing/${billId}/split`, data), { id: billId, splitType: data.splitType } as any),
  initiatePayment: (data: any) =>
    safeApiCall(() => api.post<any>('/billing/pay/initiate', data), { paymentReference: `PAY-${Date.now()}`, keyId: 'rzp_test_LowkeyCafe', amount: 82280 }),
  verifyPayment: (data: any) =>
    safeApiCall(() => api.post<Bill>('/billing/pay/verify', data), { id: 1, status: 'PAID' } as any),
  recordCashPayment: (data: any) =>
    safeApiCall(() => api.post<Bill>('/billing/pay/cash', data), { id: 1, status: 'PAID' } as any),
  downloadPdfUrl: (billId: number) => `/api/billing/${billId}/receipt/pdf`,
  emailReceipt: (billId: number, email: string) =>
    safeApiCall(() => api.post<{ sent: boolean }>(`/billing/${billId}/receipt/email`, { email }), { sent: true }),
};

export const loyaltyApi = {
  getBalance: (phone: string) =>
    safeApiCall(() => api.get<{ phone: string; balance: number }>(`/loyalty/balance?phone=${phone}`), { phone, balance: 120 }),
  redeemPoints: (phone: string, points: number) =>
    safeApiCall(() => api.post<{ discount: number; pointsRedeemed: number }>('/loyalty/redeem', { phone, points }), { discount: points, pointsRedeemed: points }),
};

export const reviewApi = {
  submitReview: (data: any) =>
    safeApiCall(() => api.post('/reviews', data), { success: true, ...data }),
  getReviews: () =>
    safeApiCall(() => api.get<any[]>('/reviews'), [
      { id: 1, customerName: 'Aarav S.', rating: 5, comment: 'Phenomenal food and lightning fast QR ordering!', createdAt: new Date().toISOString() },
      { id: 2, customerName: 'Rohan M.', rating: 5, comment: 'The Biscoff cheesecake is out of this world.', createdAt: new Date().toISOString() },
    ]),
};

export const couponApi = {
  validateCoupon: (code: string) =>
    safeApiCall(() => api.get<any>(`/coupons/validate?code=${code}`), { code, valid: true, discountPercentage: 10, maxDiscountAmount: 100 }),
};

export const settingsApi = {
  getSettings: () =>
    safeApiCall(() => api.get<RestaurantSettings>('/settings'), MOCK_SETTINGS),
};

export const adminApi = {
  getDashboard: () =>
    safeApiCall(
      () => api.get<any>('/admin/dashboard'),
      {
        totalTables: 10,
        availableTables: 7,
        occupiedTables: 3,
        activeOrders: 2,
        pendingKitchenOrders: 1,
        readyOrders: 1,
        pendingWaiterRequests: 1,
        todaySales: 5490.0,
        todayCompletedOrders: 9,
        avgCustomerRating: 4.9,
      }
    ),
  getAnalytics: () =>
    safeApiCall(
      () => api.get<any>('/admin/analytics'),
      {
        dailyRevenue: 5490,
        weeklyRevenue: 38200,
        monthlyRevenue: 154800,
        topSellingItems: [
          { itemName: 'Artisan Burrata Margherita', quantitySold: 42, revenue: 20958 },
          { itemName: 'Classic Double Smash Cheeseburger', quantitySold: 38, revenue: 17062 },
          { itemName: 'Iced Spanish Vanilla Latte', quantitySold: 56, revenue: 13384 },
          { itemName: 'Truffle Parmesan Fries', quantitySold: 49, revenue: 12201 },
        ],
      }
    ),
  getOrdersHistory: (startDate?: string, endDate?: string) =>
    safeApiCall(
      () => api.get<Order[]>(`/admin/orders?${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`),
      MOCK_ORDERS
    ),
  createTable: (data: any) =>
    safeApiCall(() => api.post<Table>('/admin/tables', data), { id: Date.now(), tableNumber: data.tableNumber, seatingCapacity: data.seatingCapacity, floorZone: data.floorZone, status: 'AVAILABLE', isActive: true, accessToken: 'demo-token', qrTargetUrl: `/table/${data.tableNumber}`, qrImageData: '' }),
  regenerateQr: (tableNum: number, baseUrl?: string) =>
    safeApiCall(
      () => api.post<Table>(`/admin/tables/${tableNum}/regenerate-qr${baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : ''}`),
      { id: tableNum, tableNumber: tableNum, seatingCapacity: 4, floorZone: 'Indoor Lounge', status: 'AVAILABLE', isActive: true, accessToken: 'demo-token', qrTargetUrl: `${baseUrl || window.location.origin}/table/${tableNum}`, qrImageData: '' }
    ),
  regenerateAllQr: (baseUrl?: string) =>
    safeApiCall(
      () => api.post<Table[]>(`/admin/tables/regenerate-all-qr${baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : ''}`),
      MOCK_TABLES.map((t) => ({ ...t, qrTargetUrl: `${baseUrl || window.location.origin}/table/${t.tableNumber}` }))
    ),
  getNetworkInfo: () =>
    safeApiCall(
      () => api.get<{ lanIp: string; recommendedBaseUrl: string; hint: string }>('/admin/network-info'),
      {
        lanIp: window.location.hostname || '10.242.100.245',
        recommendedBaseUrl: window.location.origin,
        hint: 'Active Vercel deployment preview',
      }
    ),
  createFoodItem: (data: any) =>
    safeApiCall(() => api.post<FoodItem>('/admin/menu/items', data), { id: Date.now(), ...data, isAvailable: true, customizations: [] }),
  toggleAvailability: (id: number) =>
    safeApiCall(() => api.patch(`/admin/menu/items/${id}/availability`), { success: true }),
  getAllStaff: () =>
    safeApiCall(() => api.get<any[]>('/admin/staff'), MOCK_STAFF),
  createStaff: (data: any) =>
    safeApiCall(() => api.post('/admin/staff', data), { id: Date.now(), ...data, isActive: true }),
  updateSettings: (data: any) =>
    safeApiCall(() => api.put('/admin/settings', data), data),
};

export default api;
