import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('Health API Route', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
  });

  it('returns 200 status with ok response', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('includes timestamp in response', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(typeof data.timestamp).toBe('number');
    expect(data.timestamp).toBeGreaterThan(0);
  });

  it('includes environment in response', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.environment).toBeDefined();
  });

  it('returns valid JSON content type', async () => {
    const response = await GET();
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
