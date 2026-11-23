import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CustomerHome from './pages/CustomerHome';
import OrderTracking from './pages/OrderTracking';
import KDSView from './pages/KDSView';
import WaiterDashboard from './pages/WaiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ScreenSwitcher from './components/ScreenSwitcher';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Website Routes */}
            <Route path="/" element={<CustomerHome />} />
            <Route path="/table/:tableNumber" element={<CustomerHome />} />
            <Route path="/order-tracking/:orderCode" element={<OrderTracking />} />

            {/* Staff & Kitchen Interfaces */}
            <Route path="/kds" element={<KDSView />} />
            <Route path="/waiter" element={<WaiterDashboard />} />

            {/* Restaurant Admin Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Universal iOS Dynamic Island Switcher (Customer / Kitchen / Waiter / Admin) */}
          <ScreenSwitcher />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
