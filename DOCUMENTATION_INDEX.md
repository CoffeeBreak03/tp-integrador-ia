# 📑 ÍNDICE DE DOCUMENTACIÓN

Encuentra lo que necesitas rápidamente:

## 🎯 Empezar aquí (según tu rol)

| Rol | Documento | Tiempo |
|-----|-----------|--------|
| 👤 Todos | [QUICK_START.md](QUICK_START.md) | 5 min |
| 👤 Todos | [SETUP_GUIDE.md](SETUP_GUIDE.md) | 10 min |
| 🎨 Frontend | [2_FRONTEND_MOCK_DRIVEN.md](2_FRONTEND_MOCK_DRIVEN.md) | 8-10 días |
| 🔌 Backend | [3_BACKEND_Y_APIS.md](3_BACKEND_Y_APIS.md) | 10-12 días |
| 🔄 DevOps/QA | [4_INFRAESTRUCTURA_Y_TESTING.md](4_INFRAESTRUCTURA_Y_TESTING.md) | 8-10 días |

## 📋 Documentación de referencia

| Documento | Contenido |
|-----------|----------|
| [README.md](README.md) | Overview del proyecto y tech stack |
| [1_CONTRATO_Y_ARQUITECTURA.md](1_CONTRATO_Y_ARQUITECTURA.md) | JSON contract + GitHub setup |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Árbol completo del proyecto |
| [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) | Checklist por miembro + timeline |
| [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md) | Comandos útiles (copy-paste) |
| [VERIFY_SETUP.md](VERIFY_SETUP.md) | Checklist post-setup |

## 🔧 Guías técnicas

| Documento | Para |
|-----------|------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Setup inicial por rol |
| [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md) | Comandos frecuentes |
| [VERIFY_SETUP.md](VERIFY_SETUP.md) | Validar que todo funciona |

## 📚 Especificación de tareas

| Documento | Tareas | Tiempo |
|-----------|--------|--------|
| [1_CONTRATO_Y_ARQUITECTURA.md](1_CONTRATO_Y_ARQUITECTURA.md) | Contrato JSON + estructura | Preparación |
| [2_FRONTEND_MOCK_DRIVEN.md](2_FRONTEND_MOCK_DRIVEN.md) | T2.1-T2.8 | 8-10 días |
| [3_BACKEND_Y_APIS.md](3_BACKEND_Y_APIS.md) | T3.1-T3.8 | 10-12 días |
| [4_INFRAESTRUCTURA_Y_TESTING.md](4_INFRAESTRUCTURA_Y_TESTING.md) | T4.1-T4.10 | 8-10 días |

## 🎓 Flujo recomendado

### Día 1 (Setup)

1. Lee [QUICK_START.md](QUICK_START.md) (5 min)
2. Crea repositorio en GitHub
3. Clona y ejecuta `npm run setup`
4. Lee [SETUP_GUIDE.md](SETUP_GUIDE.md) según tu rol

### Día 2+ (Implementación)

1. Abre tu documento técnico (.md asignado)
2. Comienza con Tarea 1 (T#.1)
3. Consulta [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md) según necesites
4. Usa [VERIFY_SETUP.md](VERIFY_SETUP.md) para troubleshooting

### Semana 1-4

- Ejecuta tareas en paralelo (sin dependencias bloqueantes)
- Haz PR (Pull Requests) a GitHub
- Los GitHub Actions validan automáticamente
- Una vez pasadas pruebas, mergea a main

## 🆘 Troubleshooting

Problema | Documento
---------|----------
"Module not found" | [VERIFY_SETUP.md](VERIFY_SETUP.md) + [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)
"Port already in use" | [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md#troubleshooting-commands)
"TypeScript errors" | [VERIFY_SETUP.md](VERIFY_SETUP.md)
"Tests failing" | [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md#testing-patterns)
"Git conflicts" | [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md#troubleshooting-commands)

## 📊 Estructura actual

```
tp-integrador-ia/
├── 📍 EMPEZAR AQUÍ
│   ├── QUICK_START.md
│   ├── SETUP_GUIDE.md
│   └── README.md
│
├── 📋 ESPECIFICACIONES TÉCNICAS
│   ├── 1_CONTRATO_Y_ARQUITECTURA.md
│   ├── 2_FRONTEND_MOCK_DRIVEN.md
│   ├── 3_BACKEND_Y_APIS.md
│   └── 4_INFRAESTRUCTURA_Y_TESTING.md
│
├── 📚 REFERENCIAS Y CHECKLISTS
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── PROJECT_STRUCTURE.md
│   ├── COMMANDS_REFERENCE.md
│   ├── VERIFY_SETUP.md
│   └── DOCUMENTATION_INDEX.md (este archivo)
│
├── 🎨 FRONTEND (Miembro A)
│   └── frontend/
│
├── 🔌 BACKEND (Miembro B)
│   └── functions/
│
├── 🔄 CI/CD (Miembro C)
│   └── .github/workflows/
│
└── 📦 MOCKS Y CONFIG
    ├── mocks/
    ├── netlify.toml
    └── package.json
```

## ✅ Versión de este documento

- **Creado:** Mayo 2026
- **Última actualización:** Hoy
- **Estado:** Listo para producción

---

**NOTA:** Este es el índice central. Usa esto para navegar la documentación según necesites.

**Recomendación:** Guarda este archivo en tus favoritos o imprime para referencia rápida.
