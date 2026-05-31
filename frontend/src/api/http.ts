import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getAdminTenantSlug, getAdminToken } from '../auth/adminSession';
import { getCandidateToken } from '../auth/session';
import { resolveTenantSlug } from '../tenant/resolveTenantSlug';

function tenantHostHeader() {
  const override = import.meta.env.VITE_TENANT_HOST as string | undefined;
  if (override) return override;
  if (typeof window !== 'undefined') return window.location.host;
  return undefined;
}

function attachTenantParams(config: InternalAxiosRequestConfig) {
  const slug = resolveTenantSlug();
  if (slug) {
    config.params = { ...(config.params as Record<string, unknown>), tenant: slug };
  }
  return config;
}

function attachAdminTenantParams(config: InternalAxiosRequestConfig) {
  const envSlug = import.meta.env.VITE_TENANT_SLUG as string | undefined;
  const slug =
    getAdminTenantSlug() ??
    envSlug?.trim().toLowerCase() ??
    'default';
  config.params = { ...(config.params as Record<string, unknown>), tenant: slug };
  return config;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

http.interceptors.request.use((config) => {
  attachTenantParams(config);

  const host = tenantHostHeader();
  if (host) {
    config.headers = config.headers ?? {};
    config.headers['X-Tenant-Host'] = host;
  }

  const token = getCandidateToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

adminHttp.interceptors.request.use((config) => {
  attachAdminTenantParams(config);

  const host = tenantHostHeader();
  if (host) {
    config.headers = config.headers ?? {};
    config.headers['X-Tenant-Host'] = host;
  }

  const token = getAdminToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
