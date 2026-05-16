# QUICK_START.md

## 🚀 Inicio Rápido - 5 minutos

### 1️⃣ Crear repositorio en GitHub

```bash
# En GitHub web:
1. New repository
2. Name: tp-integrador-ia
3. Add .gitignore (Node)
4. Clone locally
```

### 2️⃣ Copiar archivos a tu repositorio local

Copiar estos archivos al root del repositorio:
```
.env.example
.gitignore
1_CONTRATO_Y_ARQUITECTURA.md
2_FRONTEND_MOCK_DRIVEN.md
3_BACKEND_Y_APIS.md
4_INFRAESTRUCTURA_Y_TESTING.md
IMPLEMENTATION_CHECKLIST.md
README.md
```

### 3️⃣ Commit inicial

```bash
git add .
git commit -m "initial: project structure and documentation"
git push origin main
```

### 4️⃣ Proteger main branch

En GitHub web:
```
Settings → Branches → Add rule
Branch name pattern: main
✓ Require pull request reviews before merging
✓ Require status checks to pass before merging
✓ Require branches to be up to date before merging
```

### 5️⃣ Asignar tareas

**Miembro A (Frontend):**
- Leer: `2_FRONTEND_MOCK_DRIVEN.md`
- Crear rama: `feature/frontend-setup`
- Ejecutar: `T2.1` primero

**Miembro B (Backend):**
- Leer: `3_BACKEND_Y_APIS.md`
- Crear rama: `feature/backend-setup`
- Ejecutar: `T3.1` primero

**Miembro C (DevOps):**
- Leer: `4_INFRAESTRUCTURA_Y_TESTING.md`
- Ejecutar: `T4.1` (GitHub Actions workflow)
- Crear: `T4.3` (mock datasets)

### 6️⃣ Setup local (cada miembro)

```bash
git clone <repo>
cd tp-integrador-ia

# Frontend
cd frontend
npm create vite@latest . -- --template vue-ts
npm install
npm run dev  # Puerto 5173

# Backend (en otra terminal)
cd functions
npm init -y
npm install typescript @types/node
npm install -D ts-node jest @types/jest ts-jest
npm run dev  # .netlify dev
```

### 7️⃣ Verificar setup

**Frontend:**
```bash
cd frontend
npm run dev
# Visitar http://localhost:5173
# Debe cargar App.vue
```

**Backend:**
```bash
cd functions
npm run dev
# Netlify CLI inicia en http://localhost:8888
```

### 8️⃣ Primera PR

**Miembro A:**
```bash
git checkout -b feature/frontend-setup
# ... hacer cambios en T2.1
git add frontend/
git commit -m "feat: setup Vite + TailwindCSS + PWA"
git push origin feature/frontend-setup
# Abrir PR en GitHub
```

**Miembro B:**
```bash
git checkout -b feature/backend-setup
# ... hacer cambios en T3.1
git add functions/
git commit -m "feat: setup TypeScript + Jest"
git push origin feature/backend-setup
# Abrir PR en GitHub
```

**Miembro C:**
```bash
git checkout -b feature/ci-cd-setup
# ... agregar .github/workflows/
git add .github/
git commit -m "ci: GitHub Actions workflow"
git push origin feature/ci-cd-setup
# Abrir PR en GitHub
```

### 9️⃣ Configurar Netlify (Miembro C)

```bash
# Instalar CLI
npm install -g netlify-cli

# Login
netlify login

# Link site
cd tp-integrador-ia
netlify link

# Setup environment variables
netlify env:set AZURE_FOUNDRY_ENDPOINT "https://..."
netlify env:set AZURE_FOUNDRY_API_KEY "..."
netlify env:set AZURE_FOUNDRY_MODEL_VISION "gpt-4-vision"
netlify env:set AZURE_FOUNDRY_MODEL_TRANSLATE "gpt-4-turbo"
```

### 🔟 Deploy Preview (Miembro C)

```bash
# En GitHub web, ir a Settings → Integrations & services
# Conectar Netlify
# Verificar Deploy Previews en cada PR
```

---

## 📋 Checklist semanal

**Semana 1:**
- [ ] Repositorio creado y protegido
- [ ] Archivos de documentación commitados
- [ ] GitHub Actions workflow ejecutándose
- [ ] Cada miembro en su rama feature
- [ ] Miembro A: Componentes base (T2.1-T2.4)
- [ ] Miembro B: Azure client (T3.1-T3.2)
- [ ] Miembro C: Mock datasets (T4.3)

**Semana 2:**
- [ ] Miembro A: Mock data + Tests (T2.5-T2.8)
- [ ] Miembro B: Endpoints + Tests (T3.4-T3.7)
- [ ] Miembro C: CI/CD + Coverage (T4.1, T4.9)
- [ ] Primeras PRs mergeadas
- [ ] Deploy Preview funcional

**Semana 3:**
- [ ] Frontend conecta a `/api/process`
- [ ] Contrato JSON validado end-to-end
- [ ] Tests integración pasando
- [ ] Todos los tests en main pasando
- [ ] Deploy a Netlify

**Semana 4:**
- [ ] Bugs y optimizaciones
- [ ] Documentación completa
- [ ] README con instrucciones finales
- [ ] PWA instalable
- [ ] Demo funcional

---

## 🆘 Si algo no funciona

### Git conflictos
```bash
git pull origin main
git merge --abort
git checkout -b feature/mi-rama
# Re-hacer cambios
```

### Node dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Frontend no carga
```bash
cd frontend
npm run build
# Si da error, verificar vite.config.ts
```

### Backend no conecta
```bash
cd functions
npm run dev
# Si da error, verificar AZURE_FOUNDRY_* vars en .env.example
```

### Tests fallan
```bash
# Frontend
cd frontend && npm run test -- --ui

# Backend
cd functions && npm run test -- --verbose
```

---

## 🔗 Links importantes

- **Repositorio:** https://github.com/<usuario>/tp-integrador-ia
- **Netlify:** https://<site>.netlify.app
- **GitHub Actions:** <repo>/actions
- **Netlify Deploy Previews:** Deploy preview URLs en cada PR

---

## 📞 Comunicación

**Daily standups:** No hay (100% asincrónico)

**Reportar bloqueos:** Comentar en PR o crear Issue

**Cambios de contrato:** Crear Issue + PR de discusión

**Merge a main:** Automático cuando PR pasea checks

---

## 🎯 Meta final

✅ App PWA funcional en Netlify  
✅ Frontend + Backend comunicando via JSON  
✅ Azure IA procesando imágenes  
✅ Tests >60% cobertura  
✅ CI/CD automático  
✅ Equipo trabajó 100% en paralelo sin bloqueos

---

**Tiempo para empezar:** 5 minutos  
**Tiempo para primera entrega:** 4-6 semanas (trabajo paralelo)  
**No hay dependencias bloqueantes desde día 1**
