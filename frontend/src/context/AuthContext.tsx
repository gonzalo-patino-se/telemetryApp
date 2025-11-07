// src/context/AuthContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Define the shape of the authentication context
interface AuthContextType {
    accessToken: string | null; // JWT access token
    refreshToken: string | null; // JWT refresh token
    login: (access: string, refresh: string) => void; // Function to log in and set tokens
    logout: () => void; // Function to log out and clear tokens
}

// Create the AuthContext with an undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your app and provide authentication state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize accessToken and refreshToken from localStorage if available
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));

    // Login function: sets tokens in state and localStorage
    const login = (access: string, refresh: string) => {
        setAccessToken(access);
        setRefreshToken(refresh);
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    };

    // Logout function: clears tokens from state and localStorage
    const logout = () => {
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    // Provide the authentication context to child components
    return (
        <AuthContext.Provider value={{ accessToken, refreshToken, login, logout }}>
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
