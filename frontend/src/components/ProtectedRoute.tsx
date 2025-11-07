import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { accessToken } = useAuth();
    return accessToken ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;