import { validateTranslationContract } from '../src/lib/validate-contract';

describe('Contract validation', () => {
    it('accepts a valid translation contract', () => {
        const validContract = [
            {
                id: 1,
                box: [100, 120, 240, 360],
                texto_original: '原文テキスト',
                texto_traducido: 'Texto traducido al español',
            },
        ];

        expect(validateTranslationContract(validContract)).toEqual(validContract);
    });

    it('excludes an invalid translation contract', () => {
        const invalidContract = [
            {
                id: 0, // Invalid ID
                box: [100, 120, 240], // Invalid box array
                texto_original: '', // Invalid text
                texto_traducido: '', // Invalid text
            },
        ];

        expect(validateTranslationContract(invalidContract)).toEqual([]);
    });

    it('accepts a translation contract with 1-character text', () => {
        const singleCharContract = [
            {
                id: 2,
                box: [100, 120, 240, 360],
                texto_original: 'あ',
                texto_traducido: 'A',
            },
        ];

        expect(validateTranslationContract(singleCharContract)).toEqual(singleCharContract);
    });
});
