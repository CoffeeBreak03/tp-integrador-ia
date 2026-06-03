"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cropBubbles = cropBubbles;
const jimp_1 = __importDefault(require("jimp"));
/**
 * Cropea la imagen original según las coordenadas normalizadas (0-1000)
 * y devuelve una lista de sub-imágenes en base64 (JPEG).
 */
async function cropBubbles(imageBase64, boxes) {
    const startTime = Date.now();
    console.log('[CROPPER] Starting crop for', boxes.length, 'boxes');
    // Decodificar la imagen base64 a buffer
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const imageBuffer = Buffer.from(cleanBase64, 'base64');
    const image = await jimp_1.default.read(imageBuffer);
    const imgWidth = image.bitmap.width;
    const imgHeight = image.bitmap.height;
    console.log('[CROPPER] Image dimensions:', imgWidth, 'x', imgHeight);
    const results = [];
    for (const box of boxes) {
        // Convertir coordenadas normalizadas (0-1000) a píxeles reales
        const x = Math.floor((box.x_min / 1000) * imgWidth);
        const y = Math.floor((box.y_min / 1000) * imgHeight);
        const w = Math.max(1, Math.floor(((box.x_max - box.x_min) / 1000) * imgWidth));
        const h = Math.max(1, Math.floor(((box.y_max - box.y_min) / 1000) * imgHeight));
        console.log(`[CROPPER] Box ${box.id}: x=${x}, y=${y}, w=${w}, h=${h}`);
        // Clonar y cropear
        const cropped = image.clone().crop(x, y, w, h);
        // Convertir a JPEG base64
        const croppedBuffer = await cropped.getBufferAsync(jimp_1.default.MIME_JPEG);
        const croppedBase64 = croppedBuffer.toString('base64');
        results.push({ id: box.id, base64: croppedBase64 });
    }
    console.log('[CROPPER] Cropped', results.length, 'bubbles in', Date.now() - startTime, 'ms');
    return results;
}
//# sourceMappingURL=image-cropper.js.map