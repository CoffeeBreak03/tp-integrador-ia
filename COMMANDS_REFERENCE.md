# 📚 COMMANDS REFERENCE - Comandos útiles

Copiar y pegar según necesites.

## 🌍 Desde raíz del proyecto

```bash
# Setup inicial (solo una vez)
npm run setup

# Desarrollo (ambos frontend + backend)
npm run dev

# Tests completos
npm run test:all
npm run test:coverage:all

# Build (frontend + backend)
npm run build:all
```

## 🎨 Frontend commands

```bash
cd frontend

# Desarrollo
npm run dev              # http://localhost:5173

# Build
npm run build
npm run preview

# Testing
npm run test             # Ejecutar tests una vez
npm run test:watch      # Watch mode
npm run test:coverage   # Con reporte de cobertura
npm run test:ui         # Dashboard de tests
```

## 🔌 Backend commands

```bash
cd functions

# Desarrollo con Netlify CLI
npm run dev              # http://localhost:8888
# O instalando CLI: netlify dev

# Build (TypeScript → JavaScript)
npm run build

# Testing
npm run test             # Ejecutar tests una vez
npm run test:watch      # Watch mode
npm run test:coverage   # Con reporte de cobertura
```

## 🔄 Git workflow

```bash
# Crear rama para tu tarea
git checkout -b feature/nombre-de-tarea

# Ver status
git status

# Agregar cambios
git add .
git add src/            # Solo una carpeta

# Commit
git commit -m "feat: descripción de cambio"

# Push a GitHub
git push origin feature/nombre-de-tarea

# Crear PR en GitHub web
# Esperar a que tests pasen en GitHub Actions
# Mergear cuando esté aprobado
```

## 📋 Testing patterns

```bash
# Frontend: ejecutar un test específico
cd frontend
npm run test -- scale.test.ts

# Frontend: modo watch con UI
npm run test:ui

# Backend: debug de test
cd functions
npm run test -- --verbose

# Backend: coverage report
npm run test:coverage
# Ver reporte en: coverage/index.html
```

## 🚀 Deploy commands

```bash
# Build local
npm run build:all

# Deploy con Netlify CLI (requiere auth)
npm install -g netlify-cli
netlify link
netlify deploy --prod

# Ver preview
netlify open site  # Abre en navegador
```

## 🔐 Environment variables

```bash
# Backend: copiar template
cd functions
cp .env.example .env

# Editar .env con tus credenciales
nano .env  # o tu editor

# Verificar que está configurado
cat .env | grep AZURE
```

## 🆘 Troubleshooting commands

```bash
# Limpiar node_modules
rm -rf node_modules package-lock.json
npm run setup

# Verificar que TypeScript compila
cd frontend && npx tsc --noEmit && cd ..
cd functions && npx tsc --noEmit && cd ..

# Ver versiones instaladas
npm list --depth=0

# Buscar conflictos en git
git status

# Ver commits recientes
git log --oneline -10

# Descartar cambios locales
git checkout -- src/

# Actualizar desde main
git fetch origin
git rebase origin/main
```

## 📊 Useful links

```
Frontend dev server: http://localhost:5173
Backend dev server: http://localhost:8888
GitHub repo: https://github.com/<usuario>/tp-integrador-ia
Netlify dashboard: https://app.netlify.com
GitHub Actions: https://github.com/<usuario>/tp-integrador-ia/actions
```

## 💡 Pro tips

```bash
# Ejecutar todo en paralelo (desde raíz)
npm run dev
# En otra terminal:
npm run test:all

# Watch tests while developing
cd frontend && npm run test:watch
# En otra terminal:
cd frontend && npm run dev

# Verificar que nada se rompe antes de push
npm run build:all && npm run test:all

# Actualizar dependencies
npm outdated
npm update
```

---

**Mantén este archivo a mano. Los comandos son los mismos cada vez.**
