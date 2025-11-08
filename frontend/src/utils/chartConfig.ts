/**
 * chartConfig.ts
 * --------------
 * Provides reusable chart configuration for ADX data visualization.
 */

import type { ChartOptions, ChartData } from 'chart.js';

interface AdxDataPoint {
    localtime: string;
    value_double: number;
}

/**
 * Converts ADX data into Chart.js configuration.
 */
export function getChartConfig(data: any[]) {
    return {
        labels: data.map(item => item.localtime),
        datasets: [
            {
                label: 'PV1 Voltage',
                data: data.map(item => item.value_double),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                tension: 0.3,
                fill: true
            }
        ]
    };
}

/**
 * Chart options for better UX.
 */
export const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
        legend: {
            display: true,
            labels: {
                color: '#374151',
                font: { size: 14 }
            }
        },
        tooltip: {
            enabled: true,
            mode: 'nearest',
            intersect: false
        }
    },
    scales: {
        x: {
            title: { display: true, text: 'Timestamp' },
            ticks: { maxRotation: 45 }
        },
        y: {
            title: { display: true, text: 'Voltage (V)' },
            beginAtZero: true
        }
    }
};