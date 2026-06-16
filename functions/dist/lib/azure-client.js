"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAzureClient = exports.AzureClient = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AzureClient {
    constructor(config) {
        this.config = config;
    }
    async readMockFile(filename) {
        try {
            const root = process.cwd();
            const p = path_1.default.join(root, 'mocks', filename);
            if (fs_1.default.existsSync(p)) {
                const raw = await fs_1.default.promises.readFile(p, 'utf8');
                return JSON.parse(raw);
            }
            return null;
        }
        catch (e) {
            return null;
        }
    }
    getHfSpaceUrl() {
        const envUrl = process.env.HF_SPACE_API_URL?.trim();
        const defaultUrl = 'https://coffeebreak03-manga-translate-ocr.hf.space';
        const hfUrl = envUrl || defaultUrl;
        if (!hfUrl) {
            throw new Error('Missing HF_SPACE_API_URL environment variable');
        }
        return hfUrl.replace(/\/+$/, '');
    }
    normalizeBase64(imageBase64) {
        if (!imageBase64 || typeof imageBase64 !== 'string') {
            throw new Error('Invalid imageBase64 payload');
        }
        const commaIndex = imageBase64.indexOf(',');
        if (commaIndex >= 0) {
            return imageBase64.slice(commaIndex + 1).trim();
        }
        return imageBase64.trim();
    }
    async detectTextBubbles(imageBase64) {
        const startTime = Date.now();
        console.log('[HF_VISION] Starting YOLOv8 spatial detection');
        if (process.env.USE_MOCK_AZURE === 'true') {
            console.log('[HF_VISION] Mock mode enabled, reading ocr-response.json');
            const mock = await this.readMockFile('ocr-response.json');
            if (!mock) {
                console.error('[HF_VISION] ERROR: Mock file is null');
                return JSON.stringify([]);
            }
            if (!Array.isArray(mock.boxes)) {
                console.error('[HF_VISION] ERROR: mock.boxes is not an array, got:', typeof mock.boxes);
                return JSON.stringify([]);
            }
            console.log('[HF_VISION] Mock file loaded with', mock.boxes.length, 'boxes');
            // Convert mock format to HF Space format
            const globos = mock.boxes.map((box) => ({
                id: box.id,
                box: [box.y_min, box.x_min, box.y_max, box.x_max],
            }));
            const result = JSON.stringify(globos);
            const elapsed = Date.now() - startTime;
            console.log('[HF_VISION] Mock response ready:', result.length, 'bytes in', elapsed, 'ms');
            return result;
        }
        console.log('[HF_VISION] Live mode: calling HF Space');
        const hfUrl = this.getHfSpaceUrl();
        console.log('[HF_VISION] HF Space URL:', hfUrl);
        const normalized = this.normalizeBase64(imageBase64);
        console.log('[HF_VISION] Base64 normalized:', normalized.length, 'bytes');
        const payload = {
            image_base64: normalized,
        };
        try {
            const fetchStart = Date.now();
            console.log('[HF_VISION] Sending request to HF Space...');
            const response = await (0, node_fetch_1.default)(`${hfUrl}/analyze-manga`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                timeout: 120000,
            });
            const fetchTime = Date.now() - fetchStart;
            console.log('[HF_VISION] Response received in', fetchTime, 'ms, status:', response.status);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[HF_VISION] ERROR: Non-OK response:', response.status, response.statusText);
                throw new Error(`Hugging Face Space error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const parseStart = Date.now();
            const data = await response.json();
            const parseTime = Date.now() - parseStart;
            console.log('[HF_VISION] Response parsed in', parseTime, 'ms');
            if (!data) {
                console.error('[HF_VISION] ERROR: Response data is null/undefined');
                throw new Error('Invalid Hugging Face Space response: null data');
            }
            if (!Array.isArray(data.globos)) {
                console.error('[HF_VISION] ERROR: data.globos is not an array, got:', typeof data.globos);
                throw new Error(`Invalid Hugging Face Space response: ${JSON.stringify(data)}`);
            }
            console.log('[HF_VISION] HF Space returned', data.globos.length, 'items');
            const result = JSON.stringify(data.globos);
            const totalElapsed = Date.now() - startTime;
            console.log('[HF_VISION] Complete in', totalElapsed, 'ms, response:', result.length, 'bytes');
            return result;
        }
        catch (error) {
            const totalElapsed = Date.now() - startTime;
            console.error('[HF_VISION] ERROR after', totalElapsed, 'ms:', error instanceof Error ? error.message : error);
            throw error;
        }
    }
    /**
     * Llama a Azure GPT-4o con una lista de sub-imágenes (una por globo) ya cropeadas.
     * Retorna JSON con contexto y traducciones:
     * { "contexto": "...", "traducciones": [{ id, texto_japones, traduccion_espanol }] }
     *
     * Si no se provee contexto, retorna el mismo formato con contexto vacío.
     */
    async callOcrAndTranslation(croppedBubbles, contexto) {
        const startTime = Date.now();
        console.log('[AZURE_GPT4O] Starting OCR and Translation for', croppedBubbles.length, 'bubbles');
        if (contexto) {
            console.log('[AZURE_GPT4O] Chapter context provided:', contexto.length, 'chars');
        }
        if (process.env.USE_MOCK_AZURE === 'true') {
            console.log('[AZURE_GPT4O] Mock mode enabled, reading translate-response.json');
            const mock = await this.readMockFile('translate-response.json');
            if (!mock || !Array.isArray(mock.translations)) {
                return JSON.stringify({ contexto: '', traducciones: [] });
            }
            const traducciones = croppedBubbles.map((bubble, i) => ({
                id: bubble.id,
                texto_japones: mock.translations[i]?.original || 'Mock Japanese',
                traduccion_espanol: mock.translations[i]?.translated || 'Mock Spanish'
            }));
            console.log('[AZURE_GPT4O] Mock response ready in', Date.now() - startTime, 'ms');
            return JSON.stringify({
                contexto: contexto ? contexto + ' [mock-updated]' : 'Mock context for chapter.',
                traducciones
            });
        }
        console.log('[AZURE_GPT4O] Live mode: calling Azure Foundry');
        const url = `${this.config.endpoint.replace(/\/responses$/, '')}/chat/completions`;
        console.log('[AZURE_GPT4O] Azure URL:', url);
        // Construir el contenido multimodal: una entrada de texto + una imagen por globo
        const userContent = [];
        // Instrucción principal con formato de respuesta esperado
        let instructionText = `You will receive ${croppedBubbles.length} cropped manga speech bubble image(s), ` +
            `each labelled with its ID. Read the Japanese text in each bubble and translate it to Spanish.\n\n` +
            `Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:\n` +
            `{\n` +
            `  "contexto": "<updated chapter context summarizing key story elements, character names, tone and events so far, max 2000 chars>",\n` +
            `  "traducciones": [{"id": <id>, "texto_japones": "<japanese text>", "traduccion_espanol": "<spanish translation>"}]\n` +
            `}`;
        // Si hay contexto previo del capítulo, incluirlo
        if (contexto) {
            instructionText +=
                `\n\nChapter context from previous pages (use it to maintain narrative coherence and update it with new info from this page):\n` +
                    `${contexto}`;
        }
        userContent.push({ type: 'text', text: instructionText });
        for (const bubble of croppedBubbles) {
            userContent.push({
                type: 'text',
                text: `--- Bubble ID: ${bubble.id} ---`
            });
            userContent.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${bubble.base64}`,
                    detail: 'high'
                }
            });
        }
        try {
            const fetchStart = Date.now();
            console.log('[AZURE_GPT4O] Sending request to Azure Foundry...');
            const systemPrompt = contexto
                ? 'You are an expert manga OCR and translation engine working on a multi-page chapter. ' +
                    'For each speech bubble image provided, extract the exact Japanese text and translate it to Spanish. ' +
                    'Use the chapter context provided to maintain narrative coherence (consistent names, tone, pronouns). ' +
                    'Update the context field with any new relevant information from this page. ' +
                    'Return ONLY a valid JSON object with "contexto" and "traducciones" fields. No markdown, no explanations.'
                : 'You are an expert manga OCR and translation engine. ' +
                    'For each speech bubble image provided, extract the exact Japanese text and translate it to Spanish. ' +
                    'Return ONLY a valid JSON object with "contexto" and "traducciones" fields. No markdown, no explanations.';
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'api-key': this.config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.config.modelTranslate,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userContent
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.2
                }),
            });
            const fetchTime = Date.now() - fetchStart;
            console.log('[AZURE_GPT4O] Response received in', fetchTime, 'ms, status:', response.status);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[AZURE_GPT4O] ERROR: Non-OK response:', response.status, response.statusText);
                throw new Error(`Azure GPT-4o API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const data = await response.json();
            console.log('[AZURE_GPT4O] Response parsed in', Date.now() - startTime, 'ms total');
            const content = data.choices?.[0]?.message?.content ?? '';
            if (!content) {
                console.error('[AZURE_GPT4O] ERROR: Empty content in response');
            }
            console.log('[AZURE_GPT4O] Complete in', Date.now() - startTime, 'ms, content length:', content.length);
            return content;
        }
        catch (error) {
            console.error('[AZURE_GPT4O] ERROR after', Date.now() - startTime, 'ms:', error instanceof Error ? error.message : error);
            throw error;
        }
    }
    /**
     * Compatibility wrapper calling detectTextBubbles (YOLOv8)
     */
    async callVisionModel(imageBase64) {
        return this.detectTextBubbles(imageBase64);
    }
    /**
     * Compatibility wrapper doing text-only translation using GPT-4o
     */
    async callTranslateModel(text) {
        const startTime = Date.now();
        console.log('[AZURE_GPT4O] Starting standalone translation (compatibility wrapper)');
        if (process.env.USE_MOCK_AZURE === 'true') {
            console.log('[AZURE_GPT4O] Mock translation enabled');
            return 'Mock translation';
        }
        const url = `${this.config.endpoint.replace(/\/responses$/, '')}/chat/completions`;
        console.log('[AZURE_GPT4O] Azure URL:', url);
        try {
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'api-key': this.config.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.config.modelTranslate,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert translator. Translate the following text to Spanish, maintaining context and meaning.'
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Azure GPT-4o translation error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content ?? '';
            console.log('[AZURE_GPT4O] Standalone translation complete in', Date.now() - startTime, 'ms');
            return content;
        }
        catch (error) {
            console.error('[AZURE_GPT4O] Standalone translation error:', error);
            throw error;
        }
    }
}
exports.AzureClient = AzureClient;
const getAzureClient = () => {
    return new AzureClient({
        endpoint: process.env.AZURE_FOUNDRY_ENDPOINT || '',
        apiKey: process.env.AZURE_FOUNDRY_API_KEY || '',
        modelVision: process.env.AZURE_FOUNDRY_MODEL_VISION || '',
        modelTranslate: process.env.AZURE_FOUNDRY_MODEL_TRANSLATE || '',
    });
};
exports.getAzureClient = getAzureClient;
//# sourceMappingURL=azure-client.js.map