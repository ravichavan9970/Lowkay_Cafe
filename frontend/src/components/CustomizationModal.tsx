import React, { useState } from 'react';
import { FoodItem, SpiceLevel, CartCustomization } from '../types';
import { X, Flame, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CustomizationModalProps {
  item: FoodItem;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ item, onClose }) => {
  const { addItem } = useCart();

  const [portion, setPortion] = useState('Regular');
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>(item.spiceLevel || 'MEDIUM');
  const [selectedCustomizations, setSelectedCustomizations] = useState<CartCustomization[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Toggle single option or multi-option
  const handleOptionToggle = (
    groupName: string,
    allowMultiple: boolean,
    optionId: number,
    optionName: string,
    addPrice: number
  ) => {
    setSelectedCustomizations((prev) => {
      if (!allowMultiple) {
        const filtered = prev.filter((c) => c.groupName !== groupName);
        return [
          ...filtered,
          { optionId, groupName, optionName, additionalPrice: addPrice },
        ];
      } else {
        const exists = Array.isArray(prev) ? prev.some((c) => c.optionId === optionId) : false;
        if (exists) {
          return prev.filter((c) => c.optionId !== optionId);
        } else {
          return [
            ...prev,
            { optionId, groupName, optionName, additionalPrice: addPrice },
          ];
        }
      }
    });
  };

  // Price Calculation
  const customizationExtra = selectedCustomizations.reduce((sum, c) => sum + (c.additionalPrice || 0), 0);
  const unitPrice = item.price + customizationExtra;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(
      item,
      portion,
      spiceLevel,
      selectedCustomizations,
      removedIngredients,
      specialInstructions,
      quantity
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with image */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 bg-stone-900">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Customize Your Order
            </span>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl leading-tight">
              {item.name}
            </h2>
            <p className="text-xs text-stone-300 line-clamp-1 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 divide-y divide-stone-100">
          
          {/* 1. Spice Level Selection */}
          <div className="pt-2">
            <label className="font-display font-bold text-sm text-stone-900 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" /> Choose Spice Level
              </span>
              <span className="text-xs font-normal text-stone-500">Required</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'] as SpiceLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpiceLevel(level)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                    spiceLevel === level
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {level.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dynamic Customization Groups from Database */}
          {item.customizations && item.customizations.length > 0 ? (
            item.customizations.map((group) => (
              <div key={group.id} className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display font-bold text-sm text-stone-900">
                    {group.groupName}
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    {group.allowMultiple ? 'Select multiple' : 'Select one'}
                  </span>
                </div>

                <div className="space-y-2">
                  {(group.options || []).map((opt) => {
                    const isSelected = Array.isArray(selectedCustomizations)
                      ? selectedCustomizations.some((c) => c.optionId === opt.id)
                      : false;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleOptionToggle(
                            group.groupName,
                            group.allowMultiple,
                            opt.id,
                            opt.name,
                            opt.additionalPrice
                          )
                        }
                        className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/60 text-stone-900 shadow-sm'
                            : 'border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-stone-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="text-xs font-semibold">{opt.name}</span>
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          {opt.additionalPrice > 0 ? `+₹${opt.additionalPrice}` : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            /* Fallback generic portion size if no custom groups */
            <div className="pt-4">
              <label className="font-display font-bold text-sm text-stone-900 block mb-2">
                Portion Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Regular', 'Large (+₹99)'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPortion(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      portion === p
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Ingredient Removal (e.g. No Onions) */}
          <div className="pt-4">
            <label className="font-display font-bold text-xs text-stone-800 block mb-1">
              Remove Ingredients
            </label>
            <input
              type="text"
              placeholder="e.g. No onions, no mayonnaise, less ice"
              value={removedIngredients}
              onChange={(e) => setRemovedIngredients(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* 4. Special Instructions */}
          <div className="pt-4">
            <label className="font-display font-bold text-xs text-stone-800 block mb-1">
              Special Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Extra crispy, serve sauce on the side"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500 resize-none"
            ></textarea>
          </div>

          {/* Allergy warning indicator */}
          {item.allergyInfo && (
            <div className="pt-3 flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Allergen Notice:</strong> {item.allergyInfo}. Please inform the staff if you have severe dietary allergies.</span>
            </div>
          )}
        </div>

        {/* Bottom Bar: Quantity & Add Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200/90 flex items-center justify-between gap-4">
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-700 active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm px-2 text-stone-900 w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-700 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button with dynamically updated Total */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-brand-600 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-between shadow-lg transition-all active:scale-98"
          >
            <span>Add to Order</span>
            <span className="font-extrabold text-amber-300">₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;
