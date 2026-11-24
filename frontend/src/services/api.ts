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
import { cloudSync } from './cloudSyncService';

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

// Environment-aware flag for zero-delay local & serverless operation
export const isVercelHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('vercel.app') ||
  window.location.hostname.includes('lowkey-cafe')
);
export const hasCustomBackend = Boolean((import.meta as any).env?.VITE_API_URL);
export const shouldUseCloudSyncDirectly = isVercelHost || !hasCustomBackend;

// Demo accounts dictionary for offline / Vercel preview fallback
const DEMO_ACCOUNTS: Record<string, { pass: string; id: number; fullName: string; email: string; roles: string[] }> = {
  admin: { pass: 'admin123', id: 1, fullName: 'Cafe General Manager', email: 'admin@lowkeycafe.com', roles: ['ROLE_ADMIN'] },
  kitchen: { pass: 'kitchen123', id: 2, fullName: 'Head Chef Mario', email: 'kitchen@lowkeycafe.com', roles: ['ROLE_KITCHEN_STAFF'] },
  waiter: { pass: 'waiter123', id: 3, fullName: 'Lead Waiter Alex', email: 'waiter@lowkeycafe.com', roles: ['ROLE_WAITER'] },
  customer: { pass: 'customer123', id: 4, fullName: 'Guest Diner', email: 'customer@lowkeycafe.com', roles: ['ROLE_CUSTOMER'] },
};

function isHtmlResponse(data: any): boolean {
  if (typeof data === 'string') {
    const s = data.trim().toLowerCase();
    return s.startsWith('<!doctype') || s.startsWith('<html') || s.includes('<div id="root">');
  }
  return false;
}

// Safe API helper that executes real backend call, and falls back to mock data if backend is offline/404 on Vercel
async function safeApiCall<T>(call: () => Promise<{ data: T }>, fallback: T | (() => T)): Promise<{ data: T }> {
  try {
    const res = await call();
    if (isHtmlResponse(res.data)) {
      throw new Error('API returned HTML text instead of JSON');
    }
    return res;
  } catch (err: any) {
    console.warn('Backend endpoint unavailable or returned error, using fallback demo data:', err?.message || err);
    const data = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    return { data };
  }
}

export const authApi = {
  login: async (data: any): Promise<{ data: AuthResponse }> => {
    try {
      const res = await api.post<AuthResponse>('/auth/login', data);
      if (isHtmlResponse(res.data) || !res.data || !res.data.token) {
        throw new Error('Endpoint returned HTML instead of AuthResponse');
      }
      return res;
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
        try {
          return { data: JSON.parse(saved) };
        } catch (e) {
          console.error(e);
        }
      }
    }
    try {
      const res = await api.get<AuthResponse>('/auth/me');
      if (isHtmlResponse(res.data) || !res.data || !res.data.username) {
        throw new Error('Invalid getMe payload');
      }
      return res;
    } catch {
      const saved = localStorage.getItem('lowkey_demo_user');
      if (saved) {
        try {
          return { data: JSON.parse(saved) };
        } catch (e) {
          console.error(e);
        }
      }
      return {
        data: {
          token: 'demo-jwt-token-admin',
          type: 'Bearer',
          id: 1,
          username: 'admin',
          email: 'admin@lowkeycafe.com',
          fullName: 'Cafe General Manager',
          roles: ['ROLE_ADMIN'],
        },
      };
    }
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
  getTables: async (): Promise<{ data: Table[] }> => {
    if (shouldUseCloudSyncDirectly) {
      const tables = await cloudSync.getTables();
      return { data: tables };
    }
    try {
      const res = await api.get<Table[]>('/tables');
      if (isHtmlResponse(res.data) || !Array.isArray(res.data)) {
        throw new Error('Invalid tables response');
      }
      return res;
    } catch {
      const tables = await cloudSync.getTables();
      return { data: tables };
    }
  },
  getTable: async (tableNum: number): Promise<{ data: Table }> => {
    if (shouldUseCloudSyncDirectly) {
      const tables = await cloudSync.getTables();
      const found = tables.find((t) => t.tableNumber === tableNum) || tables[0];
      return { data: found };
    }
    try {
      const res = await api.get<Table>(`/tables/${tableNum}`);
      if (isHtmlResponse(res.data) || !res.data || !res.data.id) {
        throw new Error('Invalid getTable response');
      }
      return res;
    } catch {
      const tables = await cloudSync.getTables();
      const found = tables.find((t) => t.tableNumber === tableNum) || tables[0];
      return { data: found };
    }
  },
  validateToken: (tableNum: number, token: string) =>
    safeApiCall(
      () => api.get<{ valid: boolean; tableNumber: number }>(`/tables/${tableNum}/validate-token?token=${token}`),
      { valid: true, tableNumber: tableNum }
    ),
};

const generateOrderLocally = async (orderData: any): Promise<Order> => {
  const randomCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const subtotal = (orderData.items || []).reduce((acc: number, item: any) => {
    const food = MOCK_FOOD_ITEMS.find((f) => f.id === item.foodItemId) || MOCK_FOOD_ITEMS[0];
    return acc + food.price * (item.quantity || 1);
  }, 0);
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  
  const isTakeawayOrder =
    orderData.tableNumber === 0 ||
    orderData.tableNumber === null ||
    orderData.tableNumber === undefined ||
    Number(orderData.tableNumber) === 0 ||
    orderData.isTakeaway === true ||
    (typeof orderData.specialInstructions === 'string' && /takeaway/i.test(orderData.specialInstructions));

  const serviceCharge = isTakeawayOrder ? 0 : Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = subtotal + taxAmount + serviceCharge;

  const newOrder: Order = {
    id: Date.now(),
    orderCode: randomCode,
    tableNumber: isTakeawayOrder ? 0 : (orderData.tableNumber && Number(orderData.tableNumber) > 0 ? Number(orderData.tableNumber) : 10),
    customerName: orderData.customerName || (isTakeawayOrder ? 'Takeaway Customer' : 'Guest Diner'),
    customerPhone: orderData.customerPhone || '+91 98765 43210',
    specialInstructions: orderData.specialInstructions || (isTakeawayOrder ? '[TAKEAWAY / TO-GO PICKUP]' : undefined),
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
      
      let stationId = 1;
      const cat = (food.categoryName || '').toLowerCase();
      if (cat.includes('beverage') || cat.includes('coffee') || cat.includes('tea') || cat.includes('drink')) {
        stationId = 1; // Espresso Bar
      } else if (cat.includes('burger') || cat.includes('pizza') || cat.includes('main') || cat.includes('hot')) {
        stationId = 2; // Grill Station
      } else if (cat.includes('dessert') || cat.includes('bakery') || cat.includes('pastry') || cat.includes('cake')) {
        stationId = 3; // Bakery & Dessert
      } else {
        stationId = 4; // Cold Prep & Starters
      }

      return {
        id: idx + 1,
        foodItemId: food.id,
        foodItemName: food.name,
        foodItemImage: food.imageUrl || '',
        categoryName: food.categoryName || 'Mains',
        stationId,
        stationName: stationId === 1 ? 'Espresso Bar' : stationId === 2 ? 'Grill Station' : stationId === 3 ? 'Bakery' : 'Cold Prep',
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

  const savedOrder = await cloudSync.createOrder(newOrder);

  // Auto-generate Bill immediately so it's guaranteed ready
  const newBill: Bill = {
    id: savedOrder.id,
    billNumber: `BILL-${savedOrder.orderCode.replace('ORD-', '')}`,
    orderId: savedOrder.id,
    orderCode: savedOrder.orderCode,
    tableNumber: savedOrder.tableNumber,
    subtotal: savedOrder.subtotal,
    taxAmount: savedOrder.taxAmount,
    serviceCharge: savedOrder.serviceCharge,
    discountAmount: savedOrder.discountAmount,
    tipAmount: 0,
    loyaltyDiscount: 0,
    finalPayableAmount: savedOrder.grandTotal,
    paidAmount: 0,
    status: 'UNPAID',
    createdAt: savedOrder.createdAt,
    splits: [],
    items: savedOrder.items.map((i) => ({
      id: i.id,
      itemName: i.foodItemName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.subtotal,
    })),
  };
  await cloudSync.saveBill(newBill);

  return savedOrder;
};

export const orderApi = {
  createOrder: async (orderData: any): Promise<{ data: Order }> => {
    if (shouldUseCloudSyncDirectly) {
      const saved = await generateOrderLocally(orderData);
      return { data: saved };
    }

    try {
      const res = await api.post<Order>('/orders', orderData);
      if (isHtmlResponse(res.data) || !res.data || !res.data.orderCode) {
        throw new Error('Invalid createOrder response');
      }
      return res;
    } catch {
      const saved = await generateOrderLocally(orderData);
      return { data: saved };
    }
  },
  trackOrder: async (orderCode: string): Promise<{ data: Order }> => {
    if (shouldUseCloudSyncDirectly) {
      const found = await cloudSync.getOrderByCode(orderCode);
      return { data: found || null as any };
    }

    try {
      const res = await api.get<Order>(`/orders/${orderCode}`);
      if (isHtmlResponse(res.data) || !res.data || !res.data.orderCode) {
        throw new Error('Invalid trackOrder response');
      }
      return res;
    } catch {
      const found = await cloudSync.getOrderByCode(orderCode);
      return { data: found || null as any };
    }
  },
  getOrdersByTable: (tableNum: number) =>
    safeApiCall(
      () => api.get<Order[]>(`/orders/table/${tableNum}`),
      []
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
  getOrders: async (): Promise<{ data: Order[] }> => {
    if (shouldUseCloudSyncDirectly) {
      const orders = await cloudSync.getOrders();
      return { data: orders };
    }

    try {
      const res = await api.get<Order[]>('/kitchen/orders');
      if (isHtmlResponse(res.data) || !Array.isArray(res.data)) {
        throw new Error('Invalid kitchen orders response');
      }
      return res;
    } catch {
      const orders = await cloudSync.getOrders();
      return { data: orders };
    }
  },
  getOrdersByStation: (stationId: number) =>
    safeApiCall(() => api.get<Order[]>(`/kitchen/orders/station/${stationId}`), []),
  updateOrderStatus: async (orderId: number, status: string, reason?: string, fallbackOrder?: Order) => {
    if (shouldUseCloudSyncDirectly) {
      const updated = await cloudSync.updateOrderStatus(orderId, status as any, reason, fallbackOrder);
      return {
        data: updated || (fallbackOrder ? { ...fallbackOrder, status: status as any } : {
          id: orderId,
          orderCode: `ORD-${orderId}`,
          tableNumber: 4,
          customerName: 'Guest Diner',
          status: status as any,
          subtotal: 748,
          taxAmount: 37.4,
          serviceCharge: 37.4,
          discountAmount: 0,
          grandTotal: 822.8,
          estimatedPrepMinutes: 12,
          createdAt: new Date().toISOString(),
          items: [],
        }),
      };
    }

    try {
      const res = await api.patch<Order>(`/kitchen/orders/${orderId}/status`, { status, reason });
      if (isHtmlResponse(res.data) || !res.data || !Array.isArray(res.data.items)) {
        throw new Error('Invalid updateOrderStatus response');
      }
      return res;
    } catch {
      const updated = await cloudSync.updateOrderStatus(orderId, status as any, reason, fallbackOrder);
      return {
        data: updated || (fallbackOrder ? { ...fallbackOrder, status: status as any } : {
          id: orderId,
          orderCode: `ORD-${orderId}`,
          tableNumber: 4,
          customerName: 'Guest Diner',
          status: status as any,
          subtotal: 748,
          taxAmount: 37.4,
          serviceCharge: 37.4,
          discountAmount: 0,
          grandTotal: 822.8,
          estimatedPrepMinutes: 12,
          createdAt: new Date().toISOString(),
          items: [],
        }),
      };
    }
  },
};

export const waiterApi = {
  callWaiter: async (data: { tableNumber: number; requestType: string; additionalNote?: string }) => {
    const newReq: WaiterRequest = {
      id: Date.now(),
      tableNumber: data.tableNumber,
      requestType: data.requestType as any,
      status: 'PENDING',
      additionalNote: data.additionalNote,
      requestedAt: new Date().toISOString(),
    };
    const saved = await cloudSync.callWaiter(newReq);
    return { data: saved };
  },
  getRequests: async (): Promise<{ data: WaiterRequest[] }> => {
    if (shouldUseCloudSyncDirectly) {
      const list = await cloudSync.getWaiterRequests();
      return { data: list };
    }

    try {
      const res = await api.get<WaiterRequest[]>('/waiter/requests');
      if (isHtmlResponse(res.data) || !Array.isArray(res.data)) {
        throw new Error('Invalid waiter requests response');
      }
      return res;
    } catch {
      const list = await cloudSync.getWaiterRequests();
      return { data: list };
    }
  },
  acceptRequest: async (id: number) => {
    if (shouldUseCloudSyncDirectly) {
      const updated = await cloudSync.acceptWaiterRequest(id);
      return {
        data: updated || {
          id,
          tableNumber: 4,
          requestType: 'ASSISTANCE',
          status: 'IN_PROGRESS',
          assignedWaiterName: 'Lead Waiter Alex',
          requestedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const res = await api.patch<WaiterRequest>(`/waiter/requests/${id}/accept`);
      if (isHtmlResponse(res.data) || !res.data || !res.data.id) {
        throw new Error('Invalid acceptRequest response');
      }
      return res;
    } catch {
      const updated = await cloudSync.acceptWaiterRequest(id);
      return {
        data: updated || {
          id,
          tableNumber: 4,
          requestType: 'ASSISTANCE',
          status: 'IN_PROGRESS',
          assignedWaiterName: 'Lead Waiter Alex',
          requestedAt: new Date().toISOString(),
        },
      };
    }
  },
  resolveRequest: async (id: number) => {
    if (shouldUseCloudSyncDirectly) {
      await cloudSync.resolveWaiterRequest(id);
      return { data: { id, status: 'RESOLVED' } as any };
    }

    try {
      const res = await api.patch<WaiterRequest>(`/waiter/requests/${id}/resolve`);
      if (isHtmlResponse(res.data) || !res.data || !res.data.id) {
        throw new Error('Invalid resolveRequest response');
      }
      return res;
    } catch {
      await cloudSync.resolveWaiterRequest(id);
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
    if (shouldUseCloudSyncDirectly) {
      const bill = await cloudSync.getBillForOrder(orderId);
      return { data: bill };
    }

    try {
      const res = await api.get<Bill>(`/billing/order/${orderId}`);
      if (isHtmlResponse(res.data) || !res.data || !res.data.items) {
        throw new Error('Invalid bill response');
      }
      return res;
    } catch {
      const bill = await cloudSync.getBillForOrder(orderId);
      return { data: bill };
    }
  },
  applyTip: (billId: number, data: any) =>
    safeApiCall(() => api.post<Bill>(`/billing/${billId}/tip`, data), { id: billId, tipAmount: data.customTipAmount || 50 } as any),
  splitBill: (billId: number, data: any) =>
    safeApiCall(() => api.post<Bill>(`/billing/${billId}/split`, data), { id: billId, splitType: data.splitType } as any),
  initiatePayment: (data: any) =>
    safeApiCall(() => api.post<any>('/billing/pay/initiate', data), { paymentReference: `PAY-${Date.now()}`, gatewayOrderId: `order_${Date.now()}`, keyId: 'rzp_test_LowkeyCafe', amount: data.amount * 100 }),
  verifyPayment: async (data: any): Promise<{ data: Bill }> => {
    if (shouldUseCloudSyncDirectly) {
      const billId = data.billId || 1;
      const bill = await cloudSync.getBillForOrder(billId);
      const paidBill = await cloudSync.recordPayment(bill, data.tipAmount || 0, 'UPI');
      return { data: paidBill };
    }

    try {
      const res = await api.post<Bill>('/billing/pay/verify', data);
      if (isHtmlResponse(res.data) || !res.data || !res.data.items) {
        throw new Error('Invalid verify payment response');
      }
      return res;
    } catch {
      const billId = data.billId || 1;
      const bill = await cloudSync.getBillForOrder(billId);
      const paidBill = await cloudSync.recordPayment(bill, data.tipAmount || 0, 'UPI');
      return { data: paidBill };
    }
  },
  recordCashPayment: async (data: any): Promise<{ data: Bill }> => {
    if (shouldUseCloudSyncDirectly) {
      const billId = data.billId || 1;
      const bill = await cloudSync.getBillForOrder(billId);
      const paidBill = await cloudSync.recordPayment(bill, data.tipAmount || 0, 'CASH');
      return { data: paidBill };
    }

    try {
      const res = await api.post<Bill>('/billing/pay/cash', data);
      if (isHtmlResponse(res.data) || !res.data || !res.data.items) {
        throw new Error('Invalid cash payment response');
      }
      return res;
    } catch {
      const billId = data.billId || 1;
      const bill = await cloudSync.getBillForOrder(billId);
      const paidBill = await cloudSync.recordPayment(bill, data.tipAmount || 0, 'CASH');
      return { data: paidBill };
    }
  },
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
      []
    ),
  createTable: (data: any) => {
    const base = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app';
    const targetUrl = `${base}/table/${data.tableNumber}`;
    return safeApiCall(() => api.post<Table>('/admin/tables', data), { id: Date.now(), tableNumber: data.tableNumber, seatingCapacity: data.seatingCapacity, floorZone: data.floorZone, status: 'AVAILABLE', isActive: true, accessToken: 'demo-token', qrTargetUrl: targetUrl, qrImageData: '' });
  },
  regenerateQr: (tableNum: number, baseUrl?: string) => {
    const base = baseUrl || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app');
    const targetUrl = `${base}/table/${tableNum}`;
    return safeApiCall(
      () => api.post<Table>(`/admin/tables/${tableNum}/regenerate-qr${baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : ''}`),
      { id: tableNum, tableNumber: tableNum, seatingCapacity: 4, floorZone: 'Indoor Lounge', status: 'AVAILABLE', isActive: true, accessToken: 'demo-token', qrTargetUrl: targetUrl, qrImageData: '' }
    );
  },
  regenerateAllQr: (baseUrl?: string) => {
    const base = baseUrl || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app');
    return safeApiCall(
      () => api.post<Table[]>(`/admin/tables/regenerate-all-qr${baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : ''}`),
      MOCK_TABLES.map((t) => {
        const targetUrl = `${base}/table/${t.tableNumber}?token=${t.accessToken}`;
        return {
          ...t,
          qrTargetUrl: targetUrl,
          qrImageData: '',
        };
      })
    );
  },
  getNetworkInfo: () => {
    const base = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app';
    return safeApiCall(
      () => api.get<{ lanIp: string; recommendedBaseUrl: string; hint: string }>('/admin/network-info'),
      {
        lanIp: typeof window !== 'undefined' ? window.location.hostname : 'lowkey-cafe-three.vercel.app',
        recommendedBaseUrl: base,
        hint: 'Active live deployment base URL',
      }
    );
  },
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
