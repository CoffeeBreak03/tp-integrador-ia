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
    }>;
}
export interface GptTranslation {
    id: number;
    texto_japones: string;
    traduccion_espanol: string;
}
export declare const mergeVisionAndTranslation: (visionOutput: VisionOutput, translations: GptTranslation[]) => TranslationBox[];
//# sourceMappingURL=contract.d.ts.map