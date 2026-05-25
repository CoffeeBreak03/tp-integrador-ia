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
    callVisionModel(imageBase64: string): Promise<string>;
    callTranslateModel(texts: string | string[]): Promise<string>;
}
export declare const getAzureClient: () => AzureClient;
//# sourceMappingURL=azure-client.d.ts.map