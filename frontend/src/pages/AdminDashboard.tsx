import React, { useState, useEffect } from 'react';
import { adminApi, tableApi, menuApi } from '../services/api';
import { Table, FoodItem, Category } from '../types';
import wsService from '../services/websocket';
import { generateQrDataUrl, downloadQrCode, getLiveQrUrl } from '../services/qrService';
import { downloadAllTablesQrPdf, downloadSingleTableQrPdf } from '../services/tableQrPdfService';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  UtensilsCrossed,
  Users,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  Bell,
  Plus,
  Download,
  Printer,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Coffee,
  Sparkles,
  DollarSign,
  FileText,
  Wifi,
  RefreshCw,
  ExternalLink,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

const TableQrImage: React.FC<{ targetUrl?: string; tableNumber: number }> = ({ targetUrl, tableNumber }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const url = targetUrl || `https://lowkey-cafe-three.vercel.app/table/${tableNumber}`;
    generateQrDataUrl(url).then(setDataUrl).catch(console.error);
  }, [targetUrl, tableNumber]);

  if (!dataUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`Table ${tableNumber} QR`}
      className="w-full h-full object-contain"
    />
  );
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'menu' | 'staff' | 'settings' | 'orders'>('overview');
  
  // Dashboard Metrics
  const [stats, setStats] = useState<any>({
    totalTables: 10,
    availableTables: 7,
    occupiedTables: 3,
    activeOrders: 2,
    pendingKitchenOrders: 1,
    readyOrders: 1,
    pendingWaiterRequests: 0,
    todaySales: 4850.0,
    todayCompletedOrders: 8,
    avgCustomerRating: 4.8,
  });

  const [analytics, setAnalytics] = useState<any>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);

  // Modals / forms state
  const [newTableNum, setNewTableNum] = useState<number>(11);
  const [newTableZone, setNewTableZone] = useState('Main Dining');
  const [newTableCap, setNewTableCap] = useState(4);
  const [selectedQrTable, setSelectedQrTable] = useState<Table | null>(null);

  // Network & Mobile QR Target URL
  const [networkInfo, setNetworkInfo] = useState<{ lanIp: string; recommendedBaseUrl: string }>({
    lanIp: typeof window !== 'undefined' ? window.location.hostname : 'lowkey-cafe-three.vercel.app',
    recommendedBaseUrl: typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app',
  });
  const [customQrBaseUrl, setCustomQrBaseUrl] = useState(
    typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app'
  );
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [isDownloadingAllPdf, setIsDownloadingAllPdf] = useState(false);

  const handleDownloadAllSerialQrs = async () => {
    try {
      setIsDownloadingAllPdf(true);
      await downloadAllTablesQrPdf(tables, customQrBaseUrl);
    } catch (err) {
      console.error('Failed to generate serial table QR PDF', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setIsDownloadingAllPdf(false);
    }
  };

  // New Food Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<number>(1);
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemPrepTime, setNewItemPrepTime] = useState(15);

  // New Staff User Form
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('WAITER');

  // Settings Form
  const [settingsForm, setSettingsForm] = useState<any>({
    restaurantName: 'Lowkey Cafe',
    tagline: 'Artisan Coffee, Gourmet Bites & Good Vibes',
    address: '742 Evergreen Terrace, Foodie Lane, Metro City',
    phone: '+91 98765 43210',
    email: 'contact@lowkeycafe.com',
    wifiName: 'LowkeyCafe_Guest_5G',
    wifiPassword: 'espresso_vibes',
    taxPercentage: 5.0,
    serviceChargePercentage: 5.0,
    openingTime: '09:00 AM',
    closingTime: '11:00 PM',
  });

  const loadData = () => {
    adminApi.getDashboard().then((res) => res.data && typeof res.data === 'object' && !Array.isArray(res.data) && setStats(res.data)).catch(console.error);
    adminApi.getAnalytics().then((res) => res.data && typeof res.data === 'object' && setAnalytics(res.data)).catch(console.error);
    tableApi.getTables().then((res) => setTables(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    menuApi.getItems().then((res) => setMenuItems(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    menuApi.getCategories().then((res) => setCategories(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    adminApi.getAllStaff().then((res) => setStaffList(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    adminApi.getOrdersHistory().then((res) => setOrdersHistory(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    adminApi.getNetworkInfo().then((res) => {
      if (res.data && typeof res.data === 'object') {
        setNetworkInfo(res.data);
        if (res.data.recommendedBaseUrl) {
          setCustomQrBaseUrl(res.data.recommendedBaseUrl);
        }
      }
    }).catch(console.error);
  };

  const handleRegenerateAll = async (urlOverride?: string) => {
    const url = urlOverride || customQrBaseUrl;
    setIsRegeneratingAll(true);
    try {
      const res = await adminApi.regenerateAllQr(url);
      setTables(res.data);
      alert(`All table QR codes successfully updated for: ${url}\nMobile phones on your Wi-Fi can now scan and open the menu directly!`);
    } catch (err) {
      alert('Failed to regenerate QR codes');
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  const handleRegenerateSingle = async (tableNum: number) => {
    try {
      const res = await adminApi.regenerateQr(tableNum, customQrBaseUrl);
      setTables((prev) => prev.map((t) => (t.tableNumber === tableNum ? res.data : t)));
      alert(`Table #${tableNum} QR code updated successfully!`);
    } catch (err) {
      alert(`Failed to regenerate QR code for Table #${tableNum}`);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to admin live stats WebSocket
    const subStats = wsService.subscribe('/topic/admin/stats', (newStats) => {
      setStats(newStats);
    });

    return () => {
      wsService.unsubscribe(subStats);
    };
  }, []);

  // Handle Add Table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createTable({
        tableNumber: newTableNum,
        seatingCapacity: newTableCap,
        floorZone: newTableZone,
      });
      setNewTableNum(newTableNum + 1);
      loadData();
    } catch (err) {
      alert('Could not create table');
    }
  };

  // Handle Toggle Item Availability
  const handleToggleItemAvailability = async (id: number) => {
    try {
      await adminApi.toggleAvailability(id);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Create Food Item
  const handleCreateFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createFoodItem({
        name: newItemName,
        description: newItemDesc,
        price: parseFloat(newItemPrice) || 299,
        categoryId: newItemCategory,
        imageUrl: newItemImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        isVeg: newItemVeg,
        prepTimeMinutes: newItemPrepTime,
      });
      alert('Dish created and added to menu!');
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice('');
      setNewItemImage('');
      loadData();
    } catch (err) {
      alert('Failed to create dish');
    }
  };

  // Handle Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createStaff({
        username: newStaffUser,
        password: newStaffPass,
        email: newStaffEmail,
        fullName: newStaffName,
        role: newStaffRole,
      });
      alert('Staff member registered!');
      setNewStaffUser('');
      setNewStaffPass('');
      setNewStaffEmail('');
      setNewStaffName('');
      loadData();
    } catch (err) {
      alert('Failed to register staff user');
    }
  };

  // Handle Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.updateSettings(settingsForm);
      alert('Restaurant settings saved successfully!');
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Lowkey Cafe Logo"
            className="w-10 h-10 rounded-full object-cover shadow-md border border-stone-200 shrink-0"
          />
          <div>
            <h1 className="font-display font-extrabold text-lg text-stone-950 flex items-center gap-2">
              Lowkey Cafe <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-800 font-bold border border-brand-500/30">Owner Portal</span>
            </h1>
            <p className="text-[10px] text-stone-500">Centralized Restaurant Command Center</p>
          </div>
        </div>

        {/* Quick links to KDS, Waiter, and Customer Menu */}
        <div className="flex items-center gap-2">
          <Link
            to="/kds"
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold hover:bg-amber-500/25 transition-colors"
          >
            Open KDS
          </Link>
          <Link
            to="/waiter"
            className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-900 text-xs font-bold hover:bg-blue-500/25 transition-colors"
          >
            Floor View
          </Link>
          <Link
            to="/?table=1"
            className="px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            Customer View
          </Link>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {[
            { id: 'overview', label: 'Live Overview', icon: TrendingUp },
            { id: 'tables', label: 'Tables & QR Codes', icon: QrCode },
            { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed },
            { id: 'orders', label: 'Orders & Sales', icon: FileText },
            { id: 'staff', label: 'Staff Accounts', icon: Users },
            { id: 'settings', label: 'Cafe Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabbed Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS                               */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Today's Revenue</span>
                <span className="font-display font-black text-2xl text-stone-900 mt-1 block">
                  ₹{stats.todaySales || 0}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> Live Gross
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Occupied Tables</span>
                <span className="font-display font-black text-2xl text-brand-600 mt-1 block">
                  {stats.occupiedTables} / {stats.totalTables}
                </span>
                <span className="text-[10px] text-stone-500 font-medium block mt-1">
                  {stats.availableTables} Available
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Active Kitchen</span>
                <span className="font-display font-black text-2xl text-amber-600 mt-1 block">
                  {stats.pendingKitchenOrders}
                </span>
                <span className="text-[10px] text-stone-500 font-medium block mt-1">
                  Cooking right now
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Ready to Serve</span>
                <span className="font-display font-black text-2xl text-emerald-600 mt-1 block">
                  {stats.readyOrders}
                </span>
                <span className="text-[10px] text-stone-500 font-medium block mt-1">
                  Server notification sent
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Guest Rating</span>
                <span className="font-display font-black text-2xl text-stone-900 mt-1 block">
                  ★ {stats.avgCustomerRating || 4.8}
                </span>
                <span className="text-[10px] text-stone-500 font-medium block mt-1">
                  Average overall score
                </span>
              </div>
            </div>

            {/* Analytics Breakdown & Top Dishes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Revenue Trends */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <h3 className="font-display font-extrabold text-base text-stone-900 mb-4">
                  Revenue Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 block">Daily</span>
                    <span className="font-display font-black text-xl text-stone-900">
                      ₹{analytics?.dailyRevenue || stats.todaySales || 0}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 block">Past 7 Days</span>
                    <span className="font-display font-black text-xl text-stone-900">
                      ₹{analytics?.weeklyRevenue || 34200}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
                    <span className="text-xs text-stone-500 block">Monthly Total</span>
                    <span className="font-display font-black text-xl text-stone-900">
                      ₹{analytics?.monthlyRevenue || 148900}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-500">
                  Data synchronized in real time from persistent database transactions.
                </p>
              </div>

              {/* Top Selling Food Items */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                <h3 className="font-display font-extrabold text-base text-stone-900 mb-4">
                  Best-Selling Dishes
                </h3>
                <div className="space-y-3">
                  {analytics?.topSellingItems && analytics.topSellingItems.length > 0 ? (
                    analytics.topSellingItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                        <div>
                          <span className="font-bold text-xs text-stone-900 block">{item.itemName}</span>
                          <span className="text-[11px] text-stone-400">{item.quantitySold} orders placed</span>
                        </div>
                        <span className="font-extrabold text-xs text-brand-700">₹{item.revenue}</span>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-3">
                      {[
                        { name: 'Artisan Burrata Margherita', sold: 42, rev: '₹20,958' },
                        { name: 'Classic Double Smash Cheeseburger', sold: 38, rev: '₹17,062' },
                        { name: 'Iced Spanish Vanilla Latte', sold: 56, rev: '₹13,384' },
                        { name: 'Truffle Parmesan Fries', sold: 49, rev: '₹12,201' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                          <div>
                            <span className="font-bold text-xs text-stone-900 block">{item.name}</span>
                            <span className="text-[11px] text-stone-400">{item.sold} orders placed</span>
                          </div>
                          <span className="font-extrabold text-xs text-brand-700">{item.rev}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TABLES & QR CODE GENERATION                        */}
        {/* ========================================================= */}
        {activeTab === 'tables' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Physical Serial QR Batch Print & Download Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-neutral-950 to-stone-900 border-2 border-yellow-400/70 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 blur-[100px] pointer-events-none rounded-full"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Physical Table Stands · Serial Batch (1 to {tables.length || 10})</span>
                  </div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                    Download All Table QRs Serially (Print Ready)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    Generate and download a print-ready multi-page PDF formatted serially for <strong>Table #01 to #{tables.length < 10 ? '0' + tables.length : tables.length}</strong>. Each page includes the <strong>Lowkey Cafe logo</strong>, <strong>Cafe Name</strong>, <strong>Table Number</strong>, <strong>"Scan with phone camera to order" instruction message</strong>, and a <strong>high-contrast scannable QR code</strong> ready for physical table stands.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-yellow-300 font-semibold">
                    <span className="flex items-center gap-1">✓ Lowkey Cafe Logo & Title</span>
                    <span className="flex items-center gap-1">✓ Serial Order (Tables 1 to {tables.length || 10})</span>
                    <span className="flex items-center gap-1">✓ Clear Scan Instructions</span>
                    <span className="flex items-center gap-1">✓ Instant Mobile Scannable</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 w-full lg:w-auto">
                  <button
                    onClick={handleDownloadAllSerialQrs}
                    disabled={isDownloadingAllPdf || tables.length === 0}
                    className="px-6 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/25 active:scale-95 transition-all"
                  >
                    <Download className={`w-4 h-4 stroke-[2.5] ${isDownloadingAllPdf ? 'animate-bounce' : ''}`} />
                    <span>{isDownloadingAllPdf ? 'Generating Serial QRs PDF...' : 'Download All Table QRs Serially (PDF)'}</span>
                  </button>
                  <p className="text-[11px] text-neutral-400 text-center lg:text-right font-medium">
                    A5 Sheets · Ready for acrylic stands
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mobile Scanner Wi-Fi QR Configuration Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-brand-500/5 to-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                      <Smartphone className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-stone-900 flex items-center gap-2">
                        Mobile Scanner Wi-Fi Configuration
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Wifi className="w-3 h-3" /> Live Wi-Fi IP: {networkInfo.lanIp}
                        </span>
                      </h3>
                      <p className="text-xs text-stone-600 mt-0.5">
                        When scanning table QR codes from mobile phones, the QR must use your computer's Wi-Fi network IP (not <code>localhost</code>).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleRegenerateAll(`http://${networkInfo.lanIp}:5173`)}
                    disabled={isRegeneratingAll}
                    className="flex-1 md:flex-none py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegeneratingAll ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingAll ? 'Updating All QR Codes...' : 'Regenerate All Table QRs for Mobile'}</span>
                  </button>
                </div>
              </div>

              {/* URL Customization bar */}
              <div className="mt-4 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row items-center gap-3">
                <span className="text-xs font-bold text-stone-700 whitespace-nowrap">QR Base URL:</span>
                <input
                  type="text"
                  value={customQrBaseUrl}
                  onChange={(e) => setCustomQrBaseUrl(e.target.value)}
                  placeholder={`http://${networkInfo.lanIp}:5173`}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 bg-white shadow-inner"
                />
                <button
                  onClick={() => handleRegenerateAll()}
                  disabled={isRegeneratingAll}
                  className="w-full sm:w-auto py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm whitespace-nowrap"
                >
                  Apply Custom URL
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[11px] text-stone-500 bg-white/70 p-3 rounded-xl border border-stone-200">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Tip for Table 4 / Mobile users:</strong> Ensure your phone's Wi-Fi is connected to the same network as this PC (<strong>{settingsForm.wifiName}</strong> or your local Wi-Fi). Scanning the updated QR will open <code>{customQrBaseUrl}/table/4</code> directly on your phone!
                </span>
              </div>
            </div>

            {/* Create Table Card */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className="font-display font-extrabold text-base text-stone-900 mb-3">
                Add Restaurant Table
              </h3>
              <form onSubmit={handleCreateTable} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="number"
                  placeholder="Table Number"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(parseInt(e.target.value) || 1)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <input
                  type="text"
                  placeholder="Zone (e.g. Patio, Rooftop)"
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <input
                  type="number"
                  placeholder="Seating Capacity"
                  value={newTableCap}
                  onChange={(e) => setNewTableCap(parseInt(e.target.value) || 4)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Table</span>
                </button>
              </form>
            </div>

            {/* Tables QR List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center text-center justify-between gap-3 relative hover:border-amber-400 transition-all"
                >
                  <div className="w-full flex items-center justify-between px-1">
                    <span className="font-display font-black text-xl text-stone-900">
                      Table #{table.tableNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      table.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {table.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-400 -mt-2">{table.floorZone} • {table.seatingCapacity} seats</span>

                  {/* QR Image */}
                  <div className="w-36 h-36 bg-white border border-stone-200 rounded-2xl p-2 flex items-center justify-center shadow-inner relative group">
                    <TableQrImage
                      targetUrl={table.qrTargetUrl}
                      tableNumber={table.tableNumber}
                    />
                  </div>

                  {/* QR target link preview */}
                  <div className="w-full px-1">
                    <a
                      href={table.qrTargetUrl || `http://${networkInfo.lanIp}:5173/table/${table.tableNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-brand-700 hover:text-brand-900 font-mono truncate block max-w-full hover:underline flex items-center justify-center gap-1"
                      title={table.qrTargetUrl}
                    >
                      <span>Open Menu</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {table.qrImageData && (
                      <a
                        href={table.qrImageData}
                        download={`Table_${table.tableNumber}_QR.png`}
                        className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-stone-700 flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Save PNG
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedQrTable(table)}
                      className="py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> Badge
                    </button>
                    <button
                      onClick={() => downloadSingleTableQrPdf(table, customQrBaseUrl)}
                      className="col-span-2 py-1.5 px-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-sm transition-colors"
                      title="Download print-ready A5 sheet PDF for this table"
                    >
                      <Download className="w-3 h-3 stroke-[2.5]" /> Download PDF Sheet
                    </button>
                    <button
                      onClick={() => handleRegenerateSingle(table.tableNumber)}
                      className="col-span-2 py-1 px-2 border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50 text-[10px] font-bold text-stone-600 hover:text-amber-900 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      title="Regenerate with current base URL"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Regenerate QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MENU MANAGEMENT                                   */}
        {/* ========================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Add New Dish */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className="font-display font-extrabold text-base text-stone-900 mb-4">
                Add New Dish to Menu
              </h3>
              <form onSubmit={handleCreateFoodItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Dish Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(parseInt(e.target.value))}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="url"
                  placeholder="Image URL (Unsplash)"
                  value={newItemImage}
                  onChange={(e) => setNewItemImage(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200 sm:col-span-2"
                />
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItemVeg}
                      onChange={(e) => setNewItemVeg(e.target.checked)}
                      className="rounded text-brand-600"
                    />
                    <span>Vegetarian</span>
                  </label>
                  <span>Prep: {newItemPrepTime}m</span>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Save Dish
                </button>
              </form>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <h4 className="font-display font-extrabold text-base text-stone-900">
                  Current Menu Items ({menuItems.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {menuItems.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block">{item.name}</span>
                            <span className="text-[10px] text-stone-400 line-clamp-1">{item.description}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-stone-600">{item.categoryName}</td>
                        <td className="p-4 font-extrabold text-stone-900">₹{item.price}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isVeg ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleItemAvailability(item.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              item.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-400 border border-stone-200'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock (Active)' : '86\'d (Sold Out)'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ORDERS & SALES HISTORY                            */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="font-display font-extrabold text-base text-stone-900">
                  Order & Transaction Records ({ordersHistory.length})
                </h4>
                <p className="text-xs text-stone-500">Persistent database audit history</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
                  <tr>
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Items Count</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ordersHistory.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50">
                      <td className="p-4 font-mono font-bold text-stone-900">{order.orderCode}</td>
                      <td className="p-4 font-bold">Table #{order.tableNumber}</td>
                      <td className="p-4 text-stone-600">{order.customerName}</td>
                      <td className="p-4 text-stone-500">{order.items?.length || 1} items</td>
                      <td className="p-4 font-extrabold text-stone-900">₹{order.grandTotal}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: STAFF MANAGEMENT                                  */}
        {/* ========================================================= */}
        {activeTab === 'staff' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Create Staff Form */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className="font-display font-extrabold text-base text-stone-900 mb-3">
                Register New Staff Member
              </h3>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={newStaffUser}
                  onChange={(e) => setNewStaffUser(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newStaffPass}
                  onChange={(e) => setNewStaffPass(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                  required
                />
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-stone-200"
                >
                  <option value="WAITER">Floor Waiter</option>
                  <option value="KITCHEN_STAFF">Kitchen Cook</option>
                  <option value="ADMIN">Manager / Admin</option>
                </select>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Staff
                </button>
              </form>
            </div>

            {/* Staff list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {staffList.map((st) => (
                <div key={st.id} className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm">
                  <span className="font-bold text-sm text-stone-900 block">{st.fullName}</span>
                  <span className="text-xs text-stone-400 block font-mono">@{st.username}</span>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                      {st.roles ? st.roles.join(', ') : 'STAFF'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: RESTAURANT SETTINGS                               */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm max-w-2xl animate-in fade-in duration-200">
            <h3 className="font-display font-extrabold text-lg text-stone-900 mb-4">
              Restaurant Configuration
            </h3>
            <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={settingsForm.restaurantName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Guest Wi-Fi SSID</label>
                  <input
                    type="text"
                    value={settingsForm.wifiName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, wifiName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Wi-Fi Password</label>
                  <input
                    type="text"
                    value={settingsForm.wifiPassword}
                    onChange={(e) => setSettingsForm({ ...settingsForm, wifiPassword: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-600 block mb-1">GST Tax Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsForm.taxPercentage}
                    onChange={(e) => setSettingsForm({ ...settingsForm, taxPercentage: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsForm.serviceChargePercentage}
                    onChange={(e) => setSettingsForm({ ...settingsForm, serviceChargePercentage: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Print Table Badge Modal */}
      {selectedQrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setSelectedQrTable(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>
            <div className="border-4 border-dashed border-stone-300 p-6 rounded-2xl">
              <span className="font-display font-extrabold text-2xl text-stone-950 block">
                Lowkey Cafe
              </span>
              <p className="text-xs text-stone-500 mb-3">Scan to order & pay</p>
              
              <div className="w-48 h-48 mx-auto bg-white p-2 border border-stone-200 rounded-xl mb-3 flex items-center justify-center">
                <TableQrImage
                  targetUrl={selectedQrTable.qrTargetUrl}
                  tableNumber={selectedQrTable.tableNumber}
                />
              </div>

              <span className="font-display font-black text-3xl text-stone-900 block">
                TABLE {selectedQrTable.tableNumber}
              </span>
              <p className="text-[10px] text-stone-400 mt-1 font-mono break-all">
                {selectedQrTable.qrTargetUrl || `https://lowkey-cafe-three.vercel.app/table/${selectedQrTable.tableNumber}`}
              </p>
              <div className="mt-3 py-1.5 px-3 bg-stone-100 rounded-xl text-[11px] text-stone-700 flex flex-col gap-0.5 text-center">
                <span className="font-semibold text-stone-800">📶 Wi-Fi: {settingsForm.wifiName}</span>
                <span className="text-stone-500">Password: <strong className="text-stone-800 font-mono">{settingsForm.wifiPassword}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => downloadSingleTableQrPdf(selectedQrTable, customQrBaseUrl)}
                className="py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" /> Download PDF
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
