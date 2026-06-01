// src/styles/tokens.ts
// Design Tokens - Single source of truth for all styling values
// This enables scalability, maintainability, and consistency across the app

export const colors = {
  // Brand (theme-independent)
  schneiderGreen: '#3dcd58',
  schneiderGreenDark: '#009530',
  
  // Backgrounds — bound to CSS variables defined in index.css
  // (`:root`/[data-theme='dark'] vs [data-theme='light']) so they retheme live.
  bgPrimary: 'var(--bg-primary)',
  bgSecondary: 'var(--bg-surface)',
  bgSurface: 'var(--bg-surface)',
  bgSurfaceSolid: 'var(--bg-surface)',
  bgInput: 'var(--bg-input)',
  bgHover: 'var(--bg-surface-hover)',
  bgGlass: 'var(--bg-surface)',
  
  // Text — bound to CSS variables
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  textMuted: 'var(--text-tertiary)',
  textInverse: 'var(--text-inverse)',
  
  // Borders — bound to CSS variables
  borderSubtle: 'var(--border-subtle)',
  borderMedium: 'var(--border-medium)',
  borderFocus: 'var(--border-focus)',
  
  // Accents (same in both themes)
  accentPrimary: '#3b82f6',
  accentSecondary: '#8b5cf6',
  
  // Status (same in both themes)
  statusHealthy: '#22c55e',
  statusWarning: '#f59e0b',
  statusCritical: '#ef4444',
  statusInfo: '#3b82f6',
  
  // Gradients (as objects for flexibility)
  gradients: {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    brand: 'linear-gradient(135deg, #3dcd58 0%, #009530 100%)',
    background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-surface) 100%)',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const;

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '24px',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", monospace',
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  glow: {
    brand: '0 10px 40px -10px rgba(61, 205, 88, 0.4)',
    accent: '0 10px 40px -10px rgba(59, 130, 246, 0.5)',
  },
} as const;

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const;

export const zIndex = {
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  tooltip: 50,
} as const;

// Export all tokens as default
export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  zIndex,
};
