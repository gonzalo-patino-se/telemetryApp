import React from 'react';

interface WidgetCardProps {
    title?: string;
    actions?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, actions, className = '', children }) => {
    return (
    <section className={`rounded-lg border bg-white shadow-sm ${className}`}>
        {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
            <h3 className="text-sm font-semibold">{title}</h3>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        )}
        <div className="p-4">{children}</div>
    </section>
    );
};

export default WidgetCard;