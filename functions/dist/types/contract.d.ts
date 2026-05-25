export interface TranslationBox {
    id: number;
    box: [number, number, number, number];
    texto_original: string;
    texto_traducido: string;
}
export interface VisionOutput {
    boxes: Array<{
        id: number;
        y_min: number;
        x_min: number;
        y_max: number;
        x_max: number;
        text: string;
    }>;
}
export declare const denormalizeVisionToContract: (visionOutput: VisionOutput, translations: Map<string, string>) => TranslationBox[];
//# sourceMappingURL=contract.d.ts.map