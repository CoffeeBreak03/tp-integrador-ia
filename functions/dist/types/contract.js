"use strict";
// Placeholder para types/contract.ts
// Implementar según T3.3 en 3_BACKEND_Y_APIS.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.denormalizeVisionToContract = void 0;
const normalizeWhitespace = (text) => {
    return text.replace(/\s+/g, ' ').trim();
};
const denormalizeVisionToContract = (visionOutput, translations) => {
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
exports.denormalizeVisionToContract = denormalizeVisionToContract;
//# sourceMappingURL=contract.js.map