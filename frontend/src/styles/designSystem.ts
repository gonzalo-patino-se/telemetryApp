// src/styles/designSystem.ts
// Centralized design tokens for consistency, scalability, and maintainability

export const colors = {
  // Backgrounds
  bgPrimary: '#0f172a',
  bgSurface: 'rgba(30, 41, 59, 0.6)',
  bgSurfaceSolid: '#1e293b',
  bgInput: 'rgba(15, 23, 42, 0.6)',
  bgHover: 'rgba(148, 163, 184, 0.1)',
  
  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#64748b',
  textMuted: '#475569',
  
  // Borders
  borderSubtle: 'rgba(148, 163, 184, 0.1)',
  borderMedium: 'rgba(148, 163, 184, 0.2)',
  borderFocus: 'rgba(59, 130, 246, 0.5)',
  
  // Accents
  accentPrimary: '#3b82f6',
  accentSecondary: '#8b5cf6',
  accentGradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  schneiderGreen: '#3dcd58',
  
  // Status
  statusHealthy: '#22c55e',
  statusWarning: '#f59e0b',
  statusCritical: '#ef4444',
  statusInfo: '#3b82f6',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  sizes: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// Reusable component styles
export const componentStyles = {
  // Card/Panel container
  card: {
    background: colors.bgSurface,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: `1px solid ${colors.borderSubtle}`,
    overflow: 'hidden' as const,
  },
  
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  
  cardBody: {
    padding: '20px',
  },
  
  // Grid layouts
  gridContainer: (columns: string = 'repeat(auto-fit, minmax(300px, 1fr))') => ({
    display: 'grid',
    gridTemplateColumns: columns,
    gap: spacing.lg,
  }),
  
  // List item (for events, firmware versions, etc.)
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.4)',
    border: `1px solid ${colors.borderSubtle}`,
    transition: 'all 0.2s ease',
  },
  
  listItemHover: {
    background: 'rgba(15, 23, 42, 0.6)',
    borderColor: colors.borderMedium,
  },
  
  // Form inputs
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    background: colors.bgInput,
    border: `1px solid ${colors.borderMedium}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    background: colors.bgInput,
    border: `1px solid ${colors.borderMedium}`,
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    paddingRight: '40px',
  },
  
  // Labels
  label: {
    display: 'block',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: spacing.sm,
  },
  
  // Buttons
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: '#ffffff',
    background: colors.accentGradient,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    background: colors.bgInput,
    border: `1px solid ${colors.borderMedium}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  buttonActive: {
    background: 'rgba(59, 130, 246, 0.2)',
    borderColor: colors.accentPrimary,
    color: colors.textPrimary,
  },
  
  // Status badges
  badge: (status: 'healthy' | 'warning' | 'critical' | 'info' | 'default' = 'default') => {
    const statusColors = {
      healthy: { bg: 'rgba(34, 197, 94, 0.15)', text: colors.statusHealthy },
      warning: { bg: 'rgba(245, 158, 11, 0.15)', text: colors.statusWarning },
      critical: { bg: 'rgba(239, 68, 68, 0.15)', text: colors.statusCritical },
      info: { bg: 'rgba(59, 130, 246, 0.15)', text: colors.statusInfo },
      default: { bg: colors.bgInput, text: colors.textTertiary },
    };
    const { bg, text } = statusColors[status];
    return {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      color: text,
      background: bg,
      borderRadius: '6px',
    };
  },
  
  // Status dot
  statusDot: (status: 'healthy' | 'warning' | 'critical' | 'info') => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors[`status${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof colors],
    flexShrink: 0,
  }),
  
  // Text styles
  textPrimary: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  
  textSecondary: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  
  textTertiary: {
    color: colors.textTertiary,
    fontSize: typography.sizes.xs,
  },
  
  // Centered icon container
  iconContainer: (size: number = 48, bgColor: string = colors.bgHover) => ({
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '12px',
    background: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

// Layout helpers
export const layoutStyles = {
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  
  flexCol: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  gap: (size: keyof typeof spacing) => ({
    gap: spacing[size],
  }),
  
  stack: (gap: string = spacing.lg) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap,
  }),
};

export default { colors, spacing, typography, componentStyles, layoutStyles };
