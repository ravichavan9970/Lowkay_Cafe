import React from 'react';
import { FoodItem } from '../types';
import { Plus, Flame, Clock, Sparkles } from 'lucide-react';

interface FoodItemCardProps {
  item: FoodItem;
  onSelect: (item: FoodItem) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onSelect }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
      
      {/* Food Image with Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Veg / Non-Veg Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-sm flex items-center justify-center">
          <span
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-sm ${
              item.isVeg ? 'border-emerald-600' : 'border-red-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            ></span>
          </span>
        </div>

        {/* Special Offer / Popular Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {item.isSpecialOffer && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> Offer
            </span>
          )}
          {item.isPopular && !item.isSpecialOffer && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold tracking-wider uppercase shadow-md">
              Popular
            </span>
          )}
        </div>

        {/* Prep Time Pill */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-stone-900/80 backdrop-blur-sm text-stone-200 text-[11px] font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-brand-400" />
          <span>{item.prepTimeMinutes}m</span>
        </div>
      </div>

      {/* Item Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-base text-stone-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
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
            <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mb-3">
              ⚠ {item.allergyInfo}
            </p>
          )}
        </div>

        {/* Pricing and Action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between mt-auto">
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
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-brand-500 text-white hover:text-stone-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
