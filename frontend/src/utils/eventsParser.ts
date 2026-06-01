// src/utils/eventsParser.ts
//
// Dedicated parser for Alarms / Events rows returned by the Azure Data
// Explorer proxy at POST /query_adx/.
//
// Real wire shape (captured 2026-06-01 from the production ADX cluster):
//
//   {
//     "localtime":    "2026-05-31 23:30:02+00:00",   // space-separated, with offset
//     "utctime":      "2026-06-01 06:30:02+00:00",
//     "comms_serial": "1C2422V00047",
//     "name":         "/INV/ACPORT/EVENT/ALARM/DC_DISCONNECT",
//     "value":        "1",                            // STRING, not number
//     ...
//   }
//
// Why a dedicated parser:
//   1. `new Date("2026-05-31 23:30:02+00:00")` is implementation-defined.
//      Chrome accepts it, Firefox/Safari return `Invalid Date`. We must
//      normalize to ISO-8601 ("T" separator) before handing to `Date`.
//   2. The existing `parseAdxLocaltime` helper assumes `T`-separated ISO
//      and silently drops the time when given the space-separated form.
//   3. `value` is a string. KQL filters that test `value == 1` work by
//      coercion but the UI must not assume numeric. We expose both the raw
//      text and a parsed numeric form.
//   4. `name` is a hierarchical code path. Severity belongs in segment[3]
//      (ALARM / WARN / INFO / FAULT / ERROR) -- substring matching on the
//      whole string gives wrong/accidental answers for codes like
//      "CHARGE_ALLOWED" or "DC_DISCONNECT".

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type EventSeverity = 'critical' | 'warning' | 'info';

/** Active / Cleared / Unknown -- mapped from the raw value column. */
export type EventState = 'active' | 'cleared' | 'unknown';

export interface ParsedEventName {
  /** Original raw name as returned by ADX. */
  raw: string;
  /** Path segments excluding empty strings (e.g. ["INV","ACPORT","EVENT","ALARM","DC_DISCONNECT"]). */
  segments: string[];
  /** Last segment -- the actual alarm code (e.g. "DC_DISCONNECT"). */
  code: string;
  /** Segment that conventionally carries severity (e.g. "ALARM"), or "" if absent. */
  severityBucket: string;
  /** Breadcrumb of segments leading up to the code (e.g. "INV / ACPORT / EVENT"). */
  breadcrumb: string;
  /**
   * Human-friendly label combining the code (snake_case → "Snake Case") with
   * a "/"-joined breadcrumb, suitable for chart labels and tooltips.
   */
  pretty: string;
}

export interface ParsedEventValue {
  /** Raw value exactly as received (string, number, null, ...). */
  raw: unknown;
  /** Numeric coercion, or null if not a finite number. */
  numeric: number | null;
  /** Normalized state: 1 → active, 0 → cleared, otherwise unknown. */
  state: EventState;
  /** Display label for the value column ("Active" / "Cleared" / raw). */
  label: string;
}

export interface NormalizedEvent {
  /** Epoch ms for sorting, charting and downstream date math. */
  timestamp: number;
  /** ISO-8601 string for stable React keys / CSV exports. */
  isoTimestamp: string;
  name: ParsedEventName;
  value: ParsedEventValue;
  severity: EventSeverity;
  /** Original row (untouched) for debugging / fall-through rendering. */
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Timestamp parsing
// ---------------------------------------------------------------------------

/**
 * Convert ADX-style timestamp strings to epoch ms in a way that is consistent
 * across Chrome / Firefox / Safari / Node.
 *
 * Accepts:
 *   - Numbers (epoch ms or epoch s, auto-detected by magnitude).
 *   - `Date` instances.
 *   - ISO-8601 strings ("YYYY-MM-DDTHH:MM:SS[.fff][Z|±HH:MM]").
 *   - ADX space-separated strings ("YYYY-MM-DD HH:MM:SS[.fffffff][±HH:MM]").
 *   - US locale strings ("M/D/YYYY, H:MM:SS AM/PM") -- inherited from
 *     `parseAdxLocaltime`, occasionally produced by older mocks.
 *
 * Returns `null` when the input cannot be parsed -- callers should drop
 * rows with null timestamps rather than render `Invalid Date`.
 */
export function parseEventTimestamp(raw: unknown): number | null {
  if (raw == null) return null;

  // Numeric input: distinguish seconds vs. milliseconds by magnitude.
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1e12 ? raw : raw * 1000;
  }
  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof raw !== 'string') return null;

  const s = raw.trim();
  if (!s) return null;

  // US locale form: "3/11/2025, 10:45:01 AM"
  if (s.includes('/') && s.includes(',')) {
    const [datePart, timePart = ''] = s.split(', ');
    const [m, d, y] = datePart.split('/').map(Number);
    const match = timePart.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
    if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(y)) return null;
    let hh = match ? parseInt(match[1], 10) : 0;
    const mm = match ? parseInt(match[2], 10) : 0;
    const ss = match && match[3] ? parseInt(match[3], 10) : 0;
    const ampm = match?.[4]?.toUpperCase();
    if (ampm === 'PM' && hh !== 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    const t = new Date(y, m - 1, d, hh, mm, ss).getTime();
    return Number.isFinite(t) ? t : null;
  }

  // Normalize ADX "YYYY-MM-DD HH:MM:SS[.fffffff][±HH:MM]" to ISO-8601.
  //   - Replace first space with 'T' so `Date` parses it as ISO.
  //   - Trim fractional seconds to 3 digits (JS only supports milliseconds).
  //   - Leave timezone offset untouched; if absent, treat the value as UTC
  //     (the ADX cluster stores both `localtime` and `utctime`, and rows we
  //     have inspected always include a "+HH:MM" offset on `localtime`).
  let iso = s;
  const spaceIdx = iso.indexOf(' ');
  const tIdx = iso.indexOf('T');
  if (spaceIdx > 0 && (tIdx === -1 || spaceIdx < tIdx)) {
    iso = iso.slice(0, spaceIdx) + 'T' + iso.slice(spaceIdx + 1);
  }
  iso = iso.replace(/(\.\d{3})\d+/, '$1'); // trim fractional seconds
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso)) {
    iso += 'Z';
  }
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/** Convenience: return an ISO-8601 UTC string, or null if unparseable. */
export function toIsoTimestamp(raw: unknown): string | null {
  const t = parseEventTimestamp(raw);
  return t == null ? null : new Date(t).toISOString();
}

// ---------------------------------------------------------------------------
// Value parsing
// ---------------------------------------------------------------------------

/**
 * Map an ADX `value` column into a structured form. The wire type is
 * inconsistent (sometimes `"1"`, sometimes `1`, sometimes `null`); the UI
 * needs a stable shape.
 */
export function parseEventValue(raw: unknown): ParsedEventValue {
  let numeric: number | null = null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    numeric = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed !== '') {
      const n = Number(trimmed);
      if (Number.isFinite(n)) numeric = n;
    }
  } else if (typeof raw === 'boolean') {
    numeric = raw ? 1 : 0;
  }

  let state: EventState = 'unknown';
  let label = raw == null || raw === '' ? '—' : String(raw);
  if (numeric === 1) {
    state = 'active';
    label = 'Active';
  } else if (numeric === 0) {
    state = 'cleared';
    label = 'Cleared';
  } else if (numeric != null) {
    label = String(numeric);
  }

  return { raw, numeric, state, label };
}

// ---------------------------------------------------------------------------
// Name + severity parsing
// ---------------------------------------------------------------------------

const CRITICAL_BUCKETS = new Set(['FAULT', 'ERROR', 'CRITICAL', 'EMERG', 'EMERGENCY', 'TRIP']);
const WARNING_BUCKETS = new Set(['ALARM', 'WARN', 'WARNING']);
const INFO_BUCKETS = new Set(['INFO', 'STATUS', 'EVENT', 'NOTICE', 'DEBUG']);

// Substring fallback for free-form names that don't follow the slash layout.
// No `\b` word boundaries: CamelCase names like "CriticalFailure" have no
// word boundary between the tokens, so we match case-insensitive substrings
// instead.
const CRITICAL_RX = /(fault|failure|critical|emergency|trip|fatal)/i;
const WARNING_RX = /(warn|alarm|degrad|over[a-z]+|under[a-z]+|out[_ -]?of[_ -]?range)/i;

/**
 * Split a hierarchical alarm name like `/INV/ACPORT/EVENT/ALARM/DC_DISCONNECT`
 * into its segments and derive a display-friendly form.
 *
 * Accepts non-slash names by returning a single-segment result whose `code`
 * is the original string -- the UI then falls back to substring severity.
 */
export function parseEventName(raw: unknown): ParsedEventName {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    return {
      raw: '',
      segments: [],
      code: '(unnamed)',
      severityBucket: '',
      breadcrumb: '',
      pretty: '(unnamed)',
    };
  }

  const segments = text.split('/').filter(s => s.length > 0);
  const code = segments.length > 0 ? segments[segments.length - 1] : text;
  // Severity bucket is conventionally the segment immediately before the
  // code (e.g. ".../EVENT/ALARM/DC_DISCONNECT"). We scan from the right for
  // the first known bucket token so the layout can vary.
  let severityBucket = '';
  for (let i = segments.length - 2; i >= 0; i--) {
    const seg = segments[i].toUpperCase();
    if (
      CRITICAL_BUCKETS.has(seg) ||
      WARNING_BUCKETS.has(seg) ||
      INFO_BUCKETS.has(seg)
    ) {
      severityBucket = seg;
      break;
    }
  }
  const breadcrumb = segments.slice(0, -1).join(' / ');
  const pretty = breadcrumb
    ? `${humanize(code)}  ·  ${breadcrumb}`
    : humanize(code);

  return { raw: text, segments, code, severityBucket, breadcrumb, pretty };
}

/** "SNAKE_case" / "snake_case" → "Snake Case". Leaves acronyms intact. */
function humanize(token: string): string {
  return token
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => {
      if (word.length <= 3) return word; // PV1, DC, AC, ID stay uppercase
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Resolve a structured severity from a parsed name. Uses the severity
 * bucket when available, otherwise falls back to substring matching against
 * the whole name (so free-form codes still produce a sensible bucket).
 */
export function severityFromName(name: string | ParsedEventName): EventSeverity {
  const parsed = typeof name === 'string' ? parseEventName(name) : name;
  const bucket = parsed.severityBucket;

  if (CRITICAL_BUCKETS.has(bucket)) return 'critical';
  if (WARNING_BUCKETS.has(bucket)) return 'warning';
  if (INFO_BUCKETS.has(bucket)) return 'info';

  // Free-form / non-slash names: substring fallback.
  const haystack = parsed.raw;
  if (CRITICAL_RX.test(haystack)) return 'critical';
  if (WARNING_RX.test(haystack)) return 'warning';
  return 'info';
}

// ---------------------------------------------------------------------------
// Row normalization
// ---------------------------------------------------------------------------

/**
 * Convert one raw ADX row into a `NormalizedEvent`, or return `null` when
 * the row is too broken to render (missing timestamp or missing name).
 *
 * Callers should `.map(normalizeAlarmRow).filter(Boolean)` to get a clean
 * list. Rejecting bad rows here keeps every downstream consumer (table,
 * aggregation chart, Pareto chart, CSV export) on the same page.
 */
export function normalizeAlarmRow(raw: unknown): NormalizedEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;

  // ADX rows sometimes use `utctime` instead of (or in addition to)
  // `localtime`. Prefer `localtime` to preserve the user's intent but fall
  // back so we don't silently drop rows from older schemas.
  const timestamp =
    parseEventTimestamp(row.localtime) ??
    parseEventTimestamp(row.utctime) ??
    parseEventTimestamp(row.timestamp);
  if (timestamp == null) return null;

  const name = parseEventName(row.name);
  if (!name.raw) return null;

  const value = parseEventValue(row.value);
  const severity = severityFromName(name);

  return {
    timestamp,
    isoTimestamp: new Date(timestamp).toISOString(),
    name,
    value,
    severity,
    raw: row,
  };
}

/** Bulk wrapper around `normalizeAlarmRow`. */
export function normalizeAlarmRows(rows: unknown): NormalizedEvent[] {
  if (!Array.isArray(rows)) return [];
  const out: NormalizedEvent[] = [];
  for (const r of rows) {
    const norm = normalizeAlarmRow(r);
    if (norm) out.push(norm);
  }
  return out;
}
