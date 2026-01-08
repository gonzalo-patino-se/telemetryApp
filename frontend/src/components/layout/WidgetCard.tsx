import React from 'react';
import type { ReactNode } from 'react';

interface WidgetCardProps {
    title?: string;
    actions?: ReactNode;
    className?: string;
    children: ReactNode;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ 
    title, 
    actions, 
    className = '', 
    children,
    isLoading = false,
    isEmpty = false,
    emptyMessage = 'No data available'
}) => {
    return (
    <section style={{ 
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
    }} className={className}>
        {/* Header */}
        {(title || actions) && (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 20px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
            {title && (
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>
                    {title}
                </h3>
            )}
            {actions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {actions}
                </div>
            )}
        </div>
        )}
        {/* Body */}
        <div style={{ padding: '20px' }}>
            {isLoading ? (
                <SkeletonLoader />
            ) : isEmpty ? (
                <EmptyState message={emptyMessage} />
            ) : (
                children
            )}
        </div>
    </section>
    );
};

// Skeleton loader component
const SkeletonLoader: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '16px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', width: '75%' }}></div>
        <div style={{ height: '16px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px', width: '50%' }}></div>
        <div style={{ height: '120px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '12px' }}></div>
    </div>
);

// Empty state component
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'rgba(148, 163, 184, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '12px'
        }}>
            <svg 
                style={{ width: '24px', height: '24px', color: '#64748b' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
            </svg>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '200px' }}>{message}</p>
    </div>
);

export default WidgetCard;