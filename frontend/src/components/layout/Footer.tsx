import React from 'react';

const Footer: React.FC = () => {
    return (
    <footer className="border-t border-border-subtle bg-bg-surface theme-transition">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs text-text-tertiary">
        <span>© {new Date().getFullYear()} — Schneider Electric - Prosumer V1 Dashboard - Developed by Gonzalo P</span>
        <span>v1.0</span>
        </div>
    </footer>
    );
};

export default Footer;