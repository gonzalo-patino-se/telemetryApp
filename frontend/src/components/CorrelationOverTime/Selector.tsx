// src/components/CorrelationOverTime/Selector.tsx
// Compact, accessible "checkbox popover" for selecting signals and events.
// Two instances are rendered side-by-side in the card toolbar:
//   <Selector kind="signals" .../>   <Selector kind="events"  .../>

import React from 'react';
import { SIGNAL_CATALOG } from './signalCatalog';
import { EVENT_CATALOG } from './eventCatalog';

type Kind = 'signals' | 'events';

interface SelectorProps {
  kind: Kind;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

interface Item {
  id: string;
  label: string;
  group?: string;
  color: string;
  glyph?: string;
}

function getItems(kind: Kind): Item[] {
  if (kind === 'signals') {
    return SIGNAL_CATALOG.map(s => ({
      id: s.id,
      label: s.label,
      group: s.group,
      color: s.color,
    }));
  }
  return EVENT_CATALOG.map(e => ({
    id: e.id,
    label: e.label,
    color: e.color,
    glyph: e.glyph,
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

export const Selector: React.FC<SelectorProps> = ({ kind, selectedIds, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const items = React.useMemo(() => getItems(kind), [kind]);
  const grouped = React.useMemo(() => groupBy(items), [items]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  // Close on outside click / Escape.
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
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const buttonLabel =
    kind === 'signals'
      ? `Signals (${selectedIds.length})`
      : `Events (${selectedIds.length})`;

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
        {buttonLabel} ▾
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
            minWidth: 220,
            maxHeight: 280,
            overflowY: 'auto',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            padding: 4,
            fontSize: 11,
          }}
        >
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
                    <span
                      aria-hidden
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: kind === 'signals' ? 1 : '50%',
                        background: kind === 'signals' ? it.color : 'transparent',
                        color: it.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                      }}
                    >
                      {kind === 'events' ? it.glyph ?? '◆' : null}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{it.label}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Selector;
