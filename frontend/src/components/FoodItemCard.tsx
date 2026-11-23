import React from 'react';
import { FoodItem } from '../types';
import { Plus, Flame, Clock, Sparkles } from 'lucide-react';

interface FoodItemCardProps {
  item: FoodItem;
  onSelect: (item: FoodItem) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onSelect }) => {
  return (
    <div className="theme-card-dark rounded-3xl overflow-hidden flex flex-col group relative bg-neutral-950/90 border border-neutral-800/90 hover:border-yellow-400/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_45px_-10px_rgba(250,204,21,0.22)] transition-all duration-300 ease-out">
      
      {/* Food Image with Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-neutral-900">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        
        {/* Subtle Specular Top Highlight */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>

        {/* Veg / Non-Veg iOS Glass Badge */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-neutral-700 p-1.5 rounded-xl shadow-md flex items-center justify-center">
          <span
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm ${
              item.isVeg ? 'border-emerald-500' : 'border-rose-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </span>
        </div>

        {/* Special Offer & Popular Badges in Yellow/Rose */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {item.isSpecialOffer && (
            <span className="px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 border border-white/20 animate-pulse">
              <Sparkles className="w-3 h-3" /> Offer
            </span>
          )}
          {item.isPopular && !item.isSpecialOffer && (
            <span className="px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-black tracking-wider uppercase shadow-lg shadow-yellow-400/25">
              Popular
            </span>
          )}
        </div>

        {/* Prep Time Glass Capsule */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700 text-neutral-200 text-[11px] font-bold flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3 text-yellow-400" />
          <span>{item.prepTimeMinutes}m</span>
        </div>
      </div>

      {/* Item Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-extrabold text-base text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">
              {item.name}
            </h3>
            
            {/* Spice Level Indicator */}
            {item.spiceLevel !== 'MILD' && (
              <span
                className="flex items-center text-rose-400 text-xs font-bold shrink-0"
                title={`Spice Level: ${item.spiceLevel}`}
              >
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {item.spiceLevel === 'HOT' && <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 -ml-1.5" />}
                {item.spiceLevel === 'EXTRA_HOT' && (
                  <>
                    <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 -ml-1.5" />
                    <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 -ml-1.5" />
                  </>
                )}
              </span>
            )}
          </div>

          <p className="text-neutral-400 text-xs line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>

          {/* Allergy Note */}
          {item.allergyInfo && (
            <p className="text-[11px] text-yellow-300 bg-yellow-400/10 px-2.5 py-1 rounded-xl border border-yellow-400/20 inline-block mb-3 font-semibold">
              ⚠ {item.allergyInfo}
            </p>
          )}
        </div>

        {/* Pricing and Action Button */}
        <div className="pt-3 border-t border-neutral-850 flex items-center justify-between mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-xl text-yellow-400">
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-neutral-500 line-through">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelect(item)}
            className="px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs flex items-center gap-1.5 transition-all duration-200 shadow-md shadow-yellow-400/20 active:scale-95 group/btn"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] group-hover/btn:rotate-90 transition-transform duration-200" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
