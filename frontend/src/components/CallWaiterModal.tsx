import React, { useState } from 'react';
import { WaiterRequestType } from '../types';
import { waiterApi } from '../services/api';
import { X, Bell, Droplets, Utensils, HelpCircle, Receipt, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';

interface CallWaiterModalProps {
  tableNumber: number;
  onClose: () => void;
}

const REQUEST_TYPES: { type: WaiterRequestType; label: string; icon: any }[] = [
  { type: 'WATER', label: 'Need Water', icon: Droplets },
  { type: 'EXTRA_PLATES', label: 'Extra Plates / Cutlery', icon: Utensils },
  { type: 'MENU_HELP', label: 'Menu Assistance', icon: HelpCircle },
  { type: 'BILL_REQUEST', label: 'Need The Bill', icon: Receipt },
  { type: 'ASSISTANCE', label: 'Call Server to Table', icon: Bell },
  { type: 'OTHER', label: 'Other Request', icon: MessageSquare },
];

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({ tableNumber, onClose }) => {
  const [selectedType, setSelectedType] = useState<WaiterRequestType>('WATER');
  const [note, setNote] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  const handleCall = async () => {
    setIsCalling(true);
    try {
      await waiterApi.callWaiter({
        tableNumber,
        requestType: selectedType,
        additionalNote: note.trim() || undefined,
      });
      setCallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Could not notify staff. Please notify a floor server directly.');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-stone-900 animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {callSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-stone-900">
              Waiter Notified!
            </h3>
            <p className="text-xs text-stone-500">
              A staff member has received your request for Table #{tableNumber} and is heading over shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-brand-600 flex items-center justify-center shadow-sm">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-stone-900">
                  Call Waiter
                </h3>
                <p className="text-xs text-stone-500">Table #{tableNumber} • Real-time server ping</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {REQUEST_TYPES.map((req) => {
                const Icon = req.icon;
                const isSelected = selectedType === req.type;
                return (
                  <button
                    key={req.type}
                    type="button"
                    onClick={() => setSelectedType(req.type)}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 text-stone-900 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-stone-400'}`} />
                    <span className="text-xs font-bold leading-tight">{req.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Warm water, 3 extra forks"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              onClick={handleCall}
              disabled={isCalling}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-brand-600 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              {isCalling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Alerting Staff...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify Waiter Now</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CallWaiterModal;
