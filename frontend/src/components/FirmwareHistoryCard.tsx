// src/components/FirmwareHistoryCard.tsx
// Firmware History table card.
// Queries DevInfo for distinct firmware records within the global time range.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import WidgetCard from './layout/WidgetCard';
import { useTimeRangeOptional } from '../context/TimeRangeContext';
import { buildFirmwareHistoryQuery } from '../utils/kqlBuilders';

const QUERY_PATH = '/query_adx/';

interface FwRow {
  localtime: string;
  utctime: string;
  name: string;
  modelName: string;
  firmware_version: string;
}

interface FirmwareHistoryCardProps {
  serial: string;
}

const FirmwareHistoryCard: React.FC<FirmwareHistoryCardProps> = ({ serial }) => {
  const tr = useTimeRangeOptional();
  const range = tr?.globalTimeRange ?? null;

  const [rows, setRows] = useState<FwRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const reqIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!serial || !range) return;
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const kql = buildFirmwareHistoryQuery(serial, range.startDate, range.endDate);
      const res = await api.post(QUERY_PATH, { kql });
      if (myReqId !== reqIdRef.current) return; // stale
      const data: FwRow[] = (res?.data?.data || []).map((r: Record<string, unknown>) => ({
        localtime: String(r.localtime ?? ''),
        utctime: String(r.utctime ?? ''),
        name: String(r.name ?? ''),
        modelName: String(r.modelName ?? ''),
        firmware_version: String(r.firmware_version ?? ''),
      }));
      setRows(data);
    } catch (e) {
      if (myReqId !== reqIdRef.current) return;
      const msg = e instanceof Error ? e.message : 'Query failed';
      setError(msg);
      setRows([]);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [serial, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTick]);

  const handleExportCsv = useCallback(() => {
    if (rows.length === 0) return;
    const header = ['localtime', 'utctime', 'name', 'modelName', 'firmware_version'];
    const escape = (v: string) => {
      const s = v ?? '';
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([r.localtime, r.utctime, r.name, r.modelName, r.firmware_version].map(escape).join(','));
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `firmware_history_${serial}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows, serial]);

  const presetLabel = useMemo(() => range?.preset ?? '—', [range]);

  const btnStyle: React.CSSProperties = {
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.4)',
    color: '#93c5fd',
    fontSize: 12,
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
  };

  const actions = (
    <>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        {loading ? 'Loading…' : `${rows.length} row${rows.length === 1 ? '' : 's'} · ${presetLabel}`}
      </span>
      <button
        type="button"
        onClick={() => setRefreshTick((n) => n + 1)}
        disabled={loading || !serial || !range}
        style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}
        title="Re-run firmware history query"
      >
        Refresh
      </button>
      <button
        type="button"
        onClick={handleExportCsv}
        disabled={rows.length === 0}
        style={{ ...btnStyle, opacity: rows.length === 0 ? 0.5 : 1 }}
        title="Download as CSV"
      >
        Export CSV
      </button>
    </>
  );

  return (
    <WidgetCard title="Firmware History" actions={actions}>
      {!serial && (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Select a serial number to load firmware history.</div>
      )}
      {serial && !range && (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Set the Historical Data Time Range to load firmware history.</div>
      )}
      {error && (
        <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 8 }}>Error: {error}</div>
      )}
      {serial && range && !loading && rows.length === 0 && !error && (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>No firmware records in this time range.</div>
      )}
      {rows.length > 0 && (
        <div style={{ overflow: 'auto', maxHeight: 360, border: '1px solid rgba(148,163,184,0.1)', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#e2e8f0' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', zIndex: 1 }}>
              <tr>
                <th style={th}>localtime</th>
                <th style={th}>utctime</th>
                <th style={th}>name</th>
                <th style={th}>modelName</th>
                <th style={th}>firmware_version</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? 'rgba(148,163,184,0.04)' : 'transparent' }}>
                  <td style={td}>{r.localtime}</td>
                  <td style={td}>{r.utctime}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.modelName}</td>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#93c5fd' }}>{r.firmware_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetCard>
  );
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  color: '#cbd5e1',
  borderBottom: '1px solid rgba(148,163,184,0.2)',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid rgba(148,163,184,0.06)',
  whiteSpace: 'nowrap',
};

export default FirmwareHistoryCard;
