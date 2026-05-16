# 3_BACKEND_Y_APIS.md

## Objetivo
Implementar Netlify Functions (Node.js Serverless) que orquesten el pipeline IA de dos pasos: visión/OCR → traducción NLP, con conexión segura a Azure AI Foundry.

## Stack
- Node.js 18+
- TypeScript
- Netlify Functions (Lambda-compatible)
- Azure AI Foundry Python/REST APIs
- Jest para testing

## Tareas

### T3.1: Configuración inicial funciones

```bash
cd functions
npm init -y
npm install typescript @types/node
npm install -D ts-node jest @types/jest ts-jest
npm install dotenv
npm install node-fetch@2 (o fetch builtin en Node 18+)
```

**Archivos:**
- `tsconfig.json`: Target ES2020, module commonjs
- `jest.config.js`: Preset ts-jest
- `.env.example`: Template de variables
- `netlify.toml`: Rutas y timeouts

**netlify.toml (raíz):**
```toml
[build]
command = "npm run build"
publish = "dist"

[functions]
directory = "functions/dist"
node_bundler = "esbuild"

[[redirects]]
from = "/api/*"
to = "/.netlify/functions/:splat"
status = 200
```

**Entregable:** Proyecto compilable sin errores

---

### T3.2: Cliente Azure AI Foundry

```typescript
// functions/src/lib/azure-client.ts
import fetch from 'node-fetch';

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  modelVision: string;
  modelTranslate: string;
}

export class AzureClient {
  private config: AzureConfig;

  constructor(config: AzureConfig) {
    this.config = config;
  }

  async callVisionModel(imageBase64: string): Promise<string> {
    const response = await fetch(`${this.config.endpoint}/deployments/${this.config.modelVision}/chat/completions?api-version=2024-05-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: 'Extract all text from this manga image. For each text box, provide: 1) approximate y_min, x_min, y_max, x_max as percentages (0-100), 2) the original text. Return as JSON array.',
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callTranslateModel(text: string): Promise<string> {
    const response = await fetch(`${this.config.endpoint}/deployments/${this.config.modelTranslate}/chat/completions?api-version=2024-05-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Translate the following Asian text to Spanish, maintaining context and meaning:\n\n${text}`,
          },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export const getAzureClient = (): AzureClient => {
  return new AzureClient({
    endpoint: process.env.AZURE_FOUNDRY_ENDPOINT || '',
    apiKey: process.env.AZURE_FOUNDRY_API_KEY || '',
    modelVision: process.env.AZURE_FOUNDRY_MODEL_VISION || '',
    modelTranslate: process.env.AZURE_FOUNDRY_MODEL_TRANSLATE || '',
  });
};
```

**Entregable:**
- Clase con métodos para visión y traducción
- Autenticación via header `api-key`
- Error handling básico

---

### T3.3: Tipos y validación de contrato

```typescript
// functions/src/types/contract.ts
export interface TranslationBox {
  id: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  texto_original: string;
  texto_traducido: string;
}

export interface VisionOutput {
  boxes: Array<{
    id: number;
    y_min: number;
    x_min: number;
    y_max: number;
    x_max: number;
    text: string;
  }>;
}

export const denormalizeVisionToContract = (
  visionOutput: VisionOutput,
  translations: Map<string, string>
): TranslationBox[] => {
  return visionOutput.boxes.map((box) => ({
    id: box.id,
    box: [box.y_min, box.x_min, box.y_max, box.x_max],
    texto_original: box.text,
    texto_traducido: translations.get(box.text) || '',
  }));
};
```

**Entregable:**
- TypeScript interfaces
- Mapeo vision → contrato

---

### T3.4: Orquestador del pipeline

```typescript
// functions/src/orchestrator.ts
import { AzureClient } from './lib/azure-client';
import { TranslationBox, VisionOutput, denormalizeVisionToContract } from './types/contract';

export class PipelineOrchestrator {
  constructor(private azureClient: AzureClient) {}

  async processMangaImage(imageBase64: string): Promise<TranslationBox[]> {
    console.log('[Pipeline] Step 1: Visión/OCR');
    const visionRaw = await this.azureClient.callVisionModel(imageBase64);
    const visionOutput = this.parseVisionOutput(visionRaw);

    console.log(`[Pipeline] Detected ${visionOutput.boxes.length} text boxes`);

    console.log('[Pipeline] Step 2: Traducción');
    const allTexts = visionOutput.boxes.map((b) => b.text).join('\n');
    const translatedRaw = await this.azureClient.callTranslateModel(allTexts);
    const translations = this.parseTranslations(translatedRaw, visionOutput.boxes.length);

    console.log('[Pipeline] Mapping to contract');
    return denormalizeVisionToContract(visionOutput, translations);
  }

  private parseVisionOutput(raw: string): VisionOutput {
    try {
      const json = JSON.parse(raw);
      return {
        boxes: json.map((box: any, idx: number) => ({
          id: idx + 1,
          y_min: Math.min(box.y_min || 0, 1000),
          x_min: Math.min(box.x_min || 0, 1000),
          y_max: Math.min(box.y_max || 500, 1000),
          x_max: Math.min(box.x_max || 500, 1000),
          text: box.text || '',
        })),
      };
    } catch (e) {
      console.error('Failed to parse vision output:', e);
      return { boxes: [] };
    }
  }

  private parseTranslations(raw: string, boxCount: number): Map<string, string> {
    const map = new Map<string, string>();
    try {
      const translations = JSON.parse(raw);
      if (Array.isArray(translations)) {
        translations.forEach((t) => map.set(t.original, t.translated));
      }
    } catch (e) {
      console.warn('Failed to parse translations, using raw text');
      map.set('unknown', raw);
    }
    return map;
  }
}
```

**Entregable:**
- Orquestación secuencial de dos pasos
- Parseo resiliente
- Logging de progreso

---

### T3.5: Funciones Lambda

```typescript
// functions/src/vision.ts
import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';

interface VisionRequest {
  imageBase64: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as VisionRequest;
    if (!body.imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageBase64' }),
      };
    }

    const azureClient = getAzureClient();
    const result = await azureClient.callVisionModel(body.imageBase64);

    return {
      statusCode: 200,
      body: JSON.stringify({ vision_output: result }),
    };
  } catch (error) {
    console.error('Vision function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
```

```typescript
// functions/src/translate.ts
import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';

interface TranslateRequest {
  text: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as TranslateRequest;
    if (!body.text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing text' }),
      };
    }

    const azureClient = getAzureClient();
    const result = await azureClient.callTranslateModel(body.text);

    return {
      statusCode: 200,
      body: JSON.stringify({ translated: result }),
    };
  } catch (error) {
    console.error('Translate function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
```

```typescript
// functions/src/process.ts
import { Handler } from '@netlify/functions';
import { getAzureClient } from './lib/azure-client';
import { PipelineOrchestrator } from './orchestrator';

interface ProcessRequest {
  imageBase64: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as ProcessRequest;
    if (!body.imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageBase64' }),
      };
    }

    const azureClient = getAzureClient();
    const orchestrator = new PipelineOrchestrator(azureClient);
    const result = await orchestrator.processMangaImage(body.imageBase64);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Process function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
};
```

**Entregable:**
- `/api/vision` - test OCR individual
- `/api/translate` - test traducción individual
- `/api/process` - pipeline completo
- Todas aceptan POST

---

### T3.6: Pruebas con cURL/Postman

**Vision endpoint test:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/vision \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "iVBORw0KGgoAAAANS..."}' # imagen en base64
```

**Translate endpoint test:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "こんにちは、これは漫画です"}'
```

**Full pipeline test:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/process \
  -H "Content-Type: application/json" \
  -d @payload.json
```

**payload.json:**
```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Entregable:**
- Scripts cURL con ejemplos
- Colección Postman exportable (.json)

---

### T3.7: Tests unitarios (Jest)

```typescript
// functions/__tests__/contract.test.ts
import { denormalizeVisionToContract, VisionOutput } from '../src/types/contract';

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
          text: 'こんにちは',
        },
      ],
    };

    const translations = new Map([['こんにちは', 'Hola']]);
    const result = denormalizeVisionToContract(visionOutput, translations);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      box: [50, 100, 150, 400],
      texto_original: 'こんにちは',
      texto_traducido: 'Hola',
    });
  });
});

// functions/__tests__/orchestrator.test.ts
import { PipelineOrchestrator } from '../src/orchestrator';
import { AzureClient } from '../src/lib/azure-client';

describe('Pipeline orchestrator', () => {
  it('calls both azure models in sequence', async () => {
    const mockAzure = {
      callVisionModel: jest.fn().mockResolvedValue(
        JSON.stringify([{ y_min: 50, x_min: 100, y_max: 150, x_max: 400, text: 'こんにちは' }])
      ),
      callTranslateModel: jest.fn().mockResolvedValue(
        JSON.stringify([{ original: 'こんにちは', translated: 'Hola' }])
      ),
    } as any;

    const orchestrator = new PipelineOrchestrator(mockAzure);
    const result = await orchestrator.processMangaImage('base64...');

    expect(mockAzure.callVisionModel).toHaveBeenCalled();
    expect(mockAzure.callTranslateModel).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Entregable:**
- Cobertura mínima de funciones críticas
- Mocks de Azure client

---

### T3.8: Gestión de secrets en Netlify

**Variables de entorno requeridas (configurar en Netlify Dashboard):**

```
AZURE_FOUNDRY_ENDPOINT=https://your-region.api.cognitive.microsoft.com
AZURE_FOUNDRY_API_KEY=<tu-api-key>
AZURE_FOUNDRY_MODEL_VISION=gpt-4-vision
AZURE_FOUNDRY_MODEL_TRANSLATE=gpt-4-turbo
```

**Entregable:**
- Guía de configuración Dashboard
- `.env.example` con placeholders
- NO commitear `.env`

---

## Reglas de integración

- **No state:** Cada función es stateless
- **Timeouts:** Configurar 60s mín. para `/process`
- **Errores:** Retornar 500 con mensaje en JSON
- **Logging:** Console.log para debugging
- **API Keys:** Solo via environment variables Netlify

---

## Notas adicionales

- Agregar rate limiting si es necesario
- Cachear resultados en Firebase Realtime DB (opcional)
- WebSocket para progreso del pipeline (futuro)
- Soporte batch processing para múltiples imágenes
