import { Order, OrderStatus, WaiterRequest, Bill, Table } from '../types';
import { MOCK_ORDERS, MOCK_WAITER_REQUESTS, MOCK_TABLES } from './mockData';

// Unblocked, high-performance community brokers with instant SSE
const CLOUD_BROKERS = [
  'https://ntfy.adminforge.de',
  'https://ntfy.envs.net',
  'https://ntfy.tedomum.fr',
  'https://ntfy.projectsegfau.lt',
  'https://ntfy.sh',
];
const PRIMARY_BROKER = CLOUD_BROKERS[0];
const ORDERS_TOPIC = 'lowkey_cafe_orders_v8_clean';
const WAITER_TOPIC = 'lowkey_cafe_waiter_v8_clean';
const DISMISSED_ORDER_CODES = new Set(['ORD-556609', 'ORD-397384', 'ORD-255965', 'ORD-138122', 'ORD-146547', 'ORD-849201', 'ORD-849202']);

interface OrderEvent {
  action: 'CREATE' | 'UPDATE_STATUS' | 'RECORD_PAYMENT' | 'CLEAR_ALL';
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
  private dismissedOrderIds: Set<number> = new Set();

  private orderListeners: Array<(orders: Order[]) => void> = [];
  private waiterListeners: Array<(requests: WaiterRequest[]) => void> = [];

  private ordersEventSource: EventSource | null = null;
  private waiterEventSource: EventSource | null = null;

  private ordersPollTimer: any = null;
  private waiterPollTimer: any = null;
  private broadcastChannel: BroadcastChannel | null = null;

  private lastOrdersFetchTime: number = 0;
  private lastWaiterFetchTime: number = 0;
  private isFetchingOrders: boolean = false;
  private isFetchingWaiter: boolean = false;

  constructor() {
    this.purgeLegacyDemoOrders();
    this.initResolvedIds();
    this.initDismissedOrderIds();
    this.initCrossTabSync();
  }

  private purgeLegacyDemoOrders() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem('lowkey_purged_demo_orders_v8')) {
        localStorage.removeItem('lowkey_demo_orders');
        localStorage.removeItem('lowkey_demo_bills');
        localStorage.removeItem('lowkey_demo_waiter_requests');
        localStorage.removeItem('lowkey_resolved_waiter_ids');
        localStorage.removeItem('lowkey_dismissed_orders');
        localStorage.setItem('lowkey_purged_demo_orders_v8', 'true');
      }
    } catch (e) {
      console.warn('Purge error', e);
    }
  }

  private initCrossTabSync() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('lowkey_cafe_sync_v8');
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
        if (e.key === 'lowkey_demo_orders' || e.key === 'lowkey_demo_bills' || e.key === 'lowkey_dismissed_orders') {
          this.initDismissedOrderIds();
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
            'Priority': 'urgent',
            'X-Priority': '5',
            'X-Tags': 'fast_sync',
            'Cache-Control': 'no-cache',
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

  private initDismissedOrderIds() {
    try {
      const raw = localStorage.getItem('lowkey_dismissed_orders');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          this.dismissedOrderIds = new Set(ids.map(Number));
        }
      }
    } catch (e) {
      console.warn('Failed to load dismissed order IDs', e);
    }
  }

  async dismissOrder(orderId: number): Promise<void> {
    const numId = Number(orderId);
    this.dismissedOrderIds.add(numId);
    try {
      localStorage.setItem('lowkey_dismissed_orders', JSON.stringify(Array.from(this.dismissedOrderIds)));
    } catch (e) {}

    this.ordersMap.delete(numId);
    this.lastOrdersFetchTime = 0;

    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
    const nextLocal = localOrders.filter((o) => Number(o.id) !== numId);
    localStorage.setItem('lowkey_demo_orders', JSON.stringify(nextLocal));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: { id: numId, status: 'CANCELLED' } }));
    }

    const event: OrderEvent = { action: 'UPDATE_STATUS', orderId: numId, status: 'CANCELLED' };
    this.broadcastToTabs('ORDER_EVENT', event);
    this.publishToCloud(ORDERS_TOPIC, event, `Order Dismissed`);
    this.notifyOrderListeners();
  }

  async clearAllTakeaways(): Promise<void> {
    const orders = await this.getOrders();
    const takeaways = orders.filter((o) => o.tableNumber === 0 || !o.tableNumber);
    for (const t of takeaways) {
      await this.dismissOrder(t.id);
    }
  }

  async clearAllOrders(): Promise<void> {
    this.ordersMap.clear();
    this.dismissedOrderIds.clear();
    try {
      localStorage.removeItem('lowkey_demo_orders');
      localStorage.removeItem('lowkey_demo_bills');
      localStorage.removeItem('lowkey_dismissed_orders');
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: { cleared: true } }));
    }

    const event: any = { action: 'CLEAR_ALL' };
    this.broadcastToTabs('ORDER_EVENT', event);
    this.publishToCloud(ORDERS_TOPIC, event, 'All Orders Cleared');
    this.notifyOrderListeners([]);
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
   * Throttled to prevent 429 rate limits across tabs and views.
   */
  async getOrders(force = false): Promise<Order[]> {
    // 1. Load locally placed orders
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];

    localOrders.forEach((o) => {
      this.ordersMap.set(o.id, o);
    });

    const now = Date.now();
    // Return cached orders immediately if fetched within the last 1000ms unless forced
    if (!force && this.lastOrdersFetchTime > 0 && now - this.lastOrdersFetchTime < 1000) {
      return Array.from(this.ordersMap.values())
        .filter((o) => !this.dismissedOrderIds.has(Number(o.id)) && !DISMISSED_ORDER_CODES.has(o.orderCode))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (this.isFetchingOrders) {
      return Array.from(this.ordersMap.values())
        .filter((o) => !this.dismissedOrderIds.has(Number(o.id)) && !DISMISSED_ORDER_CODES.has(o.orderCode))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    this.isFetchingOrders = true;
    this.lastOrdersFetchTime = now;

    // 2. Poll past messages from cloud pubsub (last 12h so shift orders persist)
    for (const broker of CLOUD_BROKERS) {
      try {
        let signal: AbortSignal | undefined;
        let timer: any = null;
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), 2500);
          signal = controller.signal;
        }
        const res = await fetch(`${broker}/${ORDERS_TOPIC}/json?poll=1&since=12h`, {
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
          break; // Successfully loaded from this broker
        }
      } catch (err) {
        // Try fallback broker
      }
    }

    this.isFetchingOrders = false;

    const merged = Array.from(this.ordersMap.values())
      .filter((o) => !this.dismissedOrderIds.has(Number(o.id)) && !DISMISSED_ORDER_CODES.has(o.orderCode))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    try {
      localStorage.setItem('lowkey_demo_orders', JSON.stringify(merged));
    } catch (ignored) {}

    return merged;
  }

  private applyOrderEvent(evt: OrderEvent) {
    if (!evt || !evt.action) return;

    if (evt.action === 'CLEAR_ALL') {
      this.ordersMap.clear();
      this.dismissedOrderIds.clear();
      try {
        localStorage.removeItem('lowkey_demo_orders');
        localStorage.removeItem('lowkey_demo_bills');
        localStorage.removeItem('lowkey_dismissed_orders');
      } catch (e) {}
      return;
    }

    if (evt.action === 'CREATE' && evt.order) {
      const numId = Number(evt.order.id);
      if (!this.dismissedOrderIds.has(numId) && !DISMISSED_ORDER_CODES.has(evt.order.orderCode)) {
        this.ordersMap.set(numId, evt.order);
      }
    } else if (evt.action === 'UPDATE_STATUS' && evt.orderId && evt.status) {
      const numId = Number(evt.orderId);
      if (evt.status === 'CANCELLED') {
        this.dismissedOrderIds.add(numId);
        this.ordersMap.delete(numId);
        this.lastOrdersFetchTime = 0;
      } else {
        const existing = this.ordersMap.get(numId);
        const updated = existing ? { ...existing, status: evt.status, ...(evt.order || {}) } : (evt.order || null);
        if (updated && !DISMISSED_ORDER_CODES.has(updated.orderCode) && !this.dismissedOrderIds.has(numId)) {
          this.ordersMap.set(numId, updated);
          try {
            const raw = localStorage.getItem('lowkey_demo_orders');
            const list: Order[] = raw ? JSON.parse(raw) : [];
            const next = list.map(o => Number(o.id) === numId ? { ...o, ...updated, status: evt.status } : o);
            if (!list.some(o => Number(o.id) === numId)) {
              next.unshift(updated);
            }
            localStorage.setItem('lowkey_demo_orders', JSON.stringify(next));
          } catch (e) {}
        }
        this.lastOrdersFetchTime = 0;
      }
    } else if (evt.action === 'RECORD_PAYMENT' && evt.orderId) {
      const numId = Number(evt.orderId);
      const existing = this.ordersMap.get(numId);
      if (existing && (existing.status === 'READY' || existing.status === 'SERVED')) {
        this.ordersMap.set(numId, { ...existing, status: 'COMPLETED' });
      }
    }
  }

  /**
   * Saves a new order, creates initial bill, saves to localStorage, dispatches local event, and broadcasts to cloud.
   */
  async createOrder(newOrder: Order): Promise<Order> {
    this.ordersMap.set(newOrder.id, newOrder);
    this.lastOrdersFetchTime = 0;

    // Save order locally
    const localRaw = localStorage.getItem('lowkey_demo_orders');
    const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
    const updatedLocal = [newOrder, ...localOrders.filter((o) => o.id !== newOrder.id)];
    localStorage.setItem('lowkey_demo_orders', JSON.stringify(updatedLocal));

    // Auto-generate and save initial Bill so takeaway & dine-in bills are always immediately available
    const initialBill: Bill = {
      id: newOrder.id,
      billNumber: `BILL-${newOrder.orderCode.replace('ORD-', '')}`,
      orderId: newOrder.id,
      orderCode: newOrder.orderCode,
      tableNumber: newOrder.tableNumber,
      subtotal: newOrder.subtotal,
      taxAmount: newOrder.taxAmount,
      serviceCharge: newOrder.serviceCharge,
      discountAmount: newOrder.discountAmount,
      tipAmount: 0,
      loyaltyDiscount: 0,
      finalPayableAmount: newOrder.grandTotal,
      paidAmount: 0,
      status: 'UNPAID',
      createdAt: newOrder.createdAt,
      splits: [],
      items: newOrder.items.map((i) => ({
        id: i.id,
        itemName: i.foodItemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.subtotal,
      })),
    };
    try {
      const settledBills: Record<string, Bill> = JSON.parse(
        localStorage.getItem('lowkey_demo_bills') || '{}'
      );
      settledBills[newOrder.id] = initialBill;
      localStorage.setItem('lowkey_demo_bills', JSON.stringify(settledBills));
    } catch (e) {
      console.warn('Failed to save initial bill', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: newOrder }));
      window.dispatchEvent(new CustomEvent('lowkey_bill_update', { detail: initialBill }));
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
   * If fallbackOrder is provided (e.g. from KDS screen state), it ensures the order details,
   * tableNumber, customerName and items are 100% preserved without ever generating a fake takeaway order.
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    _reason?: string,
    fallbackOrder?: Order
  ): Promise<Order | null> {
    const numId = Number(orderId);
    let order = this.ordersMap.get(numId);

    // 1. Try finding by matching string or number ID in ordersMap
    if (!order) {
      for (const o of this.ordersMap.values()) {
        if (Number(o.id) === numId || String(o.id) === String(orderId)) {
          order = o;
          break;
        }
      }
    }

    // 2. Try fallbackOrder passed directly from KDS
    if (!order && fallbackOrder && (Number(fallbackOrder.id) === numId || String(fallbackOrder.id) === String(orderId))) {
      order = fallbackOrder;
    }

    // 3. Try local storage
    if (!order) {
      try {
        const localRaw = localStorage.getItem('lowkey_demo_orders');
        const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
        order = localOrders.find((o) => Number(o.id) === numId || String(o.id) === String(orderId));
      } catch (e) {}
    }

    // 4. Try network fetch if still not found
    if (!order) {
      const orders = await this.getOrders();
      order = orders.find((o) => Number(o.id) === numId || String(o.id) === String(orderId));
    }

    // 5. Final fallback to fallbackOrder if provided
    if (!order && fallbackOrder) {
      order = fallbackOrder;
    }

    if (!order) {
      console.warn(`Order #${orderId} not found in cloudSync to update status to ${status}`);
      return null;
    }

    const updatedOrder: Order = {
      ...order,
      status,
      items: Array.isArray(order.items) ? order.items : [],
    };

    this.ordersMap.set(numId, updatedOrder);
    this.lastOrdersFetchTime = 0;

    // Save locally
    try {
      const localRaw = localStorage.getItem('lowkey_demo_orders');
      const localOrders: Order[] = localRaw ? JSON.parse(localRaw) : [];
      const nextLocal = [updatedOrder, ...localOrders.filter((o) => Number(o.id) !== numId)];
      localStorage.setItem('lowkey_demo_orders', JSON.stringify(nextLocal));
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: updatedOrder }));
    }

    // Publish to cloud with full updated order data (non-blocking fire-and-forget)
    const event: OrderEvent = { action: 'UPDATE_STATUS', orderId: numId, status, order: updatedOrder };
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

    const initSSE = () => {
      if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
        if (!this.ordersEventSource || this.ordersEventSource.readyState === EventSource.CLOSED) {
          try {
            if (this.ordersEventSource) {
              try { this.ordersEventSource.close(); } catch (e) {}
            }
            this.ordersEventSource = new EventSource(`${PRIMARY_BROKER}/${ORDERS_TOPIC}/sse`);
            this.ordersEventSource.onmessage = (e) => {
              try {
                const data = JSON.parse(e.data);
                if (data.event === 'message') {
                  const payload = this.parsePayload<OrderEvent>(data.message);
                  if (payload) {
                    this.applyOrderEvent(payload);
                    this.notifyOrderListeners();
                    const dispatchOrder = payload.order || (payload.orderId ? this.ordersMap.get(Number(payload.orderId)) : null);
                    if (typeof window !== 'undefined' && dispatchOrder) {
                      window.dispatchEvent(new CustomEvent('lowkey_order_update', { detail: dispatchOrder }));
                    }
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
    };

    initSSE();

    // Instant mobile refresh: when screen unlocks or user returns to tab
    const handleOrderWakeup = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      initSSE();
      this.getOrders(true).then((ords) => this.notifyOrderListeners(ords)).catch(() => {});
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleOrderWakeup);
      window.addEventListener('focus', handleOrderWakeup);
      window.addEventListener('online', handleOrderWakeup);
    }

    // Ultra-responsive fallback polling (3.5s) to guarantee instant sync across mobile & desktop
    if (!this.ordersPollTimer) {
      this.ordersPollTimer = setInterval(async () => {
        try {
          const fresh = await this.getOrders(true);
          this.notifyOrderListeners(fresh);
        } catch (e) {
          // ignore network glitch
        }
      }, 3500);
    }

    return () => {
      this.orderListeners = this.orderListeners.filter((l) => l !== callback);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleOrderWakeup);
        window.removeEventListener('focus', handleOrderWakeup);
        window.removeEventListener('online', handleOrderWakeup);
      }
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
    const cleanCode = (orderCode || '').trim().toUpperCase();
    if (!cleanCode) return null;

    // 1. Instant check in-memory map (0ms)
    for (const order of this.ordersMap.values()) {
      if (order.orderCode && order.orderCode.trim().toUpperCase() === cleanCode) {
        return order;
      }
    }

    // 2. Instant check localStorage (0ms)
    try {
      const localRaw = localStorage.getItem('lowkey_demo_orders');
      if (localRaw) {
        const localOrders: Order[] = JSON.parse(localRaw);
        if (Array.isArray(localOrders)) {
          const match = localOrders.find((o) => o.orderCode && o.orderCode.trim().toUpperCase() === cleanCode);
          if (match) {
            this.ordersMap.set(Number(match.id), match);
            return match;
          }
        }
      }
    } catch (e) {}

    // 3. Fallback to network query
    const orders = await this.getOrders();
    const found = orders.find((o) => o.orderCode && o.orderCode.trim().toUpperCase() === cleanCode);
    return found || null;
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

    try {
      settledBills[orderId] = bill;
      localStorage.setItem('lowkey_demo_bills', JSON.stringify(settledBills));
    } catch (e) {
      console.warn('Failed to cache bill', e);
    }

    return bill;
  }

  async saveBill(bill: Bill): Promise<Bill> {
    try {
      const settledBills: Record<string, Bill> = JSON.parse(
        localStorage.getItem('lowkey_demo_bills') || '{}'
      );
      settledBills[bill.orderId] = bill;
      localStorage.setItem('lowkey_demo_bills', JSON.stringify(settledBills));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lowkey_bill_update', { detail: bill }));
      }
    } catch (e) {
      console.warn('Failed to save bill', e);
    }
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

    // For active kitchen preparation, customer payment does NOT mean food is picked up or finished cooking!
    // Only mark COMPLETED if the food was already SERVED or READY for pickup.
    const currentOrder = this.ordersMap.get(Number(bill.orderId));
    if (currentOrder && (currentOrder.status === 'READY' || currentOrder.status === 'SERVED')) {
      await this.updateOrderStatus(bill.orderId, 'COMPLETED');
    }

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
   * Throttled to prevent 429 rate limits.
   */
  async getWaiterRequests(force = false): Promise<WaiterRequest[]> {
    // 1. Load locally stored requests (from Diner tab or previous actions)
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

    const now = Date.now();
    if (!force && this.lastWaiterFetchTime > 0 && now - this.lastWaiterFetchTime < 1000) {
      return Array.from(this.waiterRequestsMap.values())
        .filter((r) => !this.resolvedWaiterIds.has(r.id) && r.status !== 'RESOLVED')
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }

    if (this.isFetchingWaiter) {
      return Array.from(this.waiterRequestsMap.values())
        .filter((r) => !this.resolvedWaiterIds.has(r.id) && r.status !== 'RESOLVED')
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }

    this.isFetchingWaiter = true;
    this.lastWaiterFetchTime = now;

    // 3. Poll past messages from cloud store (last 12h)
    for (const broker of CLOUD_BROKERS) {
      try {
        let signal: AbortSignal | undefined;
        let timer: any = null;
        if (typeof AbortController !== 'undefined') {
          const controller = new AbortController();
          timer = setTimeout(() => controller.abort(), 2000);
          signal = controller.signal;
        }
        const res = await fetch(`${broker}/${WAITER_TOPIC}/json?poll=1&since=12h`, {
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

    this.isFetchingWaiter = false;

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
    this.lastWaiterFetchTime = 0;

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
      this.lastWaiterFetchTime = 0;
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
    this.lastWaiterFetchTime = 0;

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

    const initWaiterSSE = () => {
      if (typeof window !== 'undefined' && typeof window.EventSource !== 'undefined') {
        if (!this.waiterEventSource || this.waiterEventSource.readyState === EventSource.CLOSED) {
          try {
            if (this.waiterEventSource) {
              try { this.waiterEventSource.close(); } catch (e) {}
            }
            this.waiterEventSource = new EventSource(`${PRIMARY_BROKER}/${WAITER_TOPIC}/sse`);
            this.waiterEventSource.onmessage = (e) => {
              try {
                const data = JSON.parse(e.data);
                if (data.event === 'message') {
                  const payload = this.parsePayload<WaiterEvent>(data.message);
                  if (payload) {
                    this.applyWaiterEvent(payload);
                    this.notifyWaiterListeners();
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('lowkey_waiter_update'));
                    }
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
    };

    initWaiterSSE();

    // Mobile wakeup listener: when phone is unlocked or browser tab focused
    const handleWaiterWakeup = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      initWaiterSSE();
      this.getWaiterRequests(true).then((reqs) => this.notifyWaiterListeners(reqs)).catch(() => {});
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleWaiterWakeup);
      window.addEventListener('focus', handleWaiterWakeup);
      window.addEventListener('online', handleWaiterWakeup);
    }

    // Safety fallback poll every 3.5 seconds
    if (!this.waiterPollTimer) {
      this.waiterPollTimer = setInterval(async () => {
        try {
          const fresh = await this.getWaiterRequests(true);
          this.notifyWaiterListeners(fresh);
        } catch (e) {
          // ignore network glitch
        }
      }, 3500);
    }

    return () => {
      this.waiterListeners = this.waiterListeners.filter((l) => l !== callback);
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWaiterWakeup);
        window.removeEventListener('focus', handleWaiterWakeup);
        window.removeEventListener('online', handleWaiterWakeup);
      }
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
