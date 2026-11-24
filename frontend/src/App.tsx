import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LandingPage from './pages/LandingPage';
import CustomerHome from './pages/CustomerHome';
import OrderTracking from './pages/OrderTracking';
import KDSView from './pages/KDSView';
import WaiterDashboard from './pages/WaiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import StaffPortal from './pages/StaffPortal';
import ScreenSwitcher from './components/ScreenSwitcher';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Cafe Landing & Story Website */}
            <Route path="/" element={<LandingPage />} />

            {/* Customer Digital Menu & Ordering */}
            <Route path="/menu" element={<CustomerHome />} />
            <Route path="/table/:tableNumber" element={<CustomerHome />} />
            <Route path="/takeaway" element={<CustomerHome />} />
            <Route path="/order-tracking/:orderCode" element={<OrderTracking />} />

            {/* Staff & Kitchen Interfaces */}
            <Route path="/kds" element={<KDSView />} />
            <Route path="/waiter" element={<WaiterDashboard />} />

            {/* Restaurant Admin Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Authentication & Operations Portal */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/portal" element={<StaffPortal />} />
            <Route path="/staff" element={<StaffPortal />} />

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
