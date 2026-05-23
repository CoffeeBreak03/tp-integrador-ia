import { describe, it, expect } from 'vitest';
import { normalizedBoxToPixels, pixelsToNormalizedBox } from '@/lib/scale';

describe('Scale utilities', () => {
  it('converts normalized to pixels', () => {
    const result = normalizedBoxToPixels([0, 0, 500, 500], 1000, 1000);
    expect(result).toEqual([0, 0, 500, 500]);
  });

  it('converts pixels to normalized', () => {
    const result = pixelsToNormalizedBox(0, 0, 500, 500, 1000, 1000);
    expect(result).toEqual([0, 0, 500, 500]);
  });
});
