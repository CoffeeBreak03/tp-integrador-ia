# 🔍 VERIFICACIÓN DE SETUP

Ejecuta este checklist después de `npm run setup` para asegurar que todo está OK.

## ✓ Estructura de carpetas

```bash
# Desde la raíz del proyecto, verifica:
ls frontend/src/
ls functions/src/
ls mocks/
ls .github/workflows/
```

Deberías ver:
- ✅ `frontend/src/main.ts`
- ✅ `frontend/src/App.vue`
- ✅ `frontend/public/manifest.json`
- ✅ `functions/src/vision.ts`
- ✅ `functions/src/orchestrator.ts`
- ✅ `mocks/ocr-response.json`
- ✅ `.github/workflows/ci.yml`

## ✓ Dependencies instaladas

```bash
# Frontend
cd frontend
npm list vue vite tailwindcss vitest
cd ..

# Functions
cd functions
npm list typescript jest @types/node
cd ..
```

Deberías ver versiones (no errores).

## ✓ Configuraciones compilables

```bash
# Frontend TypeScript
cd frontend
npx tsc --noEmit
cd ..

# Backend TypeScript
cd functions
npx tsc --noEmit
cd ..
```

Ambos deberían completar sin errores.

## ✓ Build exitoso

```bash
# Frontend
cd frontend
npm run build
# Deberías ver carpeta dist/ creada
cd ..

# Backend
cd functions
npm run build
# Deberías ver carpeta dist/ creada
cd ..
```

## ✓ Mock data valida

```bash
# Validar que mock data es JSON válido
cat frontend/src/mock/mock-data.json | python -m json.tool
cat mocks/ocr-response.json | python -m json.tool
```

## ✓ Tests descubribles

```bash
# Frontend
cd frontend
npm run test -- --listTests
cd ..

# Backend
cd functions
npm run test -- --listTests
cd ..
```

## ✓ Puertos disponibles

```bash
# Comprobar que puertos 5173 y 8888 están libres
# Frontend: http://localhost:5173
# Backend: http://localhost:8888
```

---

## Si algo falla

| Problema | Solución |
|----------|----------|
| `npm: command not found` | Instalar Node.js 18+ |
| `Module not found` | Ejecutar `npm run setup` nuevamente |
| `Port already in use` | Cambiar puerto en `vite.config.ts` o `netlify.toml` |
| `TypeScript errors` | Verificar `tsconfig.json` está en lugar correcto |
| `Mock data invalid JSON` | Validar JSON con `python -m json.tool` |

---

## 🎯 Cuando todo esté OK

```bash
# Verifica que esto funciona:
npm run dev

# En otra terminal:
npm run test:all

# Todo debería correr sin errores
```

✅ **Setup completado correctamente**
