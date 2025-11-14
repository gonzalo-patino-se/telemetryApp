import React from 'react';

const Footer: React.FC = () => {
    return (
    <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs text-gray-500">
        <span>© {new Date().getFullYear()} — Schneider Electric- Prosumer V1 Dashboard - Developed by Gonzalo P</span>
        <span>v1.0 • Build #{/* hook in CI build number later */}</span>
        </div>
    </footer>
    );
};

export default Footer;