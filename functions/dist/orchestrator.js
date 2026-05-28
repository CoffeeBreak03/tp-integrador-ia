"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineOrchestrator = void 0;
const contract_1 = require("./types/contract");
class PipelineOrchestrator {
    constructor(azureClient) {
        this.azureClient = azureClient;
    }
    async processMangaImage(imageBase64) {
        const imageSize = this.getImageSizeFromBase64(imageBase64);
        const visionRaw = await this.azureClient.callVisionModel(imageBase64);
        const visionOutput = this.parseVisionOutput(visionRaw);
        const normalizedVisionOutput = this.normalizeVisionOutput(visionOutput, imageSize);
        // Collect all texts and send together for context
        const textsToTranslate = normalizedVisionOutput.boxes
            .filter(box => box.text && box.text.trim())
            .map(box => box.text);
        const translatedRaw = await this.azureClient.callTranslateModel(textsToTranslate);
        const translations = this.parseTranslations(translatedRaw, textsToTranslate);
        return (0, contract_1.denormalizeVisionToContract)(normalizedVisionOutput, translations);
    }
    parseVisionOutput(raw) {
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
                boxes: parsed.map((box, idx) => {
                    // Handle different coordinate formats from Azure
                    let y_min = 0, x_min = 0, y_max = 0, x_max = 0;
                    if (box.y_min !== undefined && box.x_min !== undefined && box.y_max !== undefined && box.x_max !== undefined) {
                        y_min = Number(box.y_min) || 0;
                        x_min = Number(box.x_min) || 0;
                        y_max = Number(box.y_max) || 0;
                        x_max = Number(box.x_max) || 0;
                    }
                    else if (box.box && Array.isArray(box.box) && box.box.length === 4) {
                        [y_min, x_min, y_max, x_max] = this.parseBoxArray(box.box);
                    }
                    else if (box.coordinates) {
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
        }
        catch (error) {
            console.error('Failed to parse vision output:', error);
            return { boxes: [] };
        }
    }
    parseBoxArray(boxArray) {
        const values = boxArray.map((value) => Number(value) || 0);
        if (values.length !== 4) {
            return [0, 0, 0, 0];
        }
        const [a, b, c, d] = values;
        const standard = [a, b, c, d];
        const swapped = [b, a, d, c];
        const standardValid = c >= a && d >= b;
        const swappedValid = d >= b && c >= a;
        if (standardValid && !swappedValid)
            return standard;
        if (!standardValid && swappedValid)
            return swapped;
        const widthStandard = d - b;
        const heightStandard = c - a;
        const widthSwapped = c - a;
        const heightSwapped = d - b;
        const standardDimsValid = widthStandard >= 0 && heightStandard >= 0;
        const swappedDimsValid = widthSwapped >= 0 && heightSwapped >= 0;
        if (standardDimsValid && !swappedDimsValid)
            return standard;
        if (!standardDimsValid && swappedDimsValid)
            return swapped;
        if (standardDimsValid && swappedDimsValid) {
            return widthStandard + heightStandard >= widthSwapped + heightSwapped
                ? standard
                : swapped;
        }
        return standard;
    }
    parseTranslations(raw, originalTexts) {
        const map = new Map();
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
                translations.forEach((t) => {
                    if (t?.original && t?.translated) {
                        map.set(String(t.original), String(t.translated));
                    }
                });
            }
        }
        catch (error) {
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
    normalizeVisionOutput(output, imageSize) {
        if (!imageSize) {
            return output;
        }
        const { width, height } = imageSize;
        const allXWithinWidth = output.boxes.every((box) => box.x_min >= 0 && box.x_max <= width);
        const allYWithinHeight = output.boxes.every((box) => box.y_min >= 0 && box.y_max <= height);
        if (!allXWithinWidth || !allYWithinHeight) {
            return output;
        }
        return {
            boxes: output.boxes.map((box) => ({
                ...box,
                y_min: Math.round((box.y_min / height) * 1000),
                x_min: Math.round((box.x_min / width) * 1000),
                y_max: Math.round((box.y_max / height) * 1000),
                x_max: Math.round((box.x_max / width) * 1000),
            })),
        };
    }
    getImageSizeFromBase64(imageBase64) {
        try {
            const commaIndex = imageBase64.indexOf(',');
            const base64 = commaIndex >= 0 ? imageBase64.slice(commaIndex + 1) : imageBase64;
            const buffer = Buffer.from(base64, 'base64');
            if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
                return {
                    width: buffer.readUInt32BE(16),
                    height: buffer.readUInt32BE(20),
                };
            }
            if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
                let i = 2;
                while (i < buffer.length) {
                    if (buffer[i] !== 0xff) {
                        i += 1;
                        continue;
                    }
                    const marker = buffer[i + 1];
                    const length = buffer.readUInt16BE(i + 2);
                    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
                        return {
                            width: buffer.readUInt16BE(i + 7),
                            height: buffer.readUInt16BE(i + 5),
                        };
                    }
                    i += 2 + length;
                }
            }
        }
        catch {
            // Ignore parse errors and return null if size cannot be determined.
        }
        return null;
    }
}
exports.PipelineOrchestrator = PipelineOrchestrator;
//# sourceMappingURL=orchestrator.js.map