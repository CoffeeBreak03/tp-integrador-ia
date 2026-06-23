import { AzureClient } from './lib/azure-client';
import { VisionOutput, PageProcessResult } from './types/contract';
export declare class PipelineOrchestrator {
    private azureClient;
    constructor(azureClient: AzureClient);
    detectTextBubblesOnly(imageBase64: string): Promise<VisionOutput>;
    translatePageOnly(croppedBubbles: Array<{
        id: number;
        base64: string;
    }>, boxes: VisionOutput['boxes'], contexto?: string): Promise<PageProcessResult>;
    processMangaImage(imageBase64: string, contexto?: string): Promise<PageProcessResult>;
    /**
     * Ordena recursivamente las cajas de texto en orden de lectura de manga:
     * De Derecha a Izquierda (RTL) y de Arriba a Abajo (TTB).
     * Utiliza el concepto de Recursive XY-Cut adaptado para cajas de texto.
     */
    private sortMangaBoxes;
    /**
     * Elimina duplicados espaciales solapados cuya lectura de OCR coincide de manera parcial.
     * Si la caja A (más chica) está cubierta más de un 70% de su propia área por la caja B, y
     * sus textos coinciden como subcadena, descartamos la caja A.
     */
    private removeDuplicateOverlaps;
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