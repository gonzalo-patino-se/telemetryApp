// src/components/admin/ResourceTable.tsx
// Declarative CRUD table used by every tab of the admin console.
// Each write goes through the audited admin API.

import React, { useMemo, useState } from 'react';
import {
  createResource,
  deleteResource,
  describeApiError,
  updateResource,
} from '../../services/adminApi';

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'datetime';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string | number | null; label: string }[];
  readOnly?: boolean;
  /** Excluded from the "add new" form (e.g. server-computed columns). */
  createOnly?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
  width?: string;
  /** Computes the displayed value from the row merged with its unsaved edits. */
  derive?: (values: Record<string, unknown>) => unknown;
}

export interface ResourceTableProps<T extends { id: number }> {
  endpoint: string;
  fields: FieldDef[];
  rows: T[];
  onChanged: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
  emptyMessage?: string;
  /** Defaults applied to the "add new" form. */
  createDefaults?: Record<string, unknown>;
  rowKeyLabel?: (row: T) => string;
}

const cellStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.15))',
  fontSize: '12px',
  color: 'var(--text-primary)',
  verticalAlign: 'middle',
};

const headerStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: 'left',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-tertiary, #94a3b8)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  fontSize: '12px',
  borderRadius: '6px',
  border: '1px solid var(--border-subtle, rgba(148,163,184,0.25))',
  background: 'var(--bg-input, rgba(15,23,42,0.4))',
  color: 'var(--text-primary)',
};

const buttonStyle: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
};

function coerce(field: FieldDef, raw: string): unknown {
  if (field.type === 'number') {
    if (raw === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (field.type === 'select') {
    if (raw === '') return null;
    const match = field.options?.find(option => String(option.value) === raw);
    return match ? match.value : raw;
  }
  if (field.type === 'datetime') return raw === '' ? null : raw;
  return raw;
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
  disabled?: boolean;
}) {
  if (field.type === 'boolean') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ width: '15px', height: '15px', accentColor: '#3b82f6', cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select
        value={value === null || value === undefined ? '' : String(value)}
        disabled={disabled}
        onChange={e => onChange(coerce(field, e.target.value))}
        style={inputStyle}
      >
        {field.options?.map(option => (
          <option key={String(option.value)} value={option.value === null ? '' : String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value === null || value === undefined ? '' : String(value)}
        disabled={disabled}
        rows={2}
        placeholder={field.placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    );
  }
  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'datetime' ? 'datetime-local' : 'text'}
      step="any"
      value={value === null || value === undefined ? '' : String(value)}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={e => onChange(coerce(field, e.target.value))}
      style={inputStyle}
    />
  );
}

export function ResourceTable<T extends { id: number }>({
  endpoint,
  fields,
  rows,
  onChanged,
  canCreate = true,
  canDelete = true,
  emptyMessage = 'Nothing configured yet.',
  createDefaults = {},
  rowKeyLabel,
}: ResourceTableProps<T>) {
  const [drafts, setDrafts] = useState<Record<number, Record<string, unknown>>>({});
  const [newRow, setNewRow] = useState<Record<string, unknown>>({ ...createDefaults });
  const [busyId, setBusyId] = useState<number | 'new' | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const visibleFields = useMemo(() => fields.filter(f => !f.hideInTable), [fields]);
  const creatableFields = useMemo(() => fields.filter(f => !f.readOnly), [fields]);

  const setDraftValue = (id: number, name: string, value: unknown) => {
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), [name]: value } }));
  };

  const valueFor = (row: T, field: FieldDef) => {
    const draft = drafts[row.id];
    if (field.derive) return field.derive({ ...(row as Record<string, unknown>), ...(draft ?? {}) });
    if (draft && field.name in draft) return draft[field.name];
    return (row as Record<string, unknown>)[field.name];
  };

  const save = async (row: T) => {
    const draft = drafts[row.id];
    if (!draft || Object.keys(draft).length === 0) return;
    setBusyId(row.id);
    setMessage(null);
    try {
      await updateResource(endpoint, row.id, draft as Partial<T>);
      setDrafts(prev => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setMessage({ kind: 'ok', text: 'Saved. The change was written to the audit log.' });
      onChanged();
    } catch (error) {
      setMessage({ kind: 'error', text: describeApiError(error) });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row: T) => {
    const label = rowKeyLabel ? rowKeyLabel(row) : `#${row.id}`;
    if (!window.confirm(`Delete ${label}? This is recorded in the audit log.`)) return;
    setBusyId(row.id);
    setMessage(null);
    try {
      await deleteResource(endpoint, row.id);
      setMessage({ kind: 'ok', text: `Deleted ${label}.` });
      onChanged();
    } catch (error) {
      setMessage({ kind: 'error', text: describeApiError(error, 'The item could not be deleted.') });
    } finally {
      setBusyId(null);
    }
  };

  const create = async () => {
    setBusyId('new');
    setMessage(null);
    try {
      await createResource(endpoint, newRow as Partial<T>);
      setNewRow({ ...createDefaults });
      setMessage({ kind: 'ok', text: 'Created.' });
      onChanged();
    } catch (error) {
      setMessage({ kind: 'error', text: describeApiError(error, 'The item could not be created.') });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {message && (
        <div
          role="status"
          style={{
            marginBottom: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            color: message.kind === 'error' ? '#fca5a5' : '#86efac',
            border: `1px solid ${message.kind === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
            background: message.kind === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {visibleFields.map(field => (
                <th key={field.name} style={{ ...headerStyle, width: field.width }}>{field.label}</th>
              ))}
              <th style={{ ...headerStyle, width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={{ ...cellStyle, color: 'var(--text-tertiary, #94a3b8)' }} colSpan={visibleFields.length + 1}>
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map(row => {
              const dirty = Boolean(drafts[row.id] && Object.keys(drafts[row.id]).length);
              return (
                <tr key={row.id}>
                  {visibleFields.map(field => (
                    <td key={field.name} style={cellStyle}>
                      {field.readOnly ? (
                        <span style={{ color: 'var(--text-secondary, #cbd5e1)' }}>
                          {formatReadOnly(valueFor(row, field), field)}
                        </span>
                      ) : (
                        <FieldInput
                          field={field}
                          value={valueFor(row, field)}
                          disabled={busyId === row.id}
                          onChange={next => setDraftValue(row.id, field.name, next)}
                        />
                      )}
                    </td>
                  ))}
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => save(row)}
                        disabled={!dirty || busyId === row.id}
                        style={{
                          ...buttonStyle,
                          background: dirty ? 'linear-gradient(135deg, #3dcd58 0%, #22c55e 100%)' : 'rgba(100,116,139,0.2)',
                          color: dirty ? '#fff' : '#64748b',
                          cursor: dirty ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Save
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => remove(row)}
                          disabled={busyId === row.id}
                          style={{ ...buttonStyle, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canCreate && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, rgba(148,163,184,0.15))',
            background: 'var(--bg-surface-hover, rgba(30,41,59,0.4))',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary, #94a3b8)', marginBottom: '10px' }}>
            Add new
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {creatableFields.map(field => (
              <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary, #cbd5e1)' }}>
                {field.label}
                <FieldInput
                  field={field}
                  value={newRow[field.name]}
                  disabled={busyId === 'new'}
                  onChange={next => setNewRow(prev => ({ ...prev, [field.name]: next }))}
                />
              </label>
            ))}
          </div>
          <button
            onClick={create}
            disabled={busyId === 'new'}
            style={{ ...buttonStyle, marginTop: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}
          >
            Create
          </button>
        </div>
      )}
    </div>
  );
}

function formatReadOnly(value: unknown, field: FieldDef): string {
  if (value === null || value === undefined || value === '') return '\u2014';
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'select') {
    const match = field.options?.find(option => String(option.value) === String(value));
    return match ? match.label : String(value);
  }
  return String(value);
}

export default ResourceTable;
