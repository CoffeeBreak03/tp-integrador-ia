# 🤖 AGENTS.md - Guía de Arquitectura y Estructura del Proyecto para Agentes de IA

Este documento centraliza toda la información técnica, de arquitectura y estructura del proyecto. Su propósito es servir como la **única fuente de verdad** para que los agentes de IA puedan comprender, mantener y expandir el sistema de forma coherente.

---

## 📖 1. Descripción General del Proyecto

**Manga Translate** es un traductor automático de páginas de manga estructurado como un **monorepo**. Su flujo principal automatiza la digitalización, la detección de globos de diálogo, el recorte (cropping) de sub-imágenes, el reconocimiento de texto (OCR) y la traducción al español mediante un pipeline de Inteligencia Artificial de dos fases.

El stack tecnológico principal consiste en:
- **Frontend**: Single Page Application (SPA) responsiva y progresiva (PWA) desarrollada en **Vue 3** + **TypeScript** + **Vite** + **TailwindCSS**.
- **Backend**: Serverless API implementada con **Netlify Functions** + **Node.js** + **TypeScript**.
- **Servicios de IA**: Pipeline de detección espacial (YOLOv8) alojado en **Hugging Face Spaces** y un motor OCR+Traducción multimodal (GPT-4o) alojado en **Azure AI Foundry**.

---

## 🏛️ 2. Arquitectura de Alto Nivel y Flujo de Datos

### Flujo de Ejecución E2E (End-to-End)

```mermaid
sequenceDiagram
    participant Usuario as Cliente/Navegador
    participant Front as Frontend (Vue 3)
    participant Back as Netlify Function (process)
    participant HF as Hugging Face Space (YOLOv8)
    participant GPT as Azure AI Foundry (GPT-4o)

    Usuario->>Front: Carga Imagen/PDF/ZIP
    Front->>Front: Extrae páginas a base64 (PNG/JPEG)
    loop Para cada página del capítulo
        Front->>Back: POST /api/process { imageBase64, contexto? }
        Back->>HF: POST /analyze-manga { image_base64 }
        Note over HF: Detecta globos de diálogo (YOLOv8)
        HF-->>Back: Retorna globos con id y box [ymin, xmin, ymax, xmax]
        Note over Back: Jimp recorta (crops) cada globo en sub-imágenes
        Back->>GPT: Envía sub-imágenes + contexto del capítulo (Multimodal)
        Note over GPT: OCR japonés + Traducción español + Actualiza contexto
        GPT-->>Back: Retorna JSON { contexto, traducciones }
        Note over Back: Mezcla boxes espaciales y traducciones
        Back->>Back: Valida conformidad con el Contrato JSON
        Back-->>Front: Retorna { contexto, translations: TranslationBox[] }
        Front->>Front: Cachea resultado y renderiza overlays
        Front->>Front: Pasa contexto actualizado a la siguiente iteración
    end
```

---

## 📑 3. Contrato de Datos (API Contract)

La superficie de comunicación entre el frontend y el backend está estrictamente tipada y validada en tiempo de ejecución en ambas capas.

### Esquema del Contrato Principal (`TranslationBox` / `TranslationContract`)

Cada elemento representa un globo de diálogo detectado y traducido:

```typescript
export interface TranslationBox {
  id: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  texto_original: string;
  texto_traducido: string;
}
```

### Regla Crítica de Coordenadas Normalizadas

Para garantizar que la interfaz de usuario sea responsiva a cualquier tamaño de pantalla, las coordenadas de los cuadros (`box`) **siempre están normalizadas en un rango de 0 a 1000** relativo a las dimensiones originales de la imagen:
- `ymin`: Borde superior (0 = inicio de la imagen, 1000 = final de la imagen vertical).
- `xmin`: Borde izquierdo (0 = inicio de la imagen, 1000 = final de la imagen horizontal).
- `ymax`: Borde inferior.
- `xmax`: Borde derecho.

*Ejemplo*: Si una caja está en `[100, 150, 300, 450]`, el frontend interpretará que ocupa del `10%` al `30%` del alto de la imagen y del `15%` al `45%` del ancho de la imagen.

### Endpoints del Backend

Todos los endpoints del backend se despliegan bajo `/.netlify/functions/*` y se redirigen mediante reglas de Netlify a `/api/*`.

1. **`POST /api/process` (Pipeline Completo)**
   - **Request**: `{"imageBase64": "data:image/jpeg;base64,...", "contexto": "<opcional, contexto del capítulo>"}`
   - **Response (200)**: `{"contexto": "<contexto actualizado>", "translations": TranslationBox[]}`
   - **Response (500/502)**: `{"error": "Detalle del error"}` (Retorna `502` si Hugging Face falló por timeout o cold start).
   - **Nota**: Si no se envía `contexto`, se retorna con `contexto: ""`.

2. **`POST /api/vision` (Compatibilidad / Detección Individual)**
   - **Request**: `{"imageBase64": "..."}`
   - **Response**: `{"vision_output": "[{\"id\": 1, \"box\": [...]}]"}` (Respuesta cruda de YOLOv8).

3. **`POST /api/translate` (Compatibilidad / Traducción de Texto)**
   - **Request**: `{"text": "..."}`
   - **Response**: `{"translated": "..."}` (Traducción de texto plano).

4. **`POST /api/warm-up` (Despertador)**
   - **Request**: Ninguno.
   - **Response**: Envía una imagen mínima de 1x1 píxeles a Hugging Face para encender el contenedor remoto si está inactivo (cold-start mitigation).

---

## 📁 4. Mapa del Directorio y Responsabilidades

```text
tp-integrador-ia/
├── .github/workflows/          ← Configuración de GitHub Actions (CI/CD)
│   ├── ci.yml                  ← Corre tests de front y back en cada push/PR
│   └── coverage.yml            ← Generación e integración de cobertura Codecov
├── agents/                     
│   └── AGENTS.md               ← Este documento (fuente de verdad para IAs)
├── frontend/                   ← Aplicación Cliente SPA (Vue 3 + Vite)
│   ├── src/
│   │   ├── main.ts             ← Inicialización y montaje de Vue
│   │   ├── App.vue             ← Componente raíz, orquestación de capítulo y caché
│   │   ├── components/         ← Componentes de UI
│   │   │   ├── ImageUploader.vue     ← Carga de imágenes, PDFs, ZIPs y multi-selección
│   │   │   ├── OverlayRenderer.vue   ← Dibuja las cajas traducidas absolutas + spinner de carga
│   │   │   ├── PageNavigator.vue     ← Navegación entre páginas del capítulo (Anterior/Siguiente)
│   │   │   └── TranslationPanel.vue  ← Barra lateral de búsqueda y navegación
│   │   ├── lib/                ← Lógica auxiliar y compartida
│   │   │   ├── api.ts          ← Cliente HTTP con retry + soporte de contexto
│   │   │   ├── contract.ts     ← Validador de contrato + interfaces (ProcessPageResponse)
│   │   │   └── scale.ts        ← Conversiones de coordenadas [0-1000] ↔ píxeles
│   │   ├── mock/               
│   │   │   └── mock-data.json  ← Datos estáticos para simular la API
│   │   └── __tests__/          ← Suite de pruebas de Vitest
│   ├── tailwind.config.js      ← Configuración de TailwindCSS (soporte oscuro/claro)
│   ├── vite.config.ts          ← Configuración del empaquetador Vite
│   └── vitest.config.ts        ← Configuración de pruebas Vitest + jsdom
├── functions/                  ← API Backend Serverless (Netlify Functions)
│   ├── src/
│   │   ├── process.ts          ← Handler lambda principal (/process) con soporte de contexto
│   │   ├── vision.ts           ← Handler lambda de detección (/vision)
│   │   ├── translate.ts        ← Handler lambda de traducción de texto (/translate)
│   │   ├── warm-up.ts          ← Handler lambda de precalentamiento (/warm-up)
│   │   ├── orchestrator.ts     ← Coordinador del pipeline de IA con contexto acumulativo
│   │   ├── lib/                
│   │   │   ├── azure-client.ts       ← Cliente Azure/HF con prompt contextual para capítulos
│   │   │   ├── image-cropper.ts      ← Recorte físico de sub-imágenes usando Jimp
│   │   │   └── validate-contract.ts  ← Validación estricta del contrato en backend
│   │   └── types/              
│   │       └── contract.ts     ← Interfaces compartidas (TranslationBox, PageProcessResult)
│   └── __tests__/              ← Suite de pruebas de Jest para Node
├── mocks/                      ← Datasets de simulación global
│   ├── ocr-response.json       ← Mock de respuesta de YOLOv8
│   ├── translate-response.json ← Mock de respuesta de GPT-4o
│   └── integration-test-dataset.json  ← Dataset de prueba para integración
├── netlify.toml                ← Configuración de rutas, builds, timeout (26s) y redirecciones
└── package.json                ← Mono-repo scripts (setup, dev, build y tests)
```

---

## 🛠️ 5. Detalles Técnicos de Implementación

### 5.1. Mecanismo de Mock Mode (`USE_MOCK_AZURE`)
En el archivo [azure-client.ts](file:///e:/tmp/tp-integrador-ia/functions/src/lib/azure-client.ts), si se define la variable de entorno `USE_MOCK_AZURE=true`, el backend omitirá llamadas reales a Hugging Face y Azure AI Foundry. En su lugar:
1. Lee `mocks/ocr-response.json` para obtener los bounding boxes.
2. Lee `mocks/translate-response.json` para emular los textos japoneses y traducciones en español.
3. Devuelve los resultados de manera inmediata e idéntica a una llamada en vivo.

### 5.2. Pipeline de Detección y Recorte (Crop)
1. **Detección Espacial**: [azure-client.ts](file:///e:/tmp/tp-integrador-ia/functions/src/lib/azure-client.ts) envía el base64 de la imagen al space de Hugging Face (`/analyze-manga`). Este servicio retorna un array de globos detectados con sus coordenadas `box` normalizadas de 0 a 1000.
2. **Recorte en Memoria**: En [image-cropper.ts](file:///e:/tmp/tp-integrador-ia/functions/src/lib/image-cropper.ts), utilizando la librería `Jimp`, se lee el buffer de la imagen original. Se desnormalizan las coordenadas a píxeles absolutos usando las dimensiones de la imagen:
   $$\text{pixel\_x} = \lfloor(\text{xmin}/1000) \times \text{width}\rfloor$$
   $$\text{pixel\_width} = \lfloor((\text{xmax} - \text{xmin})/1000) \times \text{width}\rfloor$$
   Se recortan los fragmentos de la imagen original y se generan sub-imágenes en formato JPEG base64.

### 5.3. OCR y Traducción Multimodal con GPT-4o
En lugar de hacer OCR y luego traducir texto plano, se realiza una sola llamada multimodal en [azure-client.ts](file:///e:/tmp/tp-integrador-ia/functions/src/lib/azure-client.ts):
- Se envía a Azure GPT-4o un prompt del sistema instruyéndole comportarse como un motor OCR y traducción.
- El cuerpo del mensaje contiene texto con instrucciones e IDs junto con las imágenes recortadas en base64.
- GPT-4o procesa las sub-imágenes y devuelve directamente una estructura JSON válida que se mapea con los IDs de las coordenadas espaciales detectadas por YOLOv8.

### 5.4. Lógica de Escala del Frontend
1. **Recalcular Escala del Contenedor**: En [App.vue](file:///e:/tmp/tp-integrador-ia/frontend/src/App.vue#L179-L192), la función `recalcScale` asegura que el lienzo de la imagen no desborde horizontalmente la pantalla. Calcula el ancho disponible del contenedor padre y establece un factor CSS `scale()` dinámico sobre el contenedor central.
2. **Renderizado de Cajas**: En [OverlayRenderer.vue](file:///e:/tmp/tp-integrador-ia/frontend/src/components/OverlayRenderer.vue#L121-L131), la función `styleFromBox` toma el array de coordenadas normalizadas `[ymin, xmin, ymax, xmax]` y calcula porcentajes directos para aplicar estilos inline:
   - `top: ymin / 10%`
   - `left: xmin / 10%`
   - `width: (xmax - xmin) / 10%`
   - `height: (ymax - ymin) / 10%`
   Esto independiza completamente la posición visual del render del tamaño en píxeles del elemento `<img>` subyacente.

### 5.5. Soporte Multi-Página (PDF, ZIP, Multi-Imagen)
El componente [ImageUploader.vue](file:///e:/tmp/tp-integrador-ia/frontend/src/components/ImageUploader.vue) soporta tres formatos de carga:
- **PDF multi-página**: Usa `pdfjs-dist` (versión legacy) para extraer todas las páginas del PDF, renderizándolas sobre Canvas en memoria (máx. 1200×1600 px cada una). Se emite el evento `chapterLoaded` con el array completo de Data URLs.
- **Archivos ZIP**: Usa `jszip` (cargada bajo demanda) para descomprimir el archivo en memoria. Las imágenes se filtran por extensión (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`), se ordenan alfabéticamente y se emiten como capítulo.
- **Selección múltiple de imágenes**: Permite seleccionar varias imágenes del explorador de archivos (HTML5 `<input multiple>`), las ordena por nombre de archivo, y las emite como capítulo.
- Si se sube un solo archivo (imagen o PDF de una página), se mantiene el comportamiento legacy emitiendo `update:imageData`.
- Límite máximo configurable de **50 páginas** por capítulo.

### 5.6. Procesamiento Secuencial con Contexto
Cuando se carga un capítulo, [App.vue](file:///e:/tmp/tp-integrador-ia/frontend/src/App.vue) orquesta el procesamiento secuencial:
1. El frontend envía `POST /api/process` para cada página, una a la vez.
2. En cada request se incluye el campo `contexto` devuelto por la página anterior.
3. GPT-4o usa el contexto para mantener coherencia narrativa (nombres de personajes, tono, eventos).
4. Cada resultado se cachea en un `Map<number, CachedPage>` indexado por número de página.
5. Si el usuario navega a una página ya cacheada, los overlays se renderizan instantáneamente.
6. Si navega a una página aún no procesada, se muestra un spinner de carga centrado sobre la imagen.
7. El cliente HTTP ([api.ts](file:///e:/tmp/tp-integrador-ia/frontend/src/lib/api.ts)) implementa reintentos automáticos (máximo 3) con backoff exponencial para mitigar timeouts de cold start.

### 5.7. Navegación de Páginas
El componente [PageNavigator.vue](file:///e:/tmp/tp-integrador-ia/frontend/src/components/PageNavigator.vue) muestra:
- Botones "Anterior" y "Siguiente" para navegar entre páginas.
- Indicador "Página X / N" con el número actual y total.
- Spinner animado si la página actual está siendo procesada.
- Contador de progreso del capítulo `(procesadas/total)`.

---

## 🔐 6. Configuración de Entorno e Infraestructura

### Variables de Entorno Requeridas

Deben configurarse en un archivo `.env` en el directorio raíz (para desarrollo local con `netlify dev`) o en el panel de Netlify (Settings -> Environment Variables):

| Variable | Descripción | Valor Ejemplo |
|----------|-------------|---------------|
| `AZURE_FOUNDRY_ENDPOINT` | Endpoint base de Azure OpenAI | `https://<recurso>.services.ai.azure.com/api/projects/.../openai/v1/responses` |
| `AZURE_FOUNDRY_API_KEY` | API Key para la autorización en Azure | `FKhk8PQ2ZxcNJXjW4...` |
| `AZURE_FOUNDRY_MODEL_VISION` | Modelo para OCR/Vision (GPT-4o) | `gpt-4o` |
| `AZURE_FOUNDRY_MODEL_TRANSLATE` | Modelo para traducción (GPT-4o) | `gpt-4o` |
| `HF_SPACE_API_URL` | URL del espacio YOLOv8 | `https://coffeebreak03-manga-translate-ocr.hf.space` |
| `USE_MOCK_AZURE` | Bandera para usar mocks en local | `true` o `false` |
| `NODE_ENV` | Entorno de Node.js | `development` o `production` |

---

## 🧪 7. Guía de Testing para Agentes

El repositorio tiene dos suites de pruebas diferenciadas e independientes en cada subdirectorio del monorepo:

### 7.1. Pruebas Unitarias del Frontend (Vitest)
Se ubican en [frontend/src/\_\_tests\_\_/](file:///e:/tmp/tp-integrador-ia/frontend/src/__tests__/).
- Utilizan `jsdom` para emular el navegador.
- Archivos clave:
  - `scale.test.ts`: Valida las transformaciones matemáticas en [scale.ts](file:///e:/tmp/tp-integrador-ia/frontend/src/lib/scale.ts).
  - `contract.test.ts`: Valida que el parser detecte y rechace payloads ajenos al contrato en [contract.ts](file:///e:/tmp/tp-integrador-ia/frontend/src/lib/contract.ts).

### 7.2. Pruebas Unitarias del Backend (Jest)
Se ubican en [functions/\_\_tests\_\_/](file:///e:/tmp/tp-integrador-ia/functions/__tests__/).
- Utilizan `ts-jest` para ejecutar pruebas unitarias sobre Node.js.
- Archivos clave:
  - `contract.test.ts`: Valida el parseo y formateo a contrato en backend.
  - `validate-contract.test.ts`: Valida las restricciones físicas de la función `validateTranslationContract`.
  - `orchestrator.test.ts`: Emula el pipeline mediante mocks del cliente Azure y verifica que se llamen en secuencia los dos pasos de visión e traducción.

### 7.3. Integración Continua (CI/CD)
El flujo en `.github/workflows/ci.yml` se ejecuta automáticamente en cada commit de PR e incluye:
1. Instalación paralela de dependencias en `frontend/` y `functions/`.
2. Ejecución secuencial de `npm run test` en ambos subdirectorios.
3. Compilación (build) de ambos proyectos para verificar que no haya fallos de TypeScript.
4. Despliegue automático a producción en Netlify si los tests pasan exitosamente en la rama `main`.
