import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  LogIn,
  ChefHat,
  Bell,
  LayoutDashboard,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface PortalLink {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  actionText: string;
}

const PORTAL_LINKS: PortalLink[] = [
  {
    id: 'takeaway',
    title: 'Takeaway',
    subtitle: 'Customer & counter takeaway ordering console',
    route: '/takeaway',
    icon: ShoppingBag,
    badge: 'Customer & Pickup',
    badgeColor: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
    actionText: 'Open Takeaway',
  },
  {
    id: 'login',
    title: 'Staff Login',
    subtitle: 'Secure sign-in for waiters, kitchen staff & managers',
    route: '/login',
    icon: LogIn,
    badge: 'Authentication',
    badgeColor: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    actionText: 'Staff Sign In',
  },
  {
    id: 'kds',
    title: 'Kitchen Display',
    subtitle: 'Live kitchen preparation screen with real-time ticket alerts',
    route: '/kds',
    icon: ChefHat,
    badge: 'Chef & Kitchen',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    actionText: 'Open Kitchen KDS',
  },
  {
    id: 'waiter',
    title: 'Floor Waiter',
    subtitle: 'Table dining tracker, guest call alerts & cash bill settlement',
    route: '/waiter',
    icon: Bell,
    badge: 'Dining Floor',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    actionText: 'Open Floor Waiter',
  },
  {
    id: 'admin',
    title: 'Owner Admin',
    subtitle: 'Central restaurant hub: sales reports, menu & serial table QR printing',
    route: '/admin',
    icon: LayoutDashboard,
    badge: 'Management',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    actionText: 'Open Owner Admin',
  },
];

export const StaffPortal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-yellow-400 selection:text-black">
      
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full pt-6 sm:pt-10 text-center">
        
        {/* Brand Logo & Title */}
        <Link to="/" className="inline-flex flex-col items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Lowkey Cafe Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain group-hover:scale-105 transition-transform duration-200"
          />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center justify-center gap-1.5">
              Lowkey<span className="text-yellow-400">Cafe</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium tracking-wide mt-1">
              Operations & Staff System Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Main Grid: 5 Portals */}
      <main className="max-w-4xl mx-auto w-full my-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PORTAL_LINKS.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                onClick={() => navigate(portal.route)}
                className="group relative p-5 sm:p-6 rounded-3xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-yellow-400/60 shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    {portal.badge && (
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${portal.badgeColor}`}>
                        {portal.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-black text-lg text-white group-hover:text-yellow-400 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {portal.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-black text-yellow-400 group-hover:text-yellow-300">
                  <span>{portal.actionText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Footer & Back Navigation */}
      <div className="max-w-4xl mx-auto w-full pb-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white px-4 py-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Main Website</span>
        </Link>
        <p className="text-[11px] text-neutral-600 mt-4">
          © {new Date().getFullYear()} Lowkey Cafe Systems · Authorized Staff Access Only
        </p>
      </div>

    </div>
  );
};

export default StaffPortal;
