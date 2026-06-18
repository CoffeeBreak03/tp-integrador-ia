import { TranslationBox } from '../types/contract';

const isTranslationBox = (value: any): value is TranslationBox => {
    if (typeof value !== 'object' || value === null) {
        console.error(`[VALIDATION] item is not an object. Received:`, value);
        return false;
    }
    if (typeof value.id !== 'number' || value.id < 1) {
        console.error(`[VALIDATION] id is invalid for item. Expected number >= 1, got: ${value.id}`);
        return false;
    }
    if (!Array.isArray(value.box) || value.box.length !== 4) {
        console.error(`[VALIDATION] box is not an array of 4 elements for id ${value.id}. Got:`, value.box);
        return false;
    }
    if (!value.box.every((coordinate: any) => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1000)) {
        console.error(`[VALIDATION] box coordinates are invalid for id ${value.id}. Must be between 0 and 1000. Got:`, value.box);
        return false;
    }
    if (typeof value.texto_original !== 'string' || value.texto_original.trim().length <= 1) {
        console.error(`[VALIDATION] texto_original is empty or <= 1 char for id ${value.id}. Got: "${value.texto_original}"`);
        return false;
    }
    if (typeof value.texto_traducido !== 'string' || value.texto_traducido.trim().length === 0) {
        console.error(`[VALIDATION] texto_traducido is empty or not a string for id ${value.id}. Got: "${value.texto_traducido}"`);
        return false;
    }
    return true;
};

export const validateTranslationContract = (value: any): TranslationBox[] => {
    if (!Array.isArray(value)) {
        throw new Error('Contract response must be an array');
    }

    const validated: TranslationBox[] = [];
    value.forEach((item: any, index: number) => {
        if (isTranslationBox(item)) {
            validated.push(item);
        } else {
            console.warn(`[VALIDATION] Contract item ${index + 1} (ID: ${item?.id}) is invalid and will be excluded.`);
        }
    });

    return validated;
};
