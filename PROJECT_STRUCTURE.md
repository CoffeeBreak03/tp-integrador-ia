# 📦 ESTRUCTURA COMPLETA DEL PROYECTO

Todo está listo para ser pusheado a GitHub. Aquí está el árbol completo:

```
tp-integrador-ia/
│
├── 📄 ROOT CONFIG
├── .env.example              ← Template de variables (NO commitear .env)
├── .gitignore                ← Node/Vite/IDE patterns
├── package.json              ← Scripts globales (setup, dev, test, build)
├── netlify.toml              ← Config despliegue + redirects
│
├── 📚 DOCUMENTACIÓN TÉCNICA (LÉE ESTO)
├── README.md                 ← Overview del proyecto
├── QUICK_START.md            ← 5 pasos para empezar
├── SETUP_GUIDE.md            ← Guía por rol (Frontend/Backend/DevOps)
├── COMMANDS_REFERENCE.md     ← Comandos útiles (copy-paste)
├── VERIFY_SETUP.md           ← Checklist post-setup
│
├── 📋 ESPECIFICACIÓN DE TAREAS (LÉE UNA SEGÚN TU ROL)
├── 1_CONTRATO_Y_ARQUITECTURA.md      ← JSON spec + GitHub setup
├── 2_FRONTEND_MOCK_DRIVEN.md         ← T2.1-T2.8 (Miembro A)
├── 3_BACKEND_Y_APIS.md               ← T3.1-T3.8 (Miembro B)
├── 4_INFRAESTRUCTURA_Y_TESTING.md    ← T4.1-T4.10 (Miembro C)
├── IMPLEMENTATION_CHECKLIST.md       ← Checklist de ejecución
│
├── 🎨 FRONTEND (Miembro A comienza aquí)
├── frontend/
│   ├── package.json                  ← Dependencies + scripts
│   ├── vite.config.ts                ← Vite config
│   ├── vitest.config.ts              ← Vitest config
│   ├── tailwind.config.js            ← Tailwind theme (light/dark)
│   ├── postcss.config.js             ← PostCSS processors
│   ├── tsconfig.json                 ← TypeScript compiler
│   ├── tsconfig.node.json
│   ├── index.html                    ← Entry point
│   │
│   ├── public/
│   │   └── manifest.json             ← PWA manifest
│   │
│   └── src/
│       ├── main.ts                   ← App entry (ya implementado)
│       ├── App.vue                   ← Root component (placeholder)
│       │
│       ├── components/               ← Vue components (AQUÍ IMPLEMENTAR T2.2-T2.4)
│       │   └── .placeholder
│       │       ├── ImageUploader.vue
│       │       ├── OverlayRenderer.vue
│       │       └── TranslationPanel.vue
│       │
│       ├── lib/
│       │   ├── contract.ts           ← Validator (T2.5)
│       │   └── scale.ts              ← Coordinate conversion (T2.5)
│       │
│       ├── styles/
│       │   └── index.css             ← Tailwind imports (ya OK)
│       │
│       └── mock/
│           └── mock-data.json        ← Test data para frontend (ya OK)
│
├── 🔌 BACKEND (Miembro B comienza aquí)
├── functions/
│   ├── package.json                  ← Dependencies + scripts
│   ├── tsconfig.json                 ← TypeScript compiler
│   ├── jest.config.js                ← Jest config
│   ├── .env.example                  ← Template Azure credentials
│   │
│   ├── src/
│   │   ├── vision.ts                 ← Lambda function /api/vision (T3.5)
│   │   ├── translate.ts              ← Lambda function /api/translate (T3.5)
│   │   ├── process.ts                ← Lambda function /api/process (T3.5)
│   │   ├── orchestrator.ts           ← Pipeline orchestrator (T3.4)
│   │   │
│   │   ├── lib/
│   │   │   └── azure-client.ts       ← Azure AI client (T3.2)
│   │   │
│   │   └── types/
│   │       └── contract.ts           ← Contract types (T3.3)
│   │
│   └── __tests__/                    ← Unit tests (T3.7)
│       └── .placeholder
│
├── 📊 MOCK DATA (para tests)
├── mocks/
│   ├── ocr-response.json             ← Mock Vision output
│   ├── translate-response.json       ← Mock Translate output
│   └── integration-test-dataset.json ← Full pipeline test data
│
└── 🔄 CI/CD (Miembro C configura esto)
    └── .github/
        └── workflows/
            ├── ci.yml                ← GitHub Actions pipeline (ya OK)
            └── coverage.yml          ← Coverage reports (ya OK)
```

---

## ✅ Lo que está LISTO para usar

- ✅ Todas las carpetas creadas
- ✅ Configuraciones (vite, tailwind, tsconfig, jest, netlify)
- ✅ package.json con scripts
- ✅ Archivos de entrada (main.ts, App.vue, index.html)
- ✅ Mock data (JSON válidos)
- ✅ GitHub Actions workflow
- ✅ Archivos placeholder para cada componente/función
- ✅ Documentación técnica completa

## 🔨 Lo que FALTA (por implementar según tareas .md)

**Miembro A (Frontend):**
- [ ] T2.2: Componente ImageUploader.vue (completo)
- [ ] T2.3: Componente OverlayRenderer.vue (completo)
- [ ] T2.4: Componente TranslationPanel.vue (completo)
- [ ] T2.5: Funciones de escala (validar/mejorar)
- [ ] T2.6: App.vue composición completa
- [ ] T2.7: Validar mock data
- [ ] T2.8: Tests unitarios Vitest

**Miembro B (Backend):**
- [ ] T3.2: Implementar AzureClient (métodos vision + translate)
- [ ] T3.3: Validar tipos de contrato
- [ ] T3.4: Implementar PipelineOrchestrator
- [ ] T3.5: Implementar 3 Lambda functions
- [ ] T3.6: Tests manuales cURL/Postman
- [ ] T3.7: Tests unitarios Jest

**Miembro C (DevOps):**
- [ ] T4.1: Setup GitHub + proteger main branch
- [ ] T4.2: Configurar Netlify deployment
- [ ] T4.3: Validar mock datasets ✅ (ya están)
- [ ] T4.4-T4.5: Configurar testing infrastructure
- [ ] T4.9: Setup coverage reporting
- [ ] T4.10: Documentar features futuras

---

## 🚀 PRÓXIMOS PASOS

### Paso 1: Crear repositorio en GitHub
```bash
# En GitHub.com:
1. New repository → tp-integrador-ia
2. Initialize with .gitignore (Node.js)
3. Clone locally
```

### Paso 2: Copiar archivos a repo local
```bash
# Copiar todo de /tmp/tp-integrador-ia/ a tu repo local
cp -r /tmp/tp-integrador-ia/* ./tp-integrador-ia/
```

### Paso 3: Commit inicial
```bash
git add .
git commit -m "initial: project structure with docs and placeholders"
git push origin main
```

### Paso 4: Cada miembro hace setup local
```bash
git clone https://github.com/<usuario>/tp-integrador-ia.git
cd tp-integrador-ia
npm run setup  # Instala todo
```

### Paso 5: Comienza a trabajar
- **Miembro A:** Lee `SETUP_GUIDE.md` → Frontend section
- **Miembro B:** Lee `SETUP_GUIDE.md` → Backend section
- **Miembro C:** Lee `SETUP_GUIDE.md` → DevOps section

---

## 📞 Preguntas frecuentes

**P: ¿Qué hago si algo no compila?**
R: Ejecuta `npm run setup` nuevamente. Si persiste, revisa VERIFY_SETUP.md

**P: ¿Puedo empezar sin el setup de GitHub?**
R: Sí, pero eventualmente necesitarán Git. Recomendado hacer GitHub primero.

**P: ¿Las credenciales de Azure?**
R: Solo Miembro B las necesita. En functions/.env.example → .env

**P: ¿Cómo veo el progreso de CI/CD?**
R: GitHub → Actions tab. Se ejecuta automáticamente en cada push/PR.

**P: ¿Necesito Netlify CLI?**
R: Para `npm run dev` en functions. Instalar: `npm install -g netlify-cli`

---

**TODO ESTÁ LISTO. SOLO FALTA PUSHEAR A GITHUB Y EMPEZAR A TRABAJAR.**
