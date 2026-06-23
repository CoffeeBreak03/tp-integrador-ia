"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCacheRoute = exports.checkCacheRoute = void 0;
const cache_client_1 = require("./lib/cache-client");
const validate_contract_1 = require("./lib/validate-contract");
const checkCacheRoute = async (req, res) => {
    try {
        const { fileHash } = req.body;
        if (!fileHash || typeof fileHash !== 'string') {
            res.status(400).json({ error: 'Missing or invalid fileHash parameter' });
            return;
        }
        const cacheClient = (0, cache_client_1.getCacheClient)();
        const cachedData = await cacheClient.checkCache(fileHash);
        if (cachedData) {
            res.status(200).json({
                cached: true,
                data: cachedData
            });
        }
        else {
            res.status(200).json({
                cached: false
            });
        }
    }
    catch (error) {
        console.error('[CACHE] Route check error:', error);
        res.status(500).json({ error: String(error) });
    }
};
exports.checkCacheRoute = checkCacheRoute;
const saveCacheRoute = async (req, res) => {
    try {
        const { fileHash, fileType, pages } = req.body;
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
                (0, validate_contract_1.validateTranslationContract)(page.translations);
            }
            catch (err) {
                res.status(400).json({ error: `Validation failed for page ${page.pageIndex}: ${String(err)}` });
                return;
            }
        }
        const cacheClient = (0, cache_client_1.getCacheClient)();
        const cacheData = {
            fileHash,
            fileType,
            pages: pages.map(p => ({
                pageIndex: p.pageIndex,
                translations: p.translations,
                contexto: p.contexto
            }))
        };
        await cacheClient.saveCache(cacheData);
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('[CACHE] Route save error:', error);
        res.status(500).json({ error: String(error) });
    }
};
exports.saveCacheRoute = saveCacheRoute;
//# sourceMappingURL=cache.js.map