import { Order, OrderStatus, WaiterRequest, Bill, Table } from '../types';
import { MOCK_ORDERS, MOCK_WAITER_REQUESTS, MOCK_TABLES } from './mockData';

// High-speed, unblocked community brokers with global access & SSE
const CLOUD_BROKERS = [
  'https://ntfy.tedomum.fr',
  'https://ntfy.adminforge.de',
];
const PRIMARY_BROKER = CLOUD_BROKERS[0];
const ORDERS_TOPIC = 'lowkey_cafe_orders_v2';
const WAITER_TOPIC = 'lowkey_cafe_waiter_v2';

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
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.initResolvedIds();
    this.initCrossTabSync();
  }

  private initCrossTabSync() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('lowkey_cafe_sync_v2');
          this.broadcastChannel.onmessage = (e) => {
            const data = e.data;
            if (!data) return;
            if (data.type === 'ORDER_EVENT' && data.event) {
              this.applyOrderEvent(data.event);
              this.notifyOrderListeners();
            } else if (data.type === 'WAITER_EVENT' && data.event) {
              this.applyWaiterEvent(data.event);
              this.notifyWaiterListeners();
            }
          };
        }
      } catch (err) {
        console.warn('BroadcastChannel init error', err);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'lowkey_demo_waiter_requests' || e.key === 'lowkey_resolved_waiter_ids') {
          this.initResolvedIds();
          this.getWaiterRequests().then((reqs) => this.notifyWaiterListeners(reqs)).catch(console.error);
        }
        if (e.key === 'lowkey_demo_orders' || e.key === 'lowkey_demo_bills') {
          this.getOrders().then((ords) => this.notifyOrderListeners(ords)).catch(console.error);
        }
      });
    }
  }

  private broadcastToTabs(type: 'ORDER_EVENT' | 'WAITER_EVENT', event: any) {
    try {
      this.broadcastChannel?.postMessage({ type, event });
    } catch (err) {
      console.warn('BroadcastChannel postMessage error', err);
    }
  }

  /**
   * Non-blocking fire-and-forget cloud publisher across reliable brokers.
   * Dispatches in parallel to community brokers to ensure mobile and desktop always sync.
   */
  private publishToCloud(topic: string, body: any, title?: string) {
    if (typeof window === 'undefined') return;
    const jsonBody = typeof body === 'string' ? body : JSON.stringify(body);
    CLOUD_BROKERS.forEach((broker) => {
      try {
        let signal: AbortSignal | undefined;
        let timer: any = null;
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), 3500);
          signal = controller.signal;
        }
        fetch(`${broker}/${topic}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(title ? { Title: title } : {}),
          },
          body: jsonBody,
          signal,
        })
          .then(() => {
            if (timer) clearTimeout(timer);
          })
          .catch(() => {
            if (timer) clearTimeout(timer);
          });
      } catch (e) {
        // Non-blocking fire-and-forget
      }
    });
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

  private parsePayload<T>(raw: any): T | null {
    if (!raw) return null;
    if (typeof raw === 'object') return raw as T;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
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

    // 2. Poll past messages from cloud pubsub (last 15m)
    for (const broker of CLOUD_BROKERS) {
      try {
        let signal: AbortSignal | undefined;
        let timer: any = null;
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), 2000);
          signal = controller.signal;
        }
        const res = await fetch(`${broker}/${ORDERS_TOPIC}/json?poll=1&since=15m`, {
          headers: { 'Cache-Control': 'no-cache' },
          signal,
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.event === 'message') {
                const payload = this.parsePayload<OrderEvent>(data.message);
                if (payload) {
                  this.applyOrderEvent(payload);
                }
              }
            } catch (e) {
              // Ignore corrupted lines
            }
          }
          break; // Successfully loaded
        }
      } catch (err) {
        // Try fallback broker
      }
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

    // Publish to cloud for kitchen and waiter screens (non-blocking fire-and-forget)
    const event: OrderEvent = { action: 'CREATE', order: newOrder };
    this.broadcastToTabs('ORDER_EVENT', event);
    const isTakeaway = newOrder.tableNumber === 0 || !newOrder.tableNumber;
    const notifyTitle = isTakeaway
      ? `New Order #${newOrder.orderCode} (Takeaway Pickup)`
      : `New Order #${newOrder.orderCode} (Table ${newOrder.tableNumber})`;
    this.publishToCloud(ORDERS_TOPIC, event, notifyTitle);

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

    // Publish to cloud (non-blocking fire-and-forget)
    const event: OrderEvent = { action: 'UPDATE_STATUS', orderId, status };
    this.broadcastToTabs('ORDER_EVENT', event);
    this.publishToCloud(ORDERS_TOPIC, event, `Order #${updatedOrder.orderCode} -> ${status}`);

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
          this.ordersEventSource = new EventSource(`${PRIMARY_BROKER}/${ORDERS_TOPIC}/sse`);
          this.ordersEventSource.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.event === 'message') {
                const payload = this.parsePayload<OrderEvent>(data.message);
                if (payload) {
                  this.applyOrderEvent(payload);
                  this.notifyOrderListeners();
                }
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

    // Active resilient polling every 2.5 seconds to guarantee cross-device sync
    if (!this.ordersPollTimer) {
      this.ordersPollTimer = setInterval(async () => {
        try {
          const fresh = await this.getOrders();
          this.notifyOrderListeners(fresh);
        } catch (e) {
          // ignore network glitch
        }
      }, 2500);
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

    const subtotal = order ? order.subtotal : 249;
    const taxAmount = order ? order.taxAmount : 12.45;
    const isTakeaway = order?.tableNumber === 0;
    const serviceCharge = isTakeaway ? 0 : (order ? order.serviceCharge : 12.45);
    const finalPayableAmount = order ? order.grandTotal : 273.9;

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
          ];

    const bill: Bill = {
      id: orderId,
      billNumber: `BILL-${order ? order.orderCode.replace('ORD-', '') : orderId}`,
      orderId,
      orderCode: order ? order.orderCode : `ORD-${orderId}`,
      tableNumber: order ? order.tableNumber : 10,
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

    // Auto-resolve any pending waiter calls or cash collection requests for this table
    try {
      const requests = await this.getWaiterRequests();
      const tableReqs = requests.filter(
        (r) => r.tableNumber === bill.tableNumber && r.status !== 'RESOLVED'
      );
      for (const r of tableReqs) {
        await this.resolveWaiterRequest(r.id);
      }
    } catch (e) {
      console.warn('Auto resolve waiter request on payment error', e);
    }

    const event: OrderEvent = { action: 'RECORD_PAYMENT', orderId: bill.orderId, bill: paidBill };
    this.broadcastToTabs('ORDER_EVENT', event);
    this.publishToCloud(ORDERS_TOPIC, event, `Bill Paid #${paidBill.billNumber}`);

    console.log('💳 Payment completed and recorded for Bill #', paidBill.billNumber);
    return paidBill;
  }

  // ==========================================
  // DYNAMIC TABLES MANAGEMENT
  // ==========================================

  /**
   * Derives live table status for all 10 tables based on active orders & waiter calls.
   */
  async getTables(): Promise<Table[]> {
    const orders = await this.getOrders();
    const requests = await this.getWaiterRequests();

    const activeOrders = orders.filter(
      (o) => o && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
    );

    return MOCK_TABLES.map((t) => {
      // Find active order for this table
      const tableOrder = activeOrders.find((o) => o.tableNumber === t.tableNumber);
      // Find pending or in-progress waiter call
      const tableReq = requests.find(
        (r) => r.tableNumber === t.tableNumber && r.status !== 'RESOLVED'
      );

      let status = 'AVAILABLE';
      if (tableReq) {
        status = tableReq.requestType === 'BILL_REQUEST' ? 'BILLING_REQUESTED' : 'ASSISTANCE_REQUESTED';
      } else if (tableOrder) {
        if (tableOrder.status === 'PREPARING' || tableOrder.status === 'ACCEPTED' || tableOrder.status === 'NEW_ORDER') {
          status = 'PREPARING';
        } else if (tableOrder.status === 'READY') {
          status = 'FOOD_READY';
        } else if (tableOrder.status === 'SERVED') {
          status = 'OCCUPIED';
        } else {
          status = 'OCCUPIED';
        }
      }

      return {
        ...t,
        status,
        activeOrderId: tableOrder?.id,
        activeOrderCode: tableOrder?.orderCode,
      };
    });
  }

  /**
   * Clears a table: marks its active order as COMPLETED, resolves its waiter calls, and frees the table.
   */
  async clearTable(tableNumber: number): Promise<void> {
    const orders = await this.getOrders();
    const tableOrders = orders.filter(
      (o) => o.tableNumber === tableNumber && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
    );
    for (const o of tableOrders) {
      await this.updateOrderStatus(o.id, 'COMPLETED');
    }

    const requests = await this.getWaiterRequests();
    const tableReqs = requests.filter(
      (r) => r.tableNumber === tableNumber && r.status !== 'RESOLVED'
    );
    for (const r of tableReqs) {
      await this.resolveWaiterRequest(r.id);
    }
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

    // 2. Load locally stored requests (from Diner tab or previous actions)
    try {
      const localRaw = localStorage.getItem('lowkey_demo_waiter_requests');
      if (localRaw) {
        const localList: WaiterRequest[] = JSON.parse(localRaw);
        if (Array.isArray(localList)) {
          localList.forEach((r) => {
            if (!this.resolvedWaiterIds.has(r.id)) {
              this.waiterRequestsMap.set(r.id, r);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse local waiter requests', e);
    }

    // 3. Poll past messages from cloud store (last 15m)
    for (const broker of CLOUD_BROKERS) {
      try {
        let signal: AbortSignal | undefined;
        let timer: any = null;
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), 2000);
          signal = controller.signal;
        }
        const res = await fetch(`${broker}/${WAITER_TOPIC}/json?poll=1&since=15m`, {
          headers: { 'Cache-Control': 'no-cache' },
          signal,
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.event === 'message') {
                const payload = this.parsePayload<WaiterEvent>(data.message);
                if (payload) {
                  this.applyWaiterEvent(payload);
                }
              }
            } catch (e) {
              // Ignore corrupted lines
            }
          }
          break; // Successfully loaded
        }
      } catch (err) {
        // Try fallback broker
      }
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

    // Broadcast to cloud and local tabs for waiter screens (non-blocking)
    const event: WaiterEvent = { action: 'CALL', request: req };
    this.broadcastToTabs('WAITER_EVENT', event);
    this.publishToCloud(WAITER_TOPIC, event, `Table #${req.tableNumber} - ${req.requestType}`);

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

    // Broadcast to cloud and local tabs (non-blocking)
    const event: WaiterEvent = { action: 'ACCEPT', id, waiterName };
    this.broadcastToTabs('WAITER_EVENT', event);
    this.publishToCloud(WAITER_TOPIC, event, `Call Accepted for Table`);

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

    // Broadcast to cloud and local tabs (non-blocking)
    const event: WaiterEvent = { action: 'RESOLVE', id };
    this.broadcastToTabs('WAITER_EVENT', event);
    this.publishToCloud(WAITER_TOPIC, event, `Call Resolved`);

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
          this.waiterEventSource = new EventSource(`${PRIMARY_BROKER}/${WAITER_TOPIC}/sse`);
          this.waiterEventSource.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.event === 'message') {
                const payload = this.parsePayload<WaiterEvent>(data.message);
                if (payload) {
                  this.applyWaiterEvent(payload);
                  this.notifyWaiterListeners();
                }
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

    // Safety fallback poll every 15 seconds (only when SSE is not open)
    if (!this.waiterPollTimer) {
      this.waiterPollTimer = setInterval(async () => {
        if (this.waiterEventSource && this.waiterEventSource.readyState === 1) {
          return;
        }
        try {
          const fresh = await this.getWaiterRequests();
          this.notifyWaiterListeners(fresh);
        } catch (e) {
          console.warn('Periodic waiter poll error', e);
        }
      }, 15000);
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
