// Placeholder para types/contract.ts
// Implementar según T3.3 en 3_BACKEND_Y_APIS.md

export interface TranslationBox {
  id: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  texto_original: string;
  texto_traducido: string;
}

export interface CroppedBubble {
  id: number;
  base64: string;
}

export interface VisionOutput {
  boxes: Array<{
    id: number;
    y_min: number;
    x_min: number;
    y_max: number;
    x_max: number;
  }>;
  croppedBubbles?: CroppedBubble[];
}

/**
 * Resultado de procesar una página con contexto acumulativo.
 * El campo `contexto` se reenvía a la siguiente página para mantener
 * coherencia narrativa en traducciones de capítulos completos.
 */
export interface PageProcessResult {
  contexto: string;
  translations: TranslationBox[];
}

export interface GptTranslation {
  id: number;
  texto_japones: string;
  traduccion_espanol: string;
}

export const mergeVisionAndTranslation = (
  visionOutput: VisionOutput,
  translations: GptTranslation[]
): TranslationBox[] => {
  return visionOutput.boxes.map((box) => {
    const translation = translations.find((t) => t.id === box.id);
    return {
      id: box.id,
      box: [box.y_min, box.x_min, box.y_max, box.x_max],
      texto_original: translation?.texto_japones ?? '',
      texto_traducido: translation?.traduccion_espanol ?? '',
    };
  });
};
