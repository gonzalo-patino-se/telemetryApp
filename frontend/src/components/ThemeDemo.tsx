// src/components/ThemeDemo.tsx
// Demo component to showcase the theme system
import { useTheme } from '../context/ThemeContext';

export default function ThemeDemo() {
  const { theme } = useTheme();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Theme System Demo
        </h1>
        <p className="text-text-secondary">
          Current theme: <span className="font-semibold text-accent-primary">{theme}</span>
        </p>
      </div>

      {/* Color Swatches */}
      <section className="bg-bg-surface border border-border-medium rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Color System</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="h-16 bg-bg-primary border border-border-subtle rounded mb-2"></div>
            <p className="text-xs text-text-secondary">bg-primary</p>
          </div>
          <div>
            <div className="h-16 bg-bg-surface border border-border-subtle rounded mb-2"></div>
            <p className="text-xs text-text-secondary">bg-surface</p>
          </div>
          <div>
            <div className="h-16 bg-accent-primary rounded mb-2"></div>
            <p className="text-xs text-text-secondary">accent-primary</p>
          </div>
          <div>
            <div className="h-16 bg-accent-cyan rounded mb-2"></div>
            <p className="text-xs text-text-secondary">accent-cyan</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="bg-bg-surface border border-border-medium rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Typography</h2>
        
        <div className="space-y-3">
          <div className="text-kpi">1,247</div>
          <p className="text-metric-label">KPI Number (text-kpi)</p>
          
          <div className="text-section-header mt-4">Section Header</div>
          <p className="text-text-primary">Primary Text</p>
          <p className="text-text-secondary">Secondary Text</p>
          <p className="text-text-tertiary">Tertiary Text</p>
        </div>
      </section>

      {/* Status Colors */}
      <section className="bg-bg-surface border border-border-medium rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Status Indicators</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-healthy"></div>
            <span className="text-sm text-text-secondary">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-sm text-text-secondary">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical"></div>
            <span className="text-sm text-text-secondary">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-info"></div>
            <span className="text-sm text-text-secondary">Info</span>
          </div>
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="bg-bg-surface border border-border-medium rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Interactive Elements</h2>
        
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-text-inverse rounded-lg transition-colors duration-200">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-bg-input hover:bg-bg-surface-hover border border-border-medium text-text-primary rounded-lg transition-colors duration-200">
            Secondary Button
          </button>
          <input 
            type="text" 
            placeholder="Input field" 
            className="px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
          />
        </div>
      </section>

      {/* Card Example */}
      <section className="bg-bg-surface border border-border-medium rounded-lg p-6 hover:border-accent-primary transition-colors duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Active Devices</h3>
          <span className="text-xs text-text-tertiary">Last 15m</span>
        </div>
        <div className="text-kpi mb-2">1,247</div>
        <p className="text-xs text-status-healthy">↑ 12% from previous period</p>
      </section>
    </div>
  );
}
