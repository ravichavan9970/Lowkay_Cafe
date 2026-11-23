import React from 'react';
import { Coffee, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-950 text-stone-400 py-10 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-stone-950 flex items-center justify-center font-bold">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-extrabold text-sm text-white">
              Lowkey Cafe
            </span>
            <p className="text-[10px] text-stone-500">
              Artisan Coffee & Good Vibes
            </p>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1 text-[11px] text-stone-500">
          Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for modern culinary hospitality.
        </p>

        <p className="text-[10px] text-stone-600">
          © {new Date().getFullYear()} Lowkey Cafe Systems. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
