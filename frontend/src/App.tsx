// src/App.tsx
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SerialProvider } from './context/SerialContext';
import { TimeRangeProvider } from './context/TimeRangeContext';

import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAppShell from './components/layout/ProtectedAppShell';

const Events   = React.lazy(() => import('./pages/Events'));
const Firmware = React.lazy(() => import('./pages/Firmware'));
const Settings = React.lazy(() => import('./pages/Settings'));
const About    = React.lazy(() => import('./pages/About'));
const StyleGuide = React.lazy(() => import('./pages/StyleGuide'));

export default function App() {
  return (
    <ThemeProvider>
      <SerialProvider>
        <TimeRangeProvider>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-bg-primary"><div className="text-text-secondary">Loading…</div></div>}>
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
                <Route path="/events" element={<Events />} />
                <Route path="/firmware" element={<Firmware />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="/styleguide" element={<StyleGuide />} />
              </Route>

              {/* Default to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </TimeRangeProvider>
      </SerialProvider>
    </ThemeProvider>
  );
}
