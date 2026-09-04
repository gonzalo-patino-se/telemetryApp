// src/pages/ValidationReport.tsx
// FR-018 Validation Report: latest valid cloud value for each subsystem with
// its threshold evaluation. Thresholds come from the same configuration used by
// the history charts and the PDF report.

import React, { useCallback, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSerial } from '../context/SerialContext';
import { useThresholds } from '../context/ThresholdContext';
import api from '../services/api';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ThresholdStatus,
} from '../services/thresholds';

interface ValidationRow {
  metric_key: string;
  label: string;
  unit: string;
  subsystem: string;
  signal: string;
  value: number | null;
  lower_limit: number | null;
  upper_limit: number | null;
  threshold_display: string;
  status: ThresholdStatus;
  utc_timestamp: string | null;
  data_quality: 'good' | 'stale' | 'missing' | 'unverified';
  last_seen: string | null;
  firmware_version: string | null;
}

interface ValidationResponse {
  device: { serial: string; model: string | null; firmware_version: string | null; last_seen: string | null };
  generated_at: string;
  lookback_days: number;
  missing_threshold_text: string;
  stale_data_minutes: number;
  summary: Record<ThresholdStatus, number>;
  results: ValidationRow[];
}

const QUALITY_LABELS: Record<ValidationRow['data_quality'], string> = {
  good: 'Good',
  stale: 'Stale',
  missing: 'No data',
  unverified: 'Unverified',
};

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle, rgba(148,163,184,0.15))',
  borderRadius: '12px',
  padding: '16px',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-tertiary, #94a3b8)',
  borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.2))',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 8px',
  fontSize: '12px',
  borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))',
  color: 'var(--text-primary)',
};

function formatUtc(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

function formatLocal(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function formatValue(value: number | null, unit: string): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const rounded = Math.abs(Number(value)) >= 100 ? Number(value).toFixed(1) : Number(value).toFixed(2);
  return unit ? `${rounded} ${unit}` : rounded;
}

const ValidationReport: React.FC = () => {
  const { serial } = useSerial();
  const { missingThresholdText } = useThresholds();
  const [report, setReport] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ThresholdStatus>('all');
  const [lookbackDays, setLookbackDays] = useState(7);

  const run = useCallback(async () => {
    if (!serial) {
      setError('Select a device serial first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<ValidationResponse>('/validation_report/', {
        serial,
        lookback_days: lookbackDays,
      });
      setReport(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'The validation report could not be generated.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [serial, lookbackDays]);

  const rows = useMemo(() => {
    if (!report) return [];
    if (statusFilter === 'all') return report.results;
    return report.results.filter(row => row.status === statusFilter);
  }, [report, statusFilter]);

  const exportPdf = useCallback(() => {
    if (!report) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const marginX = 28;
    let y = 40;

    doc.setFontSize(16);
    doc.text('Validation Report', marginX, y);
    y += 18;
    doc.setFontSize(9);
    doc.text(
      `Device ${report.device.serial}  |  Model ${report.device.model ?? 'n/a'}  |  Firmware ${report.device.firmware_version ?? 'n/a'}`,
      marginX,
      y,
    );
    y += 12;
    doc.text(
      `Generated ${formatUtc(report.generated_at)} (${formatLocal(report.generated_at)})  |  Lookback ${report.lookback_days} d  |  Passed ${report.summary.passed ?? 0} / Failed ${report.summary.failed ?? 0} / Unknown ${report.summary.unknown ?? 0}`,
      marginX,
      y,
    );
    y += 18;

    const headers = ['Subsystem', 'Metric', 'Value', 'UTC time', 'Local time', 'Threshold', 'Status', 'Quality', 'Firmware'];
    const widths = [60, 130, 70, 115, 115, 110, 55, 55, 60];
    doc.setFontSize(8);
    let x = marginX;
    headers.forEach((header, index) => {
      doc.text(header, x, y);
      x += widths[index];
    });
    y += 10;
    doc.setDrawColor(180);
    doc.line(marginX, y - 6, marginX + widths.reduce((a, b) => a + b, 0), y - 6);

    report.results.forEach(row => {
      if (y > 540) {
        doc.addPage();
        y = 40;
      }
      const cells = [
        row.subsystem,
        row.label,
        formatValue(row.value, row.unit),
        formatUtc(row.utc_timestamp),
        formatLocal(row.utc_timestamp),
        row.threshold_display,
        STATUS_LABELS[row.status],
        QUALITY_LABELS[row.data_quality],
        row.firmware_version ?? 'n/a',
      ];
      x = marginX;
      cells.forEach((cell, index) => {
        doc.text(String(cell).slice(0, 42), x, y);
        x += widths[index];
      });
      y += 12;
    });

    doc.save(`validation_report_${report.device.serial}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [report]);

  return (
    <DashboardLayout title="Validation Report" showFilters={false}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ ...panelStyle, display: 'flex', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary, #94a3b8)' }}>Device</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{serial ?? 'No serial selected'}</div>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Lookback window
            <select
              value={lookbackDays}
              onChange={e => setLookbackDays(Number(e.target.value))}
              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, rgba(148,163,184,0.25))' }}
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
          <button
            onClick={run}
            disabled={!serial || loading}
            style={{
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '18px',
              border: 'none',
              cursor: !serial || loading ? 'not-allowed' : 'pointer',
              background: !serial || loading ? 'rgba(100,116,139,0.2)' : 'linear-gradient(135deg, #3dcd58 0%, #22c55e 100%)',
              color: !serial || loading ? '#64748b' : '#fff',
            }}
          >
            {loading ? 'Generating…' : 'Generate report'}
          </button>
          {report && (
            <button
              onClick={exportPdf}
              style={{
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '18px',
                border: '1px solid var(--border-subtle, rgba(148,163,184,0.3))',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Download PDF
            </button>
          )}
        </div>

        {error && <div style={{ ...panelStyle, borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '13px' }}>{error}</div>}

        {report && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {(['passed', 'failed', 'unknown'] as ThresholdStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(prev => (prev === status ? 'all' : status))}
                  style={{
                    ...panelStyle,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderColor: statusFilter === status ? STATUS_COLORS[status] : 'var(--border-subtle, rgba(148,163,184,0.15))',
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary, #94a3b8)' }}>
                    {STATUS_LABELS[status]}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: STATUS_COLORS[status] }}>
                    {report.summary[status] ?? 0}
                  </div>
                </button>
              ))}
              <div style={panelStyle}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary, #94a3b8)' }}>Generated</div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>{formatUtc(report.generated_at)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatLocal(report.generated_at)}</div>
              </div>
            </div>

            <div style={{ ...panelStyle, overflowX: 'auto' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #94a3b8)', marginBottom: '10px' }}>
                Values older than {report.stale_data_minutes} minutes are flagged as stale. Metrics without a configured
                threshold report “{report.missing_threshold_text || missingThresholdText}”.
                {statusFilter !== 'all' && ` Showing ${STATUS_LABELS[statusFilter]} only — click the card again to clear.`}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Subsystem</th>
                    <th style={thStyle}>Metric</th>
                    <th style={thStyle}>Value</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>UTC timestamp</th>
                    <th style={thStyle}>Local timestamp</th>
                    <th style={thStyle}>Threshold</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Data quality</th>
                    <th style={thStyle}>Last seen</th>
                    <th style={thStyle}>Firmware</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={11} style={{ ...tdStyle, color: 'var(--text-tertiary, #94a3b8)' }}>No rows for the current filter.</td></tr>
                  )}
                  {rows.map(row => (
                    <tr key={row.metric_key}>
                      <td style={tdStyle}>{row.subsystem}</td>
                      <td style={tdStyle} title={row.signal}>{row.label}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{formatValue(row.value, '')}</td>
                      <td style={tdStyle}>{row.unit || '—'}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatUtc(row.utc_timestamp)}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatLocal(row.utc_timestamp)}</td>
                      <td style={tdStyle}>{row.threshold_display}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: STATUS_COLORS[row.status],
                            border: `1px solid ${STATUS_COLORS[row.status]}`,
                          }}
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td style={tdStyle}>{QUALITY_LABELS[row.data_quality]}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatLocal(row.last_seen)}</td>
                      <td style={tdStyle}>{row.firmware_version ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!report && !error && !loading && (
          <div style={{ ...panelStyle, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Generate the report to see the latest valid cloud value for every subsystem together with its
            threshold evaluation.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ValidationReport;
