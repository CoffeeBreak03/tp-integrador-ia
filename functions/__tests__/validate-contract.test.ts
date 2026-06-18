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
                id: 0,
                box: [100, 120, 240],
                texto_original: '',
                texto_traducido: '',
            },
        ];

        expect(validateTranslationContract(invalidContract)).toEqual([]);
    });
});
