import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const AppLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Identify staff routes where the left navigation sidebar applies
  const isStaffRoute =
    currentPath.startsWith('/kds') ||
    currentPath.startsWith('/waiter') ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/login') ||
    currentPath.startsWith('/portal') ||
    currentPath.startsWith('/staff');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Main Content: Offset by pl-16 sm:pl-20 when staff sidebar is open so it NEVER overlaps! */}
      <div
        className={
          isStaffRoute
            ? isSidebarCollapsed
              ? 'transition-all duration-300 pl-0 min-h-screen'
              : 'transition-all duration-300 pl-16 sm:pl-20 min-h-screen'
            : 'min-h-screen'
        }
      >
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
      </div>

      {/* Left-docked Vertical Screen Switcher (Up-to-Down) with Zero Overlap */}
      <ScreenSwitcher
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
