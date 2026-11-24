import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Coffee,
  ChefHat,
  Bell,
  LayoutDashboard,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ScreenSwitcherProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({
  isCollapsed = false,
  onToggle,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, quickSwitchRole } = useAuth();

  // Determine current active mode based on route
  const currentPath = location.pathname;

  // Only show sidebar switcher on staff routes.
  // The landing dashboard, table menu, and takeaway will NEVER show this sidebar.
  const isStaffRoute =
    currentPath.startsWith('/kds') ||
    currentPath.startsWith('/waiter') ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/login') ||
    currentPath.startsWith('/portal') ||
    currentPath.startsWith('/staff');

  if (!isStaffRoute) {
    return null;
  }

  let activeTab: 'customer' | 'kitchen' | 'waiter' | 'admin' | 'portal' = 'customer';
  if (currentPath.startsWith('/kds')) {
    activeTab = 'kitchen';
  } else if (currentPath.startsWith('/waiter')) {
    activeTab = 'waiter';
  } else if (currentPath.startsWith('/admin')) {
    activeTab = 'admin';
  } else if (currentPath.startsWith('/portal') || currentPath.startsWith('/staff')) {
    activeTab = 'portal';
  } else {
    activeTab = 'customer';
  }

  const handleSwitch = (tab: 'customer' | 'kitchen' | 'waiter' | 'admin' | 'portal') => {
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
    } else if (tab === 'portal') {
      navigate('/portal');
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
      label: 'Owner Admin',
      shortLabel: 'Admin',
      icon: LayoutDashboard,
    },
    {
      id: 'portal' as const,
      label: 'Staff Portal',
      shortLabel: 'Portal',
      icon: Sparkles,
    },
  ];

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 h-20 w-6 sm:w-7 bg-black/95 hover:bg-neutral-900 border-y border-r border-neutral-750 hover:border-yellow-400/60 rounded-r-2xl flex flex-col items-center justify-center gap-1 shadow-2xl transition-all group cursor-pointer"
        title="Expand Left Navigation Bar"
        aria-label="Expand Left Navigation Bar"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-yellow-400 transition-colors" />
      </button>
    );
  }

  return (
    <aside
      aria-label="Quick Navigation Sidebar"
      className="fixed left-0 top-0 bottom-0 z-40 w-16 sm:w-20 bg-black/95 backdrop-blur-2xl border-r border-neutral-800/90 flex flex-col items-center justify-between py-4 shadow-2xl select-none"
    >
      {/* Top: Clean Cafe Emblem */}
      <div className="flex flex-col items-center gap-2">
        <Link to="/portal" title="Lowkey Cafe Operations Portal" className="group">
          <img
            src="/logo.png"
            alt="Lowkey Cafe"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain group-hover:scale-105 transition-transform"
          />
        </Link>
        <div className="w-8 h-px bg-neutral-850"></div>
      </div>

      {/* Middle: Vertical Navigation (Up to Down) */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSwitch(item.id)}
              className={`group w-full aspect-square max-w-[54px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/25 font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850/80 font-bold'
              }`}
              title={item.label}
              aria-pressed={isActive}
            >
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] transition-transform ${
                  isActive ? 'text-black scale-105' : 'group-hover:text-yellow-400 group-hover:scale-105'
                }`}
              />
              <span className="text-[9px] uppercase tracking-tight leading-none text-center">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Collapse Button */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-px bg-neutral-850"></div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-neutral-500 hover:text-yellow-400 hover:bg-neutral-850 transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default ScreenSwitcher;
