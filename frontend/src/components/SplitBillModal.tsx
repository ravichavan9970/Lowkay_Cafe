import React, { useState } from 'react';
import { Bill } from '../types';
import { billingApi } from '../services/api';
import { X, Users, Calculator, Check, AlertCircle } from 'lucide-react';

interface SplitBillModalProps {
  bill: Bill;
  onClose: () => void;
  onSplitUpdated: (updatedBill: Bill) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  bill,
  onClose,
  onSplitUpdated,
}) => {
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM_AMOUNT'>('EQUAL');
  const [numberOfPersons, setNumberOfPersons] = useState<number>(2);
  const [customAmounts, setCustomAmounts] = useState<number[]>([
    Math.round((bill.finalPayableAmount / 2) * 100) / 100,
    Math.round((bill.finalPayableAmount / 2) * 100) / 100,
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const perPersonEqual = Math.round((bill.finalPayableAmount / numberOfPersons) * 100) / 100;

  const handlePersonsCountChange = (count: number) => {
    const safeCount = Math.max(1, count);
    setNumberOfPersons(safeCount);
    const evenShare = Math.round((bill.finalPayableAmount / safeCount) * 100) / 100;
    setCustomAmounts(Array(safeCount).fill(evenShare));
  };

  const handleCustomAmountChange = (index: number, val: number) => {
    const updated = [...customAmounts];
    updated[index] = val;
    setCustomAmounts(updated);
  };

  const currentCustomSum = customAmounts.reduce((a, b) => a + (Number(b) || 0), 0);
  const customDifference = Math.round((bill.finalPayableAmount - currentCustomSum) * 100) / 100;

  const handleSaveSplit = async () => {
    setErrorMsg('');
    if (splitType === 'CUSTOM_AMOUNT' && Math.abs(customDifference) > 0.1) {
      setErrorMsg(`Allocated sum must equal ₹${bill.finalPayableAmount}. Currently ₹${currentCustomSum.toFixed(2)} (Diff: ₹${customDifference})`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await billingApi.splitBill(bill.id, {
        splitType,
        numberOfPersons,
        customAmounts: splitType === 'CUSTOM_AMOUNT' ? customAmounts : undefined,
      });
      onSplitUpdated(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update bill split');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg text-stone-900">
              Split The Bill
            </h3>
            <p className="text-xs text-stone-500">
              Total Payable: <strong className="text-stone-900 font-bold">₹{bill.finalPayableAmount}</strong>
            </p>
          </div>
        </div>

        {/* Tab selection: Equal vs Custom */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-4">
          <button
            onClick={() => setSplitType('EQUAL')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              splitType === 'EQUAL'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Equal Split
          </button>
          <button
            onClick={() => setSplitType('CUSTOM_AMOUNT')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              splitType === 'CUSTOM_AMOUNT'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Custom Amount
          </button>
        </div>

        {splitType === 'EQUAL' ? (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Number of Diners
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePersonsCountChange(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      numberOfPersons === num
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
              <span className="text-xs text-stone-500 block mb-1">Each Person Pays</span>
              <span className="font-display font-black text-2xl text-brand-600">
                ₹{perPersonEqual.toFixed(2)}
              </span>
              <p className="text-[11px] text-stone-400 mt-1">Split across {numberOfPersons} diners</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2 max-h-60 overflow-y-auto">
            {customAmounts.map((amt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-700 w-16">
                  Person {idx + 1}
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amt}
                    onChange={(e) => handleCustomAmountChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold pl-7 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            ))}

            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              Math.abs(customDifference) <= 0.1 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              <span>Allocated: ₹{currentCustomSum.toFixed(2)}</span>
              <span>Remaining: ₹{customDifference.toFixed(2)}</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-[11px] text-rose-600 mt-3 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
          </p>
        )}

        <button
          onClick={handleSaveSplit}
          disabled={isSaving}
          className="w-full mt-4 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>Confirm Split</span>
        </button>
      </div>
    </div>
  );
};

export default SplitBillModal;
