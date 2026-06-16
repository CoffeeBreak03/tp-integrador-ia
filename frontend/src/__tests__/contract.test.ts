import { describe, it, expect } from 'vitest';
import { validateContract } from '@/lib/contract';

describe('Contract validation', () => {
  it('validates valid contract', () => {
    const valid = [
      {
        id: 1,
        box: [100, 120, 240, 360],
        texto_original: '原文テキスト',
        texto_traducido: 'Texto traducido al español',
      },
    ];

    expect(validateContract(valid)).toBe(true);
  });

  it('accepts an empty contract array', () => {
    expect(validateContract([])).toBe(true);
  });

  it('rejects invalid contract shapes', () => {
    expect(validateContract(null)).toBe(false);
    expect(validateContract([{ id: 'invalid', box: [], texto_original: '', texto_traducido: '' }])).toBe(false);
  });

  it('accepts float coordinates in boxes', () => {
    const validFloat = [
      {
        id: 1,
        box: [100.5, 120.25, 240.75, 360.99],
        texto_original: '原文テキスト',
        texto_traducido: 'Texto traducido al español',
      },
    ];

    expect(validateContract(validFloat)).toBe(true);
  });
});
