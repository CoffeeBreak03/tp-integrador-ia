# 🚀 SETUP GUIDE - Comienza aquí

Después de clonar el repositorio, sigue estos pasos según tu rol:

## 1️⃣ Setup inicial (TODOS)

```bash
# Clonar
git clone https://github.com/<usuario>/tp-integrador-ia.git
cd tp-integrador-ia

# Instalar todas las dependencias
npm run setup
```

## 2️⃣ Setup por rol

### 👤 Frontend Developer (Miembro A)

```bash
# Moverte a la rama de frontend
git checkout -b feature/frontend-setup

# Navega a la carpeta frontend
cd frontend

# Comienza con T2.1 de 2_FRONTEND_MOCK_DRIVEN.md
npm run dev  # http://localhost:5173

# Tests
npm run test
npm run test:coverage
```

**Lee:** `2_FRONTEND_MOCK_DRIVEN.md`

---

### 👤 Backend Engineer (Miembro B)

```bash
# Moverte a la rama de backend
git checkout -b feature/backend-setup

# Navega a la carpeta functions
cd functions

# Configura .env (copia de .env.example)
cp .env.example .env
# Edita .env con tus credenciales de Azure

# Comienza con T3.1 de 3_BACKEND_Y_APIS.md
npm run dev  # http://localhost:8888

# Tests
npm run test
npm run test:coverage
```

**Lee:** `3_BACKEND_Y_APIS.md`

---

### 👤 DevOps/QA Engineer (Miembro C)

```bash
# Crear ramas para tu trabajo
git checkout -b feature/ci-cd-setup
git checkout -b feature/testing-setup

# Comienza con T4.1 de 4_INFRAESTRUCTURA_Y_TESTING.md

# Validar que los workflows se ejecutan
# (Verifica en GitHub Actions después de hacer push)
```

**Lee:** `4_INFRAESTRUCTURA_Y_TESTING.md`

---

## 📋 Estructura actual

```
tp-integrador-ia/
├── frontend/           ← T2.* (Miembro A)
│   ├── src/
│   ├── public/
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── package.json
├── functions/          ← T3.* (Miembro B)
│   ├── src/
│   ├── __tests__/
│   ├── tsconfig.json
│   └── package.json
├── mocks/              ← Datos de prueba
├── .github/workflows/  ← CI/CD (Miembro C)
├── netlify.toml
└── package.json (raíz)
```

## ✅ Verificar que todo funciona

### Frontend
```bash
cd frontend
npm run dev
# Visita http://localhost:5173
# Deberías ver mensaje de "MangaTranslator" 
```

### Backend
```bash
cd functions
npm run dev
# Netlify CLI inicia en http://localhost:8888
```

### Tests
```bash
# Desde raíz
npm run test:all
```

## 🔑 Secrets y Environment

**Solo Miembro B necesita:**
- Copiar `functions/.env.example` a `functions/.env`
- Llenar con credenciales reales de Azure
- NO commitear `.env`

## 🎯 Próximo paso

- **Lee tu archivo .md correspondiente**
- **Crea tu rama feature/**
- **Comienza con Tarea 1 (T#.1)**

---

**No hay bloqueos. Todos pueden empezar ahora mismo en paralelo.**
