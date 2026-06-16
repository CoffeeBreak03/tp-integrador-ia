# 📚 Guía de Comandos (COMMANDS.md)

Este documento contiene todos los comandos esenciales para instalar, ejecutar, probar y construir el proyecto en desarrollo y producción.

---

## 🌍 1. Comandos Globales (Desde la Raíz del Monorepo)

Ejecutar estos comandos en la raíz del proyecto (`tp-integrador-ia/`):

```bash
# 1. Instalar dependencias en la raíz, frontend/ y functions/ en un solo paso
npm run setup

# 2. Iniciar el entorno de desarrollo local (inicia frontend y backend en paralelo)
npm run dev

# 3. Compilar el proyecto completo para producción
npm run build:all

# 4. Ejecutar todas las pruebas unitarias e integración
npm run test:all

# 5. Generar reporte de cobertura de código para todo el proyecto
npm run test:coverage:all
```

---

## 🎨 2. Comandos del Frontend (Dentro de `/frontend`)

Si necesitas interactuar únicamente con la aplicación cliente:

```bash
cd frontend

# Iniciar servidor local de Vite (por defecto http://localhost:5173)
npm run dev

# Compilar aplicación SPA de Vue
npm run build

# Previsualizar el build de producción localmente
npm run preview

# Ejecutar pruebas unitarias una sola vez con Vitest
npm run test

# Ejecutar pruebas en modo de observación reactiva (watch mode)
npm run test:watch

# Generar reporte de cobertura local con Vitest
npm run test:coverage

# Abrir el panel interactivo UI de Vitest en el navegador
npm run test:ui
```

---

## 🔌 3. Comandos del Backend (Dentro de `/functions`)

Para interactuar únicamente con la API de Netlify Functions:

```bash
cd functions

# Iniciar Netlify CLI para servir funciones localmente (por defecto http://localhost:8888)
npm run dev

# Compilar archivos de TypeScript (.ts) a JavaScript (.js) en la carpeta /dist
npm run build

# Ejecutar pruebas unitarias de Jest una vez
npm run test

# Ejecutar pruebas en modo de observación reactiva (watch mode)
npm run test:watch

# Generar reporte de cobertura local con Jest
npm run test:coverage
```

---

## 🔒 4. Configuración de Variables de Entorno (.env)

Para inicializar las credenciales locales de la API del backend:

```bash
# Copiar plantilla en functions/
cd functions
cp .env.example .env

# O copiar plantilla en la raíz/
cp .env.example .env
```

*Edita el archivo `.env` resultante e introduce las credenciales correspondientes para `AZURE_FOUNDRY_API_KEY`, `AZURE_FOUNDRY_ENDPOINT` y `HF_SPACE_API_URL`.*

---

## 🚀 5. Despliegue (Deploy) Manual

Si necesitas subir los cambios a Netlify manualmente desde tu terminal local (requiere instalar Netlify CLI de forma global):

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Autenticar y enlazar el repositorio con tu sitio de Netlify
netlify link

# Compilar localmente
npm run build:all

# Desplegar a producción
netlify deploy --prod

# Abrir el sitio desplegado en el navegador
netlify open site
```

---

## 🆘 6. Resolución de Problemas Comunes (Troubleshooting)

```bash
# Limpiar dependencias instaladas y reinstalar todo desde cero
rm -rf node_modules package-lock.json frontend/node_modules frontend/package-lock.json functions/node_modules functions/package-lock.json
npm run setup

# Validar que TypeScript compile en ambos subproyectos sin emitir archivos
cd frontend && npx tsc --noEmit && cd ../functions && npx tsc --noEmit && cd ..

# Comprobar la versión instalada de Netlify CLI
npx netlify --version
```
