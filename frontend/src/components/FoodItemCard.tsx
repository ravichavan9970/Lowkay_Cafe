import React from 'react';
import { FoodItem } from '../types';
import { Plus, Flame, Clock, Sparkles } from 'lucide-react';

interface FoodItemCardProps {
  item: FoodItem;
  onSelect: (item: FoodItem) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onSelect }) => {
  return (
    <div className="ios-card rounded-3xl overflow-hidden flex flex-col group relative bg-white/80 backdrop-blur-xl border border-stone-200/70 hover:border-amber-400/50 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] transition-all duration-300 ease-out">
      
      {/* Food Image with iOS Glass Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        
        {/* Subtle Specular Top Highlight */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/25 to-transparent pointer-events-none"></div>

        {/* Veg / Non-Veg iOS Glass Badge */}
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md border border-white/60 p-1.5 rounded-xl shadow-sm flex items-center justify-center">
          <span
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm ${
              item.isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            ></span>
          </span>
        </div>

        {/* Special Offer & Popular Glass Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {item.isSpecialOffer && (
            <span className="px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1 border border-white/20 animate-pulse">
              <Sparkles className="w-3 h-3" /> Special
            </span>
          )}
          {item.isPopular && !item.isSpecialOffer && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-stone-950 text-[10px] font-black tracking-wider uppercase shadow-md border border-white/20">
              Popular
            </span>
          )}
        </div>

        {/* Prep Time Glass Capsule */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-stone-950/70 backdrop-blur-md border border-white/10 text-stone-200 text-[11px] font-semibold flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{item.prepTimeMinutes}m</span>
        </div>
      </div>

      {/* Item Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-extrabold text-base text-stone-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {item.name}
            </h3>
            
            {/* Spice Level Indicator */}
            {item.spiceLevel !== 'MILD' && (
              <span
                className="flex items-center text-rose-500 text-xs font-semibold shrink-0"
                title={`Spice Level: ${item.spiceLevel}`}
              >
                <Flame className="w-3.5 h-3.5 fill-rose-500" />
                {item.spiceLevel === 'HOT' && <Flame className="w-3.5 h-3.5 fill-rose-500 -ml-1.5" />}
                {item.spiceLevel === 'EXTRA_HOT' && (
                  <>
                    <Flame className="w-3.5 h-3.5 fill-rose-500 -ml-1.5" />
                    <Flame className="w-3.5 h-3.5 fill-rose-500 -ml-1.5" />
                  </>
                )}
              </span>
            )}
          </div>

          <p className="text-stone-500 text-xs line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>

          {/* Allergy Note */}
          {item.allergyInfo && (
            <p className="text-[11px] text-amber-800 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 inline-block mb-3 font-medium">
              ⚠ {item.allergyInfo}
            </p>
          )}
        </div>

        {/* Pricing and iOS Action Pill */}
        <div className="pt-3 border-t border-stone-100/90 flex items-center justify-between mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-lg text-stone-900">
                ₹{item.price}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{item.originalPrice}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelect(item)}
            className="px-4 py-2 rounded-full bg-stone-900 hover:bg-amber-500 text-white hover:text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95 group/btn"
          >
            <Plus className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform duration-200" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
