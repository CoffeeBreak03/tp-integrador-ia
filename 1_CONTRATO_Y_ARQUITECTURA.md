# 1_CONTRATO_Y_ARQUITECTURA.md

## Contrato de datos JSON

- Solo se transmite un array de objetos.
- Cada objeto representa un cuadro de texto detectado en el manga.
- Coordenadas normalizadas en escala de 0 a 1000.

```json
[
  {
    "id": 1,
    "box": [100, 120, 240, 360],
    "texto_original": "原文テキスト",
    "texto_traducido": "Texto traducido al español"
  }
]
```

### Schema formal

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "box", "texto_original", "texto_traducido"],
    "properties": {
      "id": { "type": "integer", "minimum": 1 },
      "box": {
        "type": "array",
        "minItems": 4,
        "maxItems": 4,
        "items": { "type": "integer", "minimum": 0, "maximum": 1000 }
      },
      "texto_original": { "type": "string", "minLength": 1 },
      "texto_traducido": { "type": "string", "minLength": 1 }
    },
    "additionalProperties": false
  }
}
```

## Estructura de carpetas sugerida

```text
tp-integrador-ia/
├── README.md
├── netlify.toml
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ImageUploader.vue
│   │   │   ├── OverlayRenderer.vue
│   │   │   └── TranslationPanel.vue
│   │   ├── views/
│   │   ├── lib/
│   │   │   ├── scale.ts
│   │   │   └── contract.ts
│   │   ├── mock/
│   │   │   └── mock-data.json
│   │   ├── __tests__/
│   │   └── styles/
│   └── public/
├── functions/
│   ├── package.json
│   ├── netlify.toml (opcional override)
│   ├── src/
│   │   ├── vision.ts
│   │   ├── translate.ts
│   │   ├── orchestrator.ts
│   │   ├── lib/
│   │   │   ├── azure-client.ts
│   │   │   └── validate-contract.ts
│   │   ├── types/
│   │   │   └── contract.ts
│   │   └── __tests__/
│   ├── dist/ (generado en build)
│   └── .env.example
├── mocks/
│   ├── ocr-response.json
│   ├── translate-response.json
│   └── integration-test-dataset.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── coverage.yml
├── tests/
│   ├── e2e/
│   └── integration/
├── TESTING.md
└── FEATURES_FUTURAS.md
```

## Contrato entre Frontend y Backend

**Endpoint:** `POST /.netlify/functions/process`

**Request:**
```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "box": [100, 120, 240, 360],
    "texto_original": "原文テキスト",
    "texto_traducido": "Texto traducido al español"
  }
]
```

**Response (500):**
```json
{
  "error": "Error message"
}
```

## Requisitos de GitHub

- **Repositorio:** `github.com/<TU_USUARIO>/tp-integrador-ia`
- **Branch principal:** `main`
- **Branch de desarrollo:** `develop`
- **Feature branches:** `feature/<nombre-tarea>`
- **Conventions:**
  - PR descriptions obligatorias
  - Commits atómicos (un cambio lógico por commit)
  - Main protegida: requiere PR + tests pasando

**Archivos iniciales requeridos:**

1. `README.md` - Descripción, setup, arquitectura
2. `.gitignore` - Node, Vite, Netlify, IDE
3. `package.json` (raíz) - Scripts globales
4. `.env.example` - Template de variables

## Reglas de convivencia frontend/backend en monorepo

### Separación clara

| Aspecto | Frontend | Backend |
|---------|----------|---------|
| Ubicación | `/frontend` | `/functions` |
| package.json | Propio | Propio |
| Build | Vite | TypeScript compiler |
| Deploy | Netlify (carpeta dist) | Netlify Functions |
| Puerto local | 5173 | 8888 (.netlify dev) |

### Configuración de entorno

**Raíz `netlify.toml`:**
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
```

### Variables de entorno

**Solo backend necesita secrets:**
```
AZURE_FOUNDRY_ENDPOINT=https://region.api.cognitive.microsoft.com
AZURE_FOUNDRY_API_KEY=<api-key-secret>
AZURE_FOUNDRY_MODEL_VISION=gpt-4-vision
AZURE_FOUNDRY_MODEL_TRANSLATE=gpt-4-turbo
```

**Configurar en:** Netlify Dashboard → Site settings → Build & deploy → Environment

### Comunicación entre capas

```
Frontend (Vue 3 + Vite + TailwindCSS)
    ↓ fetch("/api/process", { body: imageBase64 })
    ↓
Netlify Functions (Node.js Serverless)
    ↓ Valida contrato
    ↓ Llama a Azure AI Foundry
    ↓ Orquesta pipeline (Visión → Traducción)
    ↓
Azure AI Foundry (Modelos Open Source)
    ↓ Retorna JSON estructurado
    ↓
Backend (Transforma a contrato)
    ↓ fetch response
    ↓
Frontend (Renderiza overlay)
```

## Stack técnico resumido

| Capa | Tecnología | Propósito |
|------|------------|----------|
| **Frontend** | Vue 3 + Vite + TailwindCSS | UI móvil PWA |
| **Hosting Frontend** | Netlify | CDN + Deploy automático |
| **Backend** | Netlify Functions + Node.js | Orquestación serverless |
| **IA** | Azure AI Foundry (Open Source models) | Visión + NLP |
| **Base de datos** | Firebase (opcional) | Caché de traducciones |
| **CI/CD** | GitHub Actions | Testing + Deploy automático |
| **Testing** | Vitest (frontend) + Jest (backend) | Cobertura >60% |

## Notas de arquitectura

1. **Mock-Driven Development:** Frontend no depende de backend. Consume `/mock/mock-data.json` desde día 1.
2. **Contrato como interfaz:** JSON es la única superficie de comunicación.
3. **Serverless:** Cero overhead de servidor. Escalabilidad automática.
4. **Desacoplamiento total:** Cada miembro del equipo puede desarrollar en paralelo sin bloqueos.
5. **PWA móvil-first:** Responsive, installable, offline-ready.
6. **Open Source IA:** No vendor lock-in. Flexibilidad en modelos.

## Próximos pasos

1. **Crear repositorio en GitHub** (Tarea T4.1)
2. **Clonar y configurar ambiente local** (Cada miembro)
3. **Dividir tareas por archivo .md** (Asignación por miembro)
4. **Iniciar en paralelo desde día 1** (No hay dependencias iniciales)
5. **Validar contrato en testing** (Requisito obligatorio)
