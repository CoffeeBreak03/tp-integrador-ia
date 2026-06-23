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
export declare class CacheClient {
    private localCacheDir;
    private blobServiceClient;
    constructor();
    /**
     * Asegura que exista el directorio local.
     */
    private ensureLocalDir;
    /**
     * Verifica si existe un archivo traducido en la caché (Azure o local).
     */
    checkCache(fileHash: string): Promise<CachedChapter | null>;
    /**
     * Almacena el resultado de la traducción en la caché.
     */
    saveCache(data: CachedChapter): Promise<void>;
    /**
     * Helper para convertir un Stream a Buffer.
     */
    private streamToBuffer;
}
export declare const getCacheClient: () => CacheClient;
//# sourceMappingURL=cache-client.d.ts.map