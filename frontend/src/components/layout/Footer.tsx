import React from 'react';

const Footer: React.FC = () => {
    const footerStyle = {
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(12px)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
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
        color: 'var(--text-secondary)',
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