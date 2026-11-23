import React, { useState, useEffect } from 'react';
import { kitchenApi } from '../services/api';
import { Order, OrderStatus } from '../types';
import wsService from '../services/websocket';
import { cloudSync } from '../services/cloudSyncService';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Volume2,
  VolumeX,
  Flame,
  ArrowLeft,
  Utensils,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Station {
  id: number;
  name: string;
}

export const KDSView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load stations & active kitchen orders
  const loadData = () => {
    kitchenApi.getStations().then((res) => setStations(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    kitchenApi.getOrders().then((res) => setOrders(Array.isArray(res.data) ? res.data : [])).catch(console.error);
  };

  useEffect(() => {
    loadData();

    // 1. Subscribe to live cloud orders (syncs across Mobile phones & Kitchen KDS in real time)
    const unsubCloud = cloudSync.subscribeToOrders((cloudOrders) => {
      setOrders((prev) => {
        const activeCloud = (cloudOrders || []).filter(
          (o) => o && o.status !== 'SERVED' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
        );
        const safePrev = Array.isArray(prev) ? prev : [];
        const prevIds = new Set(safePrev.map((o) => o?.id));
        const hasNew = Array.isArray(activeCloud) && activeCloud.some((o) => o && !prevIds.has(o.id));
        if (hasNew && soundEnabled) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (ignored) {}
        }
        return activeCloud;
      });
    });

    // 2. Subscribe to live kitchen updates via WebSocket
    const subId = wsService.subscribe('/topic/kitchen', (newOrUpdatedOrder: Order) => {
      console.log('⚡ KDS received WebSocket update:', newOrUpdatedOrder);
      setOrders((prev) => {
        if (newOrUpdatedOrder.status === 'COMPLETED' || newOrUpdatedOrder.status === 'CANCELLED' || newOrUpdatedOrder.status === 'SERVED') {
          return prev.filter((o) => o.id !== newOrUpdatedOrder.id);
        }
        const idx = prev.findIndex((o) => o.id === newOrUpdatedOrder.id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = newOrUpdatedOrder;
          return updated;
        } else {
          if (soundEnabled) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch (ignored) {}
          }
          return [newOrUpdatedOrder, ...prev];
        }
      });
    });

    return () => {
      unsubCloud();
      wsService.unsubscribe(subId);
    };
  }, [soundEnabled]);

  // Advance Order Status
  const handleAdvanceStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      const res = await kitchenApi.updateOrderStatus(orderId, nextStatus);
      const updated = res.data;
      setOrders((prev) => {
        if (nextStatus === 'SERVED' || nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED') {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              ...updated,
              status: nextStatus,
              items: Array.isArray(updated?.items) && updated.items.length > 0 ? updated.items : (Array.isArray(o.items) ? o.items : []),
            };
          }
          return o;
        });
      });
    } catch (err) {
      console.error('Failed to update status', err);
      // Fallback: update status locally so UI is never stuck
      setOrders((prev) => {
        if (nextStatus === 'SERVED' || nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED') {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
      });
    }
  };

  // Filter orders by station safely
  const safeOrdersList = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrdersList.filter((o) => {
    if (!o) return false;
    if (!selectedStation) return true;
    const items = Array.isArray(o.items) ? o.items : [];
    return items.some((item) => item?.stationId === selectedStation);
  });

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (createdAt: string) => {
    const diff = (Date.now() - new Date(createdAt).getTime()) / 60000;
    return Math.max(1, Math.floor(diff));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      
      {/* Top Touchscreen Bar */}
      <header className="h-16 bg-stone-900 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            title="Exit to Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-brand-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-white tracking-wide">
                KITCHEN DISPLAY SYSTEM
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono block -mt-1">
                LOWKEY CAFE • LIVE TICKETS
              </span>
            </div>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-stone-950 p-1 rounded-2xl border border-stone-800">
          <button
            onClick={() => setSelectedStation(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStation === null
                ? 'bg-brand-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All Stations ({orders.length})
          </button>
          {stations.map((st) => {
            const count = safeOrdersList.filter((o) => {
              if (!o) return false;
              const items = Array.isArray(o.items) ? o.items : [];
              return items.some((i) => i?.stationId === st.id);
            }).length;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStation(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedStation === st.id
                    ? 'bg-brand-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <span>{st.name}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Audio Toggle & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
              soundEnabled
                ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-400'
                : 'border-stone-800 bg-stone-900 text-stone-500'
            }`}
            title="Toggle Sound Alert"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main KDS Grid */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-24">
            <div className="w-20 h-20 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600 mb-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-stone-200">
              Kitchen Screen Clear
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              All station orders have been prepared and served. New customer orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isDelayed = elapsed > 15;

              return (
                <div
                  key={order.id}
                  className={`bg-stone-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    isDelayed
                      ? 'border-rose-500/80 shadow-rose-950/40 ring-2 ring-rose-500/30'
                      : order.status === 'READY'
                      ? 'border-emerald-500/60 shadow-emerald-950/30'
                      : order.status === 'PREPARING'
                      ? 'border-amber-500/60 shadow-amber-950/30'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Card Header: Table & Timers */}
                  <div
                    className={`p-4 flex items-center justify-between border-b ${
                      isDelayed
                        ? 'bg-rose-950/40 border-rose-900/60'
                        : order.status === 'READY'
                        ? 'bg-emerald-950/40 border-emerald-900/60'
                        : 'bg-stone-850 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-black text-2xl text-white">
                          {order.tableNumber === 0 ? '🥡 TAKEAWAY' : `TBL #${order.tableNumber}`}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {order.orderCode}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        Diner: {order.customerName}
                      </span>
                    </div>

                    {/* Timer */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                        isDelayed
                          ? 'bg-rose-500 text-stone-950 border-rose-400 animate-pulse'
                          : 'bg-stone-800 text-stone-200 border-stone-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m</span>
                    </div>
                  </div>

                  {/* Food Items List */}
                  <div className="p-4 flex-1 space-y-3 divide-y divide-stone-800/80 overflow-y-auto max-h-72">
                    {(Array.isArray(order?.items) ? order.items : []).map((item) => (
                      <div key={item.id} className="pt-2 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display font-bold text-sm text-stone-100 leading-snug">
                            {item.quantity}× {item.foodItemName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 shrink-0">
                            {item.selectedPortion}
                          </span>
                        </div>

                        {/* Spice & Customizations */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {item.selectedSpiceLevel !== 'MILD' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> {item.selectedSpiceLevel}
                            </span>
                          )}

                          {Array.isArray(item.customizations) && item.customizations.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50"
                            >
                              +{c.optionName}
                            </span>
                          ))}
                        </div>

                        {/* Removed Ingredients Alert */}
                        {item.removedIngredients && (
                          <p className="text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded mt-1 border border-rose-900/50">
                            NO: {item.removedIngredients}
                          </p>
                        )}

                        {item.itemNotes && (
                          <p className="text-[10px] text-stone-400 italic mt-0.5">
                            Note: {item.itemNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Special Instructions or Allergy Alert */}
                  {order.specialInstructions && (
                    <div className="px-4 py-2 bg-amber-950/30 border-t border-amber-900/40 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Special: {order.specialInstructions}</span>
                    </div>
                  )}

                  {/* Action Workflow Buttons */}
                  <div className="p-3 bg-stone-950 border-t border-stone-800/90 flex gap-2">
                    {order.status === 'NEW_ORDER' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'ACCEPTED')}
                        className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-stone-950 font-display font-extrabold text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'PREPARING')}
                        className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-extrabold text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'READY')}
                        className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-display font-extrabold text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleAdvanceStatus(order.id, 'SERVED')}
                        className="w-full py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-stone-950 font-display font-extrabold text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Served</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KDSView;
