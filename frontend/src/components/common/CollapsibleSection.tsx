// src/components/common/CollapsibleSection.tsx
// Reusable collapsible section for organizing dashboard widgets

import React, { useState } from 'react';
import { colors, spacing, borderRadius, typography } from '../../styles/tokens';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  color?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  badge,
  color = colors.schneiderGreen,
  defaultExpanded = true,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: spacing.xl }}>
      {/* Section Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: isExpanded ? spacing.lg : 0,
          paddingBottom: spacing.sm,
          borderBottom: `1px solid ${colors.borderSubtle}`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ 
          width: '24px', 
          height: '24px', 
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </span>
        <h2 style={{
          margin: 0,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.textPrimary,
          flex: 1,
        }}>
          {title}
        </h2>
        {badge && (
          <span style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.textTertiary,
            background: colors.bgHover,
            padding: '2px 8px',
            borderRadius: borderRadius.full,
          }}>
            {badge}
          </span>
        )}
        <svg 
          style={{
            width: '20px',
            height: '20px',
            color: colors.textTertiary,
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Collapsible Content */}
      <div style={{
        overflow: 'hidden',
        maxHeight: isExpanded ? '5000px' : '0',
        opacity: isExpanded ? 1 : 0,
        transition: 'all 0.3s ease',
      }}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
