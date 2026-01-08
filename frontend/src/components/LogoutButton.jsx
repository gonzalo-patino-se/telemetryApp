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
        background: isHovered ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
        border: `1px solid ${isHovered ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.2)'}`,
        color: isHovered ? '#ef4444' : '#f1f5f9',
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