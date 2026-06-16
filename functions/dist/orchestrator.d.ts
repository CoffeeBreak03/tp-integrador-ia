import { AzureClient } from './lib/azure-client';
import { PageProcessResult } from './types/contract';
export declare class PipelineOrchestrator {
    private azureClient;
    constructor(azureClient: AzureClient);
    processMangaImage(imageBase64: string, contexto?: string): Promise<PageProcessResult>;
    private parseVisionOutput;
    /**
     * Parsea la respuesta de GPT-4o que ahora viene en formato:
     * { "contexto": "...", "traducciones": [{ id, texto_japones, traduccion_espanol }] }
     *
     * También soporta el formato legacy (array directo) por retrocompatibilidad.
     */
    private parseOcrAndTranslation;
}
//# sourceMappingURL=orchestrator.d.ts.map