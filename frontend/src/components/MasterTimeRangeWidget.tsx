// src/components/MasterTimeRangeWidget.tsx
// Master widget to control global time range for all historical widgets
// Features:
// - Quick preset buttons (15m, 1h, 6h, 12h, 24h, 3d, 7d)
// - Custom date range picker
// - Visual indicator showing current selection
// - Refresh all widgets button

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTimeRange, getPresetLabel, type TimeRangePreset } from '../context/TimeRangeContext';

// ============================================================================
// Preset Buttons Configuration
// ============================================================================

const PRESETS: { value: TimeRangePreset; label: string; shortLabel: string }[] = [
  { value: '15m', label: 'Last 15 min', shortLabel: '15m' },
  { value: '1h', label: 'Last 1 hour', shortLabel: '1h' },
  { value: '6h', label: 'Last 6 hours', shortLabel: '6h' },
  { value: '12h', label: 'Last 12 hours', shortLabel: '12h' },
  { value: '24h', label: 'Last 24 hours', shortLabel: '24h' },
  { value: '3d', label: 'Last 3 days', shortLabel: '3d' },
  { value: '7d', label: 'Last 7 days', shortLabel: '7d' },
];

// ============================================================================
// Component
// ============================================================================

const MasterTimeRangeWidget: React.FC = () => {
  const { globalTimeRange, setGlobalTimeRange, applyPreset } = useTimeRange();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(globalTimeRange.startDate);
  const [customEnd, setCustomEnd] = useState<Date | null>(globalTimeRange.endDate);

  const handlePresetClick = (preset: TimeRangePreset) => {
    setShowCustomPicker(false);
    applyPreset(preset);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd && customEnd > customStart) {
      setGlobalTimeRange({
        startDate: customStart,
        endDate: customEnd,
        preset: 'custom',
      });
      setShowCustomPicker(false);
    }
  };

  const formatDateRange = () => {
    const start = globalTimeRange.startDate;
    const end = globalTimeRange.endDate;
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return `${start.toLocaleDateString(undefined, formatOptions)} → ${end.toLocaleDateString(undefined, formatOptions)}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
      borderRadius: '16px',
      border: '1px solid var(--border-medium)',
      padding: '20px',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            🕐
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              Historical Data Time Range
            </h3>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-tertiary)',
            }}>
              Controls all historical charts below • Individual widgets can override
            </p>
          </div>
        </div>

        {/* Current Selection Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #8b5cf620 0%, #6366f120 100%)',
          borderRadius: '20px',
          border: '1px solid #8b5cf640',
        }}>
          <span style={{ fontSize: '14px' }}>📅</span>
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#a78bfa',
          }}>
            {globalTimeRange.preset !== 'custom' 
              ? getPresetLabel(globalTimeRange.preset)
              : formatDateRange()
            }
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: showCustomPicker ? '16px' : '0',
      }}>
        {PRESETS.map(({ value, shortLabel }) => (
          <button
            key={value}
            onClick={() => handlePresetClick(value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: globalTimeRange.preset === value
                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                : 'var(--bg-input)',
              color: globalTimeRange.preset === value ? 'white' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: globalTimeRange.preset === value 
                ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
                : 'none',
            }}
          >
            {shortLabel}
          </button>
        ))}
        
        {/* Custom Button */}
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: showCustomPicker || globalTimeRange.preset === 'custom'
              ? '2px solid #8b5cf6'
              : '1px dashed var(--border-subtle)',
            background: globalTimeRange.preset === 'custom'
              ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
              : 'transparent',
            color: globalTimeRange.preset === 'custom' ? 'white' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📆</span>
          Custom
        </button>
      </div>

      {/* Custom Date Picker (Expandable) */}
      {showCustomPicker && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: '16px',
          padding: '16px',
          background: 'var(--bg-input)',
          borderRadius: '12px',
          marginTop: '12px',
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              marginBottom: '6px',
            }}>
              Start Date & Time
            </label>
            <DatePicker
              selected={customStart}
              onChange={(date) => setCustomStart(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMM d, yyyy HH:mm"
              maxDate={customEnd || new Date()}
              className="time-range-datepicker"
              wrapperClassName="time-range-datepicker-wrapper"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              marginBottom: '6px',
            }}>
              End Date & Time
            </label>
            <DatePicker
              selected={customEnd}
              onChange={(date) => setCustomEnd(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMM d, yyyy HH:mm"
              minDate={customStart || undefined}
              maxDate={new Date()}
              className="time-range-datepicker"
              wrapperClassName="time-range-datepicker-wrapper"
            />
          </div>
          
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd || customEnd <= customStart}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: (!customStart || !customEnd || customEnd <= customStart)
                ? 'var(--bg-hover)'
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: (!customStart || !customEnd || customEnd <= customStart)
                ? 'var(--text-disabled)'
                : 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: (!customStart || !customEnd || customEnd <= customStart)
                ? 'not-allowed'
                : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Inline styles for date picker */}
      <style>{`
        .time-range-datepicker {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-size: 13px;
          width: 180px;
          outline: none;
        }
        .time-range-datepicker:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        .react-datepicker {
          font-family: inherit;
          background: var(--bg-elevated);
          border: 1px solid var(--border-medium);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        .react-datepicker__header {
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker__day-name {
          color: var(--text-primary);
        }
        .react-datepicker__day {
          color: var(--text-secondary);
        }
        .react-datepicker__day:hover {
          background: var(--bg-hover);
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background: #8b5cf6 !important;
          color: white !important;
        }
        .react-datepicker__time-container {
          border-left: 1px solid var(--border-subtle);
        }
        .react-datepicker__time-list-item {
          color: var(--text-secondary);
        }
        .react-datepicker__time-list-item:hover {
          background: var(--bg-hover) !important;
        }
        .react-datepicker__time-list-item--selected {
          background: #8b5cf6 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default MasterTimeRangeWidget;
