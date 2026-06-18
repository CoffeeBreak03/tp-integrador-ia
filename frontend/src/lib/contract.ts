export interface TranslationContract {
  id: number;
  box: [number, number, number, number];
  texto_original: string;
  texto_traducido: string;
}

/**
 * Respuesta del backend para procesamiento de una página con contexto acumulativo.
 */
export interface ProcessPageResponse {
  contexto: string;
  translations: TranslationContract[];
}

const isNormalizedBox = (box: unknown): box is [number, number, number, number] => {
  return (
    Array.isArray(box) &&
    box.length === 4 &&
    box.every(
      (coord) => typeof coord === 'number' && Number.isFinite(coord) && coord >= 0 && coord <= 1000
    )
  );
};

export const validateContract = (data: unknown): data is TranslationContract[] => {
  if (!Array.isArray(data)) return false;

  return data.every((item) => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as any).id === 'number' &&
      isNormalizedBox((item as any).box) &&
      typeof (item as any).texto_original === 'string' &&
      (item as any).texto_original.length > 0 &&
      typeof (item as any).texto_traducido === 'string' &&
      (item as any).texto_traducido.length > 0
    );
  });
};

export interface VisionBox {
  id: number;
  y_min: number;
  x_min: number;
  y_max: number;
  x_max: number;
}

export interface VisionOutput {
  boxes: VisionBox[];
}
