import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useLocation, useNavigate } from 'react-router-dom';
import { menuApi, tableApi } from '../services/api';
import { Category, FoodItem } from '../types';
import { useCart } from '../context/CartContext';
import FoodItemCard from '../components/FoodItemCard';
import CustomizationModal from '../components/CustomizationModal';
import CartDrawer from '../components/CartDrawer';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Sparkles, ShoppingBag, ArrowRight, Coffee, Check, QrCode, ArrowLeft } from 'lucide-react';

export const CustomerHome: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { tableNumber: pathTableNum } = useParams<{ tableNumber?: string }>();
  const { tableNumber, setTableInfo, isTakeaway, setTakeawayMode, itemCount, subtotal } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<FoodItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Table & Takeaway recognition from URL
  useEffect(() => {
    if (location.pathname.startsWith('/takeaway')) {
      setTakeawayMode(true);
      return;
    }

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
  }, [pathTableNum, searchParams, location.pathname]);

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
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white relative selection:bg-yellow-400 selection:text-black pb-28">
      {/* Ambient Yellow Luminous Glow Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-yellow-500/8 blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full bg-yellow-400/5 blur-3xl"></div>
      </div>

      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Compact Diner Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Return to Cafe Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-lg sm:text-xl text-white">
                  {isTakeaway ? 'Takeaway & Pickup Menu' : `Table #${tableNumber || 1} Menu`}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider">
                  {isTakeaway ? '🥡 To-Go (0% Fee)' : '🍽️ Dine-In Table'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {isTakeaway
                  ? 'Zero dine-in service charge · Freshly packed at counter'
                  : 'Orders dispatch directly to kitchen line · Live updates'}
              </p>
            </div>
          </div>

          {/* Inline Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search dishes, drinks, burgers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-black border border-neutral-800 text-white placeholder:text-neutral-500 text-xs focus:outline-none focus:border-yellow-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full relative z-10">
        
        {/* Sticky Black/Yellow Category Navigation Bar */}
        <div className="sticky top-16 z-30 bg-[#0a0a0a]/90 backdrop-blur-2xl py-3.5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 border-y border-neutral-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <div className="flex items-center justify-between gap-3">
            
            {/* Scrollable Category Pills in Black/Yellow/White */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {safeCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all duration-300 flex items-center gap-2 active:scale-95 select-none ${
                      isSelected
                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/25 scale-[1.02]'
                        : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Veg Only Toggle Pill */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-black border flex items-center gap-2 transition-all duration-300 active:scale-95 shadow-sm ${
                vegOnly
                  ? 'border-emerald-500 bg-emerald-500 text-black shadow-emerald-500/25'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full flex items-center justify-center ${
                  vegOnly ? 'bg-black text-emerald-400' : 'bg-emerald-500'
                }`}
              >
                {vegOnly && <Check className="w-2 h-2 stroke-[3]" />}
              </span>
              <span className="hidden sm:inline">Veg Only</span>
            </button>
          </div>
        </div>

        {/* Food Items Grid with High-Contrast Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="rounded-3xl h-80 animate-pulse bg-neutral-900/80 border border-neutral-800"
              ></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center bg-neutral-950/80 border border-neutral-800 rounded-3xl p-12 max-w-md mx-auto">
            <Coffee className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-display font-black text-lg text-white">No dishes match your filter</h3>
            <p className="text-xs text-neutral-400 mt-1">Try resetting the filter or searching for another keyword.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setVegOnly(false);
                if (safeCategories.length > 0) setSelectedCategory(safeCategories[0].id);
              }}
              className="mt-4 px-5 py-2 rounded-full bg-yellow-400 text-black text-xs font-black hover:bg-yellow-300 transition-colors"
            >
              Show All Dishes
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

      {/* Floating Bottom Cart Capsule in Black/Yellow Tone */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-black/90 backdrop-blur-2xl text-white p-3 sm:p-3.5 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.8)] border border-yellow-400/40 flex items-center justify-between active:scale-98 transition-all hover:border-yellow-400 group"
          >
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-full bg-yellow-400 text-black font-black flex items-center justify-center shadow-md shadow-yellow-400/30">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-semibold text-neutral-300 block">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in order
                </span>
                <span className="font-display font-black text-sm text-yellow-400">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-400 group-hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/20 transition-colors">
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
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
