import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee,
  ShoppingBag,
  QrCode,
  Wifi,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Flame,
  CheckCircle2,
  Users,
  ChevronRight,
  Download,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  Star,
  Award,
  Heart,
  Copy,
  Check,
} from 'lucide-react';
import { MOCK_TABLES } from '../services/mockData';
import { Table } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Selected zone filter for table viewer
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  
  // QR Modal state
  const [activeQrModal, setActiveQrModal] = useState<{
    title: string;
    subtitle: string;
    url: string;
    type: 'TABLE' | 'TAKEAWAY';
    tableNum?: number;
  } | null>(null);

  // Copied Wi-Fi password state
  const [copiedWifi, setCopiedWifi] = useState(false);

  const zones = ['ALL', 'Indoor Lounge', 'Patio Garden', 'Rooftop Terrace'];

  const filteredTables = selectedZone === 'ALL'
    ? MOCK_TABLES
    : MOCK_TABLES.filter((t) => t.floorZone === selectedZone);

  const handleCopyWifi = () => {
    navigator.clipboard.writeText('lowkeycoffee');
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const getQrImageUrl = (targetPath: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lowkey-cafe-three.vercel.app';
    const fullUrl = encodeURIComponent(`${origin}${targetPath}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=0a0a0a&bgcolor=facc15&margin=10&data=${fullUrl}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-yellow-400 selection:text-black">
      
      {/* Top Announcement Bar */}
      <div className="bg-yellow-400 text-black text-xs font-black py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Welcome to Lowkey Cafe · Free 5G Wi-Fi · Dine-In Contactless QR & Takeaway To-Go Available</span>
        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-2xl border-b border-neutral-800/90 text-white shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-400/25">
              <Coffee className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white flex items-center gap-1">
                Lowkey<span className="text-yellow-400">Cafe</span>
              </span>
              <p className="text-[10px] text-neutral-400 tracking-wider uppercase font-semibold -mt-1 hidden sm:block">
                Artisan Roastery & Dining
              </p>
            </div>
          </div>

          {/* Quick Header Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-neutral-300">
            <a href="#dine-in-tables" className="hover:text-yellow-400 transition-colors">Dine-In Tables</a>
            <a href="#takeaway-qr" className="hover:text-yellow-400 transition-colors">Takeaway / To-Go</a>
            <a href="#story" className="hover:text-yellow-400 transition-colors">Our Story</a>
            <a href="#specials" className="hover:text-yellow-400 transition-colors">Chef Specials</a>
            <a href="#visit" className="hover:text-yellow-400 transition-colors">Hours & Wi-Fi</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#takeaway-qr"
              className="px-3 sm:px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-yellow-400/40 text-yellow-300 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" />
              <span>Takeaway QR</span>
            </a>
            <a
              href="#dine-in-tables"
              className="px-3.5 sm:px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Table Menu</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-neutral-850">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-yellow-400/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-neutral-700/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artisan Roastery · Gourmet Bistro · Contactless Dining</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Where Slow Mornings Meet <span className="text-yellow-400 underline decoration-yellow-400/30 underline-offset-8">Gourmet Flavors</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Welcome to <strong className="text-white font-bold">Lowkey Cafe</strong>. Sip ethically sourced single-origin pour-overs, savor 48-hour cold-ferment sourdough pizzas, and bite into brioche smash burgers in a tranquil, modern ambiance.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <a
              href="#dine-in-tables"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/25 active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4 stroke-[2.5]" />
              <span>Dine-In Table Menu</span>
              <ArrowRight className="w-4 h-4 ml-1 stroke-[2.5]" />
            </a>

            <a
              href="#takeaway-qr"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-white font-black text-sm flex items-center justify-center gap-2 hover:border-yellow-400/50 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-yellow-400" />
              <span>Takeaway / Outside QR</span>
            </a>
          </div>

          {/* Key Stats Bar */}
          <div className="mt-14 pt-8 border-t border-neutral-850 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
            <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <span className="text-2xl font-black text-yellow-400">100%</span>
              <p className="text-xs text-neutral-400 font-semibold mt-0.5">Arabica Single Origin</p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <span className="text-2xl font-black text-white">48h</span>
              <p className="text-xs text-neutral-400 font-semibold mt-0.5">Sourdough Fermentation</p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <span className="text-2xl font-black text-yellow-400">10</span>
              <p className="text-xs text-neutral-400 font-semibold mt-0.5">Smart QR Tables</p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <span className="text-2xl font-black text-white">4.9 ★</span>
              <p className="text-xs text-neutral-400 font-semibold mt-0.5">500+ Diner Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Dine-In Table QR Simulator & Floor Hub */}
      <section id="dine-in-tables" className="py-16 sm:py-24 border-b border-neutral-850 bg-neutral-950/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Dine-In Customer Experience</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
                Sitting At A Table? Scan Or Choose Your Table
              </h2>
              <p className="text-neutral-400 text-sm mt-1 max-w-xl">
                When you visit our cafe, sit comfortably at any available table and scan its QR code to browse, customize dishes, and order directly to your table without waiting for staff.
              </p>
            </div>

            {/* Zone Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black border border-neutral-800 overflow-x-auto">
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    selectedZone === zone
                      ? 'bg-yellow-400 text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {zone === 'ALL' ? 'All Tables (10)' : zone}
                </button>
              ))}
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredTables.map((table: Table) => {
              const isOccupied = table.status === 'OCCUPIED' || table.status === 'PREPARING';
              return (
                <div
                  key={table.id}
                  className="group relative p-4 rounded-3xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-yellow-400/60 shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Table Card Top */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300">
                        {table.floorZone}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOccupied ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        title={isOccupied ? 'Occupied / Active' : 'Available'}
                      ></span>
                    </div>

                    <div className="my-2">
                      <h3 className="font-display font-black text-2xl text-white group-hover:text-yellow-400 transition-colors">
                        Table {table.tableNumber < 10 ? `0${table.tableNumber}` : table.tableNumber}
                      </h3>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Up to {table.seatingCapacity} Guests</span>
                      </p>
                    </div>
                  </div>

                  {/* Table Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-2">
                    <button
                      onClick={() => navigate(`/table/${table.tableNumber}?token=${table.accessToken}`)}
                      className="w-full py-2.5 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/20 active:scale-95 transition-all"
                    >
                      <span>Open Table Menu</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    <button
                      onClick={() =>
                        setActiveQrModal({
                          title: `Table #${table.tableNumber} QR Code`,
                          subtitle: `${table.floorZone} · Capacity ${table.seatingCapacity} Diners`,
                          url: `/table/${table.tableNumber}?token=${table.accessToken}`,
                          type: 'TABLE',
                          tableNum: table.tableNumber,
                        })
                      }
                      className="w-full py-1.5 px-3 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3 h-3 text-yellow-400" />
                      <span>View & Scan QR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Help Tip */}
          <div className="mt-8 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <p className="text-xs text-neutral-300 font-medium">
                Each dining table has an individual physical brass QR stand. Scanning directly takes you to your table's dedicated cart with instant kitchen dispatch.
              </p>
            </div>
            <button
              onClick={() => navigate('/table/4')}
              className="shrink-0 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors"
            >
              Demo Dine-In (Table 4) →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Dedicated Takeaway / Outside Customer QR & Ordering */}
      <section id="takeaway-qr" className="py-16 sm:py-24 border-b border-neutral-850 relative overflow-hidden bg-gradient-to-b from-black via-neutral-950 to-black">
        {/* Yellow ambient glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Info & Story for Outside Customers */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Outside Customers & Grab-And-Go</span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                Not Eating Inside? <br />
                <span className="text-yellow-400">Order Takeaway / To-Go</span>
              </h2>

              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                Whether you're taking your morning flat white to the office, picking up artisanal pizzas for a cozy evening, or passing by on the street — order seamlessly without waiting for a table.
              </p>

              {/* Takeaway Perks */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-yellow-400 text-black flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">0% Dine-In Service Charge</h4>
                    <p className="text-xs text-neutral-400">Enjoy full menu pricing with zero restaurant service fee added to your bill.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-yellow-400 text-black flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Insulated Hot & Cold Packaging</h4>
                    <p className="text-xs text-neutral-400">All to-go orders are sealed in 100% biodegradable thermal containers to preserve freshness.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-yellow-400 text-black flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Instant Screen & Phone Notification</h4>
                    <p className="text-xs text-neutral-400">Live order tracker alerts you the second your bag is ready at our dedicated curbside pickup counter.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/takeaway')}
                  className="px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center gap-2 shadow-xl shadow-yellow-400/25 active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>Start Takeaway Order Now</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  onClick={() =>
                    setActiveQrModal({
                      title: 'Lowkey Cafe Outside Takeaway QR',
                      subtitle: 'Scan to order to-go food & drinks without dining in',
                      url: '/takeaway',
                      type: 'TAKEAWAY',
                    })
                  }
                  className="px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-neutral-200 hover:text-white font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-yellow-400" />
                  <span>Display / Print Takeaway QR</span>
                </button>
              </div>
            </div>

            {/* Right Column: Prominent Takeaway QR Display Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border-2 border-yellow-400/70 shadow-[0_20px_60px_rgba(250,204,21,0.15)] flex flex-col items-center text-center relative group">
                
                {/* Top Badge */}
                <span className="px-3.5 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider mb-4 shadow-md">
                  Official Takeaway QR
                </span>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-yellow-400 relative group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={getQrImageUrl('/takeaway')}
                    alt="Takeaway Ordering QR Code"
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-opacity rounded-xl">
                    <span className="px-3 py-1 rounded-lg bg-yellow-400 text-black text-xs font-black shadow-lg">
                      Scan with Camera
                    </span>
                  </div>
                </div>

                {/* Scan Instructions */}
                <div className="mt-5 space-y-1">
                  <h3 className="font-display font-black text-lg text-white">
                    Scan To Order For Pickup
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Point your phone camera to open the menu in Takeaway Mode. No table required!
                  </p>
                </div>

                {/* Direct Action Link */}
                <button
                  onClick={() => navigate('/takeaway')}
                  className="mt-5 w-full py-2.5 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-yellow-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Or Click to Order Takeaway Online</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: Chef's Signature Menu Showcase */}
      <section id="specials" className="py-16 sm:py-24 border-b border-neutral-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Chef Signatures</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              Culinary Artistry in Every Bite
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              From dawn espresso pulls to evening sourdough pies, our chefs prepare each recipe from scratch using uncompromised fresh ingredients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Item 1 */}
            <div className="group rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/50 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-yellow-400/10">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80"
                  alt="Artisan Burrata Margherita"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-black border border-neutral-800">
                  Wood-Fired Pizza
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-white">Artisan Burrata Margherita</h3>
                  <span className="font-black text-yellow-400 text-sm">₹499</span>
                </div>
                <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2">
                  San Marzano DOP sauce, whole creamy burrata pugliese, cold-pressed basil oil, blistered crust.
                </p>
                <button
                  onClick={() => navigate('/takeaway')}
                  className="mt-4 w-full py-2 rounded-xl bg-neutral-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Item 2 */}
            <div className="group rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/50 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-yellow-400/10">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
                  alt="Classic Double Smash Burger"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-black border border-neutral-800">
                  Gourmet Burger
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-white">Double Smash Cheeseburger</h3>
                  <span className="font-black text-yellow-400 text-sm">₹449</span>
                </div>
                <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2">
                  Two smashed prime patties, melted Wisconsin cheddar, caramelized onion relish, toasted brioche bun.
                </p>
                <button
                  onClick={() => navigate('/takeaway')}
                  className="mt-4 w-full py-2 rounded-xl bg-neutral-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Item 3 */}
            <div className="group rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/50 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-yellow-400/10">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
                  alt="Iced Spanish Vanilla Latte"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-black border border-neutral-800">
                  Specialty Coffee
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-white">Iced Spanish Vanilla Latte</h3>
                  <span className="font-black text-yellow-400 text-sm">₹239</span>
                </div>
                <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2">
                  Double ristretto of Ethiopian Yirgacheffe, sweetened condensed milk, organic Madagascar vanilla bean.
                </p>
                <button
                  onClick={() => navigate('/takeaway')}
                  className="mt-4 w-full py-2 rounded-xl bg-neutral-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Item 4 */}
            <div className="group rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/50 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-yellow-400/10">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"
                  alt="Lotus Biscoff Basque Cheesecake"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-black border border-neutral-800">
                  House Dessert
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-white">Biscoff Basque Cheesecake</h3>
                  <span className="font-black text-yellow-400 text-sm">₹329</span>
                </div>
                <p className="text-neutral-400 text-xs mt-1.5 line-clamp-2">
                  Molten San Sebastian Basque cheesecake smothered with warm spiced Lotus Biscoff biscuit spread.
                </p>
                <button
                  onClick={() => navigate('/takeaway')}
                  className="mt-4 w-full py-2 rounded-xl bg-neutral-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/table/1')}
              className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-black text-xs inline-flex items-center gap-2 transition-all"
            >
              <span>Explore All 23+ Menu Items</span>
              <ChevronRight className="w-4 h-4 text-yellow-400" />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 4: Cafe Philosophy & Ambiance Zones */}
      <section id="story" className="py-16 sm:py-24 border-b border-neutral-850 bg-neutral-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Lounge */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-white">Indoor Acoustic Lounge</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Designed for productivity and intimate conversations. Plush velvet seating, calibrated warm amber lighting, and charging sockets at every single booth.
              </p>
              <div className="pt-2 text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                <span>Tables 1 – 4</span>
              </div>
            </div>

            {/* Card 2: Patio */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-white">Patio Garden Oasis</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sun-dappled open-air greenery with fresh morning breezes. Pet-friendly tables perfect for brunch with friends and four-legged companions.
              </p>
              <div className="pt-2 text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                <span>Tables 5 – 8</span>
              </div>
            </div>

            {/* Card 3: Rooftop */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-white">Rooftop Sunset Terrace</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Elevated skyline views beneath warm fairy lights. Evening acoustic playlists, refreshing craft coolers, and starlit sourdough dining.
              </p>
              <div className="pt-2 text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                <span>Tables 9 – 10</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5: Visit, Hours, Wi-Fi & Location */}
      <section id="visit" className="py-16 sm:py-24 border-b border-neutral-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Opening Hours */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-base text-white">Opening Hours</h4>
                  <p className="text-xs text-neutral-400">Serving 7 Days a Week</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>Monday – Friday</span>
                  <span className="font-black text-white">8:00 AM – 11:30 PM</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Saturday – Sunday</span>
                  <span className="font-black text-white">8:00 AM – 12:00 AM</span>
                </div>
                <div className="flex justify-between text-yellow-400 font-bold pt-1">
                  <span>Kitchen Last Call</span>
                  <span>11:00 PM</span>
                </div>
              </div>
            </div>

            {/* High-Speed Wi-Fi */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <Wifi className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-base text-white">High-Speed 5G Wi-Fi</h4>
                  <p className="text-xs text-neutral-400">Complimentary For Guests</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>Network (SSID)</span>
                  <span className="font-mono font-bold text-white">LowkeyCafe_Guest_5G</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-black border border-neutral-800">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Password</span>
                    <span className="font-mono font-bold text-yellow-400 text-xs">lowkeycoffee</span>
                  </div>
                  <button
                    onClick={handleCopyWifi}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedWifi ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-base text-white">Find Us</h4>
                  <p className="text-xs text-neutral-400">Indiranagar, Bengaluru</p>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 text-xs text-neutral-300">
                <p>#42 Lowkey Boulevard, 12th Main Road, Indiranagar, Bengaluru, 560038</p>
                <div className="pt-1 flex items-center gap-2 text-yellow-400 font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-neutral-850 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center text-black font-black">
              <Coffee className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-black text-base text-white">
                Lowkey<span className="text-yellow-400">Cafe</span>
              </span>
              <p className="text-[10px] text-neutral-500">
                © {new Date().getFullYear()} Lowkey Cafe Roasters. All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-neutral-400">
            <a href="#dine-in-tables" className="hover:text-yellow-400 transition-colors">Dine-In Tables</a>
            <a href="#takeaway-qr" className="hover:text-yellow-400 transition-colors">Takeaway QR</a>
            <button onClick={() => navigate('/login')} className="hover:text-yellow-400 transition-colors">Staff Login</button>
            <button onClick={() => navigate('/kds')} className="hover:text-yellow-400 transition-colors">Kitchen Display</button>
            <button onClick={() => navigate('/waiter')} className="hover:text-yellow-400 transition-colors">Floor Waiter</button>
            <button onClick={() => navigate('/admin')} className="hover:text-yellow-400 transition-colors">Owner Admin</button>
          </div>
        </div>
      </footer>

      {/* Universal Interactive QR Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-neutral-900 border-2 border-yellow-400 shadow-[0_20px_60px_rgba(250,204,21,0.2)] text-center text-white space-y-4">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveQrModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div>
              <span className="px-3 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider">
                {activeQrModal.type === 'TAKEAWAY' ? '🥡 Takeaway / Outside QR' : `Table #${activeQrModal.tableNum}`}
              </span>
              <h3 className="font-display font-black text-xl text-white mt-2">
                {activeQrModal.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {activeQrModal.subtitle}
              </p>
            </div>

            {/* High-Res QR Image */}
            <div className="p-4 bg-white rounded-2xl border-4 border-yellow-400 shadow-xl inline-block mx-auto">
              <img
                src={getQrImageUrl(activeQrModal.url)}
                alt={activeQrModal.title}
                className="w-56 h-56 object-contain"
              />
            </div>

            {/* Action Buttons inside Modal */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  navigate(activeQrModal.url);
                  setActiveQrModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/20 active:scale-95 transition-all"
              >
                <span>Directly Open Menu Link</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                onClick={() => {
                  window.open(getQrImageUrl(activeQrModal.url), '_blank');
                }}
                className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Download High-Res QR Image</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
