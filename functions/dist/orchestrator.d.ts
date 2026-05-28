import { AzureClient } from './lib/azure-client';
import { TranslationBox } from './types/contract';
export declare class PipelineOrchestrator {
    private azureClient;
    constructor(azureClient: AzureClient);
    processMangaImage(imageBase64: string): Promise<TranslationBox[]>;
    private parseVisionOutput;
    private parseBoxArray;
    private parseTranslations;
    private normalizeVisionOutput;
    private getImageSizeFromBase64;
}
//# sourceMappingURL=orchestrator.d.ts.map