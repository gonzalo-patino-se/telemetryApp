// src/components/TimezoneSelector.tsx
// ---------------------------------------------------------------------------
// Global timezone display control: UTC / Browser Local / Customer Site.
// When "Customer Site" is selected, a ZIP/postal code input appears; the code
// is resolved to an IANA timezone via the backend and reused by the Weather
// card. Clearly indicates the active timezone mode.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useTimezone } from '../context/TimezoneContext';
import type { TimezoneMode } from '../utils/timezone';

const MODES: { value: TimezoneMode; label: string; hint: string }[] = [
  { value: 'utc', label: 'UTC', hint: 'Raw UTC time' },
  { value: 'browser', label: 'Local', hint: 'Your browser timezone' },
  { value: 'site', label: 'Customer Site', hint: "Customer site local time (by ZIP)" },
];

// Common Zippopotam.us-supported countries (ISO-2, lowercase). Postal-code
// formats vary by country, so the country must be selectable — it's not
// US-only.
const COUNTRIES: { code: string; label: string }[] = [
  { code: 'us', label: 'United States' },
  { code: 'ca', label: 'Canada' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'de', label: 'Germany' },
  { code: 'fr', label: 'France' },
  { code: 'es', label: 'Spain' },
  { code: 'it', label: 'Italy' },
  { code: 'nl', label: 'Netherlands' },
  { code: 'be', label: 'Belgium' },
  { code: 'ch', label: 'Switzerland' },
  { code: 'at', label: 'Austria' },
  { code: 'pt', label: 'Portugal' },
  { code: 'se', label: 'Sweden' },
  { code: 'dk', label: 'Denmark' },
  { code: 'no', label: 'Norway' },
  { code: 'fi', label: 'Finland' },
  { code: 'pl', label: 'Poland' },
  { code: 'au', label: 'Australia' },
  { code: 'nz', label: 'New Zealand' },
  { code: 'mx', label: 'Mexico' },
  { code: 'br', label: 'Brazil' },
  { code: 'in', label: 'India' },
  { code: 'jp', label: 'Japan' },
];

/** Placeholder hint tailored to the selected country's postal-code style. */
function zipPlaceholder(country: string): string {
  switch (country) {
    case 'ca':
      return 'e.g. K1A 0B1';
    case 'gb':
      return 'e.g. SW1A 1AA';
    case 'nl':
      return 'e.g. 1011';
    case 'jp':
      return 'e.g. 100-0001';
    default:
      return 'Postal / ZIP code';
  }
}

const TimezoneSelector: React.FC = () => {
  const {
    mode,
    setMode,
    zip,
    country,
    setZipCountry,
    siteTimeZone,
    siteLocation,
    resolving,
    resolveError,
    activeLabel,
  } = useTimezone();

  const [zipDraft, setZipDraft] = useState(zip);
  const [countryDraft, setCountryDraft] = useState(country);

  const showZipInput = mode === 'site';

  const applyZip = () => {
    const z = zipDraft.trim();
    if (z) setZipCountry(z, countryDraft.trim() || 'us');
  };

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🌐</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Timezone
        </span>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {MODES.map(m => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            title={m.hint}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background:
                mode === m.value
                  ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
                  : 'var(--bg-input)',
              color: mode === m.value ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow:
                mode === m.value ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ZIP entry (only for Customer Site mode) */}
      {showZipInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            value={zipDraft}
            onChange={e => setZipDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') applyZip();
            }}
            placeholder={zipPlaceholder(countryDraft)}
            aria-label="Customer postal or ZIP code"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 13,
              width: 150,
              outline: 'none',
            }}
          />
          <select
            value={countryDraft}
            onChange={e => setCountryDraft(e.target.value)}
            aria-label="Country"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 13,
              maxWidth: 170,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code.toUpperCase()})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyZip}
            disabled={!zipDraft.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: zipDraft.trim()
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'var(--bg-hover)',
              color: zipDraft.trim() ? 'white' : 'var(--text-disabled)',
              fontSize: 13,
              fontWeight: 600,
              cursor: zipDraft.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Set
          </button>
        </div>
      )}

      {/* Active status */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 20,
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Showing: {activeLabel}
        </span>
        {mode === 'site' && (
          <span style={{ color: 'var(--text-tertiary)' }}>
            {resolving
              ? '· resolving…'
              : resolveError
                ? `· ${resolveError}`
                : siteTimeZone
                  ? `· ${siteLocation?.place || ''}${
                      siteLocation?.state ? ', ' + siteLocation.state : ''
                    } (${siteTimeZone})`
                  : '· enter a ZIP code'}
          </span>
        )}
      </div>
    </div>
  );
};

export default TimezoneSelector;
