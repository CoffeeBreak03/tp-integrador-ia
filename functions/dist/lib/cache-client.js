"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheClient = exports.CacheClient = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_blob_1 = require("@azure/storage-blob");
const CONTAINER_NAME = 'translation-cache';
class CacheClient {
    constructor() {
        this.blobServiceClient = null;
        // Definimos el directorio local de fallback: /functions/cache
        this.localCacheDir = path_1.default.join(process.cwd(), 'cache');
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (connectionString && process.env.USE_MOCK_AZURE !== 'true') {
            try {
                console.log('[CACHE] Initializing Azure Blob Storage client');
                this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
            }
            catch (err) {
                console.error('[CACHE] Failed to initialize Azure Blob Storage client, falling back to local storage:', err);
            }
        }
        else {
            console.log('[CACHE] Using local filesystem fallback for cache (functions/cache/)');
        }
    }
    /**
     * Asegura que exista el directorio local.
     */
    ensureLocalDir() {
        if (!fs_1.default.existsSync(this.localCacheDir)) {
            fs_1.default.mkdirSync(this.localCacheDir, { recursive: true });
        }
    }
    /**
     * Verifica si existe un archivo traducido en la caché (Azure o local).
     */
    async checkCache(fileHash) {
        const cleanHash = fileHash.trim().toLowerCase();
        if (!/^[a-f0-9]{64}$/.test(cleanHash)) {
            console.warn(`[CACHE] Invalid fileHash provided: ${fileHash}`);
            return null;
        }
        const blobName = `${cleanHash}.json`;
        // Si Azure está configurado, intentamos buscar en Azure Blob Storage
        if (this.blobServiceClient) {
            try {
                const containerClient = this.blobServiceClient.getContainerClient(CONTAINER_NAME);
                const exists = await containerClient.exists();
                if (!exists) {
                    return null;
                }
                const blobClient = containerClient.getBlobClient(blobName);
                const blobExists = await blobClient.exists();
                if (!blobExists) {
                    console.log(`[CACHE] Azure: cache miss for hash ${cleanHash}`);
                    return null;
                }
                console.log(`[CACHE] Azure: cache hit for hash ${cleanHash}`);
                const downloadResponse = await blobClient.download(0);
                const downloadedContent = await this.streamToBuffer(downloadResponse.readableStreamBody);
                return JSON.parse(downloadedContent.toString('utf8'));
            }
            catch (err) {
                console.error('[CACHE] Azure checkCache error, falling back to local cache check:', err);
            }
        }
        // Fallback local
        try {
            this.ensureLocalDir();
            const localPath = path_1.default.join(this.localCacheDir, blobName);
            if (fs_1.default.existsSync(localPath)) {
                console.log(`[CACHE] Local: cache hit for hash ${cleanHash}`);
                const data = await fs_1.default.promises.readFile(localPath, 'utf8');
                return JSON.parse(data);
            }
            console.log(`[CACHE] Local: cache miss for hash ${cleanHash}`);
            return null;
        }
        catch (err) {
            console.error('[CACHE] Local checkCache error:', err);
            return null;
        }
    }
    /**
     * Almacena el resultado de la traducción en la caché.
     */
    async saveCache(data) {
        const cleanHash = data.fileHash.trim().toLowerCase();
        if (!/^[a-f0-9]{64}$/.test(cleanHash)) {
            console.warn(`[CACHE] Refusing to save invalid fileHash: ${data.fileHash}`);
            return;
        }
        const blobName = `${cleanHash}.json`;
        const serializedData = JSON.stringify(data, null, 2);
        // Guardar en Azure si está configurado
        if (this.blobServiceClient) {
            try {
                const containerClient = this.blobServiceClient.getContainerClient(CONTAINER_NAME);
                await containerClient.createIfNotExists();
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                console.log(`[CACHE] Azure: saving translation results for hash ${cleanHash}`);
                await blockBlobClient.upload(serializedData, serializedData.length, {
                    blobHTTPHeaders: { blobContentType: 'application/json' }
                });
                return;
            }
            catch (err) {
                console.error('[CACHE] Azure saveCache error, falling back to local save:', err);
            }
        }
        // Fallback local
        try {
            this.ensureLocalDir();
            const localPath = path_1.default.join(this.localCacheDir, blobName);
            console.log(`[CACHE] Local: saving translation results for hash ${cleanHash}`);
            await fs_1.default.promises.writeFile(localPath, serializedData, 'utf8');
        }
        catch (err) {
            console.error('[CACHE] Local saveCache error:', err);
        }
    }
    /**
     * Helper para convertir un Stream a Buffer.
     */
    async streamToBuffer(readableStream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on('data', (data) => {
                chunks.push(data instanceof Buffer ? data : Buffer.from(data));
            });
            readableStream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            readableStream.on('error', reject);
        });
    }
}
exports.CacheClient = CacheClient;
let cacheClientInstance = null;
const getCacheClient = () => {
    if (!cacheClientInstance) {
        cacheClientInstance = new CacheClient();
    }
    return cacheClientInstance;
};
exports.getCacheClient = getCacheClient;
//# sourceMappingURL=cache-client.js.map