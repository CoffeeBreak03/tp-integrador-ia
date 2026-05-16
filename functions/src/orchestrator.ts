// Placeholder para orchestrator.ts
// Implementar según T3.4 en 3_BACKEND_Y_APIS.md

import { AzureClient } from './lib/azure-client';
import { TranslationBox, VisionOutput, denormalizeVisionToContract } from './types/contract';

export class PipelineOrchestrator {
  constructor(private azureClient: AzureClient) {}

  async processMangaImage(imageBase64: string): Promise<TranslationBox[]> {
    console.log('[Pipeline] Step 1: Visión/OCR');
    // TODO: Implementar pipeline

    console.log('[Pipeline] Step 2: Traducción');
    // TODO: Implementar pipeline

    console.log('[Pipeline] Mapping to contract');
    // TODO: Implementar mapping

    return [];
  }

  private parseVisionOutput(raw: string): VisionOutput {
    // TODO: Implementar parsing
    return { boxes: [] };
  }

  private parseTranslations(raw: string, boxCount: number): Map<string, string> {
    // TODO: Implementar parsing
    return new Map();
  }
}
