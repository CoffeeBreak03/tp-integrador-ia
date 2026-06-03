import { mergeVisionAndTranslation, VisionOutput, GptTranslation } from '../src/types/contract';

describe('Contract transformation', () => {
    it('maps vision output to contract', () => {
        const visionOutput: VisionOutput = {
            boxes: [
                {
                    id: 1,
                    y_min: 50,
                    x_min: 100,
                    y_max: 150,
                    x_max: 400,
                },
            ],
        };

        const translations: GptTranslation[] = [
            {
                id: 1,
                texto_japones: 'こんにちは',
                traduccion_espanol: 'Hola',
            },
        ];
        const result = mergeVisionAndTranslation(visionOutput, translations);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            id: 1,
            box: [50, 100, 150, 400],
            texto_original: 'こんにちは',
            texto_traducido: 'Hola',
        });
    });
});
