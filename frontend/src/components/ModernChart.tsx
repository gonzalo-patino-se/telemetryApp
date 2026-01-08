// src/components/ModernChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface DataPoint {
  timestamp: string | number;
  value: number;
  [key: string]: any;
}

interface ModernChartProps {
  data: DataPoint[];
  dataKey?: string;
  timestampKey?: string;
  height?: number;
  showArea?: boolean;
  color?: string;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
  formatTimestamp?: (timestamp: any) => string;
}

export default function ModernChart({
  data,
  dataKey = 'value',
  timestampKey = 'timestamp',
  height = 280,
  showArea = false,
  color = 'var(--accent-cyan)',
  yAxisLabel,
  formatValue = (v) => v.toFixed(1),
  formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}: ModernChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-text-tertiary">No data available</p>
      </div>
    );
  }

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent 
        data={data} 
        margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
      >
        {/* Minimal grid - horizontal lines only */}
        <CartesianGrid 
          strokeDasharray="0" 
          stroke="var(--chart-grid)"
          vertical={false}
        />
        
        {/* X-axis with subtle styling */}
        <XAxis 
          dataKey={timestampKey}
          stroke="var(--text-tertiary)"
          tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border-subtle)' }}
          tickLine={false}
          tickFormatter={formatTimestamp}
          minTickGap={50}
        />
        
        {/* Y-axis with auto-scaling */}
        <YAxis 
          stroke="var(--text-tertiary)"
          tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={formatValue}
          label={yAxisLabel ? { 
            value: yAxisLabel, 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: 'var(--text-tertiary)', fontSize: 11 }
          } : undefined}
        />
        
        {/* Custom tooltip */}
        <Tooltip 
          content={<CustomTooltip formatValue={formatValue} formatTimestamp={formatTimestamp} dataKey={dataKey} timestampKey={timestampKey} />}
          cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        
        {/* Area fill (if enabled) */}
        {showArea && (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, fill: color }}
            animationDuration={200}
            animationEasing="ease-out"
          />
        )}
        
        {/* Line */}
        {!showArea && (
          <Line 
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
            animationDuration={200}
            animationEasing="ease-out"
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  formatValue: (value: number) => string;
  formatTimestamp: (timestamp: any) => string;
  dataKey: string;
  timestampKey: string;
}

function CustomTooltip({ active, payload, formatValue, formatTimestamp, dataKey, timestampKey }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  const timestamp = data[timestampKey];
  const value = data[dataKey];

  return (
    <div className="bg-bg-elevated border border-border-medium rounded-lg px-3 py-2 shadow-xl">
      <div className="text-xs text-text-tertiary mb-1">
        {formatTimestamp(timestamp)}
      </div>
      <div className="text-sm font-semibold text-text-primary tabular-nums">
        {formatValue(value)}
      </div>
    </div>
  );
}
