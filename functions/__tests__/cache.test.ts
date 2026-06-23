import fs from 'fs';
import path from 'path';
import { getCacheClient, CachedChapter } from '../src/lib/cache-client';

describe('CacheClient Local Fallback', () => {
  const cacheClient = getCacheClient();
  const testHash = 'a'.repeat(64); // 64 hex characters
  const invalidHash = 'not-a-hash';

  // Limpiar antes y después de cada test
  const cleanCache = () => {
    const p = path.join(process.cwd(), 'cache', `${testHash}.json`);
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (err) {}
    }
  };

  beforeEach(cleanCache);
  afterEach(cleanCache);

  it('returns null on cache miss', async () => {
    const result = await cacheClient.checkCache('f'.repeat(64));
    expect(result).toBeNull();
  });

  it('returns null for an invalid hash', async () => {
    const result = await cacheClient.checkCache(invalidHash);
    expect(result).toBeNull();
  });

  it('saves and loads a valid translation chapter', async () => {
    const sampleData: CachedChapter = {
      fileHash: testHash,
      fileType: 'pdf',
      pages: [
        {
          pageIndex: 0,
          contexto: 'Test context',
          translations: [
            {
              id: 1,
              box: [100, 100, 200, 200],
              texto_original: 'こんにちは',
              texto_traducido: 'Hola'
            }
          ]
        }
      ]
    };

    await cacheClient.saveCache(sampleData);

    const result = await cacheClient.checkCache(testHash);
    expect(result).not.toBeNull();
    expect(result?.fileHash).toBe(testHash);
    expect(result?.fileType).toBe('pdf');
    expect(result?.pages.length).toBe(1);
    expect(result?.pages[0].translations[0].texto_traducido).toBe('Hola');
  });

  it('refuses to save data with an invalid hash', async () => {
    const sampleData: CachedChapter = {
      fileHash: invalidHash,
      fileType: 'image',
      pages: []
    };

    await cacheClient.saveCache(sampleData);
    const p = path.join(process.cwd(), 'cache', `${invalidHash}.json`);
    expect(fs.existsSync(p)).toBe(false);
  });
});
