import { PipelineOrchestrator } from '../src/orchestrator';

describe('Pipeline orchestrator', () => {
    it('calls both azure models in sequence and maps the contract', async () => {
        const mockAzure = {
            callVisionModel: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { y_min: 50, x_min: 100, y_max: 150, x_max: 400, text: 'こんにちは' },
                ])
            ),
            callTranslateModel: jest.fn().mockResolvedValue(
                JSON.stringify([{ original: 'こんにちは', translated: 'Hola' }])
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        expect(mockAzure.callVisionModel).toHaveBeenCalledWith('base64...');
        expect(mockAzure.callTranslateModel).toHaveBeenCalledWith('こんにちは');
        expect(result).toEqual([
            {
                id: 1,
                box: [50, 100, 150, 400],
                texto_original: 'こんにちは',
                texto_traducido: 'Hola',
            },
        ]);
    });

    it('falls back to raw translation text when parse fails', async () => {
        const mockAzure = {
            callVisionModel: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { y_min: 50, x_min: 100, y_max: 150, x_max: 400, text: 'こんにちは' },
                ])
            ),
            callTranslateModel: jest.fn().mockResolvedValue('fallback translation text'),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        expect(result[0].texto_traducido).toBe('fallback translation text');
    });
});
