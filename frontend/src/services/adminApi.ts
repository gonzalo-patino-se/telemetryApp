// src/services/adminApi.ts
// Administration console API client (FR-010, FR-016).

import api from './api';
import type { MetricCatalogEntry } from './thresholds';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description: string;
  default_timezone: string;
  is_active: boolean;
  member_count?: number;
}

export interface AdminGroup {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: number[];
  tenant: number | null;
  last_login: string | null;
  date_joined: string;
}

export interface AdminThreshold {
  id: number;
  tenant: number | null;
  scope: string;
  metric_key: string;
  label: string;
  unit: string;
  subsystem: string;
  lower_limit: number | null;
  upper_limit: number | null;
  enabled: boolean;
  is_protected: boolean;
  notes: string;
  updated_by_username?: string;
  updated_at?: string;
}

export interface AdminFeatureFlag {
  id: number;
  tenant: number | null;
  scope: string;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
}

export interface AdminSecurityPolicy {
  id: number;
  tenant: number | null;
  scope: string;
  max_concurrent_sessions: number;
  session_lifetime_minutes: number;
  inactivity_timeout_minutes: number;
  refresh_token_lifetime_days: number;
  max_failed_logins: number;
  lockout_minutes: number;
  enforce_ip_allowlist: boolean;
  allowed_ip_cidrs: string;
}

export interface AdminAccessRule {
  id: number;
  tenant: number | null;
  scope: string;
  group: number;
  group_name: string;
  resource: string;
  can_view: boolean;
  can_export: boolean;
  can_manage: boolean;
}

export interface AdminReportSetting {
  id: number;
  tenant: number | null;
  scope: string;
  header_title: string;
  footer_note: string;
  include_thresholds: boolean;
  include_charts: boolean;
  include_validation_summary: boolean;
  timestamp_mode: 'utc' | 'local' | 'both';
  stale_data_minutes: number;
  missing_threshold_text: string;
}

export interface AdminSSHPermission {
  id: number;
  user: number;
  username: string;
  tenant: number | null;
  host_pattern: string;
  remote_username: string;
  access_level: 'none' | 'read' | 'operate' | 'admin';
  is_enabled: boolean;
  expires_at: string | null;
  notes: string;
  granted_by_username?: string;
}

export interface AdminAuditEntry {
  id: number;
  actor_username: string | null;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AdminBootstrap {
  metrics: MetricCatalogEntry[];
  subsystems: string[];
  tenants: Tenant[];
  groups: AdminGroup[];
  users: AdminUser[];
  thresholds: AdminThreshold[];
  feature_flags: AdminFeatureFlag[];
  security_policies: AdminSecurityPolicy[];
  access_rules: AdminAccessRule[];
  report_settings: AdminReportSetting[];
  ssh_permissions: AdminSSHPermission[];
  audit_log: AdminAuditEntry[];
}

export const ADMIN_RESOURCES = {
  tenants: '/admin/tenants/',
  thresholds: '/admin/thresholds/',
  featureFlags: '/admin/feature-flags/',
  securityPolicies: '/admin/security-policies/',
  accessRules: '/admin/access-rules/',
  reportSettings: '/admin/report-settings/',
  sshPermissions: '/admin/ssh-permissions/',
  users: '/admin/users/',
  auditLog: '/admin/audit-log/',
} as const;

export async function fetchBootstrap(): Promise<AdminBootstrap> {
  const res = await api.get<AdminBootstrap>('/admin/bootstrap/');
  return res.data;
}

export async function createResource<T>(endpoint: string, payload: Partial<T>): Promise<T> {
  const res = await api.post<T>(endpoint, payload);
  return res.data;
}

export async function updateResource<T>(endpoint: string, id: number, payload: Partial<T>): Promise<T> {
  const res = await api.patch<T>(`${endpoint}${id}/`, payload);
  return res.data;
}

export async function deleteResource(endpoint: string, id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

/** Flatten a DRF validation error payload into a readable message. */
export function describeApiError(error: any, fallback = 'The change could not be saved.'): string {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  const parts: string[] = [];
  Object.entries(data).forEach(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value);
    parts.push(field === 'non_field_errors' ? text : `${field}: ${text}`);
  });
  return parts.length ? parts.join(' | ') : fallback;
}
