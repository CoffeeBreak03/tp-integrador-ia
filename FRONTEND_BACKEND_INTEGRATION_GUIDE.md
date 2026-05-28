# Frontend-Backend Integration Guide

## Overview

El frontend ahora está completamente integrado con el backend. Cuando un usuario carga una imagen, esta se envía al endpoint `POST /.netlify/functions/process` para ser procesada (OCR + Traducción) en lugar de usar datos mock locales.

## Request/Response Flow

### Frontend → Backend

```
POST /.netlify/functions/process
Content-Type: application/json

{
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Importante**: El `imageBase64` incluye el prefijo `data:image/*;base64,` que el `FileReader.readAsDataURL()` genera automáticamente.

### Backend → Frontend

Formato esperado:
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

O con envoltorio:
```json
{
  "data": [
    {
      "id": 1,
      "box": [100, 120, 240, 360],
      "texto_original": "原文テキスト",
      "texto_traducido": "Texto traducido al español"
    }
  ]
}
```

## Testing en Desarrollo Local

### Prerequisitos

```bash
cd /tmp/tp-integrador-ia

# Frontend
cd frontend && npm install && npm run dev &

# Backend (en otra terminal)
netlify dev
```

El `netlify dev` expondrá:
- Frontend: http://localhost:3000 (o similar)
- Backend Functions: http://localhost:8888/.netlify/functions/process

### Test 1: Verificar Endpoint Disponible

```bash
curl -X POST http://localhost:8888/.netlify/functions/process \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'
```

**Resultado esperado**: 
- Status 200 con array JSON
- Status 500 con `{"error": "mensaje"}`

### Test 2: Upload de Imagen en UI

1. Abrir http://localhost:3000
2. Click en botón "+" o "Carga tu imagen o PDF"
3. Seleccionar imagen o PDF local
4. Observar:
   - Banner azul "Procesando imagen..." aparece
   - Botones deshabilitados durante procesamiento
   - Después de ~3-5s, traducciones aparecen
   - Overlays se muestran sobre la imagen
   - Panel de traducciones se puede deslizar desde la derecha

### Test 3: Manejo de Errores

Para probar error handling, simular backend offline:

```bash
# Detener netlify dev
# Intentar upload → debe mostrar error
```

Se debe ver:
- Banner rojo con "Error al procesar la imagen"
- Mensaje de error específico
- Panel de traducciones vacío

### Test 4: Validación de Contrato

El frontend valida que la respuesta cumpla el contrato. Para probar, editar temporalmente `functions/src/process.ts` para retornar formato inválido.

Resultado esperado:
- Error "Las traducciones no cumplen el contrato esperado"

## Checklist de Validación

- [ ] Endpoint responde con status 200 y array JSON válido
- [ ] Frontend detecta cambio de imagen y llama al endpoint
- [ ] Indicador de carga aparece durante procesamiento
- [ ] Traducciones se renderizan correctamente
- [ ] Overlays se posicionan en las coordenadas correctas
- [ ] Panel de traducciones se puede buscar/filtrar
- [ ] Errores del backend se muestran al usuario
- [ ] Botones se deshabilitan durante procesamiento
- [ ] La UI sigue siendo responsive durante carga

## Archivos Modificados

### Frontend

**`frontend/src/lib/api.ts`** (NUEVO)
- Contiene función `processImage(imageBase64)` 
- Maneja request/response al endpoint
- Valida contrato

**`frontend/src/App.vue`** (MODIFICADO)
- Importa `processImage`
- Estados: `isLoading`, `errorMessage`
- Watcher que llama `processImage` cuando se sube imagen
- Renderiza indicadores de carga/error

### Backend

No se modifica nada. El endpoint `/.netlify/functions/process` debe:
1. Recibir `imageBase64` en JSON
2. Procesar con Azure AI Foundry (Visión + Traducción)
3. Retornar array `TranslationContract[]`

## Debugging

Si algo no funciona:

### Frontend console.log

En `App.vue`, el watcher incluye try/catch que loguea errores:
```typescript
console.error('Error al procesar imagen:', error);
```

Revisar Browser DevTools → Console para mensajes.

### Network tab

Verificar que:
1. Request se envía a `/.netlify/functions/process` 
2. Headers incluyen `Content-Type: application/json`
3. Body tiene `imageBase64`
4. Response es 200 con array JSON

### Backend logs

Si usar `netlify dev`:
```bash
netlify dev
# Ver logs en terminal
```

## Consideraciones de Producción

### Tamaño de imágenes

El `imageBase64` puede ser muy grande para imágenes de alta resolución. En `ImageUploader.vue`:
- Para imágenes: se convierte directamente
- Para PDFs: se renderiza solo primera página a escala máxima 1200x1600

Considerar comprimir antes de enviar al backend en producción.

### Timeouts

El fetch actualmente no tiene timeout explícito. Considerar agregar:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s
fetch(url, { signal: controller.signal });
```

### CORS

El frontend en `localhost:3000` hace fetch a `localhost:8888` (mismo origen en dev).
En Netlify (producción), ambos corren en el mismo dominio, sin problemas CORS.

## Rollback a Mocks

Si es necesario volver a development mock-driven, restaurar en `App.vue`:
```typescript
onMounted(async () => {
  try {
    const module = await import('./mock/mock-data.json');
    const mockData = module.default as unknown;
    if (validateContract(mockData)) {
      translations.value = mockData;
    }
  } catch (error) {
    console.warn('No se pudo cargar mock-data.json', error);
  }
});
```

Archivo `frontend/src/mock/mock-data.json` sigue disponible para referencia.
