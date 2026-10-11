import { describe, it, expect } from 'vitest';
import { resolveApiConfiguration } from '../src/core/api-config';

describe('frontend API deployment configuration', () => {
  it('keeps the same-origin path during local development', () => {
    expect(resolveApiConfiguration(undefined)).toEqual({ baseUrl: '/api/v1', source: 'same-origin' });
  });
  it('uses the configured backend, not the static frontend origin', () => {
    expect(resolveApiConfiguration('https://api.example.org')).toEqual({
      baseUrl: 'https://api.example.org/api/v1', source: 'external',
    });
  });
  it('does not append api/v1 twice and normalizes trailing slash', () => {
    expect(resolveApiConfiguration('https://api.example.org/api/v1/').baseUrl).toBe('https://api.example.org/api/v1');
  });
  it('can serve from a backend subpath', () => {
    expect(resolveApiConfiguration('https://example.org/backend').baseUrl).toBe('https://example.org/backend/api/v1');
  });
  it('rejects URL credentials and unexpected schemes', () => {
    for (const x of ['javascript:alert(1)', 'https://user:pass@example.com', 'ftp://example.org']) {
      expect(() => resolveApiConfiguration(x)).toThrow();
    }
  });
  it('rejects relative, query-string and fragment-based backend URLs', () => {
    for (const x of ['/api/v1', 'https://api.example.org?secret=1', 'https://api.example.org/#secret']) {
      expect(() => resolveApiConfiguration(x)).toThrow();
    }
  });
});
