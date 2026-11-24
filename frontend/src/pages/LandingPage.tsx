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
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-between selection:bg-[#FFD000] selection:text-black font-sans relative overflow-x-hidden">
      {/* Subtle futuristic amber/gold ambient glow behind the header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-[#FFD000]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="relative max-w-5xl mx-auto w-full pt-10 sm:pt-14 px-4 text-center z-10">
        {/* Logo and Brand Title */}
        <div className="inline-flex flex-col items-center group cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/logo.png"
            alt="Lowkey Cafe Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_20px_rgba(255,208,0,0.12)] group-hover:scale-105 transition-transform duration-300"
          />
          <div className="mt-3">
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center justify-center gap-1">
              Lowkey<span className="text-[#FFD000]">Cafe</span>
            </span>
          </div>
        </div>

        {/* Small elegant heading and short subtitle */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-4">
          Welcome to Lowkey Cafe
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-normal mt-1.5 max-w-lg mx-auto">
          Your Cafe. Your Control. Everything in One Place.
        </p>

        {/* Status capsule indicator */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] border border-[#262626] text-[11px] text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-neutral-200">System Ready</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">Cloud Sync Active</span>
        </div>
      </header>

      {/* Main Content: 5 Application Cards Grid */}
      <main className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 my-8 sm:my-12 z-10">
        <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
          {APPLICATION_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.route)}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-[#171717] rounded-3xl border border-[#262626] hover:border-[#FFD000]/60 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,208,0,0.08)] group cursor-pointer active:scale-[0.99]"
              >
                <div>
                  {/* Top Bar with Icon and Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFD000]/10 border border-[#FFD000]/25 flex items-center justify-center text-[#FFD000] group-hover:bg-[#FFD000]/20 group-hover:border-[#FFD000]/40 group-hover:scale-105 transition-all duration-300">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#202020] text-neutral-300 border border-[#2e2e2e]">
                      {card.badge}
                    </span>
                  </div>

                  {/* Card Name */}
                  <h2 className="text-xl font-display font-extrabold text-white group-hover:text-[#FFD000] transition-colors tracking-tight">
                    {card.name}
                  </h2>

                  {/* Short Description */}
                  <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed min-h-[40px]">
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
                  className="w-full mt-6 py-3 px-4 rounded-xl bg-[#222222] group-hover:bg-[#FFD000] text-neutral-200 group-hover:text-black font-bold text-xs sm:text-sm flex items-center justify-between border border-[#303030] group-hover:border-[#FFD000] transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative max-w-5xl mx-auto w-full px-4 pb-8 pt-4 text-center z-10 border-t border-[#1c1c1c]">
        <p className="text-xs text-neutral-500 font-medium tracking-wide">
          Lowkey Cafe Operating System • Enterprise Edition • © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;