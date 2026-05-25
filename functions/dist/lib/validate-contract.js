"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTranslationContract = void 0;
const isTranslationBox = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'number' &&
        value.id >= 1 &&
        Array.isArray(value.box) &&
        value.box.length === 4 &&
        value.box.every((coordinate) => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1000) &&
        typeof value.texto_original === 'string' &&
        value.texto_original.trim().length > 0 &&
        typeof value.texto_traducido === 'string' &&
        value.texto_traducido.trim().length > 0);
};
const validateTranslationContract = (value) => {
    if (!Array.isArray(value)) {
        throw new Error('Contract response must be an array');
    }
    const validated = value.map((item, index) => {
        if (!isTranslationBox(item)) {
            throw new Error(`Contract item ${index + 1} is invalid`);
        }
        return item;
    });
    return validated;
};
exports.validateTranslationContract = validateTranslationContract;
//# sourceMappingURL=validate-contract.js.map