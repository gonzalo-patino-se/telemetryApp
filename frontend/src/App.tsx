import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return ( 
    <Routes>
      {/* Apply centering per route or globally as needed */}
      
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<LoginForm />} /> {/* Default route */}
      
    </Routes>
  );
}

export default App;