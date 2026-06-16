import { CroppedBubble } from './image-cropper';
export interface AzureConfig {
    endpoint: string;
    apiKey: string;
    modelVision: string;
    modelTranslate: string;
}
export declare class AzureClient {
    private config;
    constructor(config: AzureConfig);
    private readMockFile;
    private getHfSpaceUrl;
    private normalizeBase64;
    detectTextBubbles(imageBase64: string): Promise<string>;
    /**
     * Llama a Azure GPT-4o con una lista de sub-imágenes (una por globo) ya cropeadas.
     * Retorna JSON con contexto y traducciones:
     * { "contexto": "...", "traducciones": [{ id, texto_japones, traduccion_espanol }] }
     *
     * Si no se provee contexto, retorna el mismo formato con contexto vacío.
     */
    callOcrAndTranslation(croppedBubbles: CroppedBubble[], contexto?: string): Promise<string>;
    /**
     * Compatibility wrapper calling detectTextBubbles (YOLOv8)
     */
    callVisionModel(imageBase64: string): Promise<string>;
    /**
     * Compatibility wrapper doing text-only translation using GPT-4o
     */
    callTranslateModel(text: string): Promise<string>;
}
export declare const getAzureClient: () => AzureClient;
//# sourceMappingURL=azure-client.d.ts.map