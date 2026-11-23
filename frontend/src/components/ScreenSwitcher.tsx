import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  QrCode,
  ShoppingBag,
  ChefHat,
  Bell,
  LayoutDashboard,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const ScreenSwitcher: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, quickSwitchRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine current active mode based on route
  const currentPath = location.pathname;
  let activeTab: 'home' | 'dinein' | 'takeaway' | 'kitchen' | 'waiter' | 'admin' = 'home';
  if (currentPath === '/') {
    activeTab = 'home';
  } else if (currentPath.startsWith('/takeaway')) {
    activeTab = 'takeaway';
  } else if (currentPath.startsWith('/table') || currentPath.startsWith('/menu')) {
    activeTab = 'dinein';
  } else if (currentPath.startsWith('/kds')) {
    activeTab = 'kitchen';
  } else if (currentPath.startsWith('/waiter')) {
    activeTab = 'waiter';
  } else if (currentPath.startsWith('/admin')) {
    activeTab = 'admin';
  }

  const handleSwitch = (tab: 'home' | 'dinein' | 'takeaway' | 'kitchen' | 'waiter' | 'admin') => {
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'dinein') {
      quickSwitchRole('CUSTOMER');
      navigate('/table/4');
    } else if (tab === 'takeaway') {
      quickSwitchRole('CUSTOMER');
      navigate('/takeaway');
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
      id: 'home' as const,
      label: 'Cafe Website',
      shortLabel: 'Home',
      icon: Globe,
    },
    {
      id: 'dinein' as const,
      label: 'Table #4',
      shortLabel: 'Dine-In',
      icon: QrCode,
    },
    {
      id: 'takeaway' as const,
      label: 'Takeaway QR',
      shortLabel: 'To-Go',
      icon: ShoppingBag,
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
    <aside aria-label="Quick Screen Switcher" className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-full px-3">
      {isCollapsed ? (
        /* Collapsed Floating Island in Black/Yellow */
        <button
          onClick={() => setIsCollapsed(false)}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/90 backdrop-blur-2xl border border-neutral-800 text-white shadow-[0_12px_40px_rgba(0,0,0,0.8)] hover:border-yellow-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
          title="Expand Screen Switcher"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Switch Screen
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-yellow-400 transition-colors" />
        </button>
      ) : (
        /* Full Black, Yellow & White Dynamic Island Switcher */
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-black/90 backdrop-blur-2xl border border-neutral-800/90 shadow-[0_16px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/5 transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Status Capsule Indicator */}
          <div className="hidden md:flex items-center gap-2 pl-3.5 pr-2.5 py-1 text-[11px] text-neutral-400 border-r border-neutral-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
            </span>
            <span className="font-bold text-neutral-200">Live Role</span>
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
                  className={`group relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-black transition-all duration-300 active:scale-95 select-none ${
                    isActive
                      ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-850'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] transition-transform duration-300 ${
                      isActive ? 'scale-110 text-black' : 'group-hover:scale-110'
                    }`}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black hidden sm:inline-block"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 ml-1 rounded-full text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800 transition-colors"
            title="Minimize Switcher"
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
