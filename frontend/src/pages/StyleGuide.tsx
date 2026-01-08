// src/pages/StyleGuide.tsx
// Comprehensive style guide showing all new components
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import KpiCard from '../components/KpiCard';
import ModernChart from '../components/ModernChart';

export default function StyleGuide() {
  // Sample chart data
  const generateChartData = (points: number) => {
    const now = Date.now();
    return Array.from({ length: points }, (_, i) => ({
      timestamp: new Date(now - (points - i) * 60000).toISOString(),
      value: 220 + Math.random() * 20 + Math.sin(i / 5) * 10,
    }));
  };

  const chartData = generateChartData(50);
  const wifiData = generateChartData(50).map((d, i) => ({
    ...d,
    value: -50 + Math.random() * 10 - Math.cos(i / 3) * 5,
  }));

  return (
    <DashboardLayout title="Design System Style Guide" showFilters={false}>
      {/* Typography Section */}
      <section className="mb-8">
        <h2 className="text-section-header mb-4">Typography</h2>
        <WidgetCard>
          <div className="space-y-4">
            <div>
              <p className="text-metric-label mb-1">KPI Number (text-kpi)</p>
              <div className="text-kpi">1,247</div>
            </div>
            <div>
              <p className="text-metric-label mb-1">Section Header (text-section-header)</p>
              <div className="text-section-header">Active Devices</div>
            </div>
            <div>
              <p className="text-metric-label mb-1">Text Hierarchy</p>
              <p className="text-text-primary mb-1">Primary text - main content</p>
              <p className="text-text-secondary mb-1">Secondary text - labels, metadata</p>
              <p className="text-text-tertiary">Tertiary text - disabled, hints</p>
            </div>
          </div>
        </WidgetCard>
      </section>

      {/* KPI Cards Section */}
      <section className="mb-8">
        <h2 className="text-section-header mb-4">KPI Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Active Devices"
            value="1,247"
            trend={{ value: 12, direction: 'up' }}
            sparklineData={[45, 52, 48, 61, 55, 67, 72, 68, 75]}
          />
          <KpiCard
            label="Healthy Status"
            value="98.2%"
            status="healthy"
            sparklineData={[95, 96, 97, 96, 98, 97, 99, 98, 98]}
          />
          <KpiCard
            label="Warning Status"
            value="3"
            status="warning"
            trend={{ value: -5, direction: 'down' }}
          />
          <KpiCard
            label="Avg Response Time"
            value="245ms"
            status="info"
            sparklineData={[250, 240, 245, 235, 230, 240, 245, 250, 245]}
          />
        </div>
      </section>

      {/* Charts Section */}
      <section className="mb-8">
        <h2 className="text-section-header mb-4">Modern Charts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WidgetCard title="Line Chart - Voltage">
            <ModernChart
              data={chartData}
              dataKey="value"
              timestampKey="timestamp"
              height={280}
              color="var(--accent-cyan)"
              yAxisLabel="Voltage (V)"
              formatValue={(v) => `${v.toFixed(1)}V`}
            />
          </WidgetCard>

          <WidgetCard title="Area Chart - Wi-Fi Signal">
            <ModernChart
              data={wifiData}
              dataKey="value"
              timestampKey="timestamp"
              height={280}
              showArea={true}
              color="var(--accent-primary)"
              yAxisLabel="Signal (dBm)"
              formatValue={(v) => `${v.toFixed(0)} dBm`}
            />
          </WidgetCard>
        </div>
      </section>

      {/* Widget States Section */}
      <section className="mb-8">
        <h2 className="text-section-header mb-4">Widget States</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WidgetCard 
            title="Normal State"
            actions={
              <button className="px-2.5 py-1 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-text-inverse text-xs font-medium transition-colors">
                Action
              </button>
            }
          >
            <p className="text-text-secondary">This is a normal widget with content.</p>
          </WidgetCard>

          <WidgetCard 
            title="Loading State"
            isLoading={true}
          >
            <p>This content won't show</p>
          </WidgetCard>

          <WidgetCard 
            title="Empty State"
            isEmpty={true}
            emptyMessage="No data available for the selected time range"
          >
            <p>This content won't show</p>
          </WidgetCard>
        </div>
      </section>

      {/* Color System Section */}
      <section className="mb-8">
        <h2 className="text-section-header mb-4">Color System</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WidgetCard title="Backgrounds">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-bg-primary border border-border-subtle rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">bg-primary</p>
                  <p className="text-xs text-text-tertiary">Page background</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-bg-surface border border-border-subtle rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">bg-surface</p>
                  <p className="text-xs text-text-tertiary">Cards, panels</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-bg-input border border-border-subtle rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">bg-input</p>
                  <p className="text-xs text-text-tertiary">Form inputs</p>
                </div>
              </div>
            </div>
          </WidgetCard>

          <WidgetCard title="Status Colors">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-status-healthy rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">Healthy</p>
                  <p className="text-xs text-text-tertiary">Success states</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-status-warning rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">Warning</p>
                  <p className="text-xs text-text-tertiary">Caution states</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-status-critical rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">Critical</p>
                  <p className="text-xs text-text-tertiary">Error states</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-status-info rounded"></div>
                <div>
                  <p className="text-sm text-text-primary font-medium">Info</p>
                  <p className="text-xs text-text-tertiary">Informational states</p>
                </div>
              </div>
            </div>
          </WidgetCard>
        </div>
      </section>

      {/* Interactive Elements Section */}
      <section className="mb-8">
        <h2 className="text-section-header mb-4">Interactive Elements</h2>
        <WidgetCard>
          <div className="space-y-4">
            <div>
              <p className="text-metric-label mb-2">Buttons</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-text-inverse rounded-lg transition-colors duration-200 font-medium">
                  Primary Button
                </button>
                <button className="px-4 py-2 bg-bg-input hover:bg-bg-surface-hover border border-border-medium text-text-primary rounded-lg transition-colors duration-200">
                  Secondary Button
                </button>
                <button className="px-4 py-2 bg-status-critical hover:bg-opacity-90 text-text-inverse rounded-lg transition-colors duration-200">
                  Danger Button
                </button>
                <button className="px-4 py-2 bg-bg-input border border-border-medium text-text-tertiary rounded-lg opacity-50 cursor-not-allowed">
                  Disabled Button
                </button>
              </div>
            </div>

            <div>
              <p className="text-metric-label mb-2">Form Inputs</p>
              <div className="space-y-3 max-w-md">
                <input
                  type="text"
                  placeholder="Text input"
                  className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none transition-colors"
                />
                <select className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary focus:border-border-focus focus:outline-none transition-colors">
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
                <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                  <input type="checkbox" className="rounded border-border-medium" />
                  Checkbox option
                </label>
              </div>
            </div>
          </div>
        </WidgetCard>
      </section>
    </DashboardLayout>
  );
}
