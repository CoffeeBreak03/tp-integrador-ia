# 4_INFRAESTRUCTURA_Y_TESTING.md

## Objetivo
Implementar pipeline CI/CD en Netlify, crear datasets Mock para frontend, y suite de tests completa (unitarios e integración).

## Stack
- GitHub Actions para CI
- Netlify Deploy Previews
- Vitest (frontend) + Jest (backend)
- Mock JSON sets

## Tareas

### T4.1: Estructura de repositorio y CI/CD base

**Inicializar repositorio:**
```bash
git init
git remote add origin https://github.com/<usuario>/tp-integrador-ia.git
git branch -M main
```

**Crear `.github/workflows/ci.yml`:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies (Frontend)
        run: cd frontend && npm install

      - name: Install dependencies (Functions)
        run: cd functions && npm install

      - name: Run frontend tests
        run: cd frontend && npm run test

      - name: Run backend tests
        run: cd functions && npm run test

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Build functions
        run: cd functions && npm run build

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Install dependencies
        run: npm install && cd frontend && npm install && cd ../functions && npm install

      - name: Lint frontend
        run: cd frontend && npm run lint 2>/dev/null || echo "No linter configured"

      - name: Lint backend
        run: cd functions && npm run lint 2>/dev/null || echo "No linter configured"

  deploy:
    runs-on: ubuntu-latest
    needs: [test, lint]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**Crear `.gitignore`:**

```
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
.DS_Store
.idea/
.vscode/
*.swp
*.swo
coverage/
.netlify/
build/
```

**Entregable:**
- Repositorio en GitHub
- Workflow CI ejecutable
- `.gitignore` configurado

---

### T4.2: Netlify configuration y Deploy Previews

**Crear `netlify.toml` (raíz):**

```toml
[build]
command = "npm run build:all"
publish = "frontend/dist"

[functions]
directory = "functions/dist"
node_bundler = "esbuild"

[[redirects]]
from = "/api/*"
to = "/.netlify/functions/:splat"
status = 200

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[context.production]
environment = { NODE_ENV = "production" }

[context.deploy-preview]
environment = { NODE_ENV = "development" }
command = "npm run build:all:dev"
```

**Agregar scripts en raíz `package.json`:**

```json
{
  "scripts": {
    "build:all": "cd frontend && npm run build && cd ../functions && npm run build",
    "build:all:dev": "cd frontend && npm run dev &",
    "dev": "concurrently \"cd frontend && npm run dev\" \"cd functions && npm run dev\"",
    "test:all": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd functions && npm run test"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

**Configurar secrets en Netlify Dashboard:**

```
AZURE_FOUNDRY_ENDPOINT = https://...
AZURE_FOUNDRY_API_KEY = <key>
AZURE_FOUNDRY_MODEL_VISION = gpt-4-vision
AZURE_FOUNDRY_MODEL_TRANSLATE = gpt-4-turbo
```

**Entregable:**
- `netlify.toml` funcional
- Secrets configurados
- Deploy Previews habilitados

---

### T4.3: Mock data sets completos

**Crear `mocks/ocr-response.json` (simulación output visión):**

```json
{
  "status": "success",
  "boxes": [
    {
      "id": 1,
      "y_min": 50,
      "x_min": 100,
      "y_max": 200,
      "x_max": 500,
      "text": "おはようございます"
    },
    {
      "id": 2,
      "y_min": 250,
      "x_min": 120,
      "y_max": 380,
      "x_max": 480,
      "text": "今日はいい天気ですね"
    },
    {
      "id": 3,
      "y_min": 420,
      "x_min": 110,
      "y_max": 550,
      "x_max": 490,
      "text": "本当にそうだね"
    }
  ]
}
```

**Crear `mocks/translate-response.json` (simulación output traducción):**

```json
{
  "status": "success",
  "translations": [
    {
      "original": "おはようございます",
      "translated": "Buenos días"
    },
    {
      "original": "今日はいい天気ですね",
      "translated": "Hace muy buen día hoy"
    },
    {
      "original": "本当にそうだね",
      "translated": "Definitivamente"
    }
  ]
}
```

**Crear `frontend/src/mock/mock-data.json` (datos frontend):**

```json
[
  {
    "id": 1,
    "box": [50, 100, 200, 500],
    "texto_original": "おはようございます",
    "texto_traducido": "Buenos días"
  },
  {
    "id": 2,
    "box": [250, 120, 380, 480],
    "texto_original": "今日はいい天気ですね",
    "texto_traducido": "Hace muy buen día hoy"
  },
  {
    "id": 3,
    "box": [420, 110, 550, 490],
    "texto_original": "本当にそうだね",
    "texto_traducido": "Definitivamente"
  }
]
```

**Crear `mocks/integration-test-dataset.json` (para tests e2e):**

```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "expected_output": [
    {
      "id": 1,
      "box": [50, 100, 200, 500],
      "texto_original": "おはようございます",
      "texto_traducido": "Buenos días"
    }
  ]
}
```

**Entregable:**
- 3 JSON sets funcionales
- Esquema consistente con contrato
- Coordenadas realistas en rango 0-1000

---

### T4.4: Tests unitarios frontend (Vitest)

**Crear `frontend/vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Tests componentes:**

```typescript
// frontend/src/__tests__/components/OverlayRenderer.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OverlayRenderer from '@/components/OverlayRenderer.vue';

describe('OverlayRenderer', () => {
  it('renders overlay boxes correctly', () => {
    const translations = [
      {
        id: 1,
        box: [0, 0, 500, 500],
        texto_original: 'test',
        texto_traducido: 'prueba',
      },
    ];

    const wrapper = mount(OverlayRenderer, {
      props: {
        imageData: 'data:image/png;base64,iVBORw0KG...',
        translations,
      },
    });

    expect(wrapper.findAll('.absolute').length).toBe(1);
    expect(wrapper.text()).toContain('prueba');
  });

  it('normalizes coordinates correctly', () => {
    const wrapper = mount(OverlayRenderer, {
      props: {
        imageData: 'data:image/png;base64,...',
        translations: [
          {
            id: 1,
            box: [500, 500, 1000, 1000],
            texto_original: 'test',
            texto_traducido: 'prueba',
          },
        ],
      },
    });

    const overlay = wrapper.find('.absolute');
    expect(overlay.attributes('style')).toContain('50%'); // 500/1000 = 50%
  });
});
```

```typescript
// frontend/src/__tests__/components/TranslationPanel.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TranslationPanel from '@/components/TranslationPanel.vue';

describe('TranslationPanel', () => {
  it('filters translations by search query', async () => {
    const translations = [
      {
        id: 1,
        box: [0, 0, 100, 100],
        texto_original: 'おはようございます',
        texto_traducido: 'Buenos días',
      },
      {
        id: 2,
        box: [100, 100, 200, 200],
        texto_original: 'こんばんは',
        texto_traducido: 'Buenas tardes',
      },
    ];

    const wrapper = mount(TranslationPanel, {
      props: { translations },
    });

    const input = wrapper.find('input');
    await input.setValue('Buenos');

    expect(wrapper.findAll('.p-3').length).toBe(1);
  });

  it('emits selectItem event', async () => {
    const translations = [
      {
        id: 1,
        box: [0, 0, 100, 100],
        texto_original: 'test',
        texto_traducido: 'prueba',
      },
    ];

    const wrapper = mount(TranslationPanel, {
      props: { translations },
    });

    await wrapper.find('.cursor-pointer').trigger('click');
    expect(wrapper.emitted('selectItem')).toBeTruthy();
  });
});
```

**Entregable:**
- Cobertura >70% componentes principales
- Tests de props y events
- Setup Vitest completo

---

### T4.5: Tests unitarios backend (Jest)

**Crear `functions/jest.config.js`:**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

```typescript
// functions/__tests__/lib/azure-client.test.ts
import { AzureClient } from '../../src/lib/azure-client';

describe('AzureClient', () => {
  let client: AzureClient;

  beforeEach(() => {
    process.env.AZURE_FOUNDRY_ENDPOINT = 'https://test.openai.azure.com';
    process.env.AZURE_FOUNDRY_API_KEY = 'test-key';
    process.env.AZURE_FOUNDRY_MODEL_VISION = 'gpt-4-vision';
    process.env.AZURE_FOUNDRY_MODEL_TRANSLATE = 'gpt-4-turbo';

    client = new AzureClient({
      endpoint: 'https://test.openai.azure.com',
      apiKey: 'test-key',
      modelVision: 'gpt-4-vision',
      modelTranslate: 'gpt-4-turbo',
    });
  });

  it('initializes with correct config', () => {
    expect(client).toBeDefined();
  });

  it('throws on missing endpoint', () => {
    expect(() => {
      new AzureClient({
        endpoint: '',
        apiKey: 'key',
        modelVision: 'model',
        modelTranslate: 'model',
      });
    }).not.toThrow(); // Constructor doesn't validate
  });
});
```

**Entregable:**
- Jest config funcional
- Tests básicos de integración
- Mocks de Azure SDK

---

### T4.6: Tests de integración (E2E mock)

```typescript
// __tests__/e2e/pipeline.test.ts
import { PipelineOrchestrator } from '../../functions/src/orchestrator';
import { AzureClient } from '../../functions/src/lib/azure-client';
import * as fs from 'fs';

describe('E2E Pipeline Integration', () => {
  it('processes mock image data end-to-end', async () => {
    const mockAzure = {
      callVisionModel: jest.fn().mockResolvedValue(
        JSON.stringify([
          {
            y_min: 50,
            x_min: 100,
            y_max: 200,
            x_max: 500,
            text: 'おはようございます',
          },
        ])
      ),
      callTranslateModel: jest.fn().mockResolvedValue(
        JSON.stringify([
          {
            original: 'おはようございます',
            translated: 'Buenos días',
          },
        ])
      ),
    } as any;

    const orchestrator = new PipelineOrchestrator(mockAzure);
    const result = await orchestrator.processMangaImage('base64mockimage');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      box: [50, 100, 200, 500],
      texto_original: 'おはようございます',
      texto_traducido: 'Buenos días',
    });

    expect(mockAzure.callVisionModel).toHaveBeenCalledTimes(1);
    expect(mockAzure.callTranslateModel).toHaveBeenCalledTimes(1);
  });

  it('validates contract output format', async () => {
    const testData = JSON.parse(
      fs.readFileSync('mocks/integration-test-dataset.json', 'utf-8')
    );

    expect(testData.expected_output).toHaveLength(1);
    expect(testData.expected_output[0]).toHaveProperty('id');
    expect(testData.expected_output[0]).toHaveProperty('box');
    expect(testData.expected_output[0]).toHaveProperty('texto_original');
    expect(testData.expected_output[0]).toHaveProperty('texto_traducido');
  });
});
```

**Entregable:**
- Tests de flujo completo
- Validación contra mock data sets
- Verificación de contrato

---

### T4.7: Scripts de testing y cobertura

**Actualizar `frontend/package.json`:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Actualizar `functions/package.json`:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "build": "tsc"
  }
}
```

**Raíz `package.json`:**

```json
{
  "scripts": {
    "test:all": "npm run test:frontend && npm run test:backend",
    "test:coverage:all": "npm run test:coverage:frontend && npm run test:coverage:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:coverage:frontend": "cd frontend && npm run test:coverage",
    "test:backend": "cd functions && npm run test",
    "test:coverage:backend": "cd functions && npm run test:coverage"
  }
}
```

**Entregable:**
- Scripts ejecutables
- Reportes de cobertura generables

---

### T4.8: Documentación de testing

**Crear `TESTING.md`:**

```markdown
# Testing Guide

## Frontend Tests

### Run Tests
\`\`\`bash
cd frontend
npm run test          # Run once
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
npm run test:ui      # UI dashboard
\`\`\`

### Test Structure
- `src/__tests__/` contains all test files
- Suffix: `*.test.ts`
- Coverage target: >70%

## Backend Tests

### Run Tests
\`\`\`bash
cd functions
npm run test          # Run once
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report
\`\`\`

### Mock Datasets
- `/mocks/ocr-response.json` - Vision model output
- `/mocks/translate-response.json` - Translation model output
- `/mocks/integration-test-dataset.json` - Full pipeline

## CI/CD

GitHub Actions runs tests on every push/PR to main/develop:
- Node 18.x and 20.x
- Lint pass required
- Test coverage threshold: 60%
- Auto-deploy to Netlify on main merge

## Contract Validation

All responses must match:
\`\`\`typescript
{
  id: number;
  box: [ymin, xmin, ymax, xmax];
  texto_original: string;
  texto_traducido: string;
}
\`\`\`

## Running E2E

\`\`\`bash
npm run test:all
\`\`\`
```

**Entregable:**
- Guía clara de testing
- Comandos copy-paste
- Coverage requirements

---

### T4.9: Configuración opcional - Análisis de cobertura y reportes

**Crear `.github/workflows/coverage.yml`:**

```yaml
name: Coverage Report

on:
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install & Test Frontend
        run: cd frontend && npm install && npm run test:coverage

      - name: Install & Test Backend
        run: cd functions && npm install && npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json,./functions/coverage/coverage-final.json
          flags: unittests
          fail_ci_if_error: false
```

**Entregable:**
- Reporte automático de cobertura
- Integración con Codecov (opcional)

---

### T4.10: Características opcionales documentadas

**Crear `FEATURES_FUTURAS.md`:**

```markdown
# Características Futuras

## Fase 2: Persistencia y Caché

### Firebase Realtime Database
- Guardar JSONs procesados
- Evitar reprocesamiento de imágenes
- Índice por imagen hash (SHA256)

```typescript
// functions/src/lib/firebase-client.ts
export class FirebaseClient {
  async cacheTranslation(imageHash: string, translations: TranslationBox[]) {
    // Store in Firebase
  }

  async getFromCache(imageHash: string): Promise<TranslationBox[] | null> {
    // Retrieve from Firebase
  }
}
```

## Fase 3: Audio y TTS

- Usar Azure Speech Services
- Text-to-Speech para traducción
- Selector de idioma destino

## Fase 4: Mejora UI/UX

- Modo oscuro completo
- Selección de región con mouse
- Editor manual de traducciones
- Historial de traducciones

## Fase 5: Escalabilidad

- Batch processing
- WebSocket para progreso en tiempo real
- Almacenamiento en S3
- Rate limiting robusto

\`\`\`

**Entregable:**
- Roadmap documentado
- Código de ejemplo para cada feature
- Prioridades claras

---

## Resumen: Scripts finales

**Raíz del proyecto:**

```bash
# Setup inicial
npm install
cd frontend && npm install && cd ..
cd functions && npm install && cd ..

# Desarrollo
npm run dev

# Testing
npm run test:all
npm run test:coverage:all

# Build & Deploy
npm run build:all
npm run deploy (vía Netlify CLI)
```

**Entregable final:**
- Pipeline CI/CD funcional
- Tests ejecutables
- Mock data sets listos
- Documentación completa
- Deploy automático a Netlify
