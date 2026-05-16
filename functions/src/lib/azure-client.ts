// Placeholder para lib/azure-client.ts
// Implementar según T3.2 en 3_BACKEND_Y_APIS.md

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  modelVision: string;
  modelTranslate: string;
}

export class AzureClient {
  private config: AzureConfig;

  constructor(config: AzureConfig) {
    this.config = config;
  }

  async callVisionModel(imageBase64: string): Promise<string> {
    // TODO: Implementar llamada a Azure Vision API
    throw new Error('Not implemented yet');
  }

  async callTranslateModel(text: string): Promise<string> {
    // TODO: Implementar llamada a Azure Translate API
    throw new Error('Not implemented yet');
  }
}

export const getAzureClient = (): AzureClient => {
  return new AzureClient({
    endpoint: process.env.AZURE_FOUNDRY_ENDPOINT || '',
    apiKey: process.env.AZURE_FOUNDRY_API_KEY || '',
    modelVision: process.env.AZURE_FOUNDRY_MODEL_VISION || '',
    modelTranslate: process.env.AZURE_FOUNDRY_MODEL_TRANSLATE || '',
  });
};
