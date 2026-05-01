// src/components/CorrelationOverTime/Selector.tsx
// Compact "checkbox popover" selector used twice in the card toolbar.
//
// Two modes:
//   <Selector kind="signals" .../>   → static catalog from SIGNAL_CATALOG
//   <Selector kind="events"  availableItems={...} .../>
//                                     → dynamic list of fetched event names
//
// For events, `selectedIds` is treated as the SHOWN set (checked = visible).
// The card converts between this and its internal excluded-set state.

import React from 'react';
import { SIGNAL_CATALOG } from './signalCatalog';

type Kind = 'signals' | 'events';

interface Item {
  id: string;
  label: string;
  group?: string;
  color: string;
  /** Signal-only: SVG dasharray, undefined = solid. */
  dash?: string;
  /** Events-only: occurrence count chip suffix. */
  count?: number;
}

/** Public shape callers pass for the event mode. */
export interface SelectorEventItem {
  id: string;
  label: string;
  color: string;
  count?: number;
}

interface SelectorProps {
  kind: Kind;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Events-only: dynamic list discovered from the latest fetch. */
  availableItems?: SelectorEventItem[];
  /** Optional override label (e.g. "Events (3 of 12)"). */
  buttonLabel?: string;
}

function getSignalItems(): Item[] {
  return SIGNAL_CATALOG.map(s => ({
    id: s.id,
    label: s.label,
    group: s.group,
    color: s.color,
    dash: s.dash,
  }));
}

function groupBy(items: Item[]): Array<[string, Item[]]> {
  const map = new Map<string, Item[]>();
  for (const it of items) {
    const g = it.group ?? '';
    const arr = map.get(g);
    if (arr) arr.push(it);
    else map.set(g, [it]);
  }
  return Array.from(map.entries());
}

export const Selector: React.FC<SelectorProps> = ({
  kind,
  selectedIds,
  onChange,
  availableItems,
  buttonLabel,
}) => {
  const [open, setOpen] = React.useState(false);
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const items: Item[] = React.useMemo(() => {
    if (kind === 'signals') return getSignalItems();
    return (availableItems ?? []).map(e => ({
      id: e.id,
      label: e.label,
      color: e.color,
      count: e.count,
    }));
  }, [kind, availableItems]);

  const grouped = React.useMemo(() => groupBy(items), [items]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (popRef.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };

  const selectAll = () => onChange(items.map(i => i.id));
  const selectNone = () => onChange([]);

  const defaultLabel =
    kind === 'signals'
      ? `Signals (${selectedIds.length})`
      : `Events (${selectedIds.length}${items.length ? ` of ${items.length}` : ''})`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          fontSize: 11,
          padding: '4px 8px',
          borderRadius: 4,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {buttonLabel ?? defaultLabel} ▾
      </button>

      {open && (
        <div
          ref={popRef}
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 20,
            minWidth: 240,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            padding: 4,
            fontSize: 11,
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                padding: '8px 10px',
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
              }}
            >
              {kind === 'events'
                ? 'No events in the current time range.'
                : 'No items available.'}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '2px 4px 6px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 4,
                }}
              >
                <button
                  type="button"
                  onClick={selectAll}
                  style={miniBtnStyle}
                  aria-label="Select all"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={selectNone}
                  style={miniBtnStyle}
                  aria-label="Select none"
                >
                  None
                </button>
              </div>
              {grouped.map(([g, list]) => (
                <div key={g || '_'} style={{ padding: '2px 0' }}>
                  {g && (
                    <div
                      style={{
                        padding: '4px 8px',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: 10,
                      }}
                    >
                      {g}
                    </div>
                  )}
                  {list.map(it => {
                    const checked = selectedSet.has(it.id);
                    return (
                      <label
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 8px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          background: checked ? 'rgba(59,130,246,0.08)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(it.id)}
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        {kind === 'signals' ? (
                          <svg
                            aria-hidden
                            width={18}
                            height={6}
                            viewBox="0 0 18 6"
                            style={{ flex: '0 0 auto' }}
                          >
                            <line
                              x1={0}
                              y1={3}
                              x2={18}
                              y2={3}
                              stroke={it.color}
                              strokeWidth={1.5}
                              strokeDasharray={it.dash}
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <span
                            aria-hidden
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: it.color,
                              display: 'inline-block',
                              flex: '0 0 auto',
                            }}
                          />
                        )}
                        <span style={{ flex: 1, color: 'var(--text-primary)' }}>
                          {it.label}
                        </span>
                        {typeof it.count === 'number' && (
                          <span
                            style={{
                              color: 'var(--text-tertiary)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {it.count}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const miniBtnStyle: React.CSSProperties = {
  fontSize: 10,
  padding: '2px 6px',
  borderRadius: 3,
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-base)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

export default Selector;
