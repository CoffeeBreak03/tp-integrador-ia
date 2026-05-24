# Frontend Progress

- Implemented `ImageUploader.vue` with image upload support, `FileReader` base64 conversion, and minimal PDF first-page rendering via `pdfjs-dist`.
- Created `OverlayRenderer.vue` to render translated text overlays using normalized 0-1000 box coordinates converted to CSS percentages.
- Added `TranslationPanel.vue` with real-time search/filter, selection event emission, and dark theme UI.
- Completed `src/lib/scale.ts` utilities for normalized pixel conversion and `src/lib/contract.ts` validation aligned with the JSON contract.
- Added unit tests for scale conversion and contract validation in `src/__tests__`.
- Verified with `npm test` and `npm run build` in `frontend`.
- Added global overlay visibility toggle and a slide-in translation panel to keep the image centered until the list is requested.
- Embedded image upload inside the main image block with a circular + button and contextual picker menu.
- Implemented clipboard image paste, local recent uploads, and file explorer selection desde un único popup.
- Added support for a secondary "Agregar otra imagen" action debajo de la imagen cargada.
 - Both the `+` button and the "Agregar otra imagen" button now open the native file explorer directly (simplified UX).

- Implemented view-height resizing: added `Ajustar tamaño` / `Restaurar tamaño` button in the main toolbar to shrink the manga image to fit the browser height (via `max-h-[calc(100vh-180px)]` and `h-full w-auto object-contain mx-auto`) while preserving exact overlay alignment. Improves desktop reading without scrolling, keeping the translation list intact.
- Corrected fit-to-screen rendering so the image and overlay boxes scale together as a smaller page instead of clipping any content.
- Refined the image container measurement so the manga page stays centered and overlay coordinates remain aligned when `Ajustar tamaño` is active.

## 2_FRONTEND_MOCK_DRIVEN.md coverage
- T2.1: Frontend setup, alias `@/`, Tailwind, PWA metadata.
- T2.2: ImageUploader component with image+PDF handling.
- T2.3: OverlayRenderer component with normalized absolute positioning.
- T2.4: TranslationPanel component with search, dark mode, and selection.
- T2.5: Scale contract utilities and validation.
- T2.7: Mock data consumption from local JSON.
- T2.8: Vitest unit tests for critical utilities.
- T2.9: UI behavior with collapsible overlays and slide panel presentation.
- T2.10: In-block upload prompt with clipboard/recent/explorer picker and add-another fallback.
