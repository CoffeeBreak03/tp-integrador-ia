import { PipelineOrchestrator } from '../src/orchestrator';

jest.mock('../src/lib/image-cropper', () => ({
  cropBubbles: jest.fn().mockImplementation((img, boxes) => {
    return boxes.map((box: any) => ({
      id: box.id,
      base64: `cropped_base64_${box.id}`
    }));
  })
}));

describe('Pipeline orchestrator', () => {
    it('calls detectTextBubbles and callOcrAndTranslation in sequence and maps the contract with padding', async () => {
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

        // w=300, h=100 -> padX=15, padY=10 -> [40, 85, 160, 415]
        expect(mockAzure.detectTextBubbles).toHaveBeenCalledWith('base64...');
        expect(mockAzure.callOcrAndTranslation).toHaveBeenCalledWith(
            [{ id: 1, base64: 'cropped_base64_1' }],
            undefined
        );
        expect(result).toEqual({
            contexto: 'Test context after processing.',
            translations: [
                {
                    id: 1,
                    box: [40, 85, 160, 415],
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
            [{ id: 1, base64: 'cropped_base64_1' }],
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

        expect(result.contexto).toBe('');
        expect(result.translations[0].texto_original).toBe('テスト');
    });

    it('sorts text boxes in manga reading order (Recursive XY-Cut)', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { id: 10, box: [200, 500, 300, 800] }, // Right-middle
                    { id: 20, box: [50, 100, 150, 400] },  // Left-top
                    { id: 30, box: [50, 600, 150, 900] },  // Right-top
                    { id: 40, box: [400, 200, 600, 500] }, // Left-bottom
                ])
            ),
            callOcrAndTranslation: jest.fn().mockResolvedValue(
                JSON.stringify({
                    contexto: 'Context',
                    traducciones: [
                        { id: 1, texto_japones: '右一', traduccion_espanol: 'Derecha 1' },
                        { id: 2, texto_japones: '左一', traduccion_espanol: 'Izquierda 1' },
                        { id: 3, texto_japones: '右二', traduccion_espanol: 'Derecha 2' },
                        { id: 4, texto_japones: '左二', traduccion_espanol: 'Izquierda 2' },
                    ]
                })
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        // RXYC order:
        // 1. Right-top (was id 30) -> now id 1
        // 2. Left-top (was id 20) -> now id 2
        // 3. Right-middle (was id 10) -> now id 3
        // 4. Left-bottom (was id 40) -> now id 4
        expect(result.translations).toHaveLength(4);
        
        expect(result.translations[0].texto_original).toBe('右一'); // Corresponds to new ID 1
        expect(result.translations[1].texto_original).toBe('左一'); // Corresponds to new ID 2
        expect(result.translations[2].texto_original).toBe('右二'); // Corresponds to new ID 3
        expect(result.translations[3].texto_original).toBe('左二'); // Corresponds to new ID 4
    });

    it('filters overlapping duplicate boxes containing substrings', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { id: 1, box: [100, 100, 300, 400] }, // Large box
                    { id: 2, box: [120, 120, 200, 300] }, // Small box inside large box (overlap > 70%)
                ])
            ),
            callOcrAndTranslation: jest.fn().mockResolvedValue(
                JSON.stringify({
                    contexto: 'Context',
                    traducciones: [
                        { id: 1, texto_japones: 'こんにちは', traduccion_espanol: 'Hola' },
                        { id: 2, texto_japones: 'こんにちは、世界', traduccion_espanol: 'Hola, mundo' },
                    ]
                })
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.processMangaImage('base64...');

        // The overlap cleaner should filter out ID 1 (small box, now reindexed to id 1) and keep ID 2 (large box, now id 2)
        expect(result.translations).toHaveLength(1);
        expect(result.translations[0].texto_original).toBe('こんにちは、世界');
    });

    it('detectTextBubblesOnly calls detectTextBubbles, sorts, and reindexes boxes', async () => {
        const mockAzure = {
            detectTextBubbles: jest.fn().mockResolvedValue(
                JSON.stringify([
                    { id: 10, box: [200, 500, 300, 800] }, // right
                    { id: 20, box: [50, 100, 150, 400] },  // left
                ])
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const result = await orchestrator.detectTextBubblesOnly('base64...');

        expect(mockAzure.detectTextBubbles).toHaveBeenCalledWith('base64...');
        expect(result.boxes).toHaveLength(2);
        // Sorted RTL: right first (now id 1), left second (now id 2)
        expect(result.boxes[0].id).toBe(1);
        expect(result.boxes[1].id).toBe(2);
    });

    it('translatePageOnly calls callOcrAndTranslation and merges/cleans overlaps', async () => {
        const mockAzure = {
            callOcrAndTranslation: jest.fn().mockResolvedValue(
                JSON.stringify({
                    contexto: 'New context',
                    traducciones: [
                        { id: 1, texto_japones: 'こんにちは', traduccion_espanol: 'Hola' },
                        { id: 2, texto_japones: 'こんにちは、世界', traduccion_espanol: 'Hola, mundo' },
                    ]
                })
            ),
        } as any;

        const orchestrator = new PipelineOrchestrator(mockAzure);
        const boxes = [
            { id: 1, y_min: 110, x_min: 110, y_max: 210, x_max: 310 }, // Small box inside large box (overlap > 70%)
            { id: 2, y_min: 90, x_min: 85, y_max: 310, x_max: 415 },  // Large box
        ];
        const result = await orchestrator.translatePageOnly('base64...', boxes, 'Old context');

        expect(mockAzure.callOcrAndTranslation).toHaveBeenCalledWith(
            expect.any(Array),
            'Old context'
        );
        expect(result.contexto).toBe('New context');
        // Overlap cleaner should remove ID 1 and keep ID 2
        expect(result.translations).toHaveLength(1);
        expect(result.translations[0].id).toBe(2);
        expect(result.translations[0].texto_original).toBe('こんにちは、世界');
    });
});
