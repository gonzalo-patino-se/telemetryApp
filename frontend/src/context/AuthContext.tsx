// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode} from 'jwt-decode';


// Define the shape of the authentication context
interface AuthContextType {
    accessToken: string | null; // JWT access token
    refreshToken: string | null; // JWT refresh token
    isAuthenticated?: boolean; // Optional boolean to indicate if user is authenticated
    login: (access: string, refresh: string) => void; // Function to log in and set tokens
    logout: () => Promise<void>; // Function to log out and clear tokens
}

// Create the AuthContext with an undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your app and provide authentication state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // Initialize accessToken and refreshToken from localStorage if available
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Login function: sets tokens in state and localStorage
    const login = (access: string, refresh: string) => {
        setAccessToken(access);
        setRefreshToken(refresh);
        setIsAuthenticated(true);
        
        //Set Authorization header for Axios
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        startTokenExpiryTimer(access);
    };

    // Logout function: clears tokens from state and localStorage
    const logout = async() => {
        try {
            if (refreshToken) {
                await api.post('/logout/', { refresh: refreshToken });
            }    
        } catch (err){
            console.error('Logout error:', err);
        } finally {
            setAccessToken(null);
            setRefreshToken(null);
            setIsAuthenticated(false);
            // Remove Authorization header
            delete api.defaults.headers.common['Authorization'];
            clearTokenExpiryTimer();
        }

    };

    // Axios interceptor: Logout on 401 Unauthorized response
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401) {
                    await logout();
                }
                return Promise.reject(error);
            }
        );
        return () => api.interceptors.response.eject(interceptor);
    }, [refreshToken]);

    // Token expiry timer
    let expiryTimer : ReturnType<typeof setTimeout> | null = null;

    const startTokenExpiryTimer = (token: string) => {
        try {
            const decoded: any = jwtDecode(token);
            const expiryTime = decoded.exp * 1000 - Date.now();
            if (expiryTimer) clearTimeout(expiryTimer);
            expiryTimer = setTimeout(() => {
                logout();
            }, expiryTime); 
        } catch {
            console.error ('Invalid token format');
        }
    };

    const clearTokenExpiryTimer = () => {
        if (expiryTimer) clearTimeout(expiryTimer);
    };

    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, isAuthenticated, login, logout }}>
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
    




