// src/components/DashboardPDFExport.tsx
// PDF Export component for Dashboard - generates PDF report with device info and live telemetry
// Fetches current telemetry values and includes them in the report

import React, { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import api from '../services/api';
import {
  MISSING_THRESHOLD_TEXT,
  STATUS_LABELS,
  classifyValue,
  fetchEffectiveThresholds,
  fetchMetricCatalog,
  formatThreshold,
  type Threshold,
  type ThresholdMap,
  type ThresholdStatus,
} from '../services/thresholds';

interface DeviceInfo {
  serial: string;
  firmware?: string;
  mac?: string;
  model?: string;
  lastSeen?: string;
}

interface TelemetryValue {
  label: string;
  value: number | string | null;
  numeric: number | null;       // raw value used for threshold classification
  unit: string;
  localtime: string | null;  // KQL timestamp
}

interface DashboardPDFExportProps {
  deviceInfo: DeviceInfo;
  targetRef?: React.RefObject<HTMLElement | null>;
  filename?: string;
}

// Telemetry names to fetch for the report
const TELEMETRY_NAMES = [
  // WiFi & Inverter
  { name: '/SCC/WIFI/STAT/SIGNAL_STRENGTH', label: 'WiFi Signal', unit: 'dBm' },
  { name: 'INV/DEV/STAT/OPERATING_STATE', label: 'Inverter Mode', unit: '' },
  { name: '/BGCS/GRID/STAT/RELAY_STATUS', label: 'BGCS Relay Status', unit: '' },
  // Solar PV
  { name: '/INV/DCPORT/STAT/PV1/V', label: 'PV1 Voltage', unit: 'V' },
  { name: '/INV/DCPORT/STAT/PV2/V', label: 'PV2 Voltage', unit: 'V' },
  { name: '/INV/DCPORT/STAT/PV3/V', label: 'PV3 Voltage', unit: 'V' },
  { name: '/INV/DCPORT/STAT/PV4/V', label: 'PV4 Voltage', unit: 'V' },
  { name: '/INV/DCPORT/STAT/PV1/I', label: 'PV1 Current', unit: 'A' },
  { name: '/INV/DCPORT/STAT/PV2/I', label: 'PV2 Current', unit: 'A' },
  { name: '/INV/DCPORT/STAT/PV3/I', label: 'PV3 Current', unit: 'A' },
  { name: '/INV/DCPORT/STAT/PV4/I', label: 'PV4 Current', unit: 'A' },
  // Grid
  { name: '/INV/ACPORT/STAT/VRMS_L1N', label: 'Grid V L1', unit: 'V' },
  { name: '/INV/ACPORT/STAT/VRMS_L2N', label: 'Grid V L2', unit: 'V' },
  { name: '/INV/ACPORT/STAT/IRMS_L1', label: 'Grid I L1', unit: 'A' },
  { name: '/INV/ACPORT/STAT/IRMS_L2', label: 'Grid I L2', unit: 'A' },
  { name: '/INV/ACPORT/STAT/FREQ_TOTAL', label: 'Grid Frequency', unit: 'Hz' },
  // Battery 1
  { name: '/BMS/MODULE1/STAT/V', label: 'Bat 1 Voltage', unit: 'V' },
  { name: '/BMS/MODULE1/STAT/I', label: 'Bat 1 Current', unit: 'A' },
  { name: '/BMS/MODULE1/STAT/USER_SOC', label: 'Bat 1 SoC', unit: '%' },
  { name: '/BMS/MODULE1/STAT/TEMP', label: 'Bat 1 Temp', unit: '°C' },
  // Battery 2
  { name: '/BMS/MODULE2/STAT/V', label: 'Bat 2 Voltage', unit: 'V' },
  { name: '/BMS/MODULE2/STAT/I', label: 'Bat 2 Current', unit: 'A' },
  { name: '/BMS/MODULE2/STAT/USER_SOC', label: 'Bat 2 SoC', unit: '%' },
  { name: '/BMS/MODULE2/STAT/TEMP', label: 'Bat 2 Temp', unit: '°C' },
  // Battery 3
  { name: '/BMS/MODULE3/STAT/V', label: 'Bat 3 Voltage', unit: 'V' },
  { name: '/BMS/MODULE3/STAT/I', label: 'Bat 3 Current', unit: 'A' },
  { name: '/BMS/MODULE3/STAT/USER_SOC', label: 'Bat 3 SoC', unit: '%' },
  { name: '/BMS/MODULE3/STAT/TEMP', label: 'Bat 3 Temp', unit: '°C' },
  // Load (matching InstantaneousGauges)
  { name: '/SYS/MEAS/STAT/PANEL/VRMS_L1N', label: 'Load V L1', unit: 'V' },
  { name: '/SYS/MEAS/STAT/PANEL/VRMS_L2N', label: 'Load V L2', unit: 'V' },
  { name: '/SYS/MEAS/STAT/LOAD/IRMS_L1', label: 'Load I L1', unit: 'A' },
  { name: '/SYS/MEAS/STAT/LOAD/IRMS_L2', label: 'Load I L2', unit: 'A' },
  { name: '/SYS/MEAS/STAT/PANEL/FREQ_TOTAL', label: 'Load Frequency', unit: 'Hz' },
];

// Inverter mode mapping (must match InverterModeDisplay.tsx)
const INVERTER_MODES: Record<number, string> = {
  [-1]: 'INVALID',
  0: 'UNDEFINED',
  1: 'OFFLINE',
  2: 'DISABLED',
  3: 'STANDBY',
  4: 'NORMAL',
  5: 'LIMP MODE',
  6: 'FAULT (AUTO)',
  7: 'FAULT (MANUAL)',
  8: 'FW UPDATE',
  9: 'SELF TEST',
};

// BGCS Relay status mapping (must match BgcsRelayStatusDisplay.tsx)
const BGCS_RELAY_STATES: Record<number, string> = {
  [-1]: 'INVALID',
  0: 'UNDEFINED',
  1: 'OPEN',
  2: 'CLOSED',
  3: 'FAULTED_OPEN',
  4: 'FAULTED_CLOSED',
  5: 'OVERRIDE_OPEN',
  6: 'OVERRIDE_CLOSED',
  7: 'ESTOP_OPEN',
  8: 'ESTOP_CLOSED',
};

// Helper to escape KQL strings
function escapeKqlString(s: string): string {
  return (s ?? '').replace(/'/g, "''");
}

// Build KQL query for a single telemetry value
function buildTelemetryKql(serial: string, telemetryName: string): string {
  const s = escapeKqlString(serial);
  return `
    let s = '${s}';
    Telemetry
    | where comms_serial has s
    | where name has '${telemetryName}'
    | top 1 by localtime desc
    | project localtime, value_double
  `.trim();
}

interface ThresholdConfig {
  thresholds: ThresholdMap;
  signalToKey: Map<string, string>;
  missingText: string;
}

// Resolves the administrator-configured thresholds and the ADX signal -> metric
// key index so PDF rows can be evaluated exactly like the history charts.
async function loadThresholdConfig(): Promise<ThresholdConfig> {
  try {
    const [effective, catalog] = await Promise.all([fetchEffectiveThresholds(), fetchMetricCatalog()]);
    const signalToKey = new Map<string, string>();
    catalog.forEach(entry => {
      if (entry.telemetry_name) signalToKey.set(entry.telemetry_name.toLowerCase(), entry.key);
    });
    return {
      thresholds: effective.thresholds ?? {},
      signalToKey,
      missingText: effective.missing_threshold_text || MISSING_THRESHOLD_TEXT,
    };
  } catch (err) {
    console.warn('Threshold configuration unavailable for PDF export:', err);
    return { thresholds: {}, signalToKey: new Map(), missingText: MISSING_THRESHOLD_TEXT };
  }
}

const DashboardPDFExport: React.FC<DashboardPDFExportProps> = ({
  deviceInfo,
  filename = 'dashboard-report',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');

  const fetchTelemetryData = async (serial: string): Promise<Map<string, TelemetryValue>> => {
    const results = new Map<string, TelemetryValue>();
    
    // Initialize all with null values first
    TELEMETRY_NAMES.forEach(config => {
      results.set(config.name, {
        label: config.label,
        value: null,
        numeric: null,
        unit: config.unit,
        localtime: null
      });
    });
    
    try {
      // Fetch telemetry using individual KQL queries (same approach as InstantaneousGauges)
      // We'll batch the requests in parallel for speed
      const fetchPromises = TELEMETRY_NAMES.map(async (config) => {
        try {
          const kql = buildTelemetryKql(serial, config.name);
          const response = await api.post('/query_adx/', { kql });
          
          const dataArray = Array.isArray(response.data?.data) ? response.data.data : [];
          const row = dataArray[0];
          
          let displayValue: string | number | null = null;
          let numericValue: number | null = null;
          const localtime = row?.localtime ?? null;
          
          if (row?.value_double !== undefined && row?.value_double !== null) {
            const numValue = Number(row.value_double);
            numericValue = Number.isFinite(numValue) ? numValue : null;
            
            // Special handling for inverter mode
            if (config.name.includes('OPERATING_STATE')) {
              displayValue = INVERTER_MODES[numValue] || `Mode ${numValue}`;
            } 
            // Special handling for BGCS relay status
            else if (config.name.includes('RELAY_STATUS')) {
              displayValue = BGCS_RELAY_STATES[numValue] || `State ${numValue}`;
            } else {
              // Round to appropriate decimals
              displayValue = config.unit === 'A' || config.unit === 'Hz' 
                ? numValue.toFixed(2) 
                : numValue.toFixed(1);
            }
          }
          
          results.set(config.name, {
            label: config.label,
            value: displayValue,
            numeric: numericValue,
            unit: config.unit,
            localtime: localtime
          });
        } catch (err) {
          console.warn(`Failed to fetch ${config.name}:`, err);
        }
      });
      
      // Wait for all telemetry fetches to complete
      await Promise.all(fetchPromises);
      
      console.log('PDF Export - Fetched telemetry values:', Object.fromEntries(results));
      
    } catch (error) {
      console.error('Failed to fetch telemetry for PDF:', error);
    }
    
    return results;
  };

  const exportToPDF = useCallback(async () => {
    if (!deviceInfo.serial) {
      alert('No device selected. Please select a device first.');
      return;
    }

    setIsExporting(true);
    setProgress('Fetching telemetry data...');

    try {
      // Fetch current telemetry values plus the configured thresholds. The PDF
      // is evaluated against exactly the same thresholds as the history charts
      // (FR-017); if the configuration cannot be read we fall back to an empty
      // map so every metric reports "Threshold needs to be defined.".
      const [telemetryData, thresholdConfig] = await Promise.all([
        fetchTelemetryData(deviceInfo.serial),
        loadThresholdConfig(),
      ]);
      const { thresholds, signalToKey, missingText } = thresholdConfig;

      const thresholdFor = (telemetryName: string): Threshold | null => {
        const key = signalToKey.get(telemetryName.toLowerCase());
        return (key && thresholds[key]) || null;
      };

      const evaluation = { passed: 0, failed: 0, unknown: 0 } as Record<ThresholdStatus, number>;
      TELEMETRY_NAMES.forEach(config => {
        const status = classifyValue(telemetryData.get(config.name)?.numeric ?? null, thresholdFor(config.name));
        evaluation[status] += 1;
      });

      setProgress('Generating PDF...');

      // Create PDF in portrait A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 0;

      // ============================================
      // Header Banner
      // ============================================
      pdf.setFillColor(61, 205, 88);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('V1 Prosumer Analytics Report', margin, 16);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleString();
      pdf.text(dateStr, pageWidth - margin - 40, 16);

      yPos = 35;

      // ============================================
      // Device Information Section
      // ============================================
      pdf.setTextColor(61, 205, 88);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Device Information', margin, yPos);
      
      yPos += 2;
      pdf.setDrawColor(61, 205, 88);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      yPos += 6;

      // Device info in two columns
      pdf.setFontSize(9);
      const col1X = margin;
      const col2X = margin + 55;
      const col3X = margin + 100;
      const col4X = margin + 145;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      pdf.text('Serial:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text(deviceInfo.serial || 'N/A', col2X, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      pdf.text('Firmware:', col3X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text(deviceInfo.firmware || 'N/A', col4X, yPos);

      yPos += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      pdf.text('MAC:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text(deviceInfo.mac || 'N/A', col2X, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      pdf.text('Last Seen:', col3X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text(deviceInfo.lastSeen || 'N/A', col4X, yPos);

      yPos += 10;

      // ============================================
      // Threshold evaluation summary
      // ============================================
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      pdf.text('Thresholds:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text(
        `${evaluation.passed} passed  /  ${evaluation.failed} failed  /  ${evaluation.unknown} unknown`,
        col2X,
        yPos,
      );

      yPos += 10;

      // ============================================
      // Helper function to draw a data table
      // ============================================
      interface TableRow {
        label: string;
        value: string | number | null;
        unit: string;
        telemetryName?: string;
      }

      const drawDataTable = (title: string, data: TableRow[], color: string) => {
        // Section header
        pdf.setFillColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
        pdf.rect(margin, yPos - 3, contentWidth, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin + 3, yPos + 1);
        yPos += 8;

        // Data rows
        pdf.setFontSize(9);
        const colWidth = contentWidth / 4;
        const rowHeight = 17;
        let colIndex = 0;

        data.forEach((item) => {
          const x = margin + (colIndex * colWidth);
          
          if (colIndex === 0 && yPos > pageHeight - 28) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(item.label + ':', x, yPos);
          
          pdf.setFont('helvetica', 'bold');
          if (item.value !== null && item.value !== undefined) {
            pdf.setTextColor(40, 40, 40);
            pdf.text(`${item.value} ${item.unit}`, x, yPos + 4);
          } else {
            pdf.setTextColor(180, 180, 180);
            pdf.text('N/A', x, yPos + 4);
          }

          // Threshold band and Passed / Failed / Unknown verdict (FR-017)
          const threshold = item.telemetryName ? thresholdFor(item.telemetryName) : null;
          const numeric = item.telemetryName ? telemetryData.get(item.telemetryName)?.numeric ?? null : null;
          const status = classifyValue(numeric, threshold);

          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(120, 120, 120);
          pdf.text(formatThreshold(threshold, missingText).slice(0, 34), x, yPos + 8);

          const statusColor = status === 'passed'
            ? [34, 197, 94]
            : status === 'failed'
              ? [239, 68, 68]
              : [148, 163, 184];
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.text(STATUS_LABELS[status].toUpperCase(), x, yPos + 12);

          colIndex++;
          if (colIndex >= 4) {
            colIndex = 0;
            yPos += rowHeight;
          }
        });

        if (colIndex !== 0) {
          yPos += rowHeight;
        }
        yPos += 3;
      };

      const toTableRow = (telemetryName: string): TableRow => {
        const item = telemetryData.get(telemetryName);
        return {
          label: item?.label || '',
          value: item?.value ?? null,
          unit: item?.unit || '',
          telemetryName,
        };
      };

      // ============================================
      // System Status
      // ============================================
      const wifiSignal = telemetryData.get('/SCC/WIFI/STAT/SIGNAL_STRENGTH');
      const invMode = telemetryData.get('INV/DEV/STAT/OPERATING_STATE');
      const bgcsRelay = telemetryData.get('/BGCS/GRID/STAT/RELAY_STATUS');
      
      // Get the most recent localtime from any telemetry value
      let latestLocaltime: string | null = null;
      telemetryData.forEach((val) => {
        if (val.localtime && (!latestLocaltime || val.localtime > latestLocaltime)) {
          latestLocaltime = val.localtime;
        }
      });
      
      // Calculate WiFi signal quality (same algorithm as AnalogNeedleGauge)
      // WiFi ranges from -100 dBm (min) to 0 dBm (max)
      const getWifiQuality = (dbm: number | null): string => {
        if (dbm === null || dbm === undefined) return 'Unknown';
        if (dbm === 0) return 'Error';  // 0 dBm is error condition
        // Convert dBm to percentage: -100 to 0 maps to 0% to 100%
        const percentage = Math.max(0, Math.min(100, ((dbm - (-100)) / (0 - (-100))) * 100));
        if (percentage >= 75) return 'Excellent';
        if (percentage >= 50) return 'Good';
        if (percentage >= 25) return 'Fair';
        return 'Poor';
      };
      
      const wifiDbm = wifiSignal?.value !== null ? Number(wifiSignal?.value) : null;
      const connectionStatus = getWifiQuality(wifiDbm);
      
      // Use raw KQL timestamp without browser conversion
      const dataTimestamp = latestLocaltime
      ? new Date(latestLocaltime).toLocaleString('en-US', { timeZone: 'America/New_York' })
      : 'N/A';
      drawDataTable('System Status', [
        { label: 'WiFi Signal', value: wifiSignal?.value ?? null, unit: wifiSignal?.unit || 'dBm', telemetryName: '/SCC/WIFI/STAT/SIGNAL_STRENGTH' },
        { label: 'Inverter Mode', value: invMode?.value ?? null, unit: '', telemetryName: 'INV/DEV/STAT/OPERATING_STATE' },
        { label: 'BGCS Relay', value: bgcsRelay?.value ?? null, unit: '', telemetryName: '/BGCS/GRID/STAT/RELAY_STATUS' },
        { label: 'Connection', value: connectionStatus, unit: '' },
        { label: 'Data Timestamp', value: dataTimestamp, unit: '' },
      ], '#3b82f6');

      // ============================================
      // Solar PV
      // ============================================
      const pvData = [
        '/INV/DCPORT/STAT/PV1/V',
        '/INV/DCPORT/STAT/PV2/V',
        '/INV/DCPORT/STAT/PV3/V',
        '/INV/DCPORT/STAT/PV4/V',
        '/INV/DCPORT/STAT/PV1/I',
        '/INV/DCPORT/STAT/PV2/I',
        '/INV/DCPORT/STAT/PV3/I',
        '/INV/DCPORT/STAT/PV4/I',
      ].map(toTableRow);
      
      drawDataTable('Solar PV Inputs', pvData, '#f59e0b');

      // ============================================
      // Grid Measurements
      // ============================================
      const gridData = [
        '/INV/ACPORT/STAT/VRMS_L1N',
        '/INV/ACPORT/STAT/VRMS_L2N',
        '/INV/ACPORT/STAT/IRMS_L1',
        '/INV/ACPORT/STAT/IRMS_L2',
        '/INV/ACPORT/STAT/FREQ_TOTAL',
      ].map(toTableRow);
      
      drawDataTable('Grid Measurements', gridData, '#10b981');

      // ============================================
      // Battery Module 1
      // ============================================
      const bat1Data = [
        '/BMS/MODULE1/STAT/V',
        '/BMS/MODULE1/STAT/I',
        '/BMS/MODULE1/STAT/USER_SOC',
        '/BMS/MODULE1/STAT/TEMP',
      ].map(toTableRow);
      
      drawDataTable('Battery Module 1', bat1Data, '#ef4444');

      // ============================================
      // Battery Module 2
      // ============================================
      const bat2Data = [
        '/BMS/MODULE2/STAT/V',
        '/BMS/MODULE2/STAT/I',
        '/BMS/MODULE2/STAT/USER_SOC',
        '/BMS/MODULE2/STAT/TEMP',
      ].map(toTableRow);
      
      drawDataTable('Battery Module 2', bat2Data, '#dc2626');

      // ============================================
      // Battery Module 3
      // ============================================
      const bat3Data = [
        '/BMS/MODULE3/STAT/V',
        '/BMS/MODULE3/STAT/I',
        '/BMS/MODULE3/STAT/USER_SOC',
        '/BMS/MODULE3/STAT/TEMP',
      ].map(toTableRow);
      
      drawDataTable('Battery Module 3', bat3Data, '#b91c1c');

      // ============================================
      // Load Measurements (using correct telemetry names from InstantaneousGauges)
      // ============================================
      const loadData = [
        '/SYS/MEAS/STAT/PANEL/VRMS_L1N',
        '/SYS/MEAS/STAT/PANEL/VRMS_L2N',
        '/SYS/MEAS/STAT/LOAD/IRMS_L1',
        '/SYS/MEAS/STAT/LOAD/IRMS_L2',
        '/SYS/MEAS/STAT/PANEL/FREQ_TOTAL',
      ].map(toTableRow);
      
      drawDataTable('Load Measurements', loadData, '#8b5cf6');

      // ============================================
      // Footer
      // ============================================
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Page ${i} of ${pageCount}  |  ${deviceInfo.serial}  |  Generated: ${dateStr}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      // Save the PDF
      const finalFilename = `${filename}_${deviceInfo.serial}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(finalFilename);

      setProgress('');
      setTimeout(() => {
        setIsExporting(false);
      }, 500);

    } catch (error) {
      console.error('PDF export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to export PDF: ${errorMessage}`);
      setIsExporting(false);
      setProgress('');
    }
  }, [deviceInfo, filename]);

  return (
    <button
      onClick={exportToPDF}
      disabled={isExporting || !deviceInfo.serial}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        background: isExporting || !deviceInfo.serial
          ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
          : 'linear-gradient(135deg, #3dcd58 0%, #22c55e 100%)',
        color: 'white',
        fontSize: '14px',
        fontWeight: 600,
        cursor: isExporting || !deviceInfo.serial ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '140px',
        justifyContent: 'center',
        opacity: !deviceInfo.serial ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isExporting && deviceInfo.serial) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
      title={!deviceInfo.serial ? 'Select a device first' : 'Export dashboard report as PDF'}
    >
      {isExporting ? (
        <>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
          <span>{progress || 'Exporting...'}</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>Export PDF</span>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default DashboardPDFExport;
