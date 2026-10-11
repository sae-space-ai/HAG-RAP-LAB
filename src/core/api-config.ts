/**
 * Resolve the browser's API origin. Vite's dev proxy forwards the default
 * same-origin /api/v1 route to Express; a static production host does NOT.
 * A production deployment must configure VITE_API_BASE_URL to a genuine
 * externally hosted backend. No synthetic API responses or hidden fallback.
 */
export interface ApiConfiguration {
  baseUrl: string;
  source: 'same-origin' | 'external';
}

export function resolveApiConfiguration(raw: string | undefined): ApiConfiguration {
  const value = raw?.trim();
  if (!value) return { baseUrl: '/api/v1', source: 'same-origin' };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_BASE_URL debe ser una URL absoluta http(s) del backend.');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password
      || url.search || url.hash) {
    throw new Error('VITE_API_BASE_URL debe utilizar http(s), sin credenciales, parámetros ni fragmentos.');
  }
  const rawPath = url.pathname.replace(/\/+$/, '');
  const path = rawPath.endsWith('/api/v1') ? rawPath : rawPath + '/api/v1';
  return { baseUrl: url.origin + path, source: 'external' };
}
