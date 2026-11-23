import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Coffee,
  ShoppingBag,
  Bell,
  Wifi,
  Clock,
  User,
  LogOut,
  LayoutDashboard,
  Monitor,
  Users,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CallWaiterModal from './CallWaiterModal';
import WifiBanner from './WifiBanner';

interface NavbarProps {
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { itemCount, tableNumber, activeOrderCode } = useCart();
  const { user, logout, hasRole } = useAuth();
  const [showCallWaiter, setShowCallWaiter] = useState(false);
  const [showWifi, setShowWifi] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-950/80 backdrop-blur-2xl border-b border-white/10 text-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & iOS Table Pill */}
          <div className="flex items-center gap-3">
            <Link to={tableNumber ? `/?table=${tableNumber}` : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 active:scale-95 transition-all duration-300">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-black text-xl tracking-tight text-white flex items-center gap-1">
                  Lowkey<span className="text-amber-400">Cafe</span>
                </span>
                <p className="text-[10px] text-stone-400 tracking-wider uppercase font-semibold -mt-1 hidden sm:block">
                  Smart QR Dining
                </p>
              </div>
            </Link>

            {/* iOS Style Table Capsule */}
            {tableNumber && (
              <div className="ml-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Table {tableNumber}</span>
              </div>
            )}
          </div>

          {/* Action Buttons with iOS Glassmorphism */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Wi-Fi Capsule */}
            <button
              onClick={() => setShowWifi(true)}
              className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              title="Restaurant Wi-Fi Info"
            >
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Wi-Fi</span>
            </button>

            {/* Call Waiter iOS Pill */}
            {tableNumber && (
              <button
                onClick={() => setShowCallWaiter(true)}
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Call Waiter</span>
              </button>
            )}

            {/* Active Order Tracker */}
            {activeOrderCode && (
              <button
                onClick={() => navigate(`/order-tracking/${activeOrderCode}`)}
                className="px-3.5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Track Order</span>
              </button>
            )}

            {/* iOS Dynamic Cart Capsule */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative px-3 sm:px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-850 border border-amber-500/30 text-amber-400 font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black hidden sm:inline">Bag</span>
                {itemCount > 0 && (
                  <span className="bg-amber-500 text-stone-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* Staff / Admin Quick Access */}
            {user ? (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/10">
                {hasRole('ADMIN') && (
                  <Link
                    to="/admin"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-medium active:scale-95 transition-all"
                    title="Admin Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                {(hasRole('ADMIN') || hasRole('KITCHEN_STAFF')) && (
                  <Link
                    to="/kds"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-medium active:scale-95 transition-all"
                    title="Kitchen Display System"
                  >
                    <Monitor className="w-4 h-4" />
                  </Link>
                )}
                {(hasRole('ADMIN') || hasRole('WAITER')) && (
                  <Link
                    to="/waiter"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-blue-400 text-xs font-medium active:scale-95 transition-all"
                    title="Waiter Floor View"
                  >
                    <Users className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-300 text-xs active:scale-95 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-medium border border-white/10 active:scale-95 transition-all"
                title="Staff / Admin Sign In"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {showCallWaiter && (
        <CallWaiterModal
          tableNumber={tableNumber || 1}
          onClose={() => setShowCallWaiter(false)}
        />
      )}

      {showWifi && (
        <WifiBanner onClose={() => setShowWifi(false)} />
      )}
    </>
  );
};

export default Navbar;
