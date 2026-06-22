"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineOrchestrator = void 0;
const image_cropper_1 = require("./lib/image-cropper");
const contract_1 = require("./types/contract");
class PipelineOrchestrator {
    constructor(azureClient) {
        this.azureClient = azureClient;
    }
    async detectTextBubblesOnly(imageBase64) {
        console.log('[ORCHESTRATOR] Starting detectTextBubblesOnly');
        const visionRaw = await this.azureClient.detectTextBubbles(imageBase64);
        console.log('[ORCHESTRATOR] Spatial detection raw response:', visionRaw.length, 'bytes');
        if (!visionRaw || visionRaw === '[]') {
            console.error('[ORCHESTRATOR] ERROR: HF returned empty response');
            return { boxes: [] };
        }
        const visionOutput = this.parseVisionOutput(visionRaw);
        console.log('[ORCHESTRATOR] Spatial output parsed:', visionOutput.boxes.length, 'boxes');
        if (visionOutput.boxes.length === 0) {
            console.error('[ORCHESTRATOR] ERROR: No boxes extracted from spatial detection');
            return { boxes: [] };
        }
        // Ordenar cajas según el orden de lectura manga (Recursive XY-Cut) e indexar de 1 a N
        console.log('[ORCHESTRATOR] Sorting boxes in manga reading order...');
        const sortedBoxes = this.sortMangaBoxes(visionOutput.boxes);
        const reindexedBoxes = sortedBoxes.map((box, index) => ({
            ...box,
            id: index + 1
        }));
        console.log('[ORCHESTRATOR] Sorted and reindexed boxes in reading order');
        // Croppear cada globo usando las coordenadas en la fase de detección
        console.log('[ORCHESTRATOR] Step 2.5: Cropping individual bubbles...');
        const croppedBubbles = await (0, image_cropper_1.cropBubbles)(imageBase64, reindexedBoxes);
        console.log('[ORCHESTRATOR] Cropped', croppedBubbles.length, 'bubbles');
        return { boxes: reindexedBoxes, croppedBubbles };
    }
    async translatePageOnly(croppedBubbles, boxes, contexto) {
        console.log('[ORCHESTRATOR] Starting translatePageOnly for', boxes.length, 'boxes');
        if (boxes.length === 0 || croppedBubbles.length === 0) {
            return { contexto: contexto || '', translations: [] };
        }
        // OCR y Traducción con Azure GPT-4o (con contexto)
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
        // Fusionar coordenadas + textos en la respuesta final
        console.log('[ORCHESTRATOR] Step 6: Merging results to contract...');
        const mergedResults = (0, contract_1.mergeVisionAndTranslation)({ boxes }, gptTranslations);
        // Filtrar solapamientos duplicados
        console.log('[ORCHESTRATOR] Step 7: Filtering overlapping duplicates...');
        const finalTranslations = this.removeDuplicateOverlaps(mergedResults);
        console.log('[ORCHESTRATOR] Final translations count:', finalTranslations.length, 'of', mergedResults.length);
        return { contexto: updatedContexto, translations: finalTranslations };
    }
    async processMangaImage(imageBase64, contexto) {
        const startTime = Date.now();
        console.log('[ORCHESTRATOR] Starting processMangaImage, input size:', imageBase64.length, 'bytes');
        if (contexto) {
            console.log('[ORCHESTRATOR] Chapter context provided:', contexto.length, 'chars');
        }
        try {
            const visionOutput = await this.detectTextBubblesOnly(imageBase64);
            if (visionOutput.boxes.length === 0) {
                return { contexto: contexto || '', translations: [] };
            }
            const result = await this.translatePageOnly(visionOutput.croppedBubbles || [], visionOutput.boxes, contexto);
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
    /**
     * Ordena recursivamente las cajas de texto en orden de lectura de manga:
     * De Derecha a Izquierda (RTL) y de Arriba a Abajo (TTB).
     * Utiliza el concepto de Recursive XY-Cut adaptado para cajas de texto.
     */
    sortMangaBoxes(boxes) {
        if (boxes.length <= 1)
            return boxes;
        // 1. Intentar corte horizontal (gutter en Y)
        const sortedByY = [...boxes].sort((a, b) => a.y_min - b.y_min);
        let splitY = -1;
        let maxY = sortedByY[0].y_max;
        for (let i = 0; i < sortedByY.length - 1; i++) {
            if (sortedByY[i].y_max > maxY) {
                maxY = sortedByY[i].y_max;
            }
            if (sortedByY[i + 1].y_min > maxY + 10) {
                splitY = (maxY + sortedByY[i + 1].y_min) / 2;
                break;
            }
        }
        if (splitY !== -1) {
            const top = boxes.filter(b => (b.y_min + b.y_max) / 2 < splitY);
            const bottom = boxes.filter(b => (b.y_min + b.y_max) / 2 >= splitY);
            return [...this.sortMangaBoxes(top), ...this.sortMangaBoxes(bottom)];
        }
        // 2. Intentar corte vertical (gutter en X)
        const sortedByX = [...boxes].sort((a, b) => a.x_min - b.x_min);
        let splitX = -1;
        let maxX = sortedByX[0].x_max;
        for (let i = 0; i < sortedByX.length - 1; i++) {
            if (sortedByX[i].x_max > maxX) {
                maxX = sortedByX[i].x_max;
            }
            if (sortedByX[i + 1].x_min > maxX + 10) {
                splitX = (maxX + sortedByX[i + 1].x_min) / 2;
                break;
            }
        }
        if (splitX !== -1) {
            const left = boxes.filter(b => (b.x_min + b.x_max) / 2 < splitX);
            const right = boxes.filter(b => (b.x_min + b.x_max) / 2 >= splitX);
            // En manga RTL, la columna derecha (right) se lee primero
            return [...this.sortMangaBoxes(right), ...this.sortMangaBoxes(left)];
        }
        // 3. Caso base: ordenar por Y ascendente (arriba a abajo).
        // Con tolerancia vertical de 40 unidades (4% alto) para ordenar de derecha a izquierda (X descendente)
        return [...boxes].sort((a, b) => {
            const cyA = (a.y_min + a.y_max) / 2;
            const cyB = (b.y_min + b.y_max) / 2;
            const cxA = (a.x_min + a.x_max) / 2;
            const cxB = (b.x_min + b.x_max) / 2;
            if (Math.abs(cyA - cyB) < 40) {
                return cxB - cxA; // Derecha a Izquierda
            }
            return cyA - cyB; // Arriba a Abajo
        });
    }
    /**
     * Elimina duplicados espaciales solapados cuya lectura de OCR coincide de manera parcial.
     * Si la caja A (más chica) está cubierta más de un 70% de su propia área por la caja B, y
     * sus textos coinciden como subcadena, descartamos la caja A.
     */
    removeDuplicateOverlaps(translations) {
        const toKeep = new Set(translations.map(t => t.id));
        for (let i = 0; i < translations.length; i++) {
            for (let j = i + 1; j < translations.length; j++) {
                const tA = translations[i];
                const tB = translations[j];
                const [yminA, xminA, ymaxA, xmaxA] = tA.box;
                const [yminB, xminB, ymaxB, xmaxB] = tB.box;
                const areaA = (xmaxA - xminA) * (ymaxA - yminA);
                const areaB = (xmaxB - xminB) * (ymaxB - yminB);
                if (areaA === 0 || areaB === 0)
                    continue;
                const xOverlap = Math.max(0, Math.min(xmaxA, xmaxB) - Math.max(xminA, xminB));
                const yOverlap = Math.max(0, Math.min(ymaxA, ymaxB) - Math.max(yminA, yminB));
                const intersectionArea = xOverlap * yOverlap;
                if (intersectionArea === 0)
                    continue;
                const [smaller, larger] = areaA < areaB ? [tA, tB] : [tB, tA];
                const smallerArea = areaA < areaB ? areaA : areaB;
                if (intersectionArea / smallerArea > 0.7) {
                    const cleanTextSmaller = smaller.texto_original.replace(/[\s\p{P}]/gu, '');
                    const cleanTextLarger = larger.texto_original.replace(/[\s\p{P}]/gu, '');
                    // Si alguno tiene OCR vacío, eliminamos ese específicamente
                    if (cleanTextLarger === '') {
                        console.log(`[ORCHESTRATOR] Removing overlapping duplicate box (empty OCR): ID ${larger.id} (Text: "${larger.texto_original}"). Overlaps with ID ${smaller.id} (Text: "${smaller.texto_original}")`);
                        toKeep.delete(larger.id);
                    }
                    if (cleanTextSmaller === '') {
                        console.log(`[ORCHESTRATOR] Removing overlapping duplicate box (empty OCR): ID ${smaller.id} (Text: "${smaller.texto_original}"). Overlapped by ID ${larger.id} (Text: "${larger.texto_original}")`);
                        toKeep.delete(smaller.id);
                    }
                    // Si ambos tienen texto y hay coincidencia parcial, eliminamos el más chico
                    if (cleanTextSmaller !== '' && cleanTextLarger !== '') {
                        if (cleanTextLarger.includes(cleanTextSmaller) || cleanTextSmaller.includes(cleanTextLarger)) {
                            console.log(`[ORCHESTRATOR] Removing overlapping duplicate box (substring): ID ${smaller.id} (Text: "${smaller.texto_original}") overlapped by ID ${larger.id} (Text: "${larger.texto_original}")`);
                            toKeep.delete(smaller.id);
                        }
                    }
                }
            }
        }
        return translations.filter(t => toKeep.has(t.id));
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
                    // Aplicar margen de seguridad (padding) del 5% del tamaño de la caja (mínimo 10 unidades)
                    const w = x_max - x_min;
                    const h = y_max - y_min;
                    const padX = Math.max(Math.round(w * 0.05), 10);
                    const padY = Math.max(Math.round(h * 0.05), 10);
                    return {
                        id: Number(box.id) || idx + 1,
                        y_min: Math.min(Math.max(y_min - padY, 0), 1000),
                        x_min: Math.min(Math.max(x_min - padX, 0), 1000),
                        y_max: Math.min(Math.max(y_max + padY, 0), 1000),
                        x_max: Math.min(Math.max(x_max + padX, 0), 1000),
                    };
                }),
            };
        }
        catch (error) {
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
    parseOcrAndTranslation(raw, fallbackContexto) {
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
                    translations: traducciones.map((t) => ({
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
                    translations: parsed.map((t) => ({
                        id: Number(t.id),
                        texto_japones: String(t.texto_japones ?? ''),
                        traduccion_espanol: String(t.traduccion_espanol ?? ''),
                    })),
                };
            }
        }
        catch (error) {
            console.warn('[Pipeline] Failed to parse OCR and translations:', error);
            console.warn('[Pipeline] Raw response was:', raw);
        }
        return { contexto: fallbackContexto || '', translations: [] };
    }
}
exports.PipelineOrchestrator = PipelineOrchestrator;
//# sourceMappingURL=orchestrator.js.map