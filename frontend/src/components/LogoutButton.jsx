import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LogoutButton = () => {
    const { logout } = useAuth();
    const [isHovered, setIsHovered] = useState(false);

    const handleLogout = async () => {
        await logout(); // Clears tokens and Axios header
    };

    const buttonStyle = {
        padding: '10px 18px',
        borderRadius: '8px',
        background: isHovered ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
        border: `1px solid ${isHovered ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-medium)'}`,
        color: isHovered ? '#ef4444' : 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    };

    return (
        <button
            onClick={handleLogout}
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            Logout
        </button>
    );
};

export default LogoutButton;