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
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CallWaiterModal from './CallWaiterModal';
import WifiBanner from './WifiBanner';

interface NavbarProps {
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { itemCount, tableNumber, isTakeaway, activeOrderCode } = useCart();
  const { user, logout, hasRole } = useAuth();
  const [showCallWaiter, setShowCallWaiter] = useState(false);
  const [showWifi, setShowWifi] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-2xl border-b border-neutral-800/90 text-white shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & iOS Table Pill */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group" title="Return to Lowkey Cafe Home">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-400/25 group-hover:scale-105 active:scale-95 transition-all duration-300">
                <Coffee className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <span className="font-display font-black text-xl tracking-tight text-white flex items-center gap-1">
                  Lowkey<span className="text-yellow-400">Cafe</span>
                </span>
                <p className="text-[10px] text-neutral-400 tracking-wider uppercase font-semibold -mt-1 hidden sm:block">
                  Smart Dining Experience
                </p>
              </div>
            </Link>

            {/* iOS Style Capsule: Takeaway or Table # */}
            {isTakeaway ? (
              <div className="ml-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md">
                <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Takeaway</span>
              </div>
            ) : tableNumber ? (
              <div className="ml-2 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                <span>Table {tableNumber}</span>
              </div>
            ) : null}
          </div>

          {/* Action Buttons with High-Contrast Black, Yellow & White Tone */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Wi-Fi Capsule */}
            <button
              onClick={() => setShowWifi(true)}
              className="px-3 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              title="Restaurant Wi-Fi Info"
            >
              <Wifi className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden sm:inline">Wi-Fi</span>
            </button>

            {/* Call Waiter Pill (Only for Dine-in with tableNumber) */}
            {!isTakeaway && tableNumber && (
              <button
                onClick={() => setShowCallWaiter(true)}
                className="px-3.5 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-yellow-400/20 active:scale-95 transition-all"
              >
                <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Call Waiter</span>
              </button>
            )}

            {/* Active Order Tracker */}
            {activeOrderCode && (
              <button
                onClick={() => navigate(`/order-tracking/${activeOrderCode}`)}
                className="px-3.5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Track Order</span>
              </button>
            )}

            {/* Dynamic Cart Capsule */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative px-3.5 sm:px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-yellow-400/40 text-yellow-400 font-black transition-all shadow-md active:scale-95 flex items-center gap-2"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-4 h-4 text-yellow-400 stroke-[2.5]" />
                <span className="text-xs font-black hidden sm:inline text-white">Bag</span>
                {itemCount > 0 && (
                  <span className="bg-yellow-400 text-black text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* Staff / Admin Quick Access */}
            {user ? (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-neutral-800">
                {hasRole('ADMIN') && (
                  <Link
                    to="/admin"
                    className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-yellow-400 text-xs font-medium active:scale-95 transition-all border border-neutral-800"
                    title="Admin Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                {(hasRole('ADMIN') || hasRole('KITCHEN_STAFF')) && (
                  <Link
                    to="/kds"
                    className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-yellow-400 text-xs font-medium active:scale-95 transition-all border border-neutral-800"
                    title="Kitchen Display System"
                  >
                    <Monitor className="w-4 h-4" />
                  </Link>
                )}
                {(hasRole('ADMIN') || hasRole('WAITER')) && (
                  <Link
                    to="/waiter"
                    className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-blue-400 text-xs font-medium active:scale-95 transition-all border border-neutral-800"
                    title="Waiter Floor View"
                  >
                    <Users className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 rounded-full bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 text-xs active:scale-95 transition-all border border-neutral-800"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium border border-neutral-800 active:scale-95 transition-all"
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
