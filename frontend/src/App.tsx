// src/App.tsx
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAppShell from './components/layout/ProtectedAppShell';

const History  = React.lazy(() => import('./pages/History.jsx'));
const Events   = React.lazy(() => import('./pages/Events.jsx'));
const Firmware = React.lazy(() => import('./pages/Firmware.jsx'));
const Settings = React.lazy(() => import('./pages/Settings.jsx'));
const About    = React.lazy(() => import('./pages/About.jsx'));

export default function App() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected area (global NavBar + global Footer) */}
        <Route
          element={
            <ProtectedRoute>
              <ProtectedAppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/events" element={<Events />} />
          <Route path="/firmware" element={<Firmware />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Route>

        {/* Default to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
