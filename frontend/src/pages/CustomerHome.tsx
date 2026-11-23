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
import { Search, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

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
        setCategories(catRes.data);
        setFoodItems(itemRes.data);
        if (catRes.data.length > 0) {
          setSelectedCategory(catRes.data[0].id);
        }
      })
      .catch((err) => console.error('Menu load error', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter food items
  const filteredItems = foodItems.filter((item) => {
    if (selectedCategory && item.categoryId !== selectedCategory) {
      // Special check for "Special Offers" category
      const currentCat = categories.find((c) => c.id === selectedCategory);
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
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-b from-stone-900 to-stone-850 text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-stone-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>QR Smart Dining Active</span>
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white">
                Artisan Coffee & Gourmet Bites
              </h1>
              <p className="text-stone-400 text-sm sm:text-base max-w-xl mt-2 leading-relaxed">
                Scan, customize, and order straight to our kitchen from Table {tableNumber || 5}.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search dishes, burgers, coffees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-800/90 border border-stone-700 text-stone-100 text-xs placeholder:text-stone-400 focus:outline-none focus:border-brand-500 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Category Navigation Bar */}
        <div className="sticky top-16 z-30 bg-stone-50/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 border-b border-stone-200/80">
          <div className="flex items-center justify-between gap-3">
            
            {/* Scrollable Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-md'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Veg Only Toggle */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                vegOnly
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-stone-200 bg-white text-stone-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="hidden sm:inline">Veg Only</span>
            </button>
          </div>
        </div>

        {/* Food Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-stone-200"></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center">
            <h3 className="font-display font-bold text-lg text-stone-700">No dishes found</h3>
            <p className="text-xs text-stone-400 mt-1">Try another category or search query.</p>
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

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {itemCount > 0 && (
        <div className="sticky bottom-4 z-30 max-w-lg mx-auto w-full px-4 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-brand-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-stone-950 font-black flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-stone-300 block">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in order
                </span>
                <span className="font-display font-black text-base text-amber-400">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
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
