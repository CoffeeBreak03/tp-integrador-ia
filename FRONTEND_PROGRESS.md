# Frontend Progress

- Implemented `ImageUploader.vue` with image upload support, `FileReader` base64 conversion, and minimal PDF first-page rendering via `pdfjs-dist`.
- Created `OverlayRenderer.vue` to render translated text overlays using normalized 0-1000 box coordinates converted to CSS percentages.
- Added `TranslationPanel.vue` with real-time search/filter, selection event emission, and dark theme UI.
- Completed `src/lib/scale.ts` utilities for normalized pixel conversion and `src/lib/contract.ts` validation aligned with the JSON contract.
- Added unit tests for scale conversion and contract validation in `src/__tests__`.
- Verified with `npm test` and `npm run build` in `frontend`.

## 2_FRONTEND_MOCK_DRIVEN.md coverage
- T2.1: Frontend setup, alias `@/`, Tailwind, PWA metadata.
- T2.2: ImageUploader component with image+PDF handling.
- T2.3: OverlayRenderer component with normalized absolute positioning.
- T2.4: TranslationPanel component with search, dark mode, and selection.
- T2.5: Scale contract utilities and validation.
- T2.7: Mock data consumption from local JSON.
- T2.8: Vitest unit tests for critical utilities.
