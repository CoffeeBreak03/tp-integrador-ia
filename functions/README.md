# Backend (Express) — Documentación de ejecución

Resumen
- Carpeta: `functions`
- Propósito: Orquestar pipeline IA (Visión/OCR → Traducción) y exponer endpoints de la API:
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
  - `AZURE_FOUNDRY_MODEL_VISION` - p. ej. `gpt-4o`
  - `AZURE_FOUNDRY_MODEL_TRANSLATE` - p. ej. `gpt-4o`

- Variable para modo mock:
  - `USE_MOCK_AZURE=true` — fuerza respuestas desde `mocks/` (útil para desarrollo sin credenciales)

Archivos útiles
- `mocks/ocr-response.json` — salida simulada del OCR
- `mocks/translate-response.json` — salida simulada de traducción
- `payload.json` — payload de ejemplo para `process`
- `curl-examples.sh` — ejemplos cURL
- `postman-collection.json` — colección Postman exportable
- `.env.example` — plantilla de variables de entorno

Comandos rápidos

Instalación (desde la raíz del repo):
```bash
npm install
cd frontend && npm install
cd ../functions && npm install
```

Compilar backend:
```bash
cd functions
npm run build
```

Ejecutar tests (Jest):
```bash
cd functions
npm test
```

Levantar Express Backend localmente:
- Desde la raíz (levanta frontend y backend simultáneamente):
```bash
npm run dev
```
- O solo el backend (desde la carpeta `functions`):
```bash
cd functions
npm run dev
```

Luego probar con cURL (ejemplos en `functions/curl-examples.sh`):
```bash
curl -X POST http://localhost:3001/api/vision \
  -H "Content-Type: application/json" \
  -d @functions/payload.json

curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"こんにちは、contexto: これは漫画です"}'

curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d @functions/payload.json
```

Modo mock vs Azure real
- Mock (rápido, sin credenciales): `USE_MOCK_AZURE=true`. Respuestas tomadas de `mocks/`.
- Azure real: quitar `USE_MOCK_AZURE` o setearlo en `false` en tu archivo `.env` en la raíz del repo.

Notas de seguridad
- NO commitear credenciales. El archivo `.env` en la raíz está ignorado por `.gitignore`.
- En Azure App Service (o tu entorno de producción), configurar las variables de entorno en el panel de configuración de la app.

Validación del contrato
- Antes de devolver el resultado final, el backend valida que la respuesta cumple el esquema (`functions/src/lib/validate-contract.ts`).

Siguiente paso sugerido (cuando deployees a Azure):
1. Configurar variables de Azure en la configuración del App Service.
2. Hacer un deploy por medio de GitHub Actions.
3. Llamar al endpoint `process` y verificar que el JSON devuelto cumple el contrato.

Soporte y debugging
- Logs: el servidor Express usa `console.log`/`console.error` para traza rápida.
- Si alguna llamada a Azure falla, revisá los logs del proceso Node/Express.
