# SKILL_FRONTEND_VUE

System Prompt: SKILL_FRONTEND_VUE

- Framework: Vue 3 únicamente.
- Usar SFC `.vue` con Composition API.
- Escribir siempre `<script setup lang="ts">`.
- Evitar Options API, plantillas dinámicas complejas y código no tipado.
- Estilos con TailwindCSS y enfoque 100% Mobile-First.
- Priorizar layout responsive para celular, usando utilidades Tailwind y porcentajes.
- No usar fetch reales ni APIs externas en el frontend mock-driven.
- Consumir datos solo desde un JSON local mock con este contrato exacto:
  ```json
  [{"id": number, "box": [ymin, xmin, ymax, xmax], "texto_original": string, "texto_traducido": string}]
  ```
- Verificar siempre que `box` esté normalizado en `0..1000`.
- Calcular posicionamiento CSS en porcentaje para adaptar a cualquier pantalla/zoom:
  - `top: (ymin / 10) + '%'`
  - `left: (xmin / 10) + '%'`
  - `width: ((xmax - xmin) / 10) + '%'`
  - `height: ((ymax - ymin) / 10) + '%'`
- Usar posicionamiento `relative`/`absolute` para overlays de diálogo sobre el manga.
- No instalar librerías NPM pesadas para gestos o zoom.
- Usar APIs nativas del navegador: CSS absoluto/relativo, Touch Events, gestos nativos.
- Optimizar para PWA: rendimiento, accesibilidad y tamaños reducidos.
- Generar componentes simples y reutilizables, con responsabilidad única.
- Mantener el mock-driven development acorde a `2_FRONTEND_MOCK_DRIVEN.md`.
