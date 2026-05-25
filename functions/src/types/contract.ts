// Placeholder para types/contract.ts
// Implementar según T3.3 en 3_BACKEND_Y_APIS.md

export interface TranslationBox {
  id: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
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

const normalizeWhitespace = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

export const denormalizeVisionToContract = (
  visionOutput: VisionOutput,
  translations: Map<string, string>
): TranslationBox[] => {
  return visionOutput.boxes.map((box) => {
    const normalized = normalizeWhitespace(box.text);
    let translated = '';

    // Try to find translation with normalized text
    for (const [key, value] of translations.entries()) {
      if (normalizeWhitespace(key) === normalized) {
        translated = value;
        break;
      }
    }

    return {
      id: box.id,
      box: [box.y_min, box.x_min, box.y_max, box.x_max],
      texto_original: box.text,
      texto_traducido: translated,
    };
  });
};
