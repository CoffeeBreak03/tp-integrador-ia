export interface CroppedBubble {
    id: number;
    base64: string;
}
export interface NormalizedBox {
    id: number;
    y_min: number;
    x_min: number;
    y_max: number;
    x_max: number;
}
/**
 * Cropea la imagen original según las coordenadas normalizadas (0-1000)
 * y devuelve una lista de sub-imágenes en base64 (JPEG).
 */
export declare function cropBubbles(imageBase64: string, boxes: NormalizedBox[]): Promise<CroppedBubble[]>;
//# sourceMappingURL=image-cropper.d.ts.map