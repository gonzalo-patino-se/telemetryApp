// src/pages/Admin.tsx
// Administrator console (FR-010). Threshold defaults are managed here per
// tenant / deployment scope (FR-016); every write is audited server-side.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ResourceTable, { type FieldDef } from '../components/admin/ResourceTable';
import { useAuth } from '../context/AuthContext';
import { useThresholds } from '../context/ThresholdContext';
import {
  ADMIN_RESOURCES,
  describeApiError,
  fetchBootstrap,
  type AdminBootstrap,
} from '../services/adminApi';

type TabKey =
  | 'thresholds'
  | 'tenants'
  | 'users'
  | 'access'
  | 'flags'
  | 'security'
  | 'reports'
  | 'ssh'
  | 'audit';

const TABS: { key: TabKey; label: string; hint: string }[] = [
  { key: 'thresholds', label: 'Thresholds', hint: 'Lower / upper limits used by charts and reports' },
  { key: 'tenants', label: 'Tenants', hint: 'Deployment scopes that own configuration defaults' },
  { key: 'users', label: 'Users', hint: 'Group membership and tenant assignment' },
  { key: 'access', label: 'Access control', hint: 'What each group may view, export and manage' },
  { key: 'flags', label: 'Feature flags', hint: 'Enable or disable optional capabilities' },
  { key: 'security', label: 'Sessions & security', hint: 'Session limits and inactivity timeout' },
  { key: 'reports', label: 'Report settings', hint: 'PDF and validation report behaviour' },
  { key: 'ssh', label: 'SSH permissions', hint: 'Per-user remote access grants' },
  { key: 'audit', label: 'Audit log', hint: 'Every administrative change' },
];

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle, rgba(148,163,184,0.15))',
  borderRadius: '12px',
  padding: '16px',
};

const Admin: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { refresh: refreshThresholds } = useThresholds();
  const [tab, setTab] = useState<TabKey>('thresholds');
  const [data, setData] = useState<AdminBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subsystemFilter, setSubsystemFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchBootstrap());
      setError(null);
    } catch (err) {
      setError(describeApiError(err, 'The administration data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
    else setLoading(false);
  }, [isAdmin, load]);

  const onChanged = useCallback(() => {
    void load();
    void refreshThresholds();
  }, [load, refreshThresholds]);

  const tenantOptions = useMemo(
    () => [
      { value: null as number | null, label: 'Global default' },
      ...(data?.tenants ?? []).map(t => ({ value: t.id as number | null, label: t.name })),
    ],
    [data?.tenants],
  );

  const metricOptions = useMemo(
    () => [
      { value: null as string | number | null, label: 'Select a metric…' },
      ...(data?.metrics ?? []).map(m => ({ value: m.key as string | number | null, label: `${m.subsystem} — ${m.label} (${m.unit || 'n/a'})` })),
    ],
    [data?.metrics],
  );

  const metricsByKey = useMemo(
    () => new Map((data?.metrics ?? []).map(m => [m.key, m])),
    [data?.metrics],
  );

  const groupOptions = useMemo(
    () => (data?.groups ?? []).map(g => ({ value: g.id as string | number | null, label: g.name })),
    [data?.groups],
  );

  const userOptions = useMemo(
    () => (data?.users ?? []).map(u => ({ value: u.id as string | number | null, label: u.username })),
    [data?.users],
  );

  if (!isAdmin) {
    return (
      <DashboardLayout title="Administration" showFilters={false}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          <div style={{ ...panelStyle, borderColor: 'rgba(239,68,68,0.4)' }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Administrator privileges required</h2>
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {user?.username ? `${user.username} is` : 'You are'} not a member of an administrator group.
              Threshold defaults, session limits and access controls can only be changed by an administrator.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const thresholdFields: FieldDef[] = [
    { name: 'metric_key', label: 'Metric', type: 'select', options: metricOptions, width: '260px' },
    { name: 'tenant', label: 'Scope', type: 'select', options: tenantOptions, width: '150px' },
    { name: 'lower_limit', label: 'Lower', type: 'number', width: '100px' },
    { name: 'upper_limit', label: 'Upper', type: 'number', width: '100px' },
    { name: 'unit', label: 'Unit', type: 'text', readOnly: true, width: '70px',
      derive: values => metricsByKey.get(String(values.metric_key))?.unit ?? '—' },
    { name: 'enabled', label: 'Shown by default', type: 'boolean', width: '90px' },
    { name: 'is_protected', label: 'Protected', type: 'boolean', width: '80px' },
    { name: 'notes', label: 'Notes', type: 'text' },
    { name: 'updated_by_username', label: 'Updated by', type: 'text', readOnly: true, width: '110px' },
  ];

  const filteredThresholds = (data?.thresholds ?? []).filter(row => {
    const bySubsystem = subsystemFilter === 'all' || row.subsystem === subsystemFilter;
    const byScope = scopeFilter === 'all' || row.scope === scopeFilter;
    return bySubsystem && byScope;
  });

  return (
    <DashboardLayout title="Administration" showFilters={false}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ ...panelStyle, borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '13px' }}>{error}</div>
        )}

        <nav style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '18px',
                cursor: 'pointer',
                border: `1px solid ${tab === key ? 'rgba(59,130,246,0.5)' : 'var(--border-subtle, rgba(148,163,184,0.2))'}`,
                background: tab === key ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: tab === key ? '#93c5fd' : 'var(--text-secondary)',
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div style={panelStyle}>
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              {TABS.find(t => t.key === tab)?.label}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-tertiary, #94a3b8)' }}>
              {TABS.find(t => t.key === tab)?.hint}
            </p>
          </div>

          {loading && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading…</div>}

          {!loading && data && tab === 'thresholds' && (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <select
                  value={subsystemFilter}
                  onChange={e => setSubsystemFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, rgba(148,163,184,0.25))' }}
                >
                  <option value="all">All subsystems</option>
                  {data.subsystems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={scopeFilter}
                  onChange={e => setScopeFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle, rgba(148,163,184,0.25))' }}
                >
                  <option value="all">All scopes</option>
                  <option value="global">Global default</option>
                  {data.tenants.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                </select>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary, #94a3b8)', alignSelf: 'center' }}>
                  {filteredThresholds.length} of {data.thresholds.length} thresholds
                </span>
              </div>
              <ResourceTable
                endpoint={ADMIN_RESOURCES.thresholds}
                fields={thresholdFields}
                rows={filteredThresholds}
                onChanged={onChanged}
                createDefaults={{ tenant: null, enabled: true, is_protected: true }}
                rowKeyLabel={row => `${row.metric_key} (${row.scope})`}
                emptyMessage="No thresholds match the current filters."
              />
            </>
          )}

          {!loading && data && tab === 'tenants' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.tenants}
              fields={[
                { name: 'name', label: 'Name', type: 'text' },
                { name: 'slug', label: 'Slug', type: 'text', width: '160px' },
                { name: 'description', label: 'Description', type: 'text' },
                { name: 'default_timezone', label: 'Default timezone', type: 'text', width: '160px' },
                { name: 'is_active', label: 'Active', type: 'boolean', width: '70px' },
                { name: 'member_count', label: 'Members', type: 'number', readOnly: true, width: '80px' },
              ]}
              rows={data.tenants}
              onChanged={onChanged}
              createDefaults={{ is_active: true, default_timezone: 'UTC' }}
              rowKeyLabel={row => row.name}
            />
          )}

          {!loading && data && tab === 'users' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.users}
              fields={[
                { name: 'username', label: 'Username', type: 'text', readOnly: true, width: '160px' },
                { name: 'email', label: 'Email', type: 'text' },
                { name: 'tenant_id', label: 'Tenant', type: 'select', options: tenantOptions, width: '170px' },
                { name: 'is_active', label: 'Active', type: 'boolean', width: '70px' },
                { name: 'is_staff', label: 'Staff', type: 'boolean', width: '70px' },
                { name: 'is_superuser', label: 'Superuser', type: 'boolean', readOnly: true, width: '80px' },
                { name: 'last_login', label: 'Last login', type: 'text', readOnly: true, width: '180px' },
              ]}
              rows={data.users.map(u => ({ ...u, tenant_id: u.tenant }))}
              onChanged={onChanged}
              canCreate={false}
              canDelete={false}
              rowKeyLabel={row => row.username}
            />
          )}

          {!loading && data && tab === 'access' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.accessRules}
              fields={[
                { name: 'group', label: 'Group', type: 'select', options: groupOptions, width: '180px' },
                { name: 'tenant', label: 'Scope', type: 'select', options: tenantOptions, width: '170px' },
                {
                  name: 'resource',
                  label: 'Resource',
                  type: 'select',
                  width: '200px',
                  options: [
                    { value: 'dashboard', label: 'Dashboard' },
                    { value: 'events', label: 'Events & analytics' },
                    { value: 'history', label: 'History charts' },
                    { value: 'validation_report', label: 'Validation report' },
                    { value: 'pdf_report', label: 'PDF report' },
                    { value: 'thresholds', label: 'Threshold configuration' },
                    { value: 'admin_console', label: 'Admin console' },
                    { value: 'adx_query', label: 'Raw ADX query' },
                    { value: 'ssh', label: 'SSH access' },
                  ],
                },
                { name: 'can_view', label: 'View', type: 'boolean', width: '70px' },
                { name: 'can_export', label: 'Export', type: 'boolean', width: '70px' },
                { name: 'can_manage', label: 'Manage', type: 'boolean', width: '70px' },
              ]}
              rows={data.access_rules}
              onChanged={onChanged}
              createDefaults={{ tenant: null, can_view: true, can_export: false, can_manage: false }}
              rowKeyLabel={row => `${row.group_name} → ${row.resource}`}
            />
          )}

          {!loading && data && tab === 'flags' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.featureFlags}
              fields={[
                { name: 'key', label: 'Key', type: 'text', width: '190px' },
                { name: 'name', label: 'Name', type: 'text' },
                { name: 'description', label: 'Description', type: 'text' },
                { name: 'tenant', label: 'Scope', type: 'select', options: tenantOptions, width: '170px' },
                { name: 'is_enabled', label: 'Enabled', type: 'boolean', width: '80px' },
              ]}
              rows={data.feature_flags}
              onChanged={onChanged}
              createDefaults={{ tenant: null, is_enabled: false }}
              rowKeyLabel={row => row.key}
            />
          )}

          {!loading && data && tab === 'security' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.securityPolicies}
              fields={[
                { name: 'tenant', label: 'Scope', type: 'select', options: tenantOptions, width: '170px' },
                { name: 'max_concurrent_sessions', label: 'Max sessions', type: 'number', width: '110px' },
                { name: 'session_lifetime_minutes', label: 'Session lifetime (min)', type: 'number', width: '130px' },
                { name: 'inactivity_timeout_minutes', label: 'Inactivity timeout (min)', type: 'number', width: '140px' },
                { name: 'refresh_token_lifetime_days', label: 'Refresh lifetime (days)', type: 'number', width: '130px' },
                { name: 'max_failed_logins', label: 'Max failed logins', type: 'number', width: '110px' },
                { name: 'lockout_minutes', label: 'Lockout (min)', type: 'number', width: '100px' },
                { name: 'enforce_ip_allowlist', label: 'Enforce IP allowlist', type: 'boolean', width: '100px' },
                { name: 'allowed_ip_cidrs', label: 'Allowed CIDRs', type: 'textarea', placeholder: 'One CIDR per line' },
              ]}
              rows={data.security_policies}
              onChanged={onChanged}
              createDefaults={{ tenant: null }}
              rowKeyLabel={row => `security policy (${row.scope})`}
            />
          )}

          {!loading && data && tab === 'reports' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.reportSettings}
              fields={[
                { name: 'tenant', label: 'Scope', type: 'select', options: tenantOptions, width: '170px' },
                { name: 'header_title', label: 'Header title', type: 'text' },
                { name: 'footer_note', label: 'Footer note', type: 'text' },
                { name: 'include_thresholds', label: 'Threshold column', type: 'boolean', width: '90px' },
                { name: 'include_charts', label: 'Charts', type: 'boolean', width: '70px' },
                { name: 'include_validation_summary', label: 'Validation summary', type: 'boolean', width: '100px' },
                {
                  name: 'timestamp_mode', label: 'Timestamps', type: 'select', width: '150px',
                  options: [
                    { value: 'utc', label: 'UTC only' },
                    { value: 'local', label: 'Browser local only' },
                    { value: 'both', label: 'UTC and browser local' },
                  ],
                },
                { name: 'stale_data_minutes', label: 'Stale after (min)', type: 'number', width: '110px' },
                { name: 'missing_threshold_text', label: 'Missing threshold text', type: 'text' },
              ]}
              rows={data.report_settings}
              onChanged={onChanged}
              createDefaults={{ tenant: null, missing_threshold_text: 'Threshold needs to be defined.' }}
              rowKeyLabel={row => `report settings (${row.scope})`}
            />
          )}

          {!loading && data && tab === 'ssh' && (
            <ResourceTable
              endpoint={ADMIN_RESOURCES.sshPermissions}
              fields={[
                { name: 'user', label: 'User', type: 'select', options: userOptions, width: '160px' },
                { name: 'tenant', label: 'Scope', type: 'select', options: tenantOptions, width: '160px' },
                { name: 'host_pattern', label: 'Host pattern', type: 'text', width: '220px' },
                { name: 'remote_username', label: 'Remote user', type: 'text', width: '130px' },
                {
                  name: 'access_level', label: 'Access level', type: 'select', width: '140px',
                  options: [
                    { value: 'none', label: 'No access' },
                    { value: 'read', label: 'Read only' },
                    { value: 'operate', label: 'Operate' },
                    { value: 'admin', label: 'Administrative' },
                  ],
                },
                { name: 'is_enabled', label: 'Enabled', type: 'boolean', width: '70px' },
                { name: 'expires_at', label: 'Expires', type: 'datetime', width: '190px' },
                { name: 'notes', label: 'Notes', type: 'text' },
                { name: 'granted_by_username', label: 'Granted by', type: 'text', readOnly: true, width: '110px' },
              ]}
              rows={data.ssh_permissions}
              onChanged={onChanged}
              createDefaults={{ tenant: null, access_level: 'read', is_enabled: false }}
              rowKeyLabel={row => `${row.username} → ${row.host_pattern}`}
            />
          )}

          {!loading && data && tab === 'audit' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    {['When', 'Actor', 'Action', 'Object', 'Changes', 'IP'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary, #94a3b8)', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.15))' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.audit_log.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '10px 8px', color: 'var(--text-tertiary, #94a3b8)' }}>No changes recorded yet.</td></tr>
                  )}
                  {data.audit_log.map(entry => (
                    <tr key={entry.id}>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))', whiteSpace: 'nowrap' }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))' }}>{entry.actor_username ?? 'system'}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))' }}>{entry.action}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))' }}>{entry.model_name}: {entry.object_repr}</td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))', maxWidth: '380px' }}>
                        <code style={{ fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                          {JSON.stringify(entry.changes)}
                        </code>
                      </td>
                      <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle, rgba(148,163,184,0.1))' }}>{entry.ip_address ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
