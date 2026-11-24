import React, { useState, useEffect } from 'react';
import { waiterApi, tableApi, billingApi, kitchenApi } from '../services/api';
import { cloudSync } from '../services/cloudSyncService';
import { Table, WaiterRequest, Bill, Order } from '../types';
import wsService from '../services/websocket';
import { Link } from 'react-router-dom';
import {
  Users,
  Bell,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Coffee,
  Banknote,
  AlertCircle,
  Check,
  Receipt,
  Utensils,
  Droplets,
  HelpCircle,
  MessageSquare,
  ChefHat,
  Trash2,
  ShoppingBag,
} from 'lucide-react';

export const WaiterDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [takeawayOrders, setTakeawayOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableBill, setTableBill] = useState<Bill | null>(null);

  // Load floor tables, takeaway orders, and assistance requests
  const loadFloor = () => {
    tableApi.getTables().then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setTables(list);
      setSelectedTable((curr) => {
        if (!curr) return null;
        return list.find((t) => t.tableNumber === curr.tableNumber) || curr;
      });
    }).catch(console.error);

    waiterApi.getRequests().then((res) => {
      const activeList = Array.isArray(res.data) ? res.data.filter((r) => r.status !== 'RESOLVED') : [];
      setRequests(activeList);
    }).catch(console.error);

    cloudSync.getOrders().then((allOrders) => {
      const activeTakeaways = (allOrders || []).filter(
        (o) => (o.tableNumber === 0 || !o.tableNumber) && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
      );
      setTakeawayOrders(activeTakeaways);
    }).catch(console.error);
  };

  useEffect(() => {
    loadFloor();

    // 1. Subscribe to live cloud orders (so tables update immediately when orders placed or advance)
    const unsubOrders = cloudSync.subscribeToOrders(() => {
      loadFloor();
    });

    // 2. Subscribe to live cloud waiter requests (cross-device sync)
    const unsubWaiter = cloudSync.subscribeToWaiterRequests((reqList) => {
      setRequests((prev) => {
        const prevIds = new Set(prev.map((r) => r.id));
        const hasNew = reqList.some((r) => !prevIds.has(r.id));
        if (hasNew) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (ignored) {}
        }
        return reqList;
      });
      loadFloor();
    });

    // 3. Event listener for local waiter requests synchronization
    const handleSync = () => {
      waiterApi.getRequests().then((res) => {
        const activeList = Array.isArray(res.data) ? res.data.filter((r) => r.status !== 'RESOLVED') : [];
        setRequests(activeList);
        loadFloor();
      }).catch(console.error);
    };
    window.addEventListener('lowkey_waiter_update', handleSync);

    // 4. Event listener for local order updates (instant cross-tab sync)
    const handleLocalOrder = () => {
      loadFloor();
    };
    window.addEventListener('lowkey_order_update', handleLocalOrder);

    // 5. Subscribe to table floor updates
    const subTables = wsService.subscribe('/topic/tables', (updatedTable: Table) => {
      setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
    });

    // 6. Subscribe to incoming waiter requests via websocket
    const subRequests = wsService.subscribe('/topic/waiter-requests', (newOrUpdatedReq: WaiterRequest) => {
      setRequests((prev) => {
        if (newOrUpdatedReq.status === 'RESOLVED') {
          return prev.filter((r) => r.id !== newOrUpdatedReq.id);
        }
        const idx = prev.findIndex((r) => r.id === newOrUpdatedReq.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = newOrUpdatedReq;
          return next;
        } else {
          return [newOrUpdatedReq, ...prev];
        }
      });
      loadFloor();
    });

    return () => {
      unsubOrders();
      unsubWaiter();
      window.removeEventListener('lowkey_waiter_update', handleSync);
      window.removeEventListener('lowkey_order_update', handleLocalOrder);
      wsService.unsubscribe(subTables);
      wsService.unsubscribe(subRequests);
    };
  }, []);

  // Takeaway handlers
  const handleSettleTakeaway = async (orderId: number) => {
    try {
      const bill = await cloudSync.getBillForOrder(orderId);
      await billingApi.recordCashPayment({ billId: bill.id, tipAmount: 0 });
      const orders = await cloudSync.getOrders();
      const order = orders.find((o) => Number(o.id) === Number(orderId));
      if (order && (order.status === 'READY' || order.status === 'SERVED')) {
        await kitchenApi.updateOrderStatus(orderId, 'COMPLETED');
      }
      loadFloor();
    } catch (e) {
      console.error(e);
    }
  };

  const handleHandoverTakeaway = async (orderId: number) => {
    try {
      await kitchenApi.updateOrderStatus(orderId, 'COMPLETED');
      loadFloor();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissTakeaway = async (orderId: number) => {
    try {
      await cloudSync.dismissOrder(orderId);
      setTakeawayOrders((prev) => prev.filter((o) => o.id !== orderId));
      loadFloor();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllTakeaways = async () => {
    try {
      await cloudSync.clearAllTakeaways();
      setTakeawayOrders([]);
      loadFloor();
    } catch (e) {
      console.error(e);
    }
  };

  // Advance order status from table inspection drawer
  const handleAdvanceTableOrder = async (orderId: number, status: 'READY' | 'SERVED') => {
    try {
      await kitchenApi.updateOrderStatus(orderId, status);
      await loadFloor();
      if (selectedTable) {
        setSelectedTable((prev) => (prev ? { ...prev, status: status === 'READY' ? 'FOOD_READY' : 'OCCUPIED' } : null));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSettleTableBill = async (bill: Bill) => {
    try {
      await billingApi.recordCashPayment({ billId: bill.id, tipAmount: 0 });
      await loadFloor();
      setTableBill((prev) => (prev ? { ...prev, status: 'PAID' } : null));
      setSelectedTable((prev) => (prev ? { ...prev, status: 'AVAILABLE', activeOrderId: undefined, activeOrderCode: undefined } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearTable = async (tableNum: number) => {
    try {
      await cloudSync.clearTable(tableNum);
      await loadFloor();
      setSelectedTable(null);
      setTableBill(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptRequest = async (id: number) => {
    try {
      const res = await waiterApi.acceptRequest(id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...res.data,
                status: 'IN_PROGRESS',
                assignedWaiterName: res.data.assignedWaiterName || 'Lead Waiter Alex',
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'IN_PROGRESS', assignedWaiterName: 'Lead Waiter Alex' } : r
        )
      );
    }
  };

  const handleResolveRequest = async (id: number) => {
    try {
      await waiterApi.resolveRequest(id);
      const targetReq = requests.find((r) => r.id === id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (targetReq) {
        setTables((prev) =>
          prev.map((t) =>
            t.tableNumber === targetReq.tableNumber && (t.status === 'ASSISTANCE_REQUESTED' || t.status === 'BILLING_REQUESTED')
              ? { ...t, status: t.activeOrderId ? 'OCCUPIED' : 'AVAILABLE' }
              : t
          )
        );
      }
    } catch (err) {
      console.error(err);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (table.activeOrderId) {
      billingApi.getBillForOrder(table.activeOrderId)
        .then((res) => setTableBill(res.data))
        .catch(() => setTableBill(null));
    } else {
      setTableBill(null);
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-400';
      case 'OCCUPIED':
        return 'bg-blue-950/30 border-blue-500/40 text-blue-300 hover:border-blue-400';
      case 'ORDER_RECEIVED':
        return 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400';
      case 'PREPARING':
        return 'bg-orange-950/40 border-orange-500/50 text-orange-300 hover:border-orange-400';
      case 'FOOD_READY':
        return 'bg-emerald-500 border-emerald-400 text-stone-950 animate-bounce font-black shadow-lg shadow-emerald-500/30';
      case 'ASSISTANCE_REQUESTED':
        return 'bg-rose-950/50 text-rose-300 border-rose-500 animate-pulse font-bold';
      case 'BILLING_REQUESTED':
        return 'bg-purple-950/60 border-purple-500 text-purple-200 font-black animate-pulse shadow-lg shadow-purple-500/30';
      default:
        return 'bg-stone-900/60 border-stone-800 text-stone-400';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'BILL_REQUEST': return Banknote;
      case 'WATER': return Droplets;
      case 'EXTRA_PLATES': return Utensils;
      case 'MENU_HELP': return HelpCircle;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="h-16 bg-stone-900/90 backdrop-blur-xl border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors border border-stone-700/60"
            title="Exit to Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-brand-400 flex items-center justify-center font-bold border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-white leading-tight">
                Waiter & Floor Management
              </h1>
              <p className="text-[10px] text-amber-400/90 font-mono -mt-0.5">LOWKEY CAFE • REAL-TIME TABLE DISPATCH</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-stone-800 text-xs font-semibold text-stone-300 border border-stone-700">
            {requests.length} Pending Calls
          </span>
          <button
            onClick={loadFloor}
            className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-stone-950 rounded-xl text-xs font-extrabold shadow-md shadow-brand-500/20 transition-all"
          >
            Refresh Floor
          </button>
        </div>
      </header>

      {/* Main Grid: Floor View (Left) & Live Feed (Right) */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Floor Map & Takeaway Counter */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Takeaway & Pickup Counter Bar */}
          <div className="bg-stone-900/80 backdrop-blur-md p-5 rounded-3xl border border-stone-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold border border-yellow-400/30">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    Takeaway & Pickup Counter
                  </h3>
                  <p className="text-xs text-stone-400">
                    {takeawayOrders.length} active takeaway orders awaiting prep or pickup
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {takeawayOrders.length > 0 && (
                  <button
                    onClick={handleClearAllTakeaways}
                    className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 text-stone-400 border border-stone-700 text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Dismiss / clear all takeaway tickets"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Clear All</span>
                  </button>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  takeawayOrders.length > 0
                    ? 'bg-yellow-400 text-black shadow-sm shadow-yellow-400/30'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}>
                  {takeawayOrders.length} In Queue
                </span>
              </div>
            </div>

            {takeawayOrders.length === 0 ? (
              <div className="py-3 text-center bg-stone-950/50 rounded-2xl border border-stone-800/80 text-xs text-stone-400">
                No active takeaway tickets. All takeaway orders have been collected!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {takeawayOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-2xl bg-stone-950/70 border border-yellow-400/30 flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/15 border border-yellow-400/30">
                            {o.orderCode}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {o.customerName || 'Takeaway Diner'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">
                          {o.items.map((i) => `${i.foodItemName} x${i.quantity}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-yellow-400">
                          ₹{o.grandTotal.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDismissTakeaway(o.id)}
                          className="p-1 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                          title="Dismiss takeaway ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'READY'
                          ? 'bg-yellow-400 text-black animate-pulse'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      }`}>
                        {o.status === 'READY' ? 'Ready for Pickup' : o.status}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSettleTakeaway(o.id)}
                          className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold border border-stone-700 transition-colors"
                        >
                          Collect Cash
                        </button>
                        <button
                          onClick={() => handleHandoverTakeaway(o.id)}
                          className="px-2.5 py-1 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-black transition-all"
                        >
                          Hand Over
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-stone-900/80 backdrop-blur-md p-5 rounded-3xl border border-stone-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base text-white">
                  Floor View ({tables.length} Tables)
                </h3>
                <p className="text-xs text-stone-400">Tap any table to view ticket details or record payment</p>
              </div>

              {/* Status Legend */}
              <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-semibold text-stone-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Avail</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Occupied</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400"></span> In Prep</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Needs Server</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span> Collect Cash</span>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {tables.map((table) => {
                const colorClass = getTableStatusColor(table.status);
                const isSelected = selectedTable?.id === table.id;

                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[110px] transition-all backdrop-blur-sm ${colorClass} ${
                      isSelected ? 'ring-4 ring-brand-500/60 shadow-xl scale-[1.03]' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {table.floorZone}
                    </span>
                    <span className="font-display font-black text-2xl my-1 text-white">
                      T-{table.tableNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                      {table.status.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Table Inspection Drawer */}
          {selectedTable && (
            <div className="bg-stone-900/90 backdrop-blur-md p-5 rounded-3xl border border-brand-500/40 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <h4 className="font-display font-bold text-base text-white">
                    Table #{selectedTable.tableNumber} Details
                  </h4>
                  <p className="text-xs text-stone-400">
                    Zone: {selectedTable.floorZone} • Capacity: {selectedTable.seatingCapacity} Guests
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-xs text-stone-400 hover:text-white px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-stone-400 block">Current Status</span>
                  <span className="font-bold text-sm text-brand-400">
                    {selectedTable.status}
                  </span>
                  {selectedTable.activeOrderCode && (
                    <p className="text-xs text-stone-300 mt-1">
                      Active Ticket: <strong className="font-mono text-white">{selectedTable.activeOrderCode}</strong>
                    </p>
                  )}
                </div>

                {tableBill && (
                  <div className="text-right">
                    <span className="text-xs text-stone-400 block">Total Due</span>
                    <span className="font-display font-black text-xl text-brand-400">
                      ₹{tableBill.finalPayableAmount}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 block mt-0.5">
                      {tableBill.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Floor Staff Action Bar */}
              {selectedTable.activeOrderId && (
                <div className="mt-4 pt-3 border-t border-stone-800 flex flex-wrap items-center gap-2">
                  {(selectedTable.status === 'PREPARING' || selectedTable.status === 'ORDER_RECEIVED') && (
                    <button
                      onClick={() => handleAdvanceTableOrder(selectedTable.activeOrderId!, 'READY')}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Mark Food Ready</span>
                    </button>
                  )}
                  {(selectedTable.status === 'FOOD_READY' || selectedTable.status === 'PREPARING' || selectedTable.status === 'OCCUPIED') && (
                    <button
                      onClick={() => handleAdvanceTableOrder(selectedTable.activeOrderId!, 'SERVED')}
                      className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Served at Table</span>
                    </button>
                  )}
                  {tableBill && tableBill.status !== 'PAID' && (
                    <button
                      onClick={() => handleSettleTableBill(tableBill)}
                      className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
                        selectedTable.status === 'BILLING_REQUESTED'
                          ? 'bg-purple-500 hover:bg-purple-400 text-white animate-pulse shadow-purple-500/30 ring-2 ring-purple-400/50'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>{selectedTable.status === 'BILLING_REQUESTED' ? `💵 Settle & Collect Cash (₹${tableBill.finalPayableAmount})` : `Settle Bill (₹${tableBill.finalPayableAmount})`}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleClearTable(selectedTable.tableNumber)}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-stone-700 transition-all ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Clear Table</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Live Assistance Requests */}
        <div className="space-y-4">
          <div className="bg-stone-900/80 backdrop-blur-md p-5 rounded-3xl border border-stone-800 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-400" />
                <h3 className="font-display font-extrabold text-base text-white">
                  Guest Call Feed
                </h3>
              </div>
              <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                {requests.length} Active
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-stone-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mb-2" />
                <p className="text-xs font-bold text-stone-300">No Pending Requests</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Customer service calls will ping here</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                {requests.map((req) => {
                  const Icon = getRequestIcon(req.requestType);
                  const isCashBill = req.requestType === 'BILL_REQUEST';
                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border shadow-md transition-all space-y-2.5 ${
                        isCashBill
                          ? 'border-purple-500/60 bg-purple-950/40 shadow-purple-500/10 ring-1 ring-purple-500/30'
                          : 'border-stone-800 bg-stone-950/70 hover:border-brand-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg text-white flex items-center gap-2">
                          Table #{req.tableNumber}
                          {isCashBill && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                              💵 COLLECT CASH
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'PENDING'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                        <Icon className={`w-4 h-4 ${isCashBill ? 'text-purple-400' : 'text-brand-400'}`} />
                        <span className={isCashBill ? 'text-purple-200 font-bold' : ''}>
                          {isCashBill ? 'Cash Payment Collection / Bill' : req.requestType.replace('_', ' ')}
                        </span>
                      </div>

                      {req.additionalNote && (
                        <p className={`text-xs italic p-2.5 rounded-xl border ${
                          isCashBill
                            ? 'text-purple-200 bg-purple-950/60 border-purple-800/80 font-medium'
                            : 'text-stone-300 bg-stone-900 border-stone-800'
                        }`}>
                          "{req.additionalNote}"
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 flex gap-2">
                        {req.status === 'PENDING' ? (
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
                              isCashBill
                                ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20'
                                : 'bg-brand-500 hover:bg-brand-400 text-stone-950 shadow-brand-500/20'
                            }`}
                          >
                            <span>{isCashBill ? 'Accept & Head to Table' : 'Accept'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResolveRequest(req.id)}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isCashBill ? 'Mark Resolved & Cash Collected' : 'Mark Resolved'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaiterDashboard;
