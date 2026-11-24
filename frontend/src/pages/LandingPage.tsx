import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee,
  ShoppingBag,
  QrCode,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Flame,
  CheckCircle2,
  ChevronRight,
  Award,
  Heart,
  Leaf,
  ShieldCheck,
  Star,
  Layers,
} from 'lucide-react';

interface SpecialityItem {
  id: number;
  name: string;
  category: string;
  typeFilter: 'COFFEE' | 'PIZZA' | 'BURGER' | 'STARTERS' | 'MAINS' | 'DESSERT';
  price: number;
  description: string;
  imageUrl: string;
  badge: string;
  isVeg: boolean;
}

const CAFE_SPECIALITIES: SpecialityItem[] = [
  {
    id: 1,
    name: 'Spanish Cortado & Velvet Flat White',
    category: 'Specialty Coffee',
    typeFilter: 'COFFEE',
    price: 199,
    description: 'Double ristretto pull of single-origin Ethiopian beans balanced with warm, textured silky microfoam.',
    imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
    badge: '100% Arabica',
    isVeg: true,
  },
  {
    id: 2,
    name: 'Wild Truffle & Mushroom Sourdough Pizza',
    category: 'Wood-Fired Pizza',
    typeFilter: 'PIZZA',
    price: 499,
    description: '48-hour cold-fermented sourdough crust topped with roasted portobello mushrooms, white truffle oil & aged mozzarella.',
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
    badge: '48h Ferment',
    isVeg: true,
  },
  {
    id: 3,
    name: 'Smoked Cheddar Brioche Smash Burger',
    category: 'Gourmet Burgers',
    typeFilter: 'BURGER',
    price: 369,
    description: 'Double-smashed spiced patties on butter-toasted brioche, caramelized shallots, house secret glaze & melted cheddar.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    badge: 'Chef Signature',
    isVeg: false,
  },
  {
    id: 4,
    name: 'Crispy Korean BBQ Wings',
    category: 'Small Plates',
    typeFilter: 'STARTERS',
    price: 349,
    description: 'Crispy double-fried chicken wings glazed in sticky spicy-sweet gochujang sauce with toasted white sesame & scallions.',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
    badge: 'Guest Favorite',
    isVeg: false,
  },
  {
    id: 5,
    name: 'Creamy Truffle Tagliatelle',
    category: 'Artisanal Pasta',
    typeFilter: 'MAINS',
    price: 449,
    description: 'Fresh egg ribbon pasta tossed in silky black truffle butter emulsion with sautéed cremini mushrooms & aged pecorino.',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281788?auto=format&fit=crop&w=600&q=80',
    badge: 'Hand-Rolled',
    isVeg: true,
  },
  {
    id: 6,
    name: 'Molten Basque Burnt Cheesecake',
    category: 'Handcrafted Desserts',
    typeFilter: 'DESSERT',
    price: 289,
    description: 'Caramelized burnt exterior with an ultra-creamy, custard-soft center served with fresh tart berry compote.',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    badge: 'House Baked',
    isVeg: true,
  },
  {
    id: 7,
    name: 'Artisan Margherita Di Bufala',
    category: 'Wood-Fired Pizza',
    typeFilter: 'PIZZA',
    price: 429,
    description: 'San Marzano DOP tomato passata, creamy Campania buffalo mozzarella, fresh sweet basil & cold-pressed EVOO.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    badge: 'Authentic Crust',
    isVeg: true,
  },
  {
    id: 8,
    name: 'Vanilla Cold Foam Nitro Cold Brew',
    category: 'Specialty Coffee',
    typeFilter: 'COFFEE',
    price: 229,
    description: '18-hour slow steep cold brew steeped with single-origin beans, crowned with sweet whipped Madagascar vanilla cream.',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    badge: '18h Steeped',
    isVeg: true,
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSpecialityFilter, setActiveSpecialityFilter] = useState<string>('ALL');

  const filteredSpecialities = activeSpecialityFilter === 'ALL'
    ? CAFE_SPECIALITIES
    : CAFE_SPECIALITIES.filter(item => item.typeFilter === activeSpecialityFilter);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-yellow-400 selection:text-black">
      
      {/* Top Announcement Bar (Wi-Fi reference cleanly removed) */}
      <div className="bg-yellow-400 text-black text-xs font-black py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Welcome to Lowkey Cafe · Specialty Roastery, Wood-Fired Kitchen & Good Vibes</span>
        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-2xl border-b border-neutral-800/90 text-white shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Lowkey Cafe Logo"
              className="w-11 h-11 object-contain shrink-0"
            />
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
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-neutral-300">
            <a href="#specialities" className="hover:text-yellow-400 transition-colors">Our Specialities</a>
            <a href="#why-us" className="hover:text-yellow-400 transition-colors">Why Lowkey Cafe</a>
            <a href="#ambiance" className="hover:text-yellow-400 transition-colors">Ambiance & Seating</a>
            <a href="#visit" className="hover:text-yellow-400 transition-colors">Hours & Location</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/takeaway')}
              className="px-3.5 sm:px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-850 border border-yellow-400/40 text-yellow-300 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Order Takeaway Online"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" />
              <span>Takeaway Order</span>
            </button>
            <button
              onClick={() => navigate('/portal')}
              className="px-3.5 sm:px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
            >
              <span>Staff Portal</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
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
            <span>Artisan Roastery · Wood-Fired Kitchen · Contactless Smart Dining</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Where Slow Mornings Meet <span className="text-yellow-400 underline decoration-yellow-400/30 underline-offset-8">Gourmet Flavors</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Welcome to <strong className="text-white font-bold">Lowkey Cafe</strong>. Sip ethically sourced single-origin pour-overs, savor 48-hour cold-ferment sourdough pizzas, and enjoy artisanal plates in a serene, modern ambiance.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <a
              href="#specialities"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/25 active:scale-95 transition-all"
            >
              <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
              <span>Explore Cafe Specialities</span>
            </a>

            <a
              href="#why-us"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-white font-black text-sm flex items-center justify-center gap-2 hover:border-yellow-400/50 active:scale-95 transition-all"
            >
              <Heart className="w-4 h-4 text-yellow-400" />
              <span>Why Lowkey</span>
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
              <p className="text-xs text-neutral-400 font-semibold mt-0.5">Smart QR Table Stands</p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-850">
              <span className="text-2xl font-black text-white">4.9 ★</span>
              <p className="text-xs text-neutral-400 font-semibold mt-0.5">500+ Diner Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Curated Cafe Specialities & Signature Dishes */}
      <section id="specialities" className="py-16 sm:py-24 border-b border-neutral-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Handcrafted With Passion</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              Our Signature Specialities
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              From in-house roasted specialty beans to slow cold-fermented sourdough crusts and melted Basque cheesecakes.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-10">
            {[
              { id: 'ALL', label: 'All Specialities' },
              { id: 'COFFEE', label: 'Specialty Coffee' },
              { id: 'PIZZA', label: 'Sourdough Pizzas' },
              { id: 'BURGER', label: 'Smash Burgers' },
              { id: 'STARTERS', label: 'Small Plates' },
              { id: 'MAINS', label: 'Artisanal Pasta' },
              { id: 'DESSERT', label: 'Desserts' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSpecialityFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  activeSpecialityFilter === tab.id
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
                    : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Specialities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSpecialities.map(dish => (
              <div
                key={dish.id}
                className="group rounded-3xl bg-neutral-900/90 border border-neutral-800 hover:border-yellow-400/60 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-yellow-400/10 flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border-2 ${dish.isVeg ? 'border-emerald-500 bg-emerald-500/40' : 'border-rose-500 bg-rose-500/40'} flex items-center justify-center`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-neutral-300 border border-neutral-800">
                        {dish.category}
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase shadow-md">
                      {dish.badge}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-black text-base text-white group-hover:text-yellow-400 transition-colors">
                        {dish.name}
                      </h3>
                      <span className="font-black text-yellow-400 text-base whitespace-nowrap">
                        ₹{dish.price}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1 text-yellow-400 font-semibold text-[11px]">
                      <Sparkles className="w-3 h-3" /> Cafe Signature
                    </span>
                    <button
                      onClick={() => navigate('/takeaway')}
                      className="text-xs font-bold text-white hover:text-yellow-400 flex items-center gap-1 transition-colors"
                    >
                      <span>Takeaway</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table QR Dining Notice Card */}
          <div className="mt-12 p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-base text-white">
                  Visiting Our Cafe? Order Directly From Your Table
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                  Every dining table at Lowkey Cafe features a physical engraved QR stand. Simply sit down, point your phone camera, browse our full live seasonal menu, and order instantly.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/takeaway')}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-yellow-400/20"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Or Order Online for Takeaway</span>
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 2: What Makes Lowkey Cafe Special (Good Things About Our Cafe) */}
      <section id="why-us" className="py-16 sm:py-24 border-b border-neutral-850 bg-neutral-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>The Lowkey Standard</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              Good Things About Our Cafe
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              We obsess over the culinary details, ethical sourcing, and quiet luxury so you can enjoy every visit.
            </p>
          </div>

          {/* 6 Feature Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Pillar 1: Single Origin */}
            <div className="p-7 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-lg text-white">100% Single-Origin Arabica</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Direct-trade beans sourced from high-altitude estates in Chikmagalur and Ethiopia. Micro-roasted in small batches to preserve chocolate, floral, and citrus notes with a velvety crema.
              </p>
            </div>

            {/* Pillar 2: 48h Ferment */}
            <div className="p-7 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-lg text-white">48-Hour Cold Fermentation</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Our sourdough pizza dough and buttery brioche buns undergo 48 hours of slow, wild-yeast cold fermentation. The result is an airy, blistered crust that is incredibly light and easy to digest.
              </p>
            </div>

            {/* Pillar 3: Farm-Fresh Ingredients */}
            <div className="p-7 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-lg text-white">Artisanal & Farm-Fresh</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                We use authentic Italian San Marzano tomatoes, Fior di Latte mozzarella, hand-picked seasonal organic herbs, and zero artificial preservatives or frozen bases.
              </p>
            </div>

            {/* Pillar 4: Smart QR Dining */}
            <div className="p-7 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-lg text-white">Physical QR Dining Stands</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                All 10 tables feature custom physical QR stands. Scan with your phone to browse, add notes, and send orders straight to the kitchen display with zero waiting for paper menus or staff.
              </p>
            </div>

            {/* Pillar 5: Acoustic Lounge */}
            <div className="p-7 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-lg text-white">Acoustic & Cozy Atmosphere</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Calibrated warm amber 2700K lighting, plush velvet seating, and relaxed lo-fi soundscapes designed for deep focus, creative work, or intimate evening dinners.
              </p>
            </div>

            {/* Pillar 6: Pet-Friendly Garden */}
            <div className="p-7 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-yellow-400/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-lg text-white">Pet-Friendly Open Spaces</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Our sun-dappled patio garden features open-air greenery with morning sun, where four-legged companions are always treated as VIPs with fresh water bowls.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: Cafe Seating Zones & Atmosphere */}
      <section id="ambiance" className="py-16 sm:py-24 border-b border-neutral-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Curated Spaces</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              Three Distinct Dining Atmospheres
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              Whether you are catching up on reading, sharing a meal with friends, or enjoying sunset views.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Zone 1: Lounge */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-white">Indoor Acoustic Lounge</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Designed for productivity and quiet conversations. Velvet booth seating, calibrated warm amber lighting, and charging sockets at every table.
              </p>
              <div className="pt-2 text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                <span>Tables 01 – 04</span>
              </div>
            </div>

            {/* Zone 2: Patio */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-white">Patio Garden Oasis</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sun-dappled open-air greenery with fresh morning breezes. Pet-friendly tables perfect for brunch with friends and four-legged companions.
              </p>
              <div className="pt-2 text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                <span>Tables 05 – 08</span>
              </div>
            </div>

            {/* Zone 3: Rooftop */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl text-white">Rooftop Sunset Terrace</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Elevated skyline views beneath warm fairy lights. Evening acoustic playlists, refreshing craft coolers, and starlit sourdough dining.
              </p>
              <div className="pt-2 text-[11px] font-bold text-yellow-400 flex items-center gap-1">
                <span>Tables 09 – 10</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: Visit, Opening Hours & Location (Wi-Fi completely removed) */}
      <section id="visit" className="py-16 sm:py-24 border-b border-neutral-850 bg-neutral-950/60">
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

            {/* Smart Table-Side Dining Experience (Replaces Wi-Fi Card) */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-base text-white">Physical QR Dining</h4>
                  <p className="text-xs text-neutral-400">Tables #01 through #10</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 text-xs text-neutral-300">
                <p className="leading-relaxed">
                  Every table has its own serial QR code stand pasted on it. Simply scan with any smartphone camera to open your table cart and order with zero waiting.
                </p>
                <div className="pt-1 flex items-center gap-2 text-yellow-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant Kitchen & Bar Dispatch</span>
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
            <img
              src="/logo.png"
              alt="Lowkey Cafe Logo"
              className="w-10 h-10 object-contain shrink-0"
            />
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
            <a href="#specialities" className="hover:text-yellow-400 transition-colors">Specialities</a>
            <a href="#why-us" className="hover:text-yellow-400 transition-colors">Why Lowkey</a>
            <a href="#ambiance" className="hover:text-yellow-400 transition-colors">Ambiance</a>
            <a href="#visit" className="hover:text-yellow-400 transition-colors">Hours & Location</a>
            <button onClick={() => navigate('/portal')} className="text-neutral-500 hover:text-yellow-400 text-xs font-semibold transition-colors">Staff Portal</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
