# 2_FRONTEND_MOCK_DRIVEN.md

## Objetivo
Implementar interfaz móvil PWA que cargue imágenes/PDFs, renderice cuadros de texto traducidos con posicionamiento absoluto usando coordenadas normalizadas (0-1000), y muestre traducción en panel lateral.

## Stack
- Vue 3 + TypeScript
- Vite para build
- TailwindCSS responsive
- Vitest para unit tests

## Tareas

### T2.1: Configuración inicial del proyecto frontend

```bash
cd frontend
npm create vite@latest . -- --template vue-ts
npm install tailwindcss postcss autoprefixer
npm install -D vitest @vitest/ui
npx tailwindcss init -p
npm install
```

**Archivos a modificar/crear:**
- `vite.config.ts`: Configurar alias `@/` para `src/`
- `tailwind.config.js`: Tema blanco/oscuro con `prefers-color-scheme`
- `src/main.ts`: Montar app
- `public/index.html`: Meta tags PWA (manifest, icon, viewport)

**Entregable:** Proyecto buildeable sin errores

---

### T2.2: Componente ImageUploader

**Responsabilidad:** Carga de imagen/PDF y parseo a Canvas 2D.

```vue
<!-- src/components/ImageUploader.vue -->
<template>
  <div class="w-full h-screen flex flex-col">
    <input 
      type="file" 
      accept="image/*,.pdf" 
      @change="handleFileUpload"
      ref="fileInput"
    />
    <div id="canvas-container" class="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
      <!-- Canvas renderizado aquí -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const fileInput = ref<HTMLInputElement>();
const imageData = ref<string>('');

const handleFileUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    imageData.value = evt.target?.result as string;
  };
  reader.readAsDataURL(file);
};
</script>
```

**Entregable:** 
- Carga de imagen en Canvas 2D
- Exporta `imageData.value` como base64
- Soporte mínimo PDF (carga primera página)

---

### T2.3: Componente OverlayRenderer

**Responsabilidad:** Renderizar cuadros de texto traducidos sobre la imagen usando coordenadas normalizadas 0-1000.

```vue
<!-- src/components/OverlayRenderer.vue -->
<template>
  <div class="relative w-full h-full" :style="{ aspectRatio: imageAspectRatio }">
    <img :src="imageData" class="w-full h-full object-contain" />
    <div 
      v-for="item in translations" 
      :key="item.id"
      class="absolute border-2 border-blue-500 bg-white bg-opacity-80 text-xs font-semibold overflow-hidden"
      :style="normalizedBoxToPercent(item.box)"
    >
      {{ item.texto_traducido }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TranslationItem {
  id: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  texto_original: string;
  texto_traducido: string;
}

defineProps<{
  imageData: string;
  translations: TranslationItem[];
}>();

const imageAspectRatio = ref(16 / 9);

const normalizedBoxToPercent = (box: [number, number, number, number]) => {
  const [ymin, xmin, ymax, xmax] = box;
  return {
    top: `${(ymin / 1000) * 100}%`,
    left: `${(xmin / 1000) * 100}%`,
    width: `${((xmax - xmin) / 1000) * 100}%`,
    height: `${((ymax - ymin) / 1000) * 100}%`,
  };
};
</script>
```

**Entregable:**
- Cajas posicionadas absolutas con coordenadas normalizadas
- Renderiza texto_traducido como overlay
- Responsive a tamaño de pantalla

---

### T2.4: Componente TranslationPanel

**Responsabilidad:** Vista lateral con lista de traducciones, búsqueda/filtro y tema oscuro.

```vue
<!-- src/components/TranslationPanel.vue -->
<template>
  <aside class="w-80 h-screen bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 overflow-y-auto p-4">
    <input 
      v-model="searchQuery"
      type="text"
      placeholder="Buscar traducción..."
      class="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
    />
    <div class="space-y-2">
      <div 
        v-for="item in filteredTranslations"
        :key="item.id"
        class="p-3 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-blue-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
        @click="selectItem(item)"
      >
        <p class="text-xs font-bold text-gray-600 dark:text-gray-300">Original:</p>
        <p class="text-sm text-gray-800 dark:text-gray-100 truncate">{{ item.texto_original }}</p>
        <p class="text-xs font-bold text-gray-600 dark:text-gray-300 mt-2">Traducción:</p>
        <p class="text-sm text-green-700 dark:text-green-400">{{ item.texto_traducido }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface TranslationItem {
  id: number;
  box: [number, number, number, number];
  texto_original: string;
  texto_traducido: string;
}

const props = defineProps<{
  translations: TranslationItem[];
}>();

const emit = defineEmits<{
  selectItem: [item: TranslationItem];
}>();

const searchQuery = ref('');

const filteredTranslations = computed(() => {
  return props.translations.filter(item =>
    item.texto_original.includes(searchQuery.value) ||
    item.texto_traducido.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const selectItem = (item: TranslationItem) => {
  emit('selectItem', item);
};
</script>
```

**Entregable:**
- Lista scrollable de traducciones
- Búsqueda en tiempo real
- Soporte tema oscuro
- Emite evento de selección

---

### T2.5: Utilitarios de escala y contrato

```typescript
// src/lib/scale.ts
export const normalizedBoxToPixels = (
  box: [number, number, number, number],
  imageWidth: number,
  imageHeight: number
): [number, number, number, number] => {
  const [ymin, xmin, ymax, xmax] = box;
  return [
    (ymin / 1000) * imageHeight,
    (xmin / 1000) * imageWidth,
    (ymax / 1000) * imageHeight,
    (xmax / 1000) * imageWidth,
  ];
};

export const pixelsToNormalizedBox = (
  ymin: number,
  xmin: number,
  ymax: number,
  xmax: number,
  imageWidth: number,
  imageHeight: number
): [number, number, number, number] => {
  return [
    (ymin / imageHeight) * 1000,
    (xmin / imageWidth) * 1000,
    (ymax / imageHeight) * 1000,
    (xmax / imageWidth) * 1000,
  ];
};
```

```typescript
// src/lib/contract.ts
export interface TranslationContract {
  id: number;
  box: [number, number, number, number];
  texto_original: string;
  texto_traducido: string;
}

export const validateContract = (data: unknown): data is TranslationContract[] => {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    typeof item.id === 'number' &&
    Array.isArray(item.box) && item.box.length === 4 &&
    typeof item.texto_original === 'string' &&
    typeof item.texto_traducido === 'string'
  );
};
```

**Entregable:**
- Funciones de conversión de escala
- Validador de contrato
- TypeScript types exportables

---

### T2.6: App.vue principal

```vue
<!-- src/App.vue -->
<template>
  <div class="flex h-screen w-screen bg-white dark:bg-gray-900">
    <div class="flex-1 flex flex-col">
      <ImageUploader @image-loaded="imageData = $event" />
      <OverlayRenderer v-if="translations.length" :imageData="imageData" :translations="translations" />
    </div>
    <TranslationPanel v-if="translations.length" :translations="translations" @selectItem="highlightItem" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ImageUploader from './components/ImageUploader.vue';
import OverlayRenderer from './components/OverlayRenderer.vue';
import TranslationPanel from './components/TranslationPanel.vue';
import { TranslationContract, validateContract } from './lib/contract';

const imageData = ref('');
const translations = ref<TranslationContract[]>([]);

onMounted(async () => {
  const mockData = await fetch('/mock/mock-data.json').then(r => r.json());
  if (validateContract(mockData)) {
    translations.value = mockData;
  }
});

const highlightItem = (item: TranslationContract) => {
  console.log('Highlighted:', item);
};
</script>
```

**Entregable:**
- Composición de componentes
- Carga de mock-data.json
- Layout responsivo

---

### T2.7: Mock data y configuración PWA

**Archivo:** `src/mock/mock-data.json`

```json
[
  {
    "id": 1,
    "box": [50, 100, 150, 400],
    "texto_original": "こんにちは",
    "texto_traducido": "Hola"
  },
  {
    "id": 2,
    "box": [200, 120, 300, 380],
    "texto_original": "これは漫画です",
    "texto_traducido": "Este es un manga"
  }
]
```

**Archivo:** `public/manifest.json`

```json
{
  "name": "TP Integrador IA - Traductor de Manga",
  "short_name": "MangaTranslator",
  "description": "Aplicación PWA para traducción automática de manga",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**Entregable:**
- Mock data válido
- PWA manifest
- Meta tags en HTML

---

### T2.8: Tests unitarios (Vitest)

```typescript
// src/__tests__/scale.test.ts
import { describe, it, expect } from 'vitest';
import { normalizedBoxToPixels, pixelsToNormalizedBox } from '@/lib/scale';

describe('Scale utilities', () => {
  it('converts normalized to pixels', () => {
    const result = normalizedBoxToPixels([0, 0, 500, 500], 1000, 1000);
    expect(result).toEqual([0, 0, 500, 500]);
  });

  it('converts pixels to normalized', () => {
    const result = pixelsToNormalizedBox(0, 0, 500, 500, 1000, 1000);
    expect(result).toEqual([0, 0, 500, 500]);
  });
});

// src/__tests__/contract.test.ts
import { describe, it, expect } from 'vitest';
import { validateContract } from '@/lib/contract';

describe('Contract validation', () => {
  it('validates valid contract', () => {
    const valid = [{
      id: 1,
      box: [0, 0, 100, 100],
      texto_original: 'test',
      texto_traducido: 'prueba'
    }];
    expect(validateContract(valid)).toBe(true);
  });

  it('rejects invalid contract', () => {
    expect(validateContract([])).toBe(true); // empty array is valid
    expect(validateContract({ id: 1 })).toBe(false); // not an array
    expect(validateContract([{ id: 'invalid', box: [] }])).toBe(false);
  });
});
```

**Entregable:**
- Suite de tests ejecutable
- Cobertura mínima funciones críticas

---

## Reglas de integración

- **Mock-Driven:** Ningún fetch a `/api/` hasta que backend esté listo
- **JSON local:** Solo consume `mock-data.json`
- **Build:** `npm run build` genera `/dist/`
- **Desarrollo:** `npm run dev` en puerto 5173

---

## Notas adicionales

- Soporte tema oscuro con `prefers-color-scheme`
- PWA instalable en móviles (agregar a pantalla de inicio)
- Scroll sincronizado opcional entre overlay y panel
- Opción futura: Text-to-Speech para audio traducido
- Caché de imágenes procesadas en IndexedDB
