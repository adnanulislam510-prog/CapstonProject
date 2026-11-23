/**
 * =====================================================================
 * File: /frontend/src/App.jsx
 * Description: Root application component with role-protected routing
 *              RESTAURANT -> /restaurant
 *              SHELTER    -> /shelter
 *              Unauthenticated -> /login
 * =====================================================================
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Auth from './pages/Auth.jsx';
import RestaurantDash from './pages/RestaurantDash.jsx';
import ShelterFeed from './pages/ShelterFeed.jsx';

/**
 * Route guard: Redirects to /login if unauthenticated.
 * Redirects to the appropriate dashboard if user role does not match allowedRole.
 */
function ProtectedRoute({ children, allowedRole }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their assigned role-based dashboard
    return <Navigate to={user.role === 'RESTAURANT' ? '/restaurant' : '/shelter'} replace />;
  }

  return children;
}

/**
 * Route guard for public-only pages (e.g. login/register)
 * Redirects authenticated users directly to their assigned role dashboard.
 */
function PublicOnlyRoute({ children }) {
  const { user, token } = useAuth();

  if (token && user) {
    return <Navigate to={user.role === 'RESTAURANT' ? '/restaurant' : '/shelter'} replace />;
  }

  return children;
}

/**
 * Root index redirector based on authentication status & role
 */
function RootRedirect() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'RESTAURANT' ? '/restaurant' : '/shelter'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Auth />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Restaurant Dashboard Route */}
          <Route
            path="/restaurant"
            element={
              <ProtectedRoute allowedRole="RESTAURANT">
                <RestaurantDash />
              </ProtectedRoute>
            }
          />

          {/* Protected Shelter Feed Route */}
          <Route
            path="/shelter"
            element={
              <ProtectedRoute allowedRole="SHELTER">
                <ShelterFeed />
              </ProtectedRoute>
            }
          />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
