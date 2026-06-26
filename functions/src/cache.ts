import { Request, Response } from 'express';
import { getCacheClient, CachedChapter } from './lib/cache-client';
import { validateTranslationContract } from './lib/validate-contract';

interface CacheCheckRequest {
  fileHash: string;
  targetLanguage?: string;
}

interface CacheSaveRequest {
  fileHash: string;
  fileType: string;
  pages: Array<{
    pageIndex: number;
    translations: any[];
    contexto: string;
  }>;
  targetLanguage?: string;
}

export const checkCacheRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileHash, targetLanguage } = req.body as CacheCheckRequest;
    if (!fileHash || typeof fileHash !== 'string') {
      res.status(400).json({ error: 'Missing or invalid fileHash parameter' });
      return;
    }

    const cacheClient = getCacheClient();
    const cachedData = await cacheClient.checkCache(fileHash, targetLanguage);

    if (cachedData) {
      res.status(200).json({
        cached: true,
        data: cachedData
      });
    } else {
      res.status(200).json({
        cached: false
      });
    }
  } catch (error) {
    console.error('[CACHE] Route check error:', error);
    res.status(500).json({ error: String(error) });
  }
};

export const saveCacheRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileHash, fileType, pages, targetLanguage } = req.body as CacheSaveRequest;
    if (!fileHash || typeof fileHash !== 'string') {
      res.status(400).json({ error: 'Missing or invalid fileHash' });
      return;
    }
    if (!fileType || typeof fileType !== 'string') {
      res.status(400).json({ error: 'Missing or invalid fileType' });
      return;
    }
    if (!pages || !Array.isArray(pages)) {
      res.status(400).json({ error: 'Missing or invalid pages array' });
      return;
    }

    // Validar el contrato de traducción para cada página
    for (const page of pages) {
      if (typeof page.pageIndex !== 'number' || !Array.isArray(page.translations) || typeof page.contexto !== 'string') {
        res.status(400).json({ error: `Invalid page structure at page index ${page.pageIndex ?? 'unknown'}` });
        return;
      }
      
      try {
        validateTranslationContract(page.translations);
      } catch (err) {
        res.status(400).json({ error: `Validation failed for page ${page.pageIndex}: ${String(err)}` });
        return;
      }
    }

    const cacheClient = getCacheClient();
    const cacheData: CachedChapter = {
      fileHash,
      fileType,
      pages: pages.map(p => ({
        pageIndex: p.pageIndex,
        translations: p.translations,
        contexto: p.contexto
      })),
      targetLanguage
    };

    await cacheClient.saveCache(cacheData, targetLanguage);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[CACHE] Route save error:', error);
    res.status(500).json({ error: String(error) });
  }
};
