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
  const effectiveTable = tableNumber && tableNumber > 0 ? tableNumber : 10;
  const [selectedType, setSelectedType] = useState<WaiterRequestType>('WATER');
  const [note, setNote] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  const handleCall = async () => {
    setIsCalling(true);
    try {
      await waiterApi.callWaiter({
        tableNumber: effectiveTable,
        requestType: selectedType,
        additionalNote: note.trim() || undefined,
      });
      setCallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Could not notify staff. Please notify a floor server directly.');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {callSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-white">
              Waiter Notified!
            </h3>
            <p className="text-xs text-neutral-400">
              A staff member has received your request for Table #{effectiveTable} and is heading over shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center shadow-sm">
                <Bell className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">
                  Call Waiter
                </h3>
                <p className="text-xs text-neutral-400">Table #{effectiveTable} • Real-time server ping</p>
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
                        ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300 shadow-sm'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-yellow-400' : 'text-neutral-400'}`} />
                    <span className="text-xs font-bold leading-tight">{req.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Warm water, 3 extra forks"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            <button
              onClick={handleCall}
              disabled={isCalling}
              className="w-full py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition-all active:scale-98 disabled:opacity-50"
            >
              {isCalling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Alerting Staff...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 stroke-[2.5]" />
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
