# Manga Translate

**Manga Translate** es una aplicación web responsiva, diseñada para traducir páginas y capítulos de manga de forma completamente automatizada. Utilizando modelos avanzados de visión computacional y procesamiento del lenguaje natural (NLP), la herramienta detecta globos de texto, realiza OCR y traduce el diálogo contextualizado, superponiendo el texto traducido directamente sobre el manga original de forma estética y personalizada.

🔗 **Sitio Web Oficial:** [https://manga-translate.azurewebsites.net/](https://manga-translate.azurewebsites.net/)

---

## 🎯 Propósito del Proyecto

El propósito de esta plataforma es eliminar las barreras de idioma en la lectura de manga de forma instantánea y fluida. Al digitalizar y traducir el contenido de forma local y contextual, permite a los lectores disfrutar de sus obras favoritas manteniendo el formato visual original de las páginas y adaptando la experiencia de lectura a sus preferencias personales.

---

## 🌟 Funcionalidades Clave

* **Carga de Archivos Flexible:** Soporte para imágenes individuales (`.png`, `.jpg`, `.jpeg`, `.webp`), documentos PDF multi-página y archivos ZIP que contienen colecciones de imágenes.
* **Pipeline de Inteligencia Artificial (IA):**
  * **Detección Espacial de Burbujas:** Detección de la ubicación de los globos de diálogo mediante un modelo YOLOv8 optimizado y alojado en Hugging Face Spaces.
  * **OCR y Traducción Contextualizada:** Extracción de texto e interpretación semántica mediante GPT-4o en Azure AI Foundry, integrando contexto acumulado de páginas anteriores para mantener la coherencia en la historia.
* **Visor de Manga Interactivo (Focus Mode):**
  * **Layouts de Lectura:** Modos de página simple, doble página (con soporte para portadas) y cascada continua vertical.
  * **Dirección de Lectura:** Soporte para LTR (de izquierda a derecha) y RTL (de derecha a izquierda, estándar en manga).
  * **Controles de Zoom y Pantalla:** Zoom táctil y mouse con auto-ajuste de alto y ancho de página.
* **Personalización de Overlays:** Configuración interactiva de la tipografía (fuente, escala de tamaño de letra, color de texto, color de fondo y opacidad de las cajas de diálogo).
* **Buscador de Traducciones:** Panel lateral interactivo con buscador en tiempo real para encontrar textos originales y traducidos.
* **Caché Inteligente Local:** Generación de firma digital única (hash) de archivos para recuperar instantáneamente páginas ya traducidas y evitar llamadas innecesarias a las APIs.
* **Exportador Fuera de Línea:** Empaqueta capítulos en un archivo `.zip` que contiene las páginas del manga estructuradas dinámicamente según el idioma (e.g. carpeta `pages/` para inglés o `paginas/` para español) y un visor offline HTML responsivo autoejecutable.
* **Internacionalización Completa (i18n):** Interfaz adaptada en Español e Inglés, incluyendo pantallas principales, lector, paneles de control, logs de error y el propio visor offline exportado.

---

## 🔧 Stack Tecnológico

El proyecto está diseñado bajo una arquitectura desacoplada y robusta:

### Frontend (Cliente SPA)
* **Framework:** Vue 3 (Composition API & Script Setup)
* **Compilador/Bundler:** Vite + TypeScript
* **Diseño y Estilos:** TailwindCSS (Layout responsivo, transiciones fluidas y modo oscuro/claro nativo)
* **Librerías Clave:** JSZip (compresión/descompresión en navegador), PDF.js (renderizado de documentos PDF a canvas)
* **Testing:** Vitest + Vue Test Utils

### Backend (API Serverless / Express)
* **Entorno:** Node.js + TypeScript
* **Framework Web:** Express
* **Procesamiento de Imágenes:** Jimp (para recortes automáticos de globos de texto antes de enviar a OCR)
* **Testing:** Jest + Ts-Jest

### Infraestructura de Inteligencia Artificial
* **Layout OCR (YOLOv8):** Alojado en Hugging Face Spaces (OCR Spatial Inference API)
* **OCR & Translation (GPT-4o):** Desplegado en Azure AI Foundry (Azure OpenAI Service)
