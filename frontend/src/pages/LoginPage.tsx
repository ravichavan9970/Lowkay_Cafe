import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coffee, ShieldCheck, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      if (username === 'kitchen') {
        navigate('/kds');
      } else if (username === 'waiter') {
        navigate('/waiter');
      } else if (username === 'customer') {
        navigate('/');
      } else {
        navigate('/admin');
      }
    } else {
      setErrorMsg('Invalid username or password. Please try again.');
    }
  };

  const fillQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-stone-950 border border-stone-800 p-8 rounded-3xl shadow-2xl relative">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group" title="Lowkey Cafe Home">
            <img
              src="/logo.png"
              alt="Lowkey Cafe Logo"
              className="w-16 h-16 rounded-full object-cover shadow-xl border-2 border-yellow-400/40 group-hover:scale-105 active:scale-95 transition-all"
            />
          </Link>
          <h2 className="font-display font-extrabold text-2xl text-white">
            Staff & Admin Sign In
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Access Kitchen Display, Waiter Floor, or Owner Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="e.g. admin or kitchen"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3.5" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder:text-stone-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Sign In to System</span>
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-6 border-t border-stone-800/80">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2 text-center">
            One-Click Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin('admin', 'admin123')}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-left text-xs text-stone-300"
            >
              <strong className="text-brand-400 block">Owner / Admin</strong>
              <span className="text-[10px] text-stone-500 font-mono">admin / admin123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickLogin('kitchen', 'kitchen123')}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-left text-xs text-stone-300"
            >
              <strong className="text-amber-400 block">Kitchen Cook</strong>
              <span className="text-[10px] text-stone-500 font-mono">kitchen / kitchen123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickLogin('waiter', 'waiter123')}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-left text-xs text-stone-300"
            >
              <strong className="text-blue-400 block">Floor Waiter</strong>
              <span className="text-[10px] text-stone-500 font-mono">waiter / waiter123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickLogin('customer', 'customer123')}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-left text-xs text-stone-300"
            >
              <strong className="text-emerald-400 block">Diner</strong>
              <span className="text-[10px] text-stone-500 font-mono">customer / customer123</span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link to="/" className="text-xs text-stone-400 hover:text-white transition-colors">
            ← Return to Customer Ordering
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
