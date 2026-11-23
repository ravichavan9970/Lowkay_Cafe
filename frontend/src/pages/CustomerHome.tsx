import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { menuApi, tableApi } from '../services/api';
import { Category, FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import FoodItemCard from '../components/FoodItemCard';
import CustomizationModal from '../components/CustomizationModal';
import CartDrawer from '../components/CartDrawer';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Sparkles, ShoppingBag, ArrowRight, Flame, Coffee, Check } from 'lucide-react';

export const CustomerHome: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { tableNumber: pathTableNum } = useParams<{ tableNumber?: string }>();
  const { tableNumber, setTableInfo, itemCount, subtotal } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<FoodItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Table recognition from URL query or path
  useEffect(() => {
    const tableParam = pathTableNum || searchParams.get('table');
    const tokenParam = searchParams.get('token');

    if (tableParam) {
      const num = parseInt(tableParam, 10);
      if (!isNaN(num)) {
        setTableInfo(num, tokenParam || undefined);
        if (tokenParam) {
          tableApi.validateToken(num, tokenParam).catch(console.error);
        }
      }
    }
  }, [pathTableNum, searchParams]);

  // Load Categories & Food Items
  useEffect(() => {
    setIsLoading(true);
    Promise.all([menuApi.getCategories(), menuApi.getItems()])
      .then(([catRes, itemRes]) => {
        const catList = Array.isArray(catRes.data) ? catRes.data : [];
        const itemList = Array.isArray(itemRes.data) ? itemRes.data : [];
        setCategories(catList);
        setFoodItems(itemList);
        if (catList.length > 0) {
          setSelectedCategory(catList[0].id);
        }
      })
      .catch((err) => console.error('Menu load error', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter food items safely
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeFoodItems = Array.isArray(foodItems) ? foodItems : [];

  const filteredItems = safeFoodItems.filter((item) => {
    if (selectedCategory && item.categoryId !== selectedCategory) {
      // Special check for "Special Offers" category
      const currentCat = safeCategories.find((c) => c.id === selectedCategory);
      if (currentCat?.slug === 'special-offers' && !item.isSpecialOffer) {
        return false;
      } else if (currentCat?.slug !== 'special-offers' && item.categoryId !== selectedCategory) {
        return false;
      }
    }

    if (vegOnly && !item.isVeg) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchIngr = item.ingredients?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchIngr) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5] text-stone-900 relative selection:bg-amber-500 selection:text-stone-950 pb-24">
      {/* Ambient iOS Luminous Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-orange-400/10 blur-3xl"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl"></div>
      </div>

      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Hero Welcome Glass Card */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="ios-glass-dark rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden text-white border border-white/15">
            
            {/* Ambient Background Glow inside Glass */}
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-orange-600/15 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                {/* iOS Glass Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold mb-4 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive Smart Menu • Table {tableNumber || 4}</span>
                </div>

                <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-tight">
                  Artisan Coffee & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Gourmet Bites</span>
                </h1>
                
                <p className="text-stone-300 text-sm sm:text-base mt-2.5 leading-relaxed font-normal">
                  Order straight to our kitchen, customize spice and portion levels, and track preparation live from your seat.
                </p>
              </div>

              {/* iOS Frosted Search Capsule */}
              <div className="w-full md:w-88 shrink-0">
                <div className="relative group">
                  <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search dishes, drinks, burgers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 text-white placeholder:text-stone-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/60 shadow-inner transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-white text-xs px-1.5 py-0.5 rounded-full bg-white/10"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full relative z-10">
        
        {/* iOS Glass Category Navigation Bar */}
        <div className="sticky top-16 z-30 ios-glass py-3.5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 border-y border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-3">
            
            {/* Scrollable iOS Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {safeCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 active:scale-95 select-none ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-md shadow-stone-900/25 scale-[1.02]'
                        : 'bg-white/80 hover:bg-white text-stone-600 hover:text-stone-950 border border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* iOS Veg Only Segmented Pill */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border flex items-center gap-2 transition-all duration-300 active:scale-95 shadow-sm ${
                vegOnly
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-600/25'
                  : 'border-stone-200/90 bg-white/80 text-stone-600 hover:text-stone-900'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full flex items-center justify-center ${
                  vegOnly ? 'bg-white text-emerald-600' : 'bg-emerald-600'
                }`}
              >
                {vegOnly && <Check className="w-2 h-2 stroke-[3]" />}
              </span>
              <span className="hidden sm:inline">Veg Only</span>
            </button>
          </div>
        </div>

        {/* Food Items Grid with iOS Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="ios-card rounded-3xl h-80 animate-pulse bg-white/70 border border-stone-200/60"
              ></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center ios-card rounded-3xl p-12 max-w-md mx-auto">
            <Coffee className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <h3 className="font-display font-black text-lg text-stone-800">No dishes match your filter</h3>
            <p className="text-xs text-stone-400 mt-1">Try resetting the veg filter or searching for another keyword.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setVegOnly(false);
                if (safeCategories.length > 0) setSelectedCategory(safeCategories[0].id);
              }}
              className="mt-4 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold hover:bg-amber-500 hover:text-stone-950 transition-colors"
            >
              Show All Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onSelect={(selected) => setSelectedItemForCustomization(selected)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom iOS Cart Capsule (Appears above the Screen Switcher) */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full ios-glass-dark text-white p-3 sm:p-3.5 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.45)] border border-white/20 flex items-center justify-between active:scale-98 transition-all hover:border-amber-400/50 group"
          >
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 font-black flex items-center justify-center shadow-md">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-semibold text-stone-300 block">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in order
                </span>
                <span className="font-display font-black text-sm text-amber-400">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 group-hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md transition-colors">
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedItemForCustomization && (
        <CustomizationModal
          item={selectedItemForCustomization}
          onClose={() => setSelectedItemForCustomization(null)}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default CustomerHome;
