import { PipelineOrchestrator } from '../src/orchestrator';

jest.mock('../src/lib/image-cropper', () => ({
  cropBubbles: jest.fn().mockResolvedValue([
    { id: 1, base64: 'cropped_base64' }
  ])
}));

describe('Pipeline orchestrator', () => {
    it('calls detectTextBubbles and callOcrAndTranslation in sequence and maps the contract', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { id: 1, box: [50, 100, 150, 400] },
                ])
            ),
            callOcrAndTranslation: jest.fn().mockResolvedValue(
                JSON.stringify({
                    contexto: 'Test context after processing.',
                    traducciones: [{ id: 1, texto_japones: 'こんにちは', traduccion_espanol: 'Hola' }]
                })
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        expect(mockAzure.detectTextBubbles).toHaveBeenCalledWith('base64...');
        expect(mockAzure.callOcrAndTranslation).toHaveBeenCalledWith(
            [{ id: 1, base64: 'cropped_base64' }],
            undefined
        );
        expect(result).toEqual({
            contexto: 'Test context after processing.',
            translations: [
                {
                    id: 1,
                    box: [50, 100, 150, 400],
                    texto_original: 'こんにちは',
                    texto_traducido: 'Hola',
                },
            ],
        });
    });

    it('passes context through when provided', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { id: 1, box: [50, 100, 150, 400] },
                ])
            ),
            callOcrAndTranslation: jest.fn().mockResolvedValue(
                JSON.stringify({
                    contexto: 'Updated context with new info.',
                    traducciones: [{ id: 1, texto_japones: 'さようなら', traduccion_espanol: 'Adiós' }]
                })
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const previousContext = 'Context from previous page.';
        const result = await orchestrator.processMangaImage('base64...', previousContext);

        expect(mockAzure.callOcrAndTranslation).toHaveBeenCalledWith(
            [{ id: 1, base64: 'cropped_base64' }],
            previousContext
        );
        expect(result.contexto).toBe('Updated context with new info.');
        expect(result.translations).toHaveLength(1);
    });

    it('handles empty response gracefully', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue('[]'),
            callOcrAndTranslation: jest.fn(),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        expect(result).toEqual({ contexto: '', translations: [] });
        expect(mockAzure.callOcrAndTranslation).not.toHaveBeenCalled();
    });

    it('preserves context on empty detection response', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue('[]'),
            callOcrAndTranslation: jest.fn(),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...', 'Existing context.');

        expect(result).toEqual({ contexto: 'Existing context.', translations: [] });
    });

    it('supports legacy array format from GPT-4o', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { id: 1, box: [50, 100, 150, 400] },
                ])
            ),
            callOcrAndTranslation: jest.fn().mockResolvedValue(
                JSON.stringify([{ id: 1, texto_japones: 'テスト', traduccion_espanol: 'Prueba' }])
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        // Legacy format: no context returned, translations still parsed
        expect(result.contexto).toBe('');
        expect(result.translations).toEqual([
            {
                id: 1,
                box: [50, 100, 150, 400],
                texto_original: 'テスト',
                texto_traducido: 'Prueba',
            },
        ]);
    });
});
