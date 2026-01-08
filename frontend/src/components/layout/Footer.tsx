import React from 'react';

const Footer: React.FC = () => {
    const footerStyle = {
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(12px)',
    };

    const containerStyle = {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#64748b',
    };

    return (
        <footer style={footerStyle}>
            <div style={containerStyle}>
                <span>© {new Date().getFullYear()} — Schneider Electric - Prosumer V1 Dashboard - Developed by Gonzalo P</span>
                <span>v1.0</span>
            </div>
        </footer>
    );
};

export default Footer;