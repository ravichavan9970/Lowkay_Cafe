import React, { useState } from 'react';
import { FoodItem, SpiceLevel, CartCustomization } from '../types';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Flame, AlertCircle } from 'lucide-react';

interface CustomizationModalProps {
  item: FoodItem;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ item, onClose }) => {
  const { addItem } = useCart();

  const [portion, setPortion] = useState<'Full' | 'Half'>('Full');
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>(item.spiceLevel || 'MILD');
  const [selectedCustomizations, setSelectedCustomizations] = useState<CartCustomization[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Calculate dynamic price based on portion & extra add-ons
  const basePrice = portion === 'Half' ? Math.round(item.price * 0.65) : item.price;
  const addonsTotal = selectedCustomizations.reduce((acc, c) => acc + c.additionalPrice, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-950 text-white border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with image */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 bg-neutral-900">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors border border-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[11px] font-black uppercase tracking-wider text-yellow-400 block mb-1">
              Customize Your Order
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl leading-tight">
              {item.name}
            </h2>
            <p className="text-xs text-neutral-300 line-clamp-1 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 divide-y divide-neutral-850">
          
          {/* 1. Spice Level Selection */}
          <div className="pt-2">
            <label className="font-display font-extrabold text-sm text-white flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" /> Choose Spice Level
              </span>
              <span className="text-xs font-normal text-neutral-400">Required</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['MILD', 'MEDIUM', 'HOT', 'EXTRA_HOT'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSpiceLevel(lvl as any)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                    spiceLevel === lvl
                      ? 'border-yellow-400 bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white'
                  }`}
                >
                  {lvl.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Portion Size Selection */}
          <div className="pt-4">
            <label className="font-display font-extrabold text-sm text-white block mb-2">
              Portion Size
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Full', 'Half'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPortion(p)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    portion === p
                      ? 'border-yellow-400 bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white'
                  }`}
                >
                  {p} Portion
                </button>
              ))}
            </div>
          </div>

          {/* Customization Groups */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="pt-4 space-y-4">
              {item.customizations.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-xs text-white">
                      {group.groupName}
                    </span>
                    <span className="text-[10px] text-neutral-400">
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
                          className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-850'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="font-bold text-yellow-400">
                            {opt.additionalPrice > 0 ? `+₹${opt.additionalPrice}` : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Ingredient Removal */}
          <div className="pt-4">
            <label className="font-display font-extrabold text-xs text-white block mb-1">
              Remove Ingredients
            </label>
            <input
              type="text"
              placeholder="e.g. No onions, no mayonnaise, less ice"
              value={removedIngredients}
              onChange={(e) => setRemovedIngredients(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* 4. Special Instructions */}
          <div className="pt-4">
            <label className="font-display font-extrabold text-xs text-white block mb-1">
              Special Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Extra crispy, serve sauce on the side"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-yellow-400 resize-none"
            ></textarea>
          </div>

          {/* Allergy notice */}
          {item.allergyInfo && (
            <div className="pt-3 flex items-start gap-2 text-[11px] text-yellow-300 bg-yellow-400/10 p-2.5 rounded-xl border border-yellow-400/20">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong>Allergen Notice:</strong> {item.allergyInfo}. Please inform our servers if you have severe allergies.</span>
            </div>
          )}
        </div>

        {/* Bottom Bar: Quantity & Add Button */}
        <div className="p-4 bg-black border-t border-neutral-850 flex items-center justify-between gap-4">
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-800 text-neutral-300 active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-black text-sm px-2 text-white w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-800 text-neutral-300 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center justify-between shadow-lg shadow-yellow-400/25 transition-all active:scale-98"
          >
            <span>Add to Order</span>
            <span className="font-black text-black">₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;
