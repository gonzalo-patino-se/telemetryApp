// src/components/ThemeToggle.tsx
import { useTheme } from '../context/ThemeContext';

const buttonStyle = {
  padding: '10px',
  borderRadius: '8px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const iconStyle = {
  width: '18px',
  height: '18px',
  color: '#94a3b8',
};

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={buttonStyle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      }}
    >
      {theme === 'dark' ? (
        // Sun icon for light mode
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          style={iconStyle}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          style={iconStyle}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      )}
    </button>
  );
}
