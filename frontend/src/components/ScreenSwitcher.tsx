import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Coffee,
  ChefHat,
  Bell,
  LayoutDashboard,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export const ScreenSwitcher: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, quickSwitchRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Determine current active mode based on route
  const currentPath = location.pathname;

  // Only show floating switcher on staff routes or for logged-in staff members.
  // Customers on the landing page, table menu, or takeaway will NEVER see this bar!
  const isStaffRoute =
    currentPath.startsWith('/kds') ||
    currentPath.startsWith('/waiter') ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/login') ||
    currentPath.startsWith('/portal') ||
    currentPath.startsWith('/staff');

  const isStaffUser =
    user && Array.isArray(user.roles) && user.roles.some((r) => r !== 'ROLE_CUSTOMER');

  if (isDismissed || (!isStaffRoute && !isStaffUser)) {
    return null;
  }

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
      label: 'Diner / Website',
      shortLabel: 'Diner',
      icon: Coffee,
    },
    {
      id: 'kitchen' as const,
      label: 'Kitchen KDS',
      shortLabel: 'Kitchen',
      icon: ChefHat,
    },
    {
      id: 'waiter' as const,
      label: 'Waiter Floor',
      shortLabel: 'Waiter',
      icon: Bell,
    },
    {
      id: 'admin' as const,
      label: 'Management',
      shortLabel: 'Admin',
      icon: LayoutDashboard,
    },
  ];

  return (
    <aside
      aria-label="Quick Screen Switcher"
      className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 select-none"
    >
      {isCollapsed ? (
        /* Collapsed Floating Island on Left Edge */
        <button
          onClick={() => setIsCollapsed(false)}
          className="group flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl bg-black/92 backdrop-blur-2xl border border-neutral-800 text-white shadow-[0_12px_40px_rgba(0,0,0,0.85)] hover:border-yellow-400/60 hover:scale-105 active:scale-95 transition-all duration-300"
          title="Expand Screen Switcher"
          aria-label="Expand Screen Switcher"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></div>
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-yellow-400 transition-colors" />
        </button>
      ) : (
        /* Vertical Left-Docked Switcher (Up-to-Down) */
        <div className="flex flex-col gap-1.5 p-2 rounded-3xl bg-black/95 backdrop-blur-2xl border border-neutral-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.9)] ring-1 ring-white/5 transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] text-neutral-400 border-b border-neutral-850 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              <span className="font-bold text-neutral-200 hidden sm:inline text-[10px] uppercase tracking-wider">
                Switch Role
              </span>
            </div>

            {/* Minimize & Close Actions */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-full text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800 transition-colors"
                title="Minimize Switcher"
                aria-label="Minimize Switcher"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-full text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                title="Dismiss Bar"
                aria-label="Dismiss Bar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Items (Arranged Up to Down) */}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSwitch(item.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-2xl text-xs font-black transition-all duration-300 active:scale-95 select-none ${
                    isActive
                      ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-850'
                  }`}
                  aria-pressed={isActive}
                  title={item.label}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] shrink-0 transition-transform duration-300 ${
                      isActive ? 'scale-110 text-black' : 'group-hover:scale-110'
                    }`}
                  />
                  <span className="hidden sm:inline whitespace-nowrap">{item.label}</span>
                  <span className="sm:hidden text-[10px]">{item.shortLabel}</span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black ml-auto hidden sm:inline-block"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ScreenSwitcher;
