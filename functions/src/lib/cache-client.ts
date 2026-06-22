import fs from 'fs';
import path from 'path';
import { BlobServiceClient } from '@azure/storage-blob';
import { TranslationBox } from '../types/contract';

export interface CachedPage {
  pageIndex: number;
  translations: TranslationBox[];
  contexto: string;
}

export interface CachedChapter {
  fileHash: string;
  fileType: string;
  pages: CachedPage[];
}

const CONTAINER_NAME = 'translation-cache';

export class CacheClient {
  private localCacheDir: string;
  private blobServiceClient: BlobServiceClient | null = null;

  constructor() {
    // Definimos el directorio local de fallback: /functions/cache
    this.localCacheDir = path.join(process.cwd(), 'cache');
    
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (connectionString && process.env.USE_MOCK_AZURE !== 'true') {
      try {
        console.log('[CACHE] Initializing Azure Blob Storage client');
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      } catch (err) {
        console.error('[CACHE] Failed to initialize Azure Blob Storage client, falling back to local storage:', err);
      }
    } else {
      console.log('[CACHE] Using local filesystem fallback for cache (functions/cache/)');
    }
  }

  /**
   * Asegura que exista el directorio local.
   */
  private ensureLocalDir() {
    if (!fs.existsSync(this.localCacheDir)) {
      fs.mkdirSync(this.localCacheDir, { recursive: true });
    }
  }

  /**
   * Verifica si existe un archivo traducido en la caché (Azure o local).
   */
  async checkCache(fileHash: string): Promise<CachedChapter | null> {
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
        const downloadedContent = await this.streamToBuffer(
          downloadResponse.readableStreamBody as NodeJS.ReadableStream
        );
        return JSON.parse(downloadedContent.toString('utf8')) as CachedChapter;
      } catch (err) {
        console.error('[CACHE] Azure checkCache error, falling back to local cache check:', err);
      }
    }

    // Fallback local
    try {
      this.ensureLocalDir();
      const localPath = path.join(this.localCacheDir, blobName);
      if (fs.existsSync(localPath)) {
        console.log(`[CACHE] Local: cache hit for hash ${cleanHash}`);
        const data = await fs.promises.readFile(localPath, 'utf8');
        return JSON.parse(data) as CachedChapter;
      }
      console.log(`[CACHE] Local: cache miss for hash ${cleanHash}`);
      return null;
    } catch (err) {
      console.error('[CACHE] Local checkCache error:', err);
      return null;
    }
  }

  /**
   * Almacena el resultado de la traducción en la caché.
   */
  async saveCache(data: CachedChapter): Promise<void> {
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
      } catch (err) {
        console.error('[CACHE] Azure saveCache error, falling back to local save:', err);
      }
    }

    // Fallback local
    try {
      this.ensureLocalDir();
      const localPath = path.join(this.localCacheDir, blobName);
      console.log(`[CACHE] Local: saving translation results for hash ${cleanHash}`);
      await fs.promises.writeFile(localPath, serializedData, 'utf8');
    } catch (err) {
      console.error('[CACHE] Local saveCache error:', err);
    }
  }

  /**
   * Helper para convertir un Stream a Buffer.
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
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

let cacheClientInstance: CacheClient | null = null;
export const getCacheClient = (): CacheClient => {
  if (!cacheClientInstance) {
    cacheClientInstance = new CacheClient();
  }
  return cacheClientInstance;
};
