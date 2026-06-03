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
     * Retorna JSON: [{ id, texto_japones, traduccion_espanol }]
     */
    callOcrAndTranslation(croppedBubbles: CroppedBubble[]): Promise<string>;
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