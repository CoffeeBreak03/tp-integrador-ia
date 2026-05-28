# Frontend-Backend Integration Verification Checklist

## Pre-Testing Setup

- [ ] Backend endpoint is implemented at `functions/src/process.ts`
- [ ] `netlify dev` runs without errors
- [ ] Frontend dependencies installed: `cd frontend && npm install`
- [ ] No TypeScript errors: `npm run type-check`

## Compilation & Build

- [ ] `frontend/src/lib/api.ts` compiles without errors
- [ ] `frontend/src/App.vue` compiles without errors
- [ ] `npm run build` completes successfully
- [ ] No console errors in dev mode: `npm run dev`

## Type Safety

- [ ] `TranslationContract` interface is properly imported in `api.ts`
- [ ] `validateContract` function is properly imported in `api.ts`
- [ ] TypeScript strict mode: all types are correct
- [ ] No `any` types in new code

## Network & API

- [ ] Endpoint URL is correct: `/.netlify/functions/process`
- [ ] HTTP method is POST
- [ ] Content-Type header is `application/json`
- [ ] Request body includes `imageBase64` field
- [ ] CORS not blocking in dev (same origin)

## Request Validation

- [ ] `imageBase64` includes `data:image/` or `data:application/pdf` prefix
- [ ] Base64 encoding is valid (readable by backend)
- [ ] Empty images are rejected with error message
- [ ] Very large images don't hang the browser

## Response Handling

- [ ] 200 response with valid array renders correctly
- [ ] 200 response with `{data: [...]}` wrapper is parsed
- [ ] 400/500 errors show error message to user
- [ ] Malformed JSON shows generic error message
- [ ] Missing fields in response trigger contract validation error

## Contract Validation

- [ ] Each item has `id` (integer)
- [ ] Each item has `box` (array of 4 integers, 0-1000)
- [ ] Each item has `texto_original` (non-empty string)
- [ ] Each item has `texto_traducido` (non-empty string)
- [ ] No extra fields in response
- [ ] Response is array, not object

## UI/UX

- [ ] Upload button is visible and clickable
- [ ] Loading spinner appears during processing
- [ ] "Procesando imagen..." message shows
- [ ] Buttons are disabled during processing
- [ ] Error message appears in red banner if backend fails
- [ ] Overlays appear with correct positioning
- [ ] Translation panel can be toggled
- [ ] Search/filter works in translation panel

## State Management

- [ ] `isLoading` is true during processing
- [ ] `isLoading` is false after success or error
- [ ] `errorMessage` is null on success
- [ ] `errorMessage` has description on error
- [ ] `translations` is empty array initially
- [ ] `translations` is populated after success
- [ ] `translations` is cleared on new upload

## Browser Compatibility

- [ ] Works in Chrome/Chromium
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Mobile responsive (tested on mobile browser)
- [ ] No console errors or warnings

## Error Scenarios

- [ ] Backend offline → shows error
- [ ] Empty response → shows error
- [ ] Invalid JSON → shows error
- [ ] Missing fields → shows contract validation error
- [ ] Network timeout → shows network error
- [ ] User can retry after error

## Performance

- [ ] Processing completes in <10 seconds for typical images
- [ ] UI remains responsive during upload
- [ ] No memory leaks (open DevTools → watch memory)
- [ ] Large images (5MB+) handled gracefully

## Accessibility

- [ ] Error messages are announced
- [ ] Buttons have proper labels
- [ ] Loading indicator is accessible
- [ ] Color contrast is sufficient

## Testing Commands

```bash
# Verify files exist
ls frontend/src/lib/api.ts
ls frontend/src/App.vue

# Check for TypeScript errors
cd frontend && npm run type-check

# Build frontend
npm run build

# Start development
netlify dev
# In another terminal:
cd frontend && npm run dev

# Test endpoint directly
./endpoint-testing-examples.sh http://localhost:8888
```

## Manual Testing Scenario

1. **Start services**
   ```bash
   netlify dev  # Terminal 1
   cd frontend && npm run dev  # Terminal 2
   ```

2. **Open browser**
   - Navigate to http://localhost:3000
   - Verify header shows "Frontend integrado con backend"

3. **Upload image**
   - Click upload button
   - Select any image from filesystem
   - Observe spinner

4. **Verify processing**
   - After 3-5 seconds, translations appear
   - Overlays show on image
   - Translation panel can be toggled

5. **Test interactions**
   - Click "Mostrar overlays" / "Ocultar overlays"
   - Click "Mostrar lista" / "Ocultar lista"
   - Search in translation panel
   - Click translation → highlights overlay

6. **Test error handling**
   - Stop netlify dev
   - Try uploading another image
   - Verify error message appears

## Documentation

- [ ] `FRONTEND_BACKEND_INTEGRATION_GUIDE.md` is present
- [ ] `FRONTEND_QUICK_REFERENCE.md` is present
- [ ] `endpoint-testing-examples.sh` is present
- [ ] `FRONTEND_INTEGRATION_COMPLETE.md` is present
- [ ] `frontend/src/lib/api.ts` has JSDoc comments
- [ ] `frontend/src/App.vue` has inline comments

## Deployment Readiness

- [ ] No console errors in production build
- [ ] No console warnings in production build
- [ ] Environment variables configured on Netlify
- [ ] Backend endpoint is accessible in production
- [ ] CORS is properly configured for production domain
- [ ] Error messages are user-friendly (no stack traces)

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Frontend Dev | | | ☐ Pass |
| Backend Dev | | | ☐ Pass |
| QA | | | ☐ Pass |
| Lead | | | ☐ Approved |

---

**Notes**: 
- Use this checklist before marking integration as complete
- If any item fails, document the issue and required fix
- Update checklist after each fix
- Archive completed checklist for reference
