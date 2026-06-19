import { validateContract, type TranslationContract, type ProcessPageResponse, type VisionOutput, type VisionBox, type CroppedBubble } from './contract';

export interface ProcessImageRequest {
  imageBase64: string;
  contexto?: string;
}

export interface ProcessImageResponse {
  data?: TranslationContract[];
  error?: string;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

/**
 * Realiza un fetch con reintentos automáticos y backoff exponencial.
 * Reintenta en errores 502 (HF cold start / timeout) y errores de red.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Reintentar en errores de servidor transitorios (500, 502, 503, 504)
      if (((response.status >= 502 && response.status <= 504) || response.status === 500) && attempt < retries) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[API] Retry ${attempt + 1}/${retries} after ${response.status}, waiting ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Reintentar en errores de red (AbortError no se reintenta)
      if (lastError.name === 'AbortError') throw lastError;

      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[API] Retry ${attempt + 1}/${retries} after network error, waiting ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error('Failed after retries');
}

/**
 * Procesa una página de manga enviando la imagen y un contexto opcional.
 * Retorna la respuesta con traducciones y el contexto actualizado.
 *
 * @param imageBase64 - Imagen en formato base64 (incluyendo el data URI)
 * @param contexto - Contexto acumulativo del capítulo (vacío para primera página o imagen suelta)
 * @returns Promise con { contexto, translations }
 */
export async function processPage(
  imageBase64: string,
  contexto?: string
): Promise<ProcessPageResponse> {
  const controller = new AbortController();
  // 120 second timeout for HF Space cold start
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetchWithRetry(
      '/api/process',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          contexto: contexto || undefined,
        } as ProcessImageRequest),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error || `Error ${response.status}`);
    }

    const data = await response.json();

    // Nuevo formato: { contexto, translations }
    if (data && typeof data === 'object' && 'translations' in data) {
      const translations = data.translations;
      if (!validateContract(translations)) {
        throw new Error('Las traducciones no cumplen el contrato esperado');
      }
      return {
        contexto: typeof data.contexto === 'string' ? data.contexto : '',
        translations,
      };
    }

    // Formato legacy: array directo (retrocompatibilidad)
    const translations = Array.isArray(data) ? data : (data as ProcessImageResponse).data;
    if (!translations) {
      throw new Error('La respuesta del backend no contiene traducciones');
    }
    if (!validateContract(translations)) {
      throw new Error('Las traducciones no cumplen el contrato esperado');
    }
    return { contexto: '', translations };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error al procesar página:', error);
    throw error;
  }
}

/**
 * Envía una imagen al backend para procesarla (OCR + Traducción).
 * Wrapper retrocompatible que delega a processPage.
 *
 * @param imageBase64 - Imagen en formato base64 (incluyendo el data URI)
 * @returns Promise con el array de traducciones o null si hay error
 */
export async function processImage(imageBase64: string): Promise<TranslationContract[] | null> {
  const result = await processPage(imageBase64);
  return result.translations;
}

/**
 * Envía una imagen al backend para detectar los globos de diálogo (YOLOv8).
 * Retorna las coordenadas de las cajas detectadas y ordenadas.
 */
export async function detectPage(
  imageBase64: string
): Promise<VisionOutput> {
  const controller = new AbortController();
  // 120 second timeout for HF Space cold start
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetchWithRetry(
      '/api/detect',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error || `Error ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray((data as any).boxes)) {
      return data as VisionOutput;
    }
    throw new Error('Respuesta de detección inválida');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error al detectar globos:', error);
    throw error;
  }
}

/**
 * Envía la imagen y las cajas detectadas para realizar el OCR y la traducción.
 * Retorna la respuesta con traducciones y el contexto actualizado.
 */
export async function translatePageWithBoxes(
  croppedBubbles: CroppedBubble[],
  boxes: VisionBox[],
  contexto?: string
): Promise<ProcessPageResponse> {
  const controller = new AbortController();
  // 120 second timeout for GPT-4o
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetchWithRetry(
      '/api/translate-page',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          croppedBubbles,
          boxes,
          contexto: contexto || undefined,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error || `Error ${response.status}`);
    }

    const data = await response.json();

    if (data && typeof data === 'object' && 'translations' in data) {
      const translations = data.translations;
      if (!validateContract(translations)) {
        throw new Error('Las traducciones no cumplen el contrato esperado');
      }
      return {
        contexto: typeof data.contexto === 'string' ? data.contexto : '',
        translations,
      };
    }
    throw new Error('Respuesta de traducción inválida');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error al traducir página con cajas:', error);
    throw error;
  }
}
