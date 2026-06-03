"use strict";
// Placeholder para types/contract.ts
// Implementar según T3.3 en 3_BACKEND_Y_APIS.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeVisionAndTranslation = void 0;
const mergeVisionAndTranslation = (visionOutput, translations) => {
    return visionOutput.boxes.map((box) => {
        const translation = translations.find((t) => t.id === box.id);
        return {
            id: box.id,
            box: [box.y_min, box.x_min, box.y_max, box.x_max],
            texto_original: translation?.texto_japones ?? '',
            texto_traducido: translation?.traduccion_espanol ?? '',
        };
    });
};
exports.mergeVisionAndTranslation = mergeVisionAndTranslation;
//# sourceMappingURL=contract.js.map