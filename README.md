# TP Integrador IA - Traductor de Manga

**Proyecto Universitario de Ingeniería de Software**

Aplicación PWA para traducción automática de manga usando visión computacional y NLP, desarrollada con Vue 3, Netlify Functions y Azure AI Foundry.

## 📋 Características

- **Frontend PWA:** Interfaz móvil 100% responsive con Vue 3 + Vite + TailwindCSS
- **Backend Serverless:** Netlify Functions (Node.js) sin servidor
- **Pipeline IA desacoplado:** Visión (OCR) → Traducción (NLP)
- **Arquitectura Mock-Driven:** Frontend y Backend independientes desde día 1
- **Tests automáticos:** GitHub Actions con CI/CD integrado
- **Deploy continuo:** Auto-deploy a Netlify en cada merge a main

## 🏗 Arquitectura

```
Frontend (Vue 3 + Vite) → Netlify Functions (Node.js) → Azure AI Foundry (Vision + NLP)
```

**Contrato de datos:** Único JSON estandarizado para toda la comunicación.

## 📁 Documentación

Cada archivo especifica tareas técnicas auto-contenidas:

1. **[1_CONTRATO_Y_ARQUITECTURA.md](1_CONTRATO_Y_ARQUITECTURA.md)**
   - Especificación JSON
   - Estructura de carpetas
   - Setup de GitHub

2. **[2_FRONTEND_MOCK_DRIVEN.md](2_FRONTEND_MOCK_DRIVEN.md)**
   - Componentes Vue (ImageUploader, OverlayRenderer, TranslationPanel)
   - Carga de imágenes/PDF
   - Renderizado de traducción con coordenadas normalizadas
   - Tests unitarios (Vitest)

3. **[3_BACKEND_Y_APIS.md](3_BACKEND_Y_APIS.md)**
   - Netlify Functions endpoints (`/api/vision`, `/api/translate`, `/api/process`)
   - Cliente Azure AI Foundry
   - Orquestación del pipeline IA
   - Tests con Jest

4. **[4_INFRAESTRUCTURA_Y_TESTING.md](4_INFRAESTRUCTURA_Y_TESTING.md)**
   - Pipeline CI/CD (GitHub Actions)
   - Mock datasets
   - Suite de tests completa
   - Deploy automático a Netlify

## 🚀 Quick Start

```bash
# Clonar
git clone https://github.com/CoffeeBreak03/tp-integrador-ia.git
cd tp-integrador-ia

# Setup
npm install
cd frontend && npm install && cd ..
cd functions && npm install && cd ..

# Desarrollo
npm run dev

# Testing
npm run test:all

# Build & Deploy (automático en main merge)
npm run build:all
```

## 👥 Equipo (3 integrantes)

### Distribución de tareas

**Miembro A - Frontend:**
- Ejecutar todas las tareas de `2_FRONTEND_MOCK_DRIVEN.md`
- Tests unitarios con Vitest
- Consume mock-data.json (sin dependencia del backend)

**Miembro B - Backend:**
- Ejecutar todas las tareas de `3_BACKEND_Y_APIS.md`
- Netlify Functions + Azure AI
- Tests unitarios con Jest

**Miembro C - Infraestructura + Testing:**
- Ejecutar todas las tareas de `4_INFRAESTRUCTURA_Y_TESTING.md`
- GitHub setup, CI/CD, mock datasets
- Tests de integración e2e

---

**Requisito crítico:** Cada miembro avanza 100% en paralelo sin esperar a otros. El Mock-Driven Development garantiza cero bloqueos.

## 🔧 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vue 3 + TypeScript + Vite + TailwindCSS |
| Backend | Node.js + Netlify Functions + TypeScript |
| IA | Azure AI Foundry (Open Source Models) |
| Hosting | Netlify (frontend + functions) |
| Testing | Vitest + Jest |
| CI/CD | GitHub Actions |
| DB (opcional) | Firebase Realtime |

## 📊 Contrato JSON

Única interfaz de comunicación entre frontend y backend:

```json
[
  {
    "id": 1,
    "box": [ymin, xmin, ymax, xmax],
    "texto_original": "Texto original",
    "texto_traducido": "Texto traducido al español"
  }
]
```

**Coordenadas normalizadas:** rango 0-1000 (independiente de tamaño de pantalla/imagen)

## ✅ Requisitos de Calidad

- ✓ Contrato validado en todos los tests
- ✓ Cobertura >60% (unittest + integration)
- ✓ GitHub Actions CI/CD pasando
- ✓ Deploy Preview funcional en cada PR
- ✓ PWA instalable en móviles

## 📝 Reglas de Git

- Main protegida: requiere PR + tests
- Commits atómicos: un cambio lógico por commit
- Feature branches: `feature/<nombre-tarea>`
- PR descriptions obligatorias

## 🔐 Variables de entorno

Configurar en Netlify Dashboard (no commitear `.env`):

```
AZURE_FOUNDRY_ENDPOINT=https://...
AZURE_FOUNDRY_API_KEY=<tu-key>
AZURE_FOUNDRY_MODEL_VISION=gpt-4-vision
AZURE_FOUNDRY_MODEL_TRANSLATE=gpt-4-turbo
```

## 🎯 Notas finales

- **100% asincrónico:** No hay reuniones de sincronización. Documentación reemplaza comunicación.
- **Mock-Driven:** El frontend nunca queda bloqueado esperando backend.
- **Contrato primero:** JSON es la única interfaz. Cambios requieren acuerdo en equipo.
- **Testing automático:** Cada PR valida tests antes de merge.
- **Deploy automático:** main → Netlify sin intervención manual.

---

**Creado:** Mayo 2026  
**Equipo:** 3 integrantes  
**Duración estimada:** 4-6 semanas (trabajo paralelo)
