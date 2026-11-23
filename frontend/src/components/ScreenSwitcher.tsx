import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone,
  ChefHat,
  Bell,
  LayoutDashboard,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Lock,
} from 'lucide-react';

export const ScreenSwitcher: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, quickSwitchRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine current active mode based on route
  const currentPath = location.pathname;
  let activeTab: 'customer' | 'kitchen' | 'waiter' | 'admin' = 'customer';
  if (currentPath.startsWith('/kds')) {
    activeTab = 'kitchen';
  } else if (currentPath.startsWith('/waiter')) {
    activeTab = 'waiter';
  } else if (currentPath.startsWith('/admin')) {
    activeTab = 'admin';
  } else {
    activeTab = 'customer';
  }

  const handleSwitch = (tab: 'customer' | 'kitchen' | 'waiter' | 'admin') => {
    if (tab === 'customer') {
      quickSwitchRole('CUSTOMER');
      navigate('/');
    } else if (tab === 'kitchen') {
      quickSwitchRole('KITCHEN_STAFF');
      navigate('/kds');
    } else if (tab === 'waiter') {
      quickSwitchRole('WAITER');
      navigate('/waiter');
    } else if (tab === 'admin') {
      quickSwitchRole('ADMIN');
      navigate('/admin');
    }
  };

  const navItems = [
    {
      id: 'customer' as const,
      label: 'Diner / Menu',
      shortLabel: 'Diner',
      icon: Smartphone,
      badge: 'Table 4',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'kitchen' as const,
      label: 'Kitchen KDS',
      shortLabel: 'Kitchen',
      icon: ChefHat,
      badge: 'Live',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'waiter' as const,
      label: 'Waiter Floor',
      shortLabel: 'Waiter',
      icon: Bell,
      badge: 'Floor',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'admin' as const,
      label: 'Management',
      shortLabel: 'Admin',
      icon: LayoutDashboard,
      badge: 'Owner',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  return (
    <aside aria-label="Quick Screen Switcher" className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-full px-3">
      {isCollapsed ? (
        /* Collapsed Floating iOS Island Button */
        <button
          onClick={() => setIsCollapsed(false)}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-950/85 backdrop-blur-2xl border border-white/15 text-stone-200 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:scale-105 active:scale-95 transition-all duration-300"
          title="Expand Screen Switcher"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Switch Screen
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors" />
        </button>
      ) : (
        /* Full iOS-Style Dynamic Island Switcher */
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-stone-950/85 backdrop-blur-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Status Capsule Indicator */}
          <div className="hidden md:flex items-center gap-2 pl-3 pr-2 py-1 text-[11px] text-stone-400 border-r border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-stone-300">Live Role</span>
          </div>

          {/* Navigation Segments */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSwitch(item.id)}
                  className={`group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/30 font-extrabold'
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-950 hidden sm:inline-block"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 ml-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Minimize Bar"
            aria-label="Minimize Switcher"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};

export default ScreenSwitcher;
