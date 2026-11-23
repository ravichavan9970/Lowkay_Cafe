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

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
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

export const authApi = {
  login: (data: any) => api.post<AuthResponse>('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get<AuthResponse>('/auth/me'),
};

export const menuApi = {
  getCategories: () => api.get<Category[]>('/menu/categories'),
  getItems: () => api.get<FoodItem[]>('/menu/items'),
  getItemsByCategory: (catId: number) => api.get<FoodItem[]>(`/menu/categories/${catId}/items`),
  getSpecialOffers: () => api.get<FoodItem[]>('/menu/special-offers'),
  searchItems: (query: string) => api.get<FoodItem[]>(`/menu/search?q=${encodeURIComponent(query)}`),
  getItemById: (id: number) => api.get<FoodItem>(`/menu/items/${id}`),
};

export const tableApi = {
  getTables: () => api.get<Table[]>('/tables'),
  getTable: (tableNum: number) => api.get<Table>(`/tables/${tableNum}`),
  validateToken: (tableNum: number, token: string) =>
    api.get<{ valid: boolean; tableNumber: number }>(`/tables/${tableNum}/validate-token?token=${token}`),
};

export const orderApi = {
  createOrder: (orderData: any) => api.post<Order>('/orders', orderData),
  trackOrder: (orderCode: string) => api.get<Order>(`/orders/${orderCode}`),
  getOrdersByTable: (tableNum: number) => api.get<Order[]>(`/orders/table/${tableNum}`),
  cancelOrder: (orderId: number) => api.post<Order>(`/orders/${orderId}/cancel`),
};

export const kitchenApi = {
  getStations: () => api.get<any[]>('/kitchen/stations'),
  getOrders: () => api.get<Order[]>('/kitchen/orders'),
  getOrdersByStation: (stationId: number) => api.get<Order[]>(`/kitchen/orders/station/${stationId}`),
  updateOrderStatus: (orderId: number, status: string, reason?: string) =>
    api.patch<Order>(`/kitchen/orders/${orderId}/status`, { status, reason }),
};

export const waiterApi = {
  callWaiter: (data: { tableNumber: number; requestType: string; additionalNote?: string }) =>
    api.post<WaiterRequest>('/waiter/call', data),
  getRequests: () => api.get<WaiterRequest[]>('/waiter/requests'),
  acceptRequest: (id: number) => api.patch<WaiterRequest>(`/waiter/requests/${id}/accept`),
  resolveRequest: (id: number) => api.patch<WaiterRequest>(`/waiter/requests/${id}/resolve`),
  markOrderServed: (orderId: number) => api.patch(`/waiter/orders/${orderId}/served`),
  getFloorStatus: () => api.get<Table[]>('/waiter/floor'),
};

export const billingApi = {
  getBillForOrder: (orderId: number) => api.get<Bill>(`/billing/order/${orderId}`),
  applyTip: (billId: number, data: { tipType: string; percentageValue?: number; customTipAmount?: number }) =>
    api.post<Bill>(`/billing/${billId}/tip`, data),
  splitBill: (billId: number, data: { splitType: string; numberOfPersons?: number; customAmounts?: number[] }) =>
    api.post<Bill>(`/billing/${billId}/split`, data),
  initiatePayment: (data: { billId: number; amount?: number; paymentMethod: string }) =>
    api.post<any>('/billing/pay/initiate', data),
  verifyPayment: (data: { paymentReference: string; razorpayOrderId?: string; razorpayPaymentId?: string; razorpaySignature?: string }) =>
    api.post<Bill>('/billing/pay/verify', data),
  recordCashPayment: (data: { billId: number; amount?: number }) =>
    api.post<Bill>('/billing/pay/cash', data),
  downloadPdfUrl: (billId: number) => `/api/billing/${billId}/receipt/pdf`,
  emailReceipt: (billId: number, email: string) =>
    api.post<{ sent: boolean }>(`/billing/${billId}/receipt/email`, { email }),
};

export const loyaltyApi = {
  getBalance: (phone: string) => api.get<{ phone: string; balance: number }>(`/loyalty/balance?phone=${phone}`),
  redeemPoints: (phone: string, points: number) => api.post<{ discount: number; pointsRedeemed: number }>('/loyalty/redeem', { phone, points }),
};

export const reviewApi = {
  submitReview: (data: any) => api.post('/reviews', data),
  getReviews: () => api.get<any[]>('/reviews'),
};

export const couponApi = {
  validateCoupon: (code: string) => api.get<any>(`/coupons/validate?code=${code}`),
};

export const settingsApi = {
  getSettings: () => api.get<RestaurantSettings>('/settings'),
};

export const adminApi = {
  getDashboard: () => api.get<any>('/admin/dashboard'),
  getAnalytics: () => api.get<any>('/admin/analytics'),
  getOrdersHistory: (startDate?: string, endDate?: string) =>
    api.get<Order[]>(`/admin/orders?${startDate ? `startDate=${startDate}&` : ''}${endDate ? `endDate=${endDate}` : ''}`),
  createTable: (data: any) => api.post<Table>('/admin/tables', data),
  regenerateQr: (tableNum: number, baseUrl?: string) =>
    api.post<Table>(`/admin/tables/${tableNum}/regenerate-qr${baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : ''}`),
  regenerateAllQr: (baseUrl?: string) =>
    api.post<Table[]>(`/admin/tables/regenerate-all-qr${baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : ''}`),
  getNetworkInfo: () => api.get<{ lanIp: string; recommendedBaseUrl: string; hint: string }>('/admin/network-info'),
  createFoodItem: (data: any) => api.post<FoodItem>('/admin/menu/items', data),
  toggleAvailability: (id: number) => api.patch(`/admin/menu/items/${id}/availability`),
  getAllStaff: () => api.get<any[]>('/admin/staff'),
  createStaff: (data: any) => api.post('/admin/staff', data),
  updateSettings: (data: any) => api.put('/admin/settings', data),
};

export default api;
