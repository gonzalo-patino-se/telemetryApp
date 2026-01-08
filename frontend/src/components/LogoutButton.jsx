import React from 'react';
import { useAuth } from '../context/AuthContext';

const LogoutButton = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout(); // Clears tokens and Axios header
    };

    return (
        <button
            onClick={handleLogout}
            className="bg-bg-input border border-border-medium text-text-primary px-4 py-2 rounded-lg hover:bg-bg-surface-hover hover:border-status-critical hover:text-status-critical transition-colors duration-200"
        >
            Logout
        </button>
    );
};

export default LogoutButton;