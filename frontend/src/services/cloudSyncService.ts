import { Order, OrderStatus, WaiterRequest, Bill } from '../types';
import { MOCK_ORDERS, MOCK_WAITER_REQUESTS } from './mockData';

// High-speed, unlimited pubsub endpoints on ntfy.sh (supports SSE & JSON history)
const ORDERS_TOPIC = 'lowkey_cafe_orders_v1';
const WAITER_TOPIC = 'lowkey_cafe_waiter_v1';
const NTFY_BASE = 'https://ntfy.sh';

interface OrderEvent {
  action: 'CREATE' | 'UPDATE_STATUS' | 'RECORD_PAYMENT';
  order?: Order;
  orderId?: number;
  status?: OrderStatus;
  bill?: Bill;
}

interface WaiterEvent {
  action: 'CALL' | 'ACCEPT' | 'RESOLVE';
  request?: WaiterRequest;
  id?: number;
  waiterName?: string;
}

class CloudSyncService {
  private ordersMap: Map<number, Order> = new Map();
  private waiterRequestsMap: Map<number, WaiterRequest> = new Map();
  private resolvedWaiterIds: Set<number> = new Set();

  private orderListeners: Array<(orders: Order[]) => void> = [];
  private waiterListeners: Array<(requests: WaiterRequest[]) => void> = [];

  private ordersEventSource: EventSource | null = null;
  private waiterEventSource: EventSource | null = null;

  private ordersPollTimer: any = null;
  private waiterPollTimer: any = null;

  constructor() {
    this.initResolvedIds();
  }

  private initResolvedIds() {
    try {
      const raw = localStorage.getItem('lowkey_resolved_waiter_ids');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          this.resolvedWaiterIds = new Set(ids);
        }
      }
    } catch (e) {
      console.warn('Failed to load resolved waiter IDs', e);
    }
  }

  private saveResolvedId(id: number) {
    this.resolvedWaiterIds.add(id);
    try {
      localStorage.setItem(
        'lowkey_resolved_waiter_ids',
        JSON.stringify(Array.from(this.resolvedWaiterIds))
      );
    } catch (e) {
      console.warn('Failed to save resolved waiter ID', e);
    }
  }

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================

  /**
   * Fetches all orders by combining ntfy message history with local cache and initial mocks.
   */
  async getOrders(): Promise<Order[]> {
    // 1. Seed with mock orders and local cache
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];

    MOCK_ORDERS.forEach((o) => {
      if (!this.ordersMap.has(o.id)) {
        this.ordersMap.set(o.id, { ...o });
      }
    });

    localOrders.forEach((o) => {
      this.ordersMap.set(o.id, o);
    });

    // 2. Poll past messages from cloud pubsub
    try {
      const res = await fetch(`${NTFY_BASE}/${ORDERS_TOPIC}/json?poll=1&since=all`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.event === 'message') {
              const payload: OrderEvent = JSON.parse(data.message);
              this.applyOrderEvent(payload);
            }
          } catch (e) {
            // Ignore corrupted lines
          }
        }
      }
    } catch (err) {
      console.warn('Could not poll orders from cloud store, using local cache', err);
    }

    const merged = Array.from(this.ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    try {
      localStorage.setItem('lowkey_demo_orders', JSON.stringify(merged));
    } catch (ignored) {}

    return merged;
  }

  private applyOrderEvent(evt: OrderEvent) {
    if (!evt || !evt.action) return;

    if (evt.action === 'CREATE' && evt.order) {
      this.ordersMap.set(evt.order.id, evt.order);
    } else if (evt.action === 'UPDATE_STATUS' && evt.orderId && evt.status) {
      const existing = this.ordersMap.get(evt.orderId);
      if (existing) {
        this.ordersMap.set(evt.orderId, { ...existing, status: evt.status });
      }
    } else if (evt.action === 'RECORD_PAYMENT' && evt.orderId) {
      const existing = this.ordersMap.get(evt.orderId);
      if (existing) {
        this.ordersMap.set(evt.orderId, { ...existing, status: 'COMPLETED' });
      }
    }
  }

  /**
   * Saves a new order, saves to localStorage, dispatches local event, and broadcasts to cloud.
   */
  async createOrder(newOrder: Order): Promise<Order> {
    this.ordersMap.set(newOrder.id, newOrder);

    // Save locally
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
    const updatedLocal = [newOrder, ...localOrders.filter((o) => o.id !== newOrder.id)];
    localStorage.setItem('lowkey_demo_orders', JSON.stringify(updatedLocal));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: newOrder }));
    }

    // Publish to cloud for kitchen and waiter screens
    const event: OrderEvent = { action: 'CREATE', order: newOrder };
    try {
      await fetch(`${NTFY_BASE}/${ORDERS_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `New Order #${newOrder.orderCode}` },
        body: JSON.stringify(event),
      });
      console.log('✅ Order published to cloud for Kitchen KDS:', newOrder.orderCode);
    } catch (err) {
      console.warn('Failed to publish order to cloud', err);
    }

    this.notifyOrderListeners();
    return newOrder;
  }

  /**
   * Updates an order's status and broadcasts to all listening screens.
   */
  async updateOrderStatus(orderId: number, status: OrderStatus, _reason?: string): Promise<Order | null> {
    let order = this.ordersMap.get(orderId);
    if (!order) {
      const orders = await this.getOrders();
      order = orders.find((o) => o.id === orderId);
    }

    const updatedOrder: Order = order
      ? { ...order, status }
      : {
          id: orderId,
          orderCode: `ORD-${orderId}`,
          tableNumber: 4,
          customerName: 'Aarav Sharma',
          customerPhone: '+91 98765 43210',
          status,
          subtotal: 748,
          taxAmount: 37.4,
          serviceCharge: 37.4,
          discountAmount: 0,
          grandTotal: 822.8,
          estimatedPrepMinutes: 12,
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 1,
              foodItemId: 1,
              foodItemName: 'Truffle Parmesan Fries',
              foodItemImage: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
              categoryName: 'Starters',
              quantity: 1,
              unitPrice: 249,
              subtotal: 249,
              selectedPortion: 'Full',
              selectedSpiceLevel: 'MILD',
              status,
              stationId: 1,
              customizations: [],
            },
          ],
        };

    if (!Array.isArray(updatedOrder.items)) {
      updatedOrder.items = [];
    }

    this.ordersMap.set(orderId, updatedOrder);

    // Save locally
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
    const nextLocal = localOrders.map((o) => (o.id === orderId ? updatedOrder : o));
    localStorage.setItem('lowkey_demo_orders', JSON.stringify(nextLocal));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: updatedOrder }));
    }

    // Publish to cloud
    const event: OrderEvent = { action: 'UPDATE_STATUS', orderId, status };
    try {
      await fetch(`${NTFY_BASE}/${ORDERS_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `Order #${updatedOrder.orderCode} -> ${status}` },
        body: JSON.stringify(event),
      });
    } catch (err) {
      console.warn('Failed to publish order status to cloud', err);
    }

    this.notifyOrderListeners();
    return updatedOrder;
  }

  /**
   * Subscribe to live cloud orders using Server-Sent Events (SSE) with auto-reconnect.
   */
  subscribeToOrders(callback: (orders: Order[]) => void): () => void {
    this.orderListeners.push(callback);

    // Initial load
    this.getOrders().then(callback).catch(console.error);

    // Start SSE listener if in browser and not yet open
    if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
      if (!this.ordersEventSource) {
        try {
          this.ordersEventSource = new EventSource(`${NTFY_BASE}/${ORDERS_TOPIC}/sse`);
          this.ordersEventSource.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.event === 'message') {
                const payload: OrderEvent = JSON.parse(data.message);
                this.applyOrderEvent(payload);
                this.notifyOrderListeners();
              }
            } catch (err) {
              console.warn('SSE order parse error', err);
            }
          };
          this.ordersEventSource.onerror = () => {
            // Native EventSource auto-reconnects
          };
        } catch (e) {
          console.warn('Could not establish SSE connection for orders', e);
        }
      }
    }

    // Safety fallback poll every 8 seconds
    if (!this.ordersPollTimer) {
      this.ordersPollTimer = setInterval(async () => {
        try {
          const fresh = await this.getOrders();
          this.notifyOrderListeners(fresh);
        } catch (e) {
          console.warn('Periodic order poll error', e);
        }
      }, 8000);
    }

    return () => {
      this.orderListeners = this.orderListeners.filter((l) => l !== callback);
      if (this.orderListeners.length === 0) {
        if (this.ordersPollTimer) {
          clearInterval(this.ordersPollTimer);
          this.ordersPollTimer = null;
        }
        if (this.ordersEventSource) {
          this.ordersEventSource.close();
          this.ordersEventSource = null;
        }
      }
    };
  }

  private notifyOrderListeners(freshList?: Order[]) {
    const list =
      freshList ||
      Array.from(this.ordersMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    this.orderListeners.forEach((l) => l(list));
  }

  async getOrderByCode(orderCode: string): Promise<Order | null> {
    const orders = await this.getOrders();
    const found = orders.find((o) => o.orderCode === orderCode);
    if (found) return found;
    return MOCK_ORDERS.find((o) => o.orderCode === orderCode) || null;
  }

  async getBillForOrder(orderId: number): Promise<Bill> {
    const settledBills: Record<string, Bill> = JSON.parse(
      localStorage.getItem('lowkey_demo_bills') || '{}'
    );
    if (settledBills[orderId]) {
      return settledBills[orderId];
    }

    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);

    const subtotal = order ? order.subtotal : 748;
    const taxAmount = order ? order.taxAmount : 37.4;
    const isTakeaway = order?.tableNumber === 0;
    const serviceCharge = isTakeaway ? 0 : (order ? order.serviceCharge : 37.4);
    const finalPayableAmount = order ? order.grandTotal : 822.8;

    const items =
      order && Array.isArray(order.items) && order.items.length > 0
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

    const settledBills: Record<string, Bill> = JSON.parse(
      localStorage.getItem('lowkey_demo_bills') || '{}'
    );
    settledBills[bill.orderId] = paidBill;
    localStorage.setItem('lowkey_demo_bills', JSON.stringify(settledBills));

    await this.updateOrderStatus(bill.orderId, 'COMPLETED');

    const event: OrderEvent = { action: 'RECORD_PAYMENT', orderId: bill.orderId, bill: paidBill };
    try {
      await fetch(`${NTFY_BASE}/${ORDERS_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `Bill Paid #${paidBill.billNumber}` },
        body: JSON.stringify(event),
      });
    } catch (ignored) {}

    console.log('💳 Payment completed and recorded for Bill #', paidBill.billNumber);
    return paidBill;
  }

  // ==========================================
  // WAITER REQUESTS MANAGEMENT
  // ==========================================

  /**
   * Fetches active waiter requests, filtering out all resolved requests so they NEVER repeat.
   */
  async getWaiterRequests(): Promise<WaiterRequest[]> {
    // 1. Seed with mocks if not yet resolved
    MOCK_WAITER_REQUESTS.forEach((r) => {
      if (!this.resolvedWaiterIds.has(r.id) && !this.waiterRequestsMap.has(r.id)) {
        this.waiterRequestsMap.set(r.id, { ...r });
      }
    });

    // 2. Poll past messages from cloud store
    try {
      const res = await fetch(`${NTFY_BASE}/${WAITER_TOPIC}/json?poll=1&since=all`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.event === 'message') {
              const payload: WaiterEvent = JSON.parse(data.message);
              this.applyWaiterEvent(payload);
            }
          } catch (e) {
            // Ignore corrupted lines
          }
        }
      }
    } catch (err) {
      console.warn('Could not poll waiter requests from cloud store', err);
    }

    const activeList = Array.from(this.waiterRequestsMap.values())
      .filter((r) => !this.resolvedWaiterIds.has(r.id) && r.status !== 'RESOLVED')
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    try {
      localStorage.setItem('lowkey_demo_waiter_requests', JSON.stringify(activeList));
    } catch (ignored) {}

    return activeList;
  }

  private applyWaiterEvent(evt: WaiterEvent) {
    if (!evt || !evt.action) return;

    if (evt.action === 'CALL' && evt.request) {
      if (!this.resolvedWaiterIds.has(evt.request.id)) {
        this.waiterRequestsMap.set(evt.request.id, evt.request);
      }
    } else if (evt.action === 'ACCEPT' && evt.id) {
      const existing = this.waiterRequestsMap.get(evt.id);
      if (existing) {
        this.waiterRequestsMap.set(evt.id, {
          ...existing,
          status: 'IN_PROGRESS',
          assignedWaiterName: evt.waiterName || 'Lead Waiter Alex',
        });
      }
    } else if (evt.action === 'RESOLVE' && evt.id) {
      this.saveResolvedId(evt.id);
      this.waiterRequestsMap.delete(evt.id);
    }
  }

  /**
   * Called when a diner calls the waiter from their mobile phone.
   */
  async callWaiter(req: WaiterRequest): Promise<WaiterRequest> {
    this.waiterRequestsMap.set(req.id, req);

    // Save locally
    const raw = localStorage.getItem('lowkey_demo_waiter_requests');
    const list: WaiterRequest[] = raw ? JSON.parse(raw) : [];
    const nextList = [req, ...list.filter((r) => r.id !== req.id)];
    localStorage.setItem('lowkey_demo_waiter_requests', JSON.stringify(nextList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_waiter_update'));
    }

    // Broadcast to cloud for waiter screens
    const event: WaiterEvent = { action: 'CALL', request: req };
    try {
      await fetch(`${NTFY_BASE}/${WAITER_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `Service Call: Table #${req.tableNumber} (${req.requestType})` },
        body: JSON.stringify(event),
      });
      console.log('🔔 Waiter call published to cloud for Table #', req.tableNumber);
    } catch (err) {
      console.warn('Failed to publish waiter call to cloud', err);
    }

    this.notifyWaiterListeners();
    return req;
  }

  /**
   * Waiter accepts a request.
   */
  async acceptWaiterRequest(id: number, waiterName = 'Lead Waiter Alex'): Promise<WaiterRequest | null> {
    let req = this.waiterRequestsMap.get(id);
    if (req) {
      req = { ...req, status: 'IN_PROGRESS', assignedWaiterName: waiterName };
      this.waiterRequestsMap.set(id, req);
    }

    // Save locally
    const raw = localStorage.getItem('lowkey_demo_waiter_requests');
    const list: WaiterRequest[] = raw ? JSON.parse(raw) : [];
    const nextList = list.map((r) =>
      r.id === id ? { ...r, status: 'IN_PROGRESS' as const, assignedWaiterName: waiterName } : r
    );
    localStorage.setItem('lowkey_demo_waiter_requests', JSON.stringify(nextList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_waiter_update'));
    }

    // Broadcast to cloud
    const event: WaiterEvent = { action: 'ACCEPT', id, waiterName };
    try {
      await fetch(`${NTFY_BASE}/${WAITER_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `Call Accepted for Table` },
        body: JSON.stringify(event),
      });
    } catch (err) {
      console.warn('Failed to publish waiter accept to cloud', err);
    }

    this.notifyWaiterListeners();
    return req || null;
  }

  /**
   * Waiter marks request as resolved. Permanently prevents it from resurfacing.
   */
  async resolveWaiterRequest(id: number): Promise<void> {
    this.saveResolvedId(id);
    this.waiterRequestsMap.delete(id);

    // Filter out permanently from local storage
    const raw = localStorage.getItem('lowkey_demo_waiter_requests');
    const list: WaiterRequest[] = raw ? JSON.parse(raw) : [];
    const nextList = list.filter((r) => r.id !== id);
    localStorage.setItem('lowkey_demo_waiter_requests', JSON.stringify(nextList));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_waiter_update'));
    }

    // Broadcast to cloud
    const event: WaiterEvent = { action: 'RESOLVE', id };
    try {
      await fetch(`${NTFY_BASE}/${WAITER_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `Call Resolved` },
        body: JSON.stringify(event),
      });
    } catch (err) {
      console.warn('Failed to publish waiter resolve to cloud', err);
    }

    this.notifyWaiterListeners();
  }

  /**
   * Subscribe to live waiter requests with Server-Sent Events.
   */
  subscribeToWaiterRequests(callback: (requests: WaiterRequest[]) => void): () => void {
    this.waiterListeners.push(callback);

    this.getWaiterRequests().then(callback).catch(console.error);

    if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
      if (!this.waiterEventSource) {
        try {
          this.waiterEventSource = new EventSource(`${NTFY_BASE}/${WAITER_TOPIC}/sse`);
          this.waiterEventSource.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.event === 'message') {
                const payload: WaiterEvent = JSON.parse(data.message);
                this.applyWaiterEvent(payload);
                this.notifyWaiterListeners();
              }
            } catch (err) {
              console.warn('SSE waiter parse error', err);
            }
          };
          this.waiterEventSource.onerror = () => {
            // Auto-reconnects
          };
        } catch (e) {
          console.warn('Could not establish SSE connection for waiter requests', e);
        }
      }
    }

    // Safety fallback poll every 8 seconds
    if (!this.waiterPollTimer) {
      this.waiterPollTimer = setInterval(async () => {
        try {
          const fresh = await this.getWaiterRequests();
          this.notifyWaiterListeners(fresh);
        } catch (e) {
          console.warn('Periodic waiter poll error', e);
        }
      }, 8000);
    }

    return () => {
      this.waiterListeners = this.waiterListeners.filter((l) => l !== callback);
      if (this.waiterListeners.length === 0) {
        if (this.waiterPollTimer) {
          clearInterval(this.waiterPollTimer);
          this.waiterPollTimer = null;
        }
        if (this.waiterEventSource) {
          this.waiterEventSource.close();
          this.waiterEventSource = null;
        }
      }
    };
  }

  private notifyWaiterListeners(freshList?: WaiterRequest[]) {
    const list =
      freshList ||
      Array.from(this.waiterRequestsMap.values())
        .filter((r) => !this.resolvedWaiterIds.has(r.id) && r.status !== 'RESOLVED')
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    this.waiterListeners.forEach((l) => l(list));
  }
}

export const cloudSync = new CloudSyncService();
export default cloudSync;
