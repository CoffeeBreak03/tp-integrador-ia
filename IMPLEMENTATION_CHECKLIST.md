# IMPLEMENTATION_CHECKLIST.md

## 📋 Checklist de Implementación - TP Integrador IA

Distribución de tareas por miembro (100% paralelo, 0 dependencias bloqueantes).

---

## 👤 Miembro A - Frontend UI Developer

**Objetivo:** Interfaz de carga de imágenes, renderizado de traducciones y panel lateral.

### Fase 1: Setup (1-2 días)
- [ ] Clonar repositorio
- [ ] Instalar dependencias (`npm install` en `/frontend`)
- [ ] Ejecutar `npm run dev` y validar puerto 5173
- [ ] Crear rama `feature/frontend-setup`

### Fase 2: Componentes Base (3-4 días)
- [ ] **T2.1:** Setup Vite + TailwindCSS + PWA
  - [ ] `vite.config.ts` con alias `@/`
  - [ ] `tailwind.config.js` con tema oscuro
  - [ ] `public/manifest.json` para PWA
  - [ ] Build sin errores: `npm run build`

- [ ] **T2.2:** Componente ImageUploader
  - [ ] Carga de archivo (imagen + PDF)
  - [ ] Conversión a base64
  - [ ] Emisión de evento `@image-loaded`

- [ ] **T2.3:** Componente OverlayRenderer
  - [ ] Renderizado de imagen con Canvas
  - [ ] Cajas posicionadas (CSS absoluto)
  - [ ] Conversión coordenadas normalizadas → porcentajes
  - [ ] Responsive a tamaño de pantalla

- [ ] **T2.4:** Componente TranslationPanel
  - [ ] Lista scrollable de traducciones
  - [ ] Búsqueda en tiempo real
  - [ ] Tema oscuro (`dark:` classes)
  - [ ] Evento de selección

### Fase 3: Integración Mock (2 días)
- [ ] **T2.5:** Utilitarios (scale.ts, contract.ts)
  - [ ] Funciones de conversión de escala
  - [ ] Validador de contrato
  - [ ] TypeScript types exportables

- [ ] **T2.6:** App.vue principal
  - [ ] Layout: imagen + overlay + panel
  - [ ] Composición de componentes
  - [ ] Carga de `/mock/mock-data.json`

- [ ] **T2.7:** Mock data y PWA
  - [ ] `src/mock/mock-data.json` válido
  - [ ] `public/manifest.json` completo
  - [ ] Meta tags en HTML

### Fase 4: Testing (2 días)
- [ ] **T2.8:** Tests unitarios (Vitest)
  - [ ] `vitest.config.ts` configurado
  - [ ] Tests para scale.ts
  - [ ] Tests para contract.ts
  - [ ] Tests para componentes (props, events)
  - [ ] Cobertura >70%
  - [ ] `npm run test:coverage` generando reportes

### Validación Final
- [ ] ✓ Build sin errores
- [ ] ✓ Tests pasando (100%)
- [ ] ✓ App cargable en http://localhost:5173
- [ ] ✓ Overlay renderizado sobre mock-data.json
- [ ] ✓ Panel de traducción funcional
- [ ] ✓ Tema oscuro toggle (no bloqueante)
- [ ] ✓ PWA instalable

**Tiempo estimado:** 8-10 días | **Bloqueador:** Ninguno

---

## 👤 Miembro B - Backend Engineer

**Objetivo:** Netlify Functions, cliente Azure AI, orquestación del pipeline IA.

### Fase 1: Setup (1-2 días)
- [ ] Clonar repositorio
- [ ] Instalar dependencias (`npm install` en `/functions`)
- [ ] Setup `.env.example` (no commitear `.env`)
- [ ] Crear rama `feature/backend-setup`

### Fase 2: Cliente Azure (2-3 días)
- [ ] **T3.1:** Configuración inicial
  - [ ] `tsconfig.json` para Node.js
  - [ ] `jest.config.js` para testing
  - [ ] `netlify.toml` con rutas de funciones

- [ ] **T3.2:** Cliente Azure AI Foundry
  - [ ] Clase `AzureClient`
  - [ ] Método `callVisionModel(imageBase64)`
  - [ ] Método `callTranslateModel(text)`
  - [ ] Error handling básico
  - [ ] Autenticación via header `api-key`

### Fase 3: Tipos y Contrato (1-2 días)
- [ ] **T3.3:** Tipos TypeScript
  - [ ] `TranslationBox` interface
  - [ ] `VisionOutput` interface
  - [ ] Función `denormalizeVisionToContract()`

### Fase 4: Orquestador (2 días)
- [ ] **T3.4:** Pipeline Orchestrator
  - [ ] Clase `PipelineOrchestrator`
  - [ ] Método `processMangaImage(imageBase64)`
  - [ ] Parseo resiliente de outputs
  - [ ] Logging de progreso

### Fase 5: Funciones Lambda (2-3 días)
- [ ] **T3.5:** Tres endpoints REST
  - [ ] `POST /.netlify/functions/vision` (test OCR)
  - [ ] `POST /.netlify/functions/translate` (test NLP)
  - [ ] `POST /.netlify/functions/process` (pipeline completo)
  - [ ] Validación de requests
  - [ ] Response en formato JSON
  - [ ] Error handling 500

### Fase 6: Testing Manual (1-2 días)
- [ ] **T3.6:** Tests con cURL/Postman
  - [ ] Script cURL para vision
  - [ ] Script cURL para translate
  - [ ] Script cURL para process
  - [ ] Colección Postman exportable

### Fase 7: Testing Automático (2 días)
- [ ] **T3.7:** Tests unitarios (Jest)
  - [ ] Tests para AzureClient
  - [ ] Tests para transformación de contrato
  - [ ] Tests para orquestador
  - [ ] Cobertura >60%
  - [ ] `npm run test:coverage` generando reportes

### Validación Final
- [ ] ✓ Build TypeScript sin errores
- [ ] ✓ Tests Jest pasando (100%)
- [ ] ✓ Funciones deployables
- [ ] ✓ Endpoints REST válidos
- [ ] ✓ Contrato JSON validado
- [ ] ✓ Error handling robusto
- [ ] ✓ Secrets configurables via .env

**Tiempo estimado:** 10-12 días | **Bloqueador:** Ninguno

---

## 👤 Miembro C - DevOps + QA Engineer

**Objetivo:** GitHub setup, CI/CD, mock datasets, tests integración.

### Fase 1: GitHub Setup (1 día)
- [ ] Crear repositorio: `github.com/<usuario>/tp-integrador-ia`
- [ ] **T4.1:** Configuración inicial
  - [ ] `.github/workflows/ci.yml` creado
  - [ ] Branch main protegida
  - [ ] Require PR + tests
  - [ ] `.gitignore` configurado
  - [ ] `README.md` completo

### Fase 2: Mock Datasets (1-2 días)
- [ ] **T4.3:** Crear 3 JSON sets
  - [ ] `mocks/ocr-response.json` (output visión)
  - [ ] `mocks/translate-response.json` (output traducción)
  - [ ] `mocks/integration-test-dataset.json` (pipeline completo)
  - [ ] Esquema consistente con contrato
  - [ ] Coordenadas realistas (0-1000)

### Fase 3: Configuración Netlify (1-2 días)
- [ ] **T4.2:** Deploy automático
  - [ ] `netlify.toml` raíz configurado
  - [ ] Scripts de build: `npm run build:all`
  - [ ] Funciones redirects configuradas
  - [ ] Environment variables en dashboard
  - [ ] Deploy Previews habilitado

### Fase 4: Testing Infraestructura (3-4 días)
- [ ] **T4.4:** Frontend tests (Vitest)
  - [ ] `vitest.config.ts` configurado
  - [ ] Tests para componentes (OverlayRenderer, TranslationPanel)
  - [ ] Tests para utilitarios
  - [ ] Reportes de cobertura

- [ ] **T4.5:** Backend tests (Jest)
  - [ ] `jest.config.js` configurado
  - [ ] Tests unitarios Azure client
  - [ ] Tests transformación contrato
  - [ ] Reportes de cobertura

- [ ] **T4.6:** Tests integración (E2E mock)
  - [ ] Test pipeline completo con mocks
  - [ ] Validación contrato output
  - [ ] Parseadores resilientes

### Fase 5: CI/CD Pipeline (2-3 días)
- [ ] **T4.1:** GitHub Actions workflow
  - [ ] Tests en Node 18.x + 20.x
  - [ ] Lint (opcional)
  - [ ] Build frontend + backend
  - [ ] Cobertura >60% verificada
  - [ ] Deploy automático en main

- [ ] **T4.9:** Coverage reporting
  - [ ] `.github/workflows/coverage.yml` creado
  - [ ] Codecov integrado (opcional)
  - [ ] Badges en README

### Fase 6: Documentación (1-2 días)
- [ ] **T4.8:** Guía de testing
  - [ ] `TESTING.md` completo
  - [ ] Comandos copy-paste
  - [ ] Coverage requirements

- [ ] **T4.10:** Features futuras
  - [ ] `FEATURES_FUTURAS.md` documentado
  - [ ] Roadmap de fases
  - [ ] Ejemplos de código

### Validación Final
- [ ] ✓ GitHub Actions workflow ejecutándose
- [ ] ✓ Tests CI pasando en cada PR
- [ ] ✓ Deploy Previews funcional
- [ ] ✓ Main auto-deployment a Netlify
- [ ] ✓ Mock datasets válidos
- [ ] ✓ Cobertura >60%
- [ ] ✓ Documentación completa
- [ ] ✓ Badges en README

**Tiempo estimado:** 8-10 días | **Bloqueador:** Ninguno

---

## 🔄 Dependencias e Integración

### Sin bloqueadores (100% paralelo)

1. **Frontend** consume `mock-data.json` local → No espera backend
2. **Backend** expone endpoints REST → Frontend integra cuando esté listo
3. **DevOps** configura CI/CD → Ambos suben sus tests
4. **Integración final** (Semana 3-4): Frontend conecta a `/api/process`

### Punto de integración crítico

```
Frontend (fetch) → Backend endpoint (/api/process) → Azure IA
         ↓
   JSON respuesta
         ↓
   Renderizado overlay
```

**Responsabilidad conjunta:** Validar que respuesta cumple contrato JSON.

---

## ✅ Quality Gates

| Gate | Propietario | Criterio |
|------|-------------|----------|
| Build | Todos | 0 errores TypeScript |
| Tests unitarios | Frontend + Backend | >70% + >60% cobertura |
| Tests integración | DevOps | Pipeline completo Mock OK |
| Contrato JSON | Todos | Schema validado |
| CI/CD | DevOps | Tests pasan en cada PR |
| PWA | Frontend | Installable en móviles |
| Netlify Deploy | DevOps | Main → Prod automático |

---

## 🎯 Timeline Recomendado

```
Semana 1: Setup + Fase 2 en paralelo
├─ Miembro A: Components + Mock
├─ Miembro B: Azure client
└─ Miembro C: GitHub + CI/CD

Semana 2: Fase 3-4 completar
├─ Miembro A: Tests frontend
├─ Miembro B: Endpoints + Tests
└─ Miembro C: Mock datasets + Testing

Semana 3: Integración
├─ Frontend conecta a /api/process
├─ Validación de contrato JSON
└─ E2E testing

Semana 4: Pulir + Documentación
├─ Bugs y optimizaciones
├─ README y guías
└─ Deploy a Netlify
```

---

## 📞 Comunicación Asincrónica

- **Decisiones:** Issues de GitHub (cualquier miembro propone)
- **Cambios de contrato:** Pull Request con descripción
- **Bloqueos:** Comment en PR (verificar daily)
- **Documentación:** Cada uno actualiza su .md

No hay reuniones. Documentación reemplaza reuniones.

---

## 🚀 Comandos Quick Reference

**Setup inicial:**
```bash
git clone <repo>
npm install && cd frontend && npm install && cd ../functions && npm install && cd ..
```

**Desarrollo (cada uno en su folder):**
```bash
cd frontend && npm run dev
cd functions && npm run dev (en otra terminal)
```

**Testing:**
```bash
npm run test:all
npm run test:coverage:all
```

**Build + Deploy:**
```bash
npm run build:all
# Netlify deploys automáticamente en main merge
```

---

**Creado:** Mayo 2026  
**Actualizado:** Diariamente por equipo  
**Próxima revisión:** Fin de semana 1
