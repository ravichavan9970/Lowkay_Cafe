import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  LogIn,
  ChefHat,
  Bell,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';

interface ApplicationCard {
  id: string;
  name: string;
  description: string;
  buttonText: string;
  route: string;
  icon: React.ElementType;
  badge: string;
}

const APPLICATION_CARDS: ApplicationCard[] = [
  {
    id: 'takeaway',
    name: 'Takeaway',
    description: 'Customer and counter takeaway ordering console.',
    buttonText: 'Open Takeaway',
    route: '/takeaway',
    icon: ShoppingBag,
    badge: 'Counter & Pickup',
  },
  {
    id: 'staff-login',
    name: 'Staff Login',
    description: 'Secure login for waiters, kitchen staff and managers.',
    buttonText: 'Staff Sign In',
    route: '/login',
    icon: LogIn,
    badge: 'Authentication',
  },
  {
    id: 'kitchen-kds',
    name: 'Kitchen Display',
    description: 'Live kitchen preparation screen. Display incoming orders and real-time ticket updates.',
    buttonText: 'Open Kitchen KDS',
    route: '/kds',
    icon: ChefHat,
    badge: 'Live KDS',
  },
  {
    id: 'floor-waiter',
    name: 'Floor Waiter',
    description: 'Table dining tracker. Guest call alerts and cash bill settlement.',
    buttonText: 'Open Floor Waiter',
    route: '/waiter',
    icon: Bell,
    badge: 'Floor Dispatch',
  },
  {
    id: 'owner-admin',
    name: 'Owner Admin',
    description: 'Central restaurant management dashboard. Sales reports, menu management and serial QR printing.',
    buttonText: 'Open Owner Admin',
    route: '/admin',
    icon: LayoutDashboard,
    badge: 'Operations Hub',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:h-screen bg-[#090909] text-white flex flex-col justify-between selection:bg-[#FFD000] selection:text-black font-sans relative overflow-x-hidden p-2 sm:p-4 lg:p-5">
      {/* Subtle futuristic amber/gold ambient glow behind the header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[220px] bg-[#FFD000]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Header - Compact for Single Screen Fit */}
      <header className="relative max-w-5xl mx-auto w-full pt-1 sm:pt-3 px-4 text-center z-10 shrink-0">
        {/* Logo and Brand Title */}
        <div className="inline-flex flex-col items-center group cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/logo.png"
            alt="Lowkey Cafe Logo"
            className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-[0_4px_16px_rgba(255,208,0,0.12)] group-hover:scale-105 transition-transform duration-300"
          />
          <div className="mt-1">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-white flex items-center justify-center gap-1">
              Lowkey<span className="text-[#FFD000]">Cafe</span>
            </span>
          </div>
        </div>

        {/* Small elegant heading and short subtitle */}
        <h1 className="text-sm sm:text-base font-bold tracking-tight text-white mt-1">
          Welcome to Lowkey Cafe
        </h1>
        <p className="text-xs text-neutral-400 font-normal mt-0.5 max-w-lg mx-auto">
          Your Cafe. Your Control. Everything in One Place.
        </p>

        {/* Status capsule indicator */}
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171717] border border-[#262626] text-[10px] text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-neutral-200">System Ready</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">Cloud Sync Active</span>
        </div>
      </header>

      {/* Main Content: 5 Application Cards Grid - Perfectly Scaled for Single Viewport */}
      <main className="relative max-w-5xl mx-auto w-full px-2 sm:px-6 my-auto py-2 z-10 flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-4">
          {APPLICATION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.route)}
                className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] bg-[#171717] rounded-2xl sm:rounded-3xl border border-[#262626] hover:border-[#FFD000]/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_25px_rgba(255,208,0,0.08)] group cursor-pointer active:scale-[0.99]"
              >
                <div>
                  {/* Top Bar with Icon and Badge */}
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFD000]/10 border border-[#FFD000]/25 flex items-center justify-center text-[#FFD000] group-hover:bg-[#FFD000]/20 group-hover:border-[#FFD000]/40 group-hover:scale-105 transition-all duration-300">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#202020] text-neutral-300 border border-[#2e2e2e]">
                      {card.badge}
                    </span>
                  </div>

                  {/* Card Name */}
                  <h2 className="text-base sm:text-lg font-display font-extrabold text-white group-hover:text-[#FFD000] transition-colors tracking-tight">
                    {card.name}
                  </h2>

                  {/* Short Description */}
                  <p className="text-xs text-neutral-400 mt-1 leading-snug line-clamp-2 min-h-[30px]">
                    {card.description}
                  </p>
                </div>

                {/* Card Navigation Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.route);
                  }}
                  className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 px-3.5 rounded-xl bg-[#222222] group-hover:bg-[#FFD000] text-neutral-200 group-hover:text-black font-bold text-xs flex items-center justify-between border border-[#303030] group-hover:border-[#FFD000] transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Footer - Minimal & Compact */}
      <footer className="relative max-w-5xl mx-auto w-full px-4 pt-2 pb-1 text-center z-10 border-t border-[#1a1a1a] shrink-0">
        <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium tracking-wide">
          Lowkey Cafe Operating System • Enterprise Edition • © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
