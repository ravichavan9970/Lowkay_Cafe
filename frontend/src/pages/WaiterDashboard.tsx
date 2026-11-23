import React, { useState, useEffect } from 'react';
import { waiterApi, tableApi, billingApi } from '../services/api';
import { Table, WaiterRequest, Bill } from '../types';
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
} from 'lucide-react';

export const WaiterDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableBill, setTableBill] = useState<Bill | null>(null);

  // Load floor tables and assistance requests
  const loadFloor = () => {
    tableApi.getTables().then((res) => setTables(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    waiterApi.getRequests().then((res) => setRequests(Array.isArray(res.data) ? res.data : [])).catch(console.error);
  };

  useEffect(() => {
    loadFloor();

    // Subscribe to table floor updates
    const subTables = wsService.subscribe('/topic/tables', (updatedTable: Table) => {
      setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
    });

    // Subscribe to incoming waiter requests
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
      wsService.unsubscribe(subTables);
      wsService.unsubscribe(subRequests);
    };
  }, []);

  const handleAcceptRequest = async (id: number) => {
    try {
      const res = await waiterApi.acceptRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveRequest = async (id: number) => {
    try {
      await waiterApi.resolveRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      loadFloor();
    } catch (err) {
      console.error(err);
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
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800';
      case 'OCCUPIED':
        return 'bg-blue-500/10 border-blue-500/40 text-blue-800';
      case 'ORDER_RECEIVED':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-800';
      case 'PREPARING':
        return 'bg-orange-500/10 border-orange-500/40 text-orange-800';
      case 'FOOD_READY':
        return 'bg-emerald-500 border-emerald-600 text-stone-950 animate-bounce font-black';
      case 'ASSISTANCE_REQUESTED':
        return 'bg-rose-500 text-white border-rose-600 animate-pulse font-bold';
      case 'BILLING_REQUESTED':
        return 'bg-purple-500/10 border-purple-500/40 text-purple-800';
      default:
        return 'bg-stone-100 border-stone-200 text-stone-700';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'WATER': return Droplets;
      case 'EXTRA_PLATES': return Utensils;
      case 'MENU_HELP': return HelpCircle;
      case 'BILL_REQUEST': return Receipt;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-stone-950 leading-tight">
                Waiter & Floor Management
              </h1>
              <p className="text-[10px] text-stone-500 -mt-0.5">Real-time Table Statuses & Guest Calls</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
            {requests.length} Pending Calls
          </span>
          <button
            onClick={loadFloor}
            className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Refresh Floor
          </button>
        </div>
      </header>

      {/* Main Grid: Floor View (Left) & Live Feed (Right) */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Floor Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base text-stone-900">
                  Floor View ({tables.length} Tables)
                </h3>
                <p className="text-xs text-stone-500">Tap any table to view ticket details or record payment</p>
              </div>

              {/* Status Legend */}
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-stone-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Avail</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Needs Server</span>
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
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[110px] transition-all ${colorClass} ${
                      isSelected ? 'ring-4 ring-brand-500/50 shadow-md' : 'shadow-sm hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                      {table.floorZone}
                    </span>
                    <span className="font-display font-black text-2xl my-1">
                      T-{table.tableNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10">
                      {table.status.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Table Inspection Drawer */}
          {selectedTable && (
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h4 className="font-display font-bold text-base text-stone-900">
                    Table #{selectedTable.tableNumber} Details
                  </h4>
                  <p className="text-xs text-stone-500">
                    Zone: {selectedTable.floorZone} • Capacity: {selectedTable.seatingCapacity} Guests
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-stone-500 block">Current Status</span>
                  <span className="font-bold text-sm text-stone-900">
                    {selectedTable.status}
                  </span>
                  {selectedTable.activeOrderCode && (
                    <p className="text-xs text-stone-600 mt-1">
                      Active Ticket: <strong className="font-mono text-stone-900">{selectedTable.activeOrderCode}</strong>
                    </p>
                  )}
                </div>

                {tableBill && (
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Total Due</span>
                    <span className="font-display font-black text-xl text-brand-600">
                      ₹{tableBill.finalPayableAmount}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 block mt-0.5">
                      {tableBill.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Assistance Requests */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-extrabold text-base text-stone-900">
                  Guest Call Feed
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-400">
                {requests.length} Active
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-stone-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mb-2" />
                <p className="text-xs font-bold text-stone-600">No Pending Requests</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Customer service calls will ping here</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {requests.map((req) => {
                  const Icon = getRequestIcon(req.requestType);
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-white shadow-sm transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg text-stone-900">
                          Table #{req.tableNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'PENDING'
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                        <Icon className="w-4 h-4 text-brand-600" />
                        <span>{req.requestType.replace('_', ' ')}</span>
                      </div>

                      {req.additionalNote && (
                        <p className="text-xs text-stone-500 italic bg-white p-2 rounded-xl border border-stone-200/60">
                          "{req.additionalNote}"
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 flex gap-2">
                        {req.status === 'PENDING' ? (
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Accept</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResolveRequest(req.id)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
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
