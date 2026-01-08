// src/components/common/Logo.tsx
// Reusable Logo component - Single source of truth for brand identity
// Used in NavBar, LoginForm, About page, etc.

import React from 'react';
import { colors, borderRadius } from '../../styles/tokens';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textLayout?: 'horizontal' | 'vertical';
}

// Size configurations
const sizeConfig = {
  sm: { container: 32, icon: 16 },
  md: { container: 38, icon: 20 },
  lg: { container: 56, icon: 28 },
  xl: { container: 80, icon: 36 },
};

// The SVG logo mark - Schneider Electric inspired geometric pattern
const LogoMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="4" width="10" height="10" rx="2" fill="white" />
    <rect x="18" y="18" width="10" height="10" rx="2" fill="white" />
    <rect x="4" y="18" width="10" height="10" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="18" y="4" width="10" height="10" rx="2" fill="rgba(255,255,255,0.5)" />
  </svg>
);

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true,
  textLayout = 'horizontal' 
}) => {
  const { container, icon } = sizeConfig[size];
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexDirection: textLayout === 'vertical' ? 'column' : 'row',
  };

  const logoBoxStyle: React.CSSProperties = {
    width: `${container}px`,
    height: `${container}px`,
    borderRadius: size === 'sm' || size === 'md' ? borderRadius.md : borderRadius.xl,
    background: colors.schneiderGreen,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const textContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
    textAlign: textLayout === 'vertical' ? 'center' : 'left',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: size === 'xl' ? '24px' : size === 'lg' ? '18px' : '15px',
    fontWeight: 600,
    color: colors.textPrimary,
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: size === 'xl' ? '14px' : size === 'lg' ? '13px' : '11px',
    fontWeight: 400,
    color: colors.textTertiary,
    marginTop: size === 'xl' ? '4px' : '2px',
  };

  return (
    <div style={containerStyle}>
      <div style={logoBoxStyle} aria-hidden="true">
        <LogoMark size={icon} />
      </div>
      {showText && (
        <div style={textContainerStyle}>
          <span style={titleStyle}>Schneider Electric</span>
          <span style={subtitleStyle}>V1 Analytics</span>
        </div>
      )}
    </div>
  );
};

// Export the logo mark separately for cases where only the icon is needed
export { LogoMark };
export default Logo;
