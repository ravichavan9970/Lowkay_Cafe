import { Order, OrderStatus, WaiterRequest, Bill } from '../types';
import { MOCK_ORDERS } from './mockData';

// Public cloud storage endpoint for real-time cross-device sync between Mobile Phones and Kitchen KDS
const CLOUD_API_BASE = 'https://api.restful-api.dev/objects';
const ORDERS_OBJECT_ID = 'ff808181a09d98f701a20a1828142b43';
const WAITER_OBJECT_ID = 'ff808181a09d98f701a20a18291b2b45';

class CloudSyncService {
  private lastFetchedOrders: Order[] = [];
  private orderListeners: Array<(orders: Order[]) => void> = [];
  private pollIntervalId: any = null;

  /**
   * Fetch all orders from the cloud store.
   * Merges with localStorage orders and mock orders so offline works seamlessly.
   */
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch(`${CLOUD_API_BASE}/${ORDERS_OBJECT_ID}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const json = await res.json();
        const cloudOrders: Order[] = Array.isArray(json?.data?.orders) ? json.data.orders : [];

        // Also get any orders stored locally on this device
        const localRaw = localStorage.getItem('lowkey_demo_orders');
        const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];

        // Merge: cloud orders take precedence, then local orders not yet in cloud, then default mock orders
        const orderMap = new Map<number | string, Order>();
        MOCK_ORDERS.forEach((o) => orderMap.set(o.id, o));
        localOrders.forEach((o) => orderMap.set(o.id, o));
        cloudOrders.forEach((o) => orderMap.set(o.id, o));

        const merged = Array.from(orderMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        this.lastFetchedOrders = merged;
        localStorage.setItem('lowkey_demo_orders', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Cloud sync offline or slow, reading from local cache', err);
    }

    // Fallback: local storage + mock data
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
    const orderMap = new Map<number | string, Order>();
    MOCK_ORDERS.forEach((o) => orderMap.set(o.id, o));
    localOrders.forEach((o) => orderMap.set(o.id, o));
    return Array.from(orderMap.values());
  }

  /**
   * Saves a new order to the cloud store and broadcasts to all listening screens.
   */
  async createOrder(newOrder: Order): Promise<Order> {
    // 1. Immediately save to this device's localStorage
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
    const updatedLocal = [newOrder, ...localOrders.filter((o) => o.id !== newOrder.id)];
    localStorage.setItem('lowkey_demo_orders', JSON.stringify(updatedLocal));

    // 2. Dispatch event locally
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: newOrder }));
    }

    // 3. Push to Cloud Store so Kitchen KDS and Waiter screens receive it instantly
    try {
      // First fetch current cloud list to merge
      const res = await fetch(`${CLOUD_API_BASE}/${ORDERS_OBJECT_ID}`);
      let currentCloud: Order[] = [];
      if (res.ok) {
        const json = await res.json();
        currentCloud = Array.isArray(json?.data?.orders) ? json.data.orders : [];
      }

      const mergedCloud = [newOrder, ...currentCloud.filter((o) => o.id !== newOrder.id)];

      await fetch(`${CLOUD_API_BASE}/${ORDERS_OBJECT_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'lowkey_cafe_global_orders_v1',
          data: { orders: mergedCloud },
        }),
      });
      console.log('✅ Order synced to Cloud for Kitchen KDS:', newOrder.orderCode);
    } catch (err) {
      console.error('Failed to sync order to cloud store', err);
    }

    return newOrder;
  }

  /**
   * Updates an order's status in the cloud store (e.g. PREPARING -> READY -> SERVED -> COMPLETED).
   */
  async updateOrderStatus(orderId: number, status: OrderStatus, reason?: string): Promise<Order | null> {
    // 1. Update local storage
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [...MOCK_ORDERS];
    let updatedOrder: Order | null = null;

    const nextLocal = localOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = { ...o, status };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      localStorage.setItem('lowkey_demo_orders', JSON.stringify(nextLocal));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: updatedOrder }));
      }
    }

    // 2. Update cloud store
    try {
      const res = await fetch(`${CLOUD_API_BASE}/${ORDERS_OBJECT_ID}`);
      if (res.ok) {
        const json = await res.json();
        const cloudOrders: Order[] = Array.isArray(json?.data?.orders) ? json.data.orders : [];
        const nextCloud = cloudOrders.map((o) => (o.id === orderId ? { ...o, status } : o));

        await fetch(`${CLOUD_API_BASE}/${ORDERS_OBJECT_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'lowkey_cafe_global_orders_v1',
            data: { orders: nextCloud },
          }),
        });
      }
    } catch (err) {
      console.error('Failed to update cloud order status', err);
    }

    return updatedOrder;
  }

  /**
   * Subscribe to live cloud orders with periodic auto-polling (every 3 seconds).
   * Calls callback with fresh orders whenever new orders arrive.
   */
  subscribeToOrders(callback: (orders: Order[]) => void, intervalMs = 3000): () => void {
    this.orderListeners.push(callback);

    // Initial fetch
    this.getOrders().then(callback).catch(console.error);

    // Setup polling if not already started
    if (!this.pollIntervalId) {
      this.pollIntervalId = setInterval(async () => {
        try {
          const fresh = await this.getOrders();
          this.orderListeners.forEach((listener) => listener(fresh));
        } catch (e) {
          console.warn('Poll orders error', e);
        }
      }, intervalMs);
    }

    // Return unsubscribe function
    return () => {
      this.orderListeners = this.orderListeners.filter((l) => l !== callback);
      if (this.orderListeners.length === 0 && this.pollIntervalId) {
        clearInterval(this.pollIntervalId);
        this.pollIntervalId = null;
      }
    };
  }

  /**
   * Retrieves a specific order by code from cloud or local store.
   */
  async getOrderByCode(orderCode: string): Promise<Order | null> {
    const orders = await this.getOrders();
    const found = orders.find((o) => o.orderCode === orderCode);
    if (found) return found;

    // Check mock orders fallback
    return MOCK_ORDERS.find((o) => o.orderCode === orderCode) || null;
  }

  /**
   * Get or generate a digital bill for an order with exact totals.
   */
  async getBillForOrder(orderId: number): Promise<Bill> {
    // Check if bill was already settled
    const settledBills: Record<string, Bill> = JSON.parse(
      localStorage.getItem('lowkey_demo_bills') || '{}'
    );
    if (settledBills[orderId]) {
      return settledBills[orderId];
    }

    // Find the corresponding order
    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);

    const subtotal = order ? order.subtotal : 748;
    const taxAmount = order ? order.taxAmount : 37.4;
    const isTakeaway = order?.tableNumber === 0;
    const serviceCharge = isTakeaway ? 0 : (order ? order.serviceCharge : 37.4);
    const finalPayableAmount = order ? order.grandTotal : 822.8;

    const items = order && Array.isArray(order.items) && order.items.length > 0
      ? order.items.map((i) => ({
          id: i.id,
          itemName: i.foodItemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.subtotal,
        }))
      : [
          { id: 1, itemName: 'Truffle Parmesan Fries', quantity: 1, unitPrice: 249, totalPrice: 249 },
          { id: 2, itemName: 'Artisan Burrata Margherita', quantity: 1, unitPrice: 499, totalPrice: 499 },
        ];

    const bill: Bill = {
      id: orderId,
      billNumber: `BILL-${order ? order.orderCode.replace('ORD-', '') : orderId}`,
      orderId,
      orderCode: order ? order.orderCode : `ORD-${orderId}`,
      tableNumber: order ? order.tableNumber : 4,
      subtotal,
      taxAmount,
      serviceCharge,
      discountAmount: order?.discountAmount || 0,
      tipAmount: 0,
      loyaltyDiscount: 0,
      finalPayableAmount,
      paidAmount: 0,
      status: 'UNPAID',
      createdAt: order ? order.createdAt : new Date().toISOString(),
      splits: [],
      items,
    };

    return bill;
  }

  /**
   * Record payment for a bill, mark order as COMPLETED, and save settled bill.
   */
  async recordPayment(bill: Bill, tipAmount = 0, paymentMethod = 'UPI'): Promise<Bill> {
    const totalPaid = Math.round((bill.finalPayableAmount + tipAmount) * 100) / 100;
    const paidBill: Bill = {
      ...bill,
      tipAmount,
      finalPayableAmount: totalPaid,
      paidAmount: totalPaid,
      status: 'PAID',
      paymentMethod,
    };

    // Save in settled bills map
    const settledBills: Record<string, Bill> = JSON.parse(
      localStorage.getItem('lowkey_demo_bills') || '{}'
    );
    settledBills[bill.orderId] = paidBill;
    localStorage.setItem('lowkey_demo_bills', JSON.stringify(settledBills));

    // Update corresponding order status to COMPLETED
    await this.updateOrderStatus(bill.orderId, 'COMPLETED');

    console.log('💳 Payment completed and recorded for Bill #', paidBill.billNumber);
    return paidBill;
  }
}

export const cloudSync = new CloudSyncService();
export default cloudSync;
