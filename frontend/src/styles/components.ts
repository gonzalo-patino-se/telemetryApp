// src/styles/components.ts
// Reusable component styles built from design tokens
// Import these in components for consistent styling

import { colors, spacing, borderRadius, typography, shadows, transitions } from './tokens';

// Card styles
export const cardStyles = {
  container: {
    background: colors.bgSurface,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: borderRadius.xl,
    border: `1px solid ${colors.borderSubtle}`,
    overflow: 'hidden' as const,
    transition: transitions.normal,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.lg} ${spacing.xl}`,
    borderBottom: `1px solid ${colors.borderSubtle}`,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  body: {
    padding: spacing.xl,
  },
};

// Glass card (for modals, login, etc.)
export const glassCardStyles = {
  container: {
    background: colors.bgGlass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: borderRadius.xxl,
    border: `1px solid ${colors.borderSubtle}`,
    boxShadow: shadows.xl,
  },
};

// Form styles
export const formStyles = {
  label: {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  labelUppercase: {
    display: 'block',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: spacing.sm,
  },
  input: {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    background: colors.bgInput,
    border: `1px solid ${colors.borderMedium}`,
    borderRadius: borderRadius.lg,
    outline: 'none',
    transition: transitions.normal,
    boxSizing: 'border-box' as const,
  },
  inputFocus: {
    borderColor: colors.accentPrimary,
    boxShadow: `0 0 0 3px ${colors.borderFocus}`,
  },
  select: {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    background: colors.bgInput,
    border: `1px solid ${colors.borderMedium}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
  },
};

// Button styles
export const buttonStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: transitions.normal,
    border: 'none',
  },
  primary: {
    color: colors.textInverse,
    background: colors.gradients.primary,
  },
  secondary: {
    color: colors.textPrimary,
    background: colors.bgInput,
    border: `1px solid ${colors.borderMedium}`,
  },
  ghost: {
    color: colors.textSecondary,
    background: 'transparent',
  },
};

// List item styles
export const listItemStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    background: colors.bgInput,
    border: `1px solid ${colors.borderSubtle}`,
    transition: transitions.normal,
  },
  containerHover: {
    borderColor: colors.borderMedium,
    background: 'rgba(15, 23, 42, 0.6)',
  },
};

// Status badge styles
export const badgeStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.sm,
  },
  healthy: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: colors.statusHealthy,
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.15)',
    color: colors.statusWarning,
  },
  critical: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: colors.statusCritical,
  },
  info: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: colors.statusInfo,
  },
  default: {
    background: colors.bgInput,
    color: colors.textTertiary,
  },
};

// Status dot styles
export const statusDotStyles = {
  base: {
    width: '8px',
    height: '8px',
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  healthy: { background: colors.statusHealthy },
  warning: { background: colors.statusWarning },
  critical: { background: colors.statusCritical },
  info: { background: colors.statusInfo },
};

// Layout styles
export const layoutStyles = {
  page: {
    width: '100%',
    minHeight: '100vh',
    background: colors.gradients.background,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `0 ${spacing.xxl}`,
  },
  grid: {
    display: 'grid',
    gap: spacing.xxl,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Text styles
export const textStyles = {
  h1: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: '-0.025em',
    margin: 0,
  },
  h2: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    margin: 0,
  },
  body: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed,
  },
  small: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  tiny: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
};

// Empty state styles
export const emptyStateStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xxxl} ${spacing.xl}`,
    textAlign: 'center' as const,
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: borderRadius.lg,
    background: colors.bgHover,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    margin: `0 0 ${spacing.sm} 0`,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    margin: 0,
  },
};
