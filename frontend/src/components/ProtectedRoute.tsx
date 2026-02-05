import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Show nothing while checking auth status (prevents flash of login page)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg-primary">
                <div className="text-text-secondary">Loading...</div>
            </div>
        );
    }
    
    // Redirect to login if not authenticated
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;