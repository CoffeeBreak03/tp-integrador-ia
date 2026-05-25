import { AzureClient } from './lib/azure-client';
import { TranslationBox, VisionOutput, denormalizeVisionToContract } from './types/contract';

export class PipelineOrchestrator {
  constructor(private azureClient: AzureClient) { }

  async processMangaImage(imageBase64: string): Promise<TranslationBox[]> {
    const visionRaw = await this.azureClient.callVisionModel(imageBase64);
    const visionOutput = this.parseVisionOutput(visionRaw);

    // Collect all texts and send together for context
    // Collect all texts and send together for context
    const textsToTranslate = visionOutput.boxes
      .filter(box => box.text && box.text.trim())
      .map(box => box.text);

    const translatedRaw = await this.azureClient.callTranslateModel(textsToTranslate);
    const translations = this.parseTranslations(translatedRaw, textsToTranslate);

    return denormalizeVisionToContract(visionOutput, translations);
  }

  private parseVisionOutput(raw: string): VisionOutput {
    try {
      // Remove markdown code blocks if present
      let json = raw;
      if (raw.includes('```')) {
        const start = raw.indexOf('```');
        const end = raw.lastIndexOf('```');
        if (start !== end && end > start) {
          json = raw.substring(start + 3, end).trim();
          // Remove optional "json" language identifier
          if (json.startsWith('json')) {
            json = json.substring(4).trim();
          }
        }
      }

      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        throw new Error('Vision output is not an array');
      }

      return {
        boxes: parsed.map((box: any, idx: number) => {
          // Handle different coordinate formats from Azure
          let y_min = 0, x_min = 0, y_max = 0, x_max = 0;

          if (box.y_min !== undefined && box.x_min !== undefined && box.y_max !== undefined && box.x_max !== undefined) {
            y_min = Number(box.y_min) || 0;
            x_min = Number(box.x_min) || 0;
            y_max = Number(box.y_max) || 0;
            x_max = Number(box.x_max) || 0;
          } else if (box.box && Array.isArray(box.box) && box.box.length === 4) {
            // Alternative format: box: [y_min, x_min, y_max, x_max]
            [y_min, x_min, y_max, x_max] = box.box.map((v: any) => Number(v) || 0);
          } else if (box.coordinates) {
            // Alternative format: coordinates object
            y_min = Number(box.coordinates.top) || 0;
            x_min = Number(box.coordinates.left) || 0;
            y_max = Number(box.coordinates.bottom) || 0;
            x_max = Number(box.coordinates.right) || 0;
          }

          return {
            id: idx + 1,
            y_min: Math.min(Math.max(y_min, 0), 1000),
            x_min: Math.min(Math.max(x_min, 0), 1000),
            y_max: Math.min(Math.max(y_max, 0), 1000),
            x_max: Math.min(Math.max(x_max, 0), 1000),
            text: String(box.text || ''),
          };
        }),
      };
    } catch (error) {
      console.error('Failed to parse vision output:', error);
      return { boxes: [] };
    }
  }

  private parseTranslations(raw: string, originalTexts: string[]): Map<string, string> {
    const map = new Map<string, string>();
    try {
      // Remove markdown code blocks if present
      let json = raw;
      if (raw.includes('```')) {
        const start = raw.indexOf('```');
        const end = raw.lastIndexOf('```');
        if (start !== end && end > start) {
          json = raw.substring(start + 3, end).trim();
          // Remove optional "json" language identifier
          if (json.startsWith('json')) {
            json = json.substring(4).trim();
          }
        }
      }

      const translations = JSON.parse(json);
      if (Array.isArray(translations)) {
        translations.forEach((t: any) => {
          if (t?.original && t?.translated) {
            map.set(String(t.original), String(t.translated));
          }
        });
      }
    } catch (error) {
      console.warn('[Pipeline] Failed to parse translations:', error);
    }

    // Fallback: if no translations found, map all originals to empty
    if (map.size === 0) {
      originalTexts.forEach((text) => {
        map.set(text, '');
      });
    }

    return map;
  }
}
