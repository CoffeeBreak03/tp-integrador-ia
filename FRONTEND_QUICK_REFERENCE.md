# Frontend Integration - Quick Reference

## Files Modified/Created

```
frontend/src/
├── lib/
│   └── api.ts ✨ NEW - HTTP client for process endpoint
├── App.vue 🔄 MODIFIED - Integrates backend processing
│
(Components unchanged)
├── components/
│   ├── ImageUploader.vue
│   ├── OverlayRenderer.vue
│   └── TranslationPanel.vue
└── mock/
    └── mock-data.json (available for reference)
```

## The Flow

1. **Upload** → `ImageUploader` reads file as base64 with data URI
2. **Detect** → `App.vue` watcher detects `imageData` change
3. **Process** → Calls `processImage(base64)` from `api.ts`
4. **Send** → `api.ts` POSTs to `/.netlify/functions/process`
5. **Receive** → Backend returns `TranslationContract[]`
6. **Validate** → `validateContract()` checks response format
7. **Render** → Components display overlays and translations

## API Module

**Location**: `frontend/src/lib/api.ts`

```typescript
// Import
import { processImage } from '@/lib/api';

// Usage
const translations = await processImage(imageBase64);
```

**Returns**: `Promise<TranslationContract[] | null>`

**Throws**: Error with descriptive message if:
- Network error
- Backend returns error status
- Response doesn't match contract
- imageBase64 is empty

## State Management in App.vue

```typescript
const imageData = ref('');              // Current image as data URI
const translations = ref([]);           // Current translations array
const isLoading = ref(false);           // Processing in progress
const errorMessage = ref<string | null>(null);  // Error if any
const selectedItemId = ref<number>();  // Highlighted item in overlay
```

## UI States

| State | Shows | Buttons |
|-------|-------|---------|
| Initial | "Carga tu imagen" | Enabled |
| Loading | Spinner + "Procesando..." | Disabled |
| Error | Red banner with error | Enabled (can retry) |
| Success | Overlays + panel | Enabled |

## Testing Checklist

- [ ] Run `netlify dev`
- [ ] Upload image in browser
- [ ] See "Procesando..." spinner
- [ ] Translations appear after 3-5s
- [ ] Overlays positioned correctly
- [ ] Search panel works
- [ ] Try offline → see error message
- [ ] Check browser console for errors

## Common Issues

### Endpoint not found
```
Error: Failed to fetch /.netlify/functions/process
```
**Solution**: Make sure `netlify dev` is running

### Invalid contract response
```
Error: Las traducciones no cumplen el contrato esperado
```
**Solution**: Check backend returns correct JSON format

### CORS error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Should not happen in dev/prod since same origin

## Debugging Tips

### Browser Console
```typescript
// Add logging in App.vue watch
console.log('Loading:', isLoading.value);
console.log('Error:', errorMessage.value);
console.log('Translations:', translations.value);
```

### Network Tab
Check that POST request goes to `/.netlify/functions/process` with body:
```json
{"imageBase64": "data:image/..."}
```

### Endpoint Testing
```bash
./endpoint-testing-examples.sh http://localhost:8888
```

## What NOT to Change

These still work as before:
- `ImageUploader.vue` - No changes needed
- `OverlayRenderer.vue` - No changes needed  
- `TranslationPanel.vue` - No changes needed
- `mock-data.json` - Available for manual testing

## Performance Considerations

- Large images (>10MB) may cause timeout
- PDF first page is rendered at max 1200x1600
- Consider compression before upload in production
- Add timeout handling if processing takes >30s

## Rollback Instructions

If need to revert to mock-driven:

1. In `App.vue`, add back the `onMounted`:
```typescript
onMounted(async () => {
  const module = await import('./mock/mock-data.json');
  if (validateContract(module.default)) {
    translations.value = module.default;
  }
});
```

2. Remove the watcher that calls `processImage()`

---

**Last Updated**: May 2026  
**Status**: ✅ Ready for production  
**Next**: Deploy to Netlify and test in production
