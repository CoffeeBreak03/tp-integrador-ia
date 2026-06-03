"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineOrchestrator = void 0;
const image_cropper_1 = require("./lib/image-cropper");
const contract_1 = require("./types/contract");
class PipelineOrchestrator {
    constructor(azureClient) {
        this.azureClient = azureClient;
    }
    async processMangaImage(imageBase64) {
        const startTime = Date.now();
        console.log('[ORCHESTRATOR] Starting processMangaImage, input size:', imageBase64.length, 'bytes');
        try {
            // --- Paso A: Detección espacial con Hugging Face (YOLOv8) ---
            console.log('[ORCHESTRATOR] Step 1: Calling HF space for spatial detection...');
            const visionRaw = await this.azureClient.detectTextBubbles(imageBase64);
            console.log('[ORCHESTRATOR] Spatial detection raw response:', visionRaw.length, 'bytes');
            if (!visionRaw || visionRaw === '[]') {
                console.error('[ORCHESTRATOR] ERROR: HF returned empty response');
                return [];
            }
            console.log('[ORCHESTRATOR] Step 2: Parsing spatial output...');
            const visionOutput = this.parseVisionOutput(visionRaw);
            console.log('[ORCHESTRATOR] Spatial output parsed:', visionOutput.boxes.length, 'boxes');
            if (visionOutput.boxes.length === 0) {
                console.error('[ORCHESTRATOR] ERROR: No boxes extracted from spatial detection');
                return [];
            }
            // --- Paso B: Croppear cada globo usando las coordenadas ---
            console.log('[ORCHESTRATOR] Step 3: Cropping individual bubbles...');
            const croppedBubbles = await (0, image_cropper_1.cropBubbles)(imageBase64, visionOutput.boxes);
            console.log('[ORCHESTRATOR] Cropped', croppedBubbles.length, 'bubbles');
            if (croppedBubbles.length === 0) {
                console.error('[ORCHESTRATOR] ERROR: No bubbles could be cropped');
                return [];
            }
            // --- Paso C: OCR y Traducción con Azure GPT-4o ---
            console.log('[ORCHESTRATOR] Step 4: Calling GPT-4o for OCR and translation...');
            const translatedRaw = await this.azureClient.callOcrAndTranslation(croppedBubbles);
            console.log('[ORCHESTRATOR] OCR/Translate raw response length:', translatedRaw.length, 'bytes');
            if (!translatedRaw) {
                console.error('[ORCHESTRATOR] ERROR: Translation returned empty response');
                return [];
            }
            console.log('[ORCHESTRATOR] Step 5: Parsing GPT-4o output...');
            const translations = this.parseOcrAndTranslation(translatedRaw);
            console.log('[ORCHESTRATOR] GPT-4o output parsed:', translations.length, 'items');
            if (translations.length === 0) {
                console.error('[ORCHESTRATOR] ERROR: No translations parsed from GPT-4o response');
            }
            // --- Paso D: Fusionar coordenadas + textos en la respuesta final ---
            console.log('[ORCHESTRATOR] Step 6: Merging results to contract...');
            const result = (0, contract_1.mergeVisionAndTranslation)(visionOutput, translations);
            console.log('[ORCHESTRATOR] Final result:', result.length, 'items');
            const totalTime = Date.now() - startTime;
            console.log('[ORCHESTRATOR] Complete in', totalTime, 'ms');
            return result;
        }
        catch (error) {
            const totalTime = Date.now() - startTime;
            console.error('[ORCHESTRATOR] FATAL ERROR after', totalTime, 'ms:', error instanceof Error ? error.message : error);
            throw error;
        }
    }
    parseVisionOutput(raw) {
        try {
            let parsed = raw;
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
            const globos = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed?.globos)
                    ? parsed.globos
                    : [];
            return {
                boxes: globos.map((box, idx) => {
                    const [y_min, x_min, y_max, x_max] = Array.isArray(box.box) && box.box.length === 4
                        ? box.box.map((value) => Number(value) || 0)
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
        }
        catch (error) {
            console.error('Failed to parse vision output:', error);
            return { boxes: [] };
        }
    }
    parseOcrAndTranslation(raw) {
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
            const translations = JSON.parse(json);
            if (Array.isArray(translations)) {
                return translations.map((t) => ({
                    id: Number(t.id),
                    texto_japones: String(t.texto_japones ?? ''),
                    traduccion_espanol: String(t.traduccion_espanol ?? ''),
                }));
            }
        }
        catch (error) {
            console.warn('[Pipeline] Failed to parse OCR and translations:', error);
            console.warn('[Pipeline] Raw response was:', raw);
        }
        return [];
    }
}
exports.PipelineOrchestrator = PipelineOrchestrator;
//# sourceMappingURL=orchestrator.js.map