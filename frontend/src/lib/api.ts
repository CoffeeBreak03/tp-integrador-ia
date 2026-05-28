import { validateContract, type TranslationContract } from './contract';

export interface ProcessImageRequest {
  imageBase64: string;
}

export interface ProcessImageResponse {
  data?: TranslationContract[];
  error?: string;
}

/**
 * Envía una imagen al backend para procesarla (OCR + Traducción).
 * El backend retorna las traducciones con las coordenadas de los boxes normalizados.
 * 
 * @param imageBase64 - Imagen en formato base64 (incluyendo el data URI)
 * @returns Promise con el array de traducciones o null si hay error
 */
export async function processImage(imageBase64: string): Promise<TranslationContract[] | null> {
  try {
    const response = await fetch('/.netlify/functions/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
      } as ProcessImageRequest),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ProcessImageResponse;
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = (await response.json()) as ProcessImageResponse | TranslationContract[];

    // Si la respuesta es un array directo, usar como está
    const translations = Array.isArray(data) ? data : data.data;

    if (!translations) {
      throw new Error('La respuesta del backend no contiene traducciones');
    }

    // Validar que respete el contrato
    if (!validateContract(translations)) {
      throw new Error('Las traducciones no cumplen el contrato esperado');
    }

    return translations;
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    throw error;
  }
}
