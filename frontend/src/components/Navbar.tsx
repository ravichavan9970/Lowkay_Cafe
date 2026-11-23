import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, ShoppingBag, Bell, Wifi, Clock, User, LogOut, LayoutDashboard, Monitor, Users } from 'lucide-react';
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
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Table Identification */}
          <div className="flex items-center gap-3">
            <Link to={tableNumber ? `/?table=${tableNumber}` : '/'} className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                  Lowkey<span className="text-brand-400">Cafe</span>
                </span>
                <p className="text-[10px] text-stone-400 tracking-wider uppercase font-medium -mt-1 hidden sm:block">
                  Smart Dining Experience
                </p>
              </div>
            </Link>

            {/* Table Badge */}
            {tableNumber && (
              <div className="ml-2 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                Table {tableNumber}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Wi-Fi Button */}
            <button
              onClick={() => setShowWifi(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-stone-700"
              title="Restaurant Wi-Fi"
            >
              <Wifi className="w-4 h-4 text-brand-400" />
              <span className="hidden sm:inline">Wi-Fi</span>
            </button>

            {/* Call Waiter Button */}
            {tableNumber && (
              <button
                onClick={() => setShowCallWaiter(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-brand-500 hover:from-amber-500 hover:to-brand-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Call Waiter</span>
              </button>
            )}

            {/* Active Order Tracker Link */}
            {activeOrderCode && (
              <button
                onClick={() => navigate(`/order-tracking/${activeOrderCode}`)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Track Order</span>
              </button>
            )}

            {/* Cart Trigger Button */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-stone-950 font-bold transition-all shadow-md active:scale-95 flex items-center justify-center"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-5 h-5 text-stone-900" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900 shadow-sm animate-bounce">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* Staff / Admin Navigation Dropdown */}
            {user ? (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-stone-700">
                {hasRole('ADMIN') && (
                  <Link
                    to="/admin"
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-brand-400 text-xs font-medium"
                    title="Admin Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                {(hasRole('ADMIN') || hasRole('KITCHEN_STAFF')) && (
                  <Link
                    to="/kds"
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-medium"
                    title="Kitchen Display System"
                  >
                    <Monitor className="w-4 h-4" />
                  </Link>
                )}
                {(hasRole('ADMIN') || hasRole('WAITER')) && (
                  <Link
                    to="/waiter"
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-blue-400 text-xs font-medium"
                    title="Waiter Floor View"
                  >
                    <Users className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-stone-800 hover:bg-red-900/50 text-stone-400 hover:text-red-300 text-xs transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors border border-stone-700"
                title="Staff / Admin Login"
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
