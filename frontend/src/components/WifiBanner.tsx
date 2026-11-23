import React, { useState, useEffect } from 'react';
import { Wifi, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { settingsApi } from '../services/api';

interface WifiBannerProps {
  onClose: () => void;
}

export const WifiBanner: React.FC<WifiBannerProps> = ({ onClose }) => {
  const [wifiName, setWifiName] = useState('LowkeyCafe_Guest_5G');
  const [wifiPassword, setWifiPassword] = useState('espresso_vibes');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    settingsApi.getSettings().then((res) => {
      if (res.data.wifiName) setWifiName(res.data.wifiName);
      if (res.data.wifiPassword) setWifiPassword(res.data.wifiPassword);
    }).catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(wifiPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-brand-400 flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Guest Wi-Fi</h3>
            <p className="text-xs text-stone-400">High-speed complimentary internet</p>
          </div>
        </div>

        <div className="space-y-3 bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 mb-5">
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Network SSID</span>
            <span className="font-mono text-sm font-semibold text-amber-300">{wifiName}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Password</span>
            <span className="font-mono text-sm font-bold text-white">{wifiPassword}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-950" />
              <span>Password Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-stone-950" />
              <span>Copy Wi-Fi Password</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-stone-400 mt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted WPA3 Guest Access</span>
        </p>
      </div>
    </div>
  );
};

export default WifiBanner;
