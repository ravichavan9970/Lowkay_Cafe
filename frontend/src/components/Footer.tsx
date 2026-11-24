import React from 'react';
import { Coffee, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-neutral-400 py-10 border-t border-neutral-850 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Lowkey Cafe Logo"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div>
            <span className="font-display font-black text-sm text-white">
              Lowkey<span className="text-yellow-400">Cafe</span>
            </span>
            <p className="text-[10px] text-neutral-400">
              Artisan Coffee & Good Vibes
            </p>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          Crafted with <Heart className="w-3 h-3 text-yellow-400 fill-yellow-400" /> for modern culinary hospitality.
        </p>

        <p className="text-[10px] text-neutral-400">
          © {new Date().getFullYear()} Lowkey Cafe Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
