# Backend (Netlify Functions) — Documentación de ejecución

Resumen
- Carpeta: `functions`
- Propósito: Orquestar pipeline IA (Visión/OCR → Traducción) y exponer endpoints serverless:
  - `/api/vision` → `vision` (POST)
  - `/api/translate` → `translate` (POST)
  - `/api/process` → `process` (POST)

Requisitos locales
- Node.js 18+ instalado
- `npm` (v8+ recomendable)

Variables de entorno
- Para pruebas con Azure (no commitear):
  - `AZURE_FOUNDRY_ENDPOINT` - URL del endpoint
  - `AZURE_FOUNDRY_API_KEY` - API Key
  - `AZURE_FOUNDRY_MODEL_VISION` - p. ej. `gpt-4-vision`
  - `AZURE_FOUNDRY_MODEL_TRANSLATE` - p. ej. `gpt-4-turbo`

- Variable para modo mock:
  - `USE_MOCK_AZURE=true` — fuerza respuestas desde `mocks/` (útil para desarrollo sin credenciales)

Archivos útiles
- `mocks/ocr-response.json` — salida simulada del OCR
- `mocks/translate-response.json` — salida simulada de traducción
- `payload.json` — payload de ejemplo para `process`
- `curl-examples.sh` — ejemplos cURL
- `postman-collection.json` — colección Postman exportable
- `.env.example` — plantilla de variables de entorno
- `tempInvoke.cjs` — script temporal para invocar handlers localmente en modo mock

Comandos rápidos

Instalación (desde la raíz del repo):
```bash
npm install
cd frontend && npm install
cd ../functions && npm install
```

Compilar funciones:
```bash
cd functions
npm run build
```

Ejecutar tests (Jest):
```bash
cd functions
npm test
```

Probar handlers localmente (modo mock):
- Usando el script temporal (ya configurado para usar mocks):
```bash
cd functions
node ./tempInvoke.cjs
```

Levantar `netlify dev` y probar endpoints via HTTP:
- PowerShell (ejecuta en la raíz del repo):
```powershell
$env:USE_MOCK_AZURE='true'
npx netlify dev
```
- Bash:
```bash
export USE_MOCK_AZURE=true
npx netlify dev
```
Luego probar con cURL (ejemplos en `functions/curl-examples.sh`):
```bash
curl -X POST http://localhost:8888/.netlify/functions/vision \
  -H "Content-Type: application/json" \
  -d @functions/payload.json

curl -X POST http://localhost:8888/.netlify/functions/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"こんにちは、これは漫画です"}'

curl -X POST http://localhost:8888/.netlify/functions/process \
  -H "Content-Type: application/json" \
  -d @functions/payload.json
```

Modo mock vs Azure real
- Mock (rápido, sin credenciales): `USE_MOCK_AZURE=true`. Respuestas tomadas de `mocks/`.
- Azure real: quitar `USE_MOCK_AZURE` y exportar las variables necesarias (ver sección "Variables de entorno").

Notas de seguridad
- NO commitear credenciales. Añadir `functions/.env` a `.gitignore` (ya existe `.env` en root `.gitignore`).
- En Netlify (o CI) configurar las variables de entorno en el dashboard.

Validación del contrato
- Antes de devolver el resultado final, el backend valida que la respuesta cumple el esquema (`functions/src/lib/validate-contract.ts`).

Siguiente paso sugerido (cuando levantes Azure):
1. Configurar variables de Azure en tu entorno o en Netlify Dashboard.
2. Ejecutar `npx netlify dev` sin `USE_MOCK_AZURE` o usar `tempInvoke.cjs` ajustado para env vars.
3. Llamar al endpoint `process` y verificar que el JSON devuelto cumple el contrato.

Soporte y debugging
- Logs: las funciones usan `console.log`/`console.error` para traza rápida.
- Si alguna llamada a Azure falla, revisá `functions/dist` y los mensajes HTTP devueltos.

Contacto
- Si querés, yo puedo:
  - Arrancar `netlify dev` y la UI frontend en modo local (necesito que confirmes),
  - O ayudarte a configurar las variables en Netlify y hacer una prueba E2E contra Azure.

