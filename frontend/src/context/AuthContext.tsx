// src/context/AuthContext.tsx
// SECURITY: JWT tokens are now stored in httpOnly cookies (not accessible via JavaScript)
// This protects against XSS attacks stealing authentication tokens

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';


// Define the shape of the authentication context
interface AuthContextType {
    isAuthenticated: boolean;
    user: { username: string; email: string } | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

// Create the AuthContext with an undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your app and provide authentication state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{ username: string; email: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication status on mount (cookies are sent automatically)
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try to access a protected endpoint to verify cookies are valid
                const response = await api.get('/auth/me/');
                setIsAuthenticated(true);
                setUser(response.data.user);
            } catch {
                // Not authenticated or token expired
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    // Login function: sends credentials, server sets httpOnly cookies
    const login = useCallback(async (username: string, password: string) => {
        const response = await api.post('/login/', { username, password });
        // Server sets httpOnly cookies automatically
        // Response contains user info (but NOT tokens - they're in cookies)
        setIsAuthenticated(true);
        setUser(response.data.user);
    }, []);

    // Logout function: server clears cookies
    const logout = useCallback(async () => {
        try {
            await api.post('/logout/');
        } catch (err) {
            // Ignore logout errors - we're logging out anyway
            console.debug('Logout API call failed:', err);
        } finally {
            // Always clear local state
            setIsAuthenticated(false);
            setUser(null);
        }
    }, []);

    // Axios interceptor: handle 401 responses
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const requestUrl = error.config?.url || '';
                // Don't trigger logout for auth endpoints (prevents infinite loop)
                const isAuthEndpoint = requestUrl.includes('/logout') || 
                                       requestUrl.includes('/login') || 
                                       requestUrl.includes('/register') ||
                                       requestUrl.includes('/token') ||
                                       requestUrl.includes('/auth/me');
                
                if (error.response?.status === 401 && !isAuthEndpoint) {
                    // Try to refresh the token
                    try {
                        await api.post('/token/refresh/');
                        // Retry the original request
                        return api.request(error.config);
                    } catch {
                        // Refresh failed, logout
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => api.interceptors.response.eject(interceptor);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
        
// Custom hook to use the AuthContext in functional components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};