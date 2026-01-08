/** @type {import ('tailwindcss').Config} */

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Use CSS variables for theme-aware colors
                bg: {
                    primary: 'var(--bg-primary)',
                    surface: 'var(--bg-surface)',
                    'surface-hover': 'var(--bg-surface-hover)',
                    input: 'var(--bg-input)',
                    elevated: 'var(--bg-elevated)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    medium: 'var(--border-medium)',
                    focus: 'var(--border-focus)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    inverse: 'var(--text-inverse)',
                },
                accent: {
                    primary: 'var(--accent-primary)',
                    'primary-hover': 'var(--accent-primary-hover)',
                    cyan: 'var(--accent-cyan)',
                    'cyan-hover': 'var(--accent-cyan-hover)',
                },
                status: {
                    healthy: 'var(--status-healthy)',
                    warning: 'var(--status-warning)',
                    critical: 'var(--status-critical)',
                    info: 'var(--status-info)',
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            fontSize: {
                'kpi': '2.25rem',     // 36px - Large KPI numbers
                'section': '0.875rem', // 14px - Section headers
                'metric': '0.75rem',   // 12px - Metric labels
            },
            boxShadow: {
                'sm': 'var(--shadow-sm)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'xl': 'var(--shadow-xl)',
            },
            transitionDuration: {
                '150': '150ms',
                '200': '200ms',
                '250': '250ms',
            },
        },
    },
    plugins: [],
}