import { AzureClient } from './lib/azure-client';
import { cropBubbles } from './lib/image-cropper';
import { TranslationBox, VisionOutput, GptTranslation, PageProcessResult, mergeVisionAndTranslation } from './types/contract';

export class PipelineOrchestrator {
  constructor(private azureClient: AzureClient) { }

  async processMangaImage(imageBase64: string, contexto?: string): Promise<PageProcessResult> {
    const startTime = Date.now();
    console.log('[ORCHESTRATOR] Starting processMangaImage, input size:', imageBase64.length, 'bytes');
    if (contexto) {
      console.log('[ORCHESTRATOR] Chapter context provided:', contexto.length, 'chars');
    }
    
    try {
      // --- Paso A: Detección espacial con Hugging Face (YOLOv8) ---
      console.log('[ORCHESTRATOR] Step 1: Calling HF space for spatial detection...');
      const visionRaw = await this.azureClient.detectTextBubbles(imageBase64);
      console.log('[ORCHESTRATOR] Spatial detection raw response:', visionRaw.length, 'bytes');
      
      if (!visionRaw || visionRaw === '[]') {
        console.error('[ORCHESTRATOR] ERROR: HF returned empty response');
        return { contexto: contexto || '', translations: [] };
      }
      
      console.log('[ORCHESTRATOR] Step 2: Parsing spatial output...');
      const visionOutput = this.parseVisionOutput(visionRaw);
      console.log('[ORCHESTRATOR] Spatial output parsed:', visionOutput.boxes.length, 'boxes');
      
      if (visionOutput.boxes.length === 0) {
        console.error('[ORCHESTRATOR] ERROR: No boxes extracted from spatial detection');
        return { contexto: contexto || '', translations: [] };
      }

      // --- Paso B: Croppear cada globo usando las coordenadas ---
      console.log('[ORCHESTRATOR] Step 3: Cropping individual bubbles...');
      const croppedBubbles = await cropBubbles(imageBase64, visionOutput.boxes);
      console.log('[ORCHESTRATOR] Cropped', croppedBubbles.length, 'bubbles');

      if (croppedBubbles.length === 0) {
        console.error('[ORCHESTRATOR] ERROR: No bubbles could be cropped');
        return { contexto: contexto || '', translations: [] };
      }

      // --- Paso C: OCR y Traducción con Azure GPT-4o (con contexto) ---
      console.log('[ORCHESTRATOR] Step 4: Calling GPT-4o for OCR and translation...');
      const translatedRaw = await this.azureClient.callOcrAndTranslation(croppedBubbles, contexto);
      console.log('[ORCHESTRATOR] OCR/Translate raw response length:', translatedRaw.length, 'bytes');
      
      if (!translatedRaw) {
        console.error('[ORCHESTRATOR] ERROR: Translation returned empty response');
        return { contexto: contexto || '', translations: [] };
      }
      
      console.log('[ORCHESTRATOR] Step 5: Parsing GPT-4o output...');
      const { translations: gptTranslations, contexto: updatedContexto } = this.parseOcrAndTranslation(translatedRaw, contexto);
      console.log('[ORCHESTRATOR] GPT-4o output parsed:', gptTranslations.length, 'items, context:', updatedContexto.length, 'chars');
      
      if (gptTranslations.length === 0) {
        console.error('[ORCHESTRATOR] ERROR: No translations parsed from GPT-4o response');
      }

      // --- Paso D: Fusionar coordenadas + textos en la respuesta final ---
      console.log('[ORCHESTRATOR] Step 6: Merging results to contract...');
      const result = mergeVisionAndTranslation(visionOutput, gptTranslations);
      console.log('[ORCHESTRATOR] Final result:', result.length, 'items');
      
      const totalTime = Date.now() - startTime;
      console.log('[ORCHESTRATOR] Complete in', totalTime, 'ms');
      return { contexto: updatedContexto, translations: result };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('[ORCHESTRATOR] FATAL ERROR after', totalTime, 'ms:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private parseVisionOutput(raw: unknown): VisionOutput {
    try {
      let parsed: any = raw;

      if (typeof raw === 'string') {
        let json = raw;
        if (raw.includes('```')) {
          const start = raw.indexOf('```');
          const end = raw.lastIndexOf('```');
          if (start !== end && end > start) {
            json = raw.substring(start + 3, end).trim();
            if (json.startsWith('json')) {
              json = json.substring(4).trim();
            }
          }
        }
        parsed = JSON.parse(json);
      }

      const globos: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.globos)
          ? parsed.globos
          : [];

      return {
        boxes: globos.map((box: any, idx: number) => {
          const [y_min, x_min, y_max, x_max] = Array.isArray(box.box) && box.box.length === 4
            ? box.box.map((value: any) => Number(value) || 0)
            : [0, 0, 0, 0];

          return {
            id: Number(box.id) || idx + 1,
            y_min: Math.min(Math.max(y_min, 0), 1000),
            x_min: Math.min(Math.max(x_min, 0), 1000),
            y_max: Math.min(Math.max(y_max, 0), 1000),
            x_max: Math.min(Math.max(x_max, 0), 1000),
          };
        }),
      };
    } catch (error) {
      console.error('Failed to parse vision output:', error);
      return { boxes: [] };
    }
  }

  /**
   * Parsea la respuesta de GPT-4o que ahora viene en formato:
   * { "contexto": "...", "traducciones": [{ id, texto_japones, traduccion_espanol }] }
   *
   * También soporta el formato legacy (array directo) por retrocompatibilidad.
   */
  private parseOcrAndTranslation(raw: string, fallbackContexto?: string): { translations: GptTranslation[]; contexto: string } {
    try {
      let json = raw;
      // Limpiar posibles bloques de markdown que GPT-4o pueda incluir
      if (raw.includes('```')) {
        const start = raw.indexOf('```');
        const end = raw.lastIndexOf('```');
        if (start !== end && end > start) {
          json = raw.substring(start + 3, end).trim();
          if (json.startsWith('json')) {
            json = json.substring(4).trim();
          }
        }
      }

      const parsed = JSON.parse(json);

      // Nuevo formato: { contexto, traducciones }
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const contexto = typeof parsed.contexto === 'string' ? parsed.contexto : (fallbackContexto || '');
        const traducciones = Array.isArray(parsed.traducciones) ? parsed.traducciones : [];
        return {
          contexto,
          translations: traducciones.map((t: any) => ({
            id: Number(t.id),
            texto_japones: String(t.texto_japones ?? ''),
            traduccion_espanol: String(t.traduccion_espanol ?? ''),
          })),
        };
      }

      // Formato legacy: array directo [{ id, texto_japones, traduccion_espanol }]
      if (Array.isArray(parsed)) {
        return {
          contexto: fallbackContexto || '',
          translations: parsed.map((t: any) => ({
            id: Number(t.id),
            texto_japones: String(t.texto_japones ?? ''),
            traduccion_espanol: String(t.traduccion_espanol ?? ''),
          })),
        };
      }
    } catch (error) {
      console.warn('[Pipeline] Failed to parse OCR and translations:', error);
      console.warn('[Pipeline] Raw response was:', raw);
    }
    return { contexto: fallbackContexto || '', translations: [] };
  }
}

