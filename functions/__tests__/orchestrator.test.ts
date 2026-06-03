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
                JSON.stringify([{ id: 1, texto_japones: 'こんにちは', traduccion_espanol: 'Hola' }])
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        expect(mockAzure.detectTextBubbles).toHaveBeenCalledWith('base64...');
        expect(mockAzure.callOcrAndTranslation).toHaveBeenCalledWith([
            { id: 1, base64: 'cropped_base64' }
        ]);
        expect(result).toEqual([
            {
                id: 1,
                box: [50, 100, 150, 400],
                texto_original: 'こんにちは',
                texto_traducido: 'Hola',
            },
        ]);
    });

    it('handles empty response gracefully', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue('[]'),
            callOcrAndTranslation: jest.fn(),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        expect(result).toEqual([]);
        expect(mockAzure.callOcrAndTranslation).not.toHaveBeenCalled();
    });
});
