import { describe, expect, it } from 'vitest';
import { estimateBytes, isQuotaError } from '../lib/storage-utils.js';

describe('isQuotaError', () => {
  it('detects quota errors by message', () => {
    expect(isQuotaError(new Error('QUOTA_BYTES_PER_ITEM quota exceeded'))).toBe(true);
    expect(isQuotaError(new Error('kQuotaBytesPerItem'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isQuotaError(new Error('network failure'))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
  });
});

describe('estimateBytes', () => {
  it('returns byte length of JSON payload', () => {
    const bytes = estimateBytes({ hello: 'world' });
    expect(bytes).toBe(new TextEncoder().encode(JSON.stringify({ hello: 'world' })).length);
  });

  it('returns Infinity for non-serializable values', () => {
    const circular = {};
    circular.self = circular;
    expect(estimateBytes(circular)).toBe(Infinity);
  });
});