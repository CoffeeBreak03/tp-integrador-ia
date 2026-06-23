<template>
  <div class="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
    <!-- Top Bar -->
    <div 
      class="absolute left-0 right-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 px-6 transition-transform duration-300"
      :class="isTopBarVisible ? 'translate-y-0' : '-translate-y-full'"
      @mouseenter="topBarHovered = true"
      @mouseleave="topBarHovered = false"
    >
      <div class="flex items-center gap-4">
        <button
          class="group relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/50 text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          @click="$emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          <div class="tooltip bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 hidden md:block">
            Volver al panel
          </div>
        </button>
        <span class="font-semibold text-lg drop-shadow-md">{{ fileName || 'Visor de Manga' }}</span>
      </div>

      <div class="flex items-center gap-4 drop-shadow-md">
        <button
          v-if="layoutMode !== 'cascade'"
          @click="prevPage"
          class="p-2 transition-colors hover:text-blue-400 disabled:opacity-50"
          :disabled="!canGoPrev"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span class="text-sm font-medium tracking-wide">
          Pág. {{ displayPageText }} / {{ chapterPages.length }}
        </span>
        <div v-if="isProcessingChapter" class="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
        <button
          v-if="layoutMode !== 'cascade'"
          @click="nextPage"
          class="p-2 transition-colors hover:text-blue-400 disabled:opacity-50"
          :disabled="!canGoNext"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>

    <!-- Main Canvas -->
    <div 
      class="relative flex-1 overflow-hidden" 
      ref="canvasRef"
      @mousemove="handleMouseMove"
      @click="onBackgroundClick"
    >
      <!-- Single Page Mode -->
      <div v-if="layoutMode === 'single'" class="flex h-full w-full overflow-auto p-4">
        <div :style="pageContainerStyle" class="relative z-20 flex-shrink-0 transition-transform duration-200 m-auto" @click.stop="onImageClick">
          <OverlayRenderer
            v-if="chapterPages[currentPageIndex]"
            :pageIndex="currentPageIndex"
            :imageData="chapterPages[currentPageIndex]"
            :translations="pageCache.get(currentPageIndex)?.translations || []"
            :showOverlay="showOverlay"
            :isLoading="isProcessingChapter && pageCache.get(currentPageIndex)?.translationStatus !== 'success' && !pageCache.get(currentPageIndex)?.hasError"
            :fitMode="fitMode"
            :selectedItemId="selectedItemId"
            :hoveredItemId="hoveredItemId"
            flat
            @imageLoaded="onImageLoaded"
            @selectBox="handleBoxSelect"
            @hoverBox="handleBoxHover"
          />
        </div>
      </div>

      <!-- Double Page Mode -->
      <div v-else-if="layoutMode === 'double'" class="flex h-full w-full overflow-auto p-4">
        <div class="relative z-20 flex flex-shrink-0 items-center justify-center gap-1 transition-transform duration-200 m-auto" :style="doubleContainerStyle" @click="onImageClick">
          <div v-for="idx in activeSpreadIndices" :key="idx" :style="pageContainerStyle" class="flex-shrink-0">
             <OverlayRenderer
                v-if="idx !== -1 && chapterPages[idx]"
                :pageIndex="idx"
                :imageData="chapterPages[idx]"
                :translations="pageCache.get(idx)?.translations || []"
                :showOverlay="showOverlay"
                :isLoading="isProcessingChapter && pageCache.get(idx)?.translationStatus !== 'success' && !pageCache.get(idx)?.hasError"
                :fitMode="fitMode"
                :selectedItemId="selectedItemId"
                :hoveredItemId="hoveredItemId"
                flat
                @imageLoaded="onImageLoaded"
                @selectBox="handleBoxSelect"
                @hoverBox="handleBoxHover"
              />
          </div>
        </div>
      </div>

      <!-- Cascade Mode -->      <div v-else-if="layoutMode === 'cascade'" class="h-full w-full overflow-y-auto" ref="cascadeScrollRef" @scroll="onCascadeScroll">
        <div class="mx-auto flex flex-col items-center py-8" :style="{ width: cascadeWidth }">
          <div 
            v-for="(page, i) in chapterPages" 
            :key="i"
            :data-index="i"
            class="cascade-page-container relative mb-4 flex-shrink-0 w-full"
            :style="{ minHeight: '50vh' }"
            @click="onImageClick"
          >
              <OverlayRenderer
                :pageIndex="Number(i)"
                :imageData="page"
                :translations="visiblePages.has(Number(i)) ? (pageCache.get(Number(i))?.translations || []) : []"
                :showOverlay="showOverlay"
                :isLoading="isProcessingChapter && pageCache.get(Number(i))?.translationStatus !== 'success' && !pageCache.get(Number(i))?.hasError"
                :fitMode="fitMode"
                :selectedItemId="selectedItemId"
                :hoveredItemId="hoveredItemId"
                flat
                @imageLoaded="onImageLoaded"
                @selectBox="handleBoxSelect"
                @hoverBox="handleBoxHover"
              />
          </div>
        </div>
      </div>>
    </div>

    <!-- Floating Buttons (Right bottom) -->
    <div class="absolute bottom-6 right-6 z-40 flex flex-col gap-3">
      <button
        class="group relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 shadow-lg backdrop-blur transition-colors hover:bg-slate-700 hover:text-white"
        @click="showOverlay = !showOverlay"
      >
        <svg v-if="showOverlay" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
        <div class="tooltip right-full top-1/2 mr-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hidden md:block">
          {{ showOverlay ? 'Ocultar Traducciones' : 'Mostrar Traducciones' }}
        </div>
      </button>

      <button
        class="group relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 shadow-lg backdrop-blur transition-colors hover:bg-slate-700 hover:text-white"
        @click="togglePanel('translations')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <div class="tooltip right-full top-1/2 mr-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hidden md:block">
          Lista de Traducciones
        </div>
      </button>

      <button
        class="group relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-200 shadow-lg backdrop-blur transition-colors hover:bg-slate-700 hover:text-white"
        @click="togglePanel('settings')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <div class="tooltip right-full top-1/2 mr-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hidden md:block">
          Configuración
        </div>
      </button>
    </div>

    <!-- Sidebars & Overlays -->
    <!-- Settings Drawer (Right) -->
    <div 
      class="fixed inset-y-0 right-0 z-50 w-80 transform bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl transition-transform duration-300"
      :class="activePanel === 'settings' ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-bold">Configuración</h2>
        <button @click="activePanel = null" class="rounded-full p-2 hover:bg-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Layout Mode -->
        <div>
          <h3 class="mb-3 text-sm font-medium text-slate-400">Layout</h3>
          <div class="flex gap-2 rounded-xl bg-slate-800 p-1">
            <button @click="layoutMode = 'single'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="layoutMode === 'single' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">Simple</button>
            <button @click="layoutMode = 'double'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="layoutMode === 'double' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">Doble</button>
            <button @click="layoutMode = 'cascade'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="layoutMode === 'cascade' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">Cascada</button>
          </div>
        </div>

        <!-- Reading Direction (only visible if not cascade) -->
        <div v-if="layoutMode !== 'cascade'">
          <h3 class="mb-3 text-sm font-medium text-slate-400">Dirección de lectura</h3>
          <div class="flex gap-2 rounded-xl bg-slate-800 p-1">
            <button @click="readingDirection = 'ltr'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="readingDirection === 'ltr' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">LTR (→)</button>
            <button @click="readingDirection = 'rtl'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="readingDirection === 'rtl' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">RTL (←)</button>
          </div>
        </div>

        <!-- Fit Presets -->
        <div>
          <h3 class="mb-3 text-sm font-medium text-slate-400">Ajuste de pantalla</h3>
          <div class="flex gap-2 rounded-xl bg-slate-800 p-1">
            <button @click="fitMode = 'height'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="fitMode === 'height' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">Alto ↕</button>
            <button @click="fitMode = 'width'" class="flex-1 rounded-lg py-2 text-center text-sm transition-colors" :class="fitMode === 'width' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'">Ancho ↔</button>
          </div>
        </div>

        <!-- Zoom Slider -->
        <div>
          <div class="mb-3 flex items-center justify-between text-sm font-medium text-slate-400">
            <span>Zoom</span>
            <span>{{ fitMode === 'width' ? 'Ajustado' : zoomPercent + '%' }}</span>
          </div>
          <input
            type="range"
            v-model.number="zoomPercent"
            :min="minZoom"
            max="200"
            step="10"
            class="w-full accent-blue-500 disabled:opacity-50"
            :disabled="fitMode === 'width'"
          />
        </div>

        <!-- Double Page settings -->
        <div v-if="layoutMode === 'double'">
          <label class="flex items-center gap-3 text-sm font-medium text-slate-300">
            <input type="checkbox" v-model="doublePageCover" class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 accent-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
            Primera página es portada
          </label>
        </div>
      </div>
    </div>

    <!-- Translations Drawer / Bottom Sheet -->
    <div 
      class="fixed z-50 flex transform flex-col bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 md:inset-y-0 md:right-0 md:w-80 md:translate-y-0"
      :class="[
        activePanel === 'translations' 
          ? 'translate-y-0 md:translate-x-0' 
          : 'translate-y-full md:translate-y-0 md:translate-x-full',
        'inset-x-0 bottom-0 h-[50vh] md:h-full md:bottom-auto md:left-auto md:top-0'
      ]"
    >
      <!-- Bottom sheet drag handle (mobile only) -->
      <div class="flex shrink-0 cursor-pointer justify-center pt-3 pb-1 md:hidden" @click="activePanel = null">
        <div class="h-1.5 w-12 rounded-full bg-slate-600"></div>
      </div>
      
      <div class="absolute right-4 top-4 hidden md:block">
        <button @click="activePanel = null" class="rounded-full p-2 hover:bg-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div class="flex-1 overflow-hidden p-4 md:p-6">
        <TranslationPanel
          :pageGroups="activePageGroups"
          :selectedItemId="selectedItemId"
          :hoveredItemId="hoveredItemId"
          @selectItem="handleTranslationSelect"
          @hoverItem="handleBoxHover"
          flat
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, inject, nextTick } from 'vue';
import OverlayRenderer from '@/components/OverlayRenderer.vue';
import TranslationPanel from '@/components/TranslationPanel.vue';

const props = defineProps<{
  fileName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Inject pipeline state
const processor = inject<any>('chapterProcessor');
const {
  chapterPages,
  pageCache,
  currentPageIndex,
  isProcessingChapter,
  goToPage
} = processor;

// --- Local State (Persisted) ---
const getSavedPref = <T>(key: string, def: T): T => {
  try {
    const val = localStorage.getItem('manga_prefs_' + key);
    return val !== null ? JSON.parse(val) : def;
  } catch {
    return def;
  }
};
const setSavedPref = (key: string, val: any) => {
  localStorage.setItem('manga_prefs_' + key, JSON.stringify(val));
};

const layoutMode = ref<'single' | 'cascade' | 'double'>(getSavedPref('layout', 'single'));
const readingDirection = ref<'rtl' | 'ltr'>(getSavedPref('direction', 'rtl'));
const fitMode = ref<'height' | 'width'>(getSavedPref('fit', 'height'));
const zoomPercent = ref<number>(Math.max(100, getSavedPref('zoom', 100)));
const doublePageCover = ref<boolean>(getSavedPref('doubleCover', true));
const showOverlay = ref<boolean>(getSavedPref('overlay', true));

const currentAspectRatio = ref(0.7);

const onImageLoaded = ({ aspectRatio }: { aspectRatio: number }) => {
  currentAspectRatio.value = aspectRatio;
};

const minZoom = computed(() => {
  if (layoutMode.value === 'cascade' && fitMode.value === 'height') {
    return 50;
  }
  return 100;
});

watch(minZoom, (newMin) => {
  if (zoomPercent.value < newMin) {
    zoomPercent.value = newMin;
  }
});

watch([layoutMode, readingDirection, fitMode, zoomPercent, doublePageCover, showOverlay], () => {
  setSavedPref('layout', layoutMode.value);
  setSavedPref('direction', readingDirection.value);
  setSavedPref('fit', fitMode.value);
  setSavedPref('zoom', zoomPercent.value);
  setSavedPref('doubleCover', doublePageCover.value);
  setSavedPref('overlay', showOverlay.value);
}, { deep: true });

// --- UI State ---
const activePanel = ref<'settings' | 'translations' | null>(null);
const togglePanel = (panel: 'settings' | 'translations') => {
  activePanel.value = activePanel.value === panel ? null : panel;
};

// --- Selection & Hover State ---
const selectedItemId = ref<string | undefined>(undefined);
const hoveredItemId = ref<string | undefined>(undefined);

const activePageGroups = computed(() => {
  if (layoutMode.value === 'double') {
    return activeSpreadIndices.value
      .filter(idx => idx !== -1)
      .map(idx => ({
        pageIndex: idx,
        title: `Página ${idx + 1}`,
        translations: pageCache.value.get(idx)?.translations || []
      }));
  }
  return [{
    pageIndex: currentPageIndex.value,
    title: `Página ${currentPageIndex.value + 1}`,
    translations: pageCache.value.get(currentPageIndex.value)?.translations || []
  }];
});

const handleBoxSelect = (payload: { pageIndex: number; item: any }) => {
  selectedItemId.value = `${payload.pageIndex}-${payload.item.id}`;
  activePanel.value = 'translations';
  
  nextTick(() => {
    const el = document.getElementById(`translation-item-${payload.pageIndex}-${payload.item.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
};

const handleTranslationSelect = (payload: { pageIndex: number; item: any }) => {
  selectedItemId.value = `${payload.pageIndex}-${payload.item.id}`;
  if (window.innerWidth < 768) {
    activePanel.value = null;
  }
  
  nextTick(() => {
    const el = document.getElementById(`translation-box-${payload.pageIndex}-${payload.item.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

const handleBoxHover = (id: string | undefined) => {
  hoveredItemId.value = id;
};

// Top bar auto-hide
const isTopBarVisible = ref(true);
const topBarHovered = ref(false);
let topBarTimer: number | null = null;
const showTopBarTemp = () => {
  isTopBarVisible.value = true;
  if (topBarTimer) clearTimeout(topBarTimer);
  topBarTimer = window.setTimeout(() => {
    if (!topBarHovered.value) isTopBarVisible.value = false;
  }, 2500);
};
const handleMouseMove = (e: MouseEvent) => {
  if (e.clientY < 80) {
    showTopBarTemp();
  }
};
onMounted(() => showTopBarTemp());

// --- Navigation Logic ---
const canGoPrev = computed(() => {
  if (layoutMode.value === 'double') {
    return currentPageIndex.value > 0;
  }
  return currentPageIndex.value > 0;
});
const canGoNext = computed(() => {
  return currentPageIndex.value < chapterPages.value.length - 1;
});

const nextPage = () => {
  const i = currentPageIndex.value;
  if (layoutMode.value === 'double') {
    const offset = doublePageCover.value ? 1 : 0;
    if (i === 0 && doublePageCover.value) {
      goToPage(2);
    } else {
      const pair = Math.floor((i - offset) / 2);
      const nextIdx = offset + (pair + 1) * 2;
      if (nextIdx < chapterPages.value.length) goToPage(nextIdx + 1);
    }
  } else {
    if (i < chapterPages.value.length - 1) goToPage(i + 2);
  }
};

const prevPage = () => {
  const i = currentPageIndex.value;
  if (layoutMode.value === 'double') {
    const offset = doublePageCover.value ? 1 : 0;
    if (i === 0) return;
    if (i <= offset) {
      goToPage(1);
    } else {
      const pair = Math.floor((i - offset) / 2);
      const prevIdx = offset + (pair - 1) * 2;
      if (prevIdx >= 0) goToPage(prevIdx + 1);
      else goToPage(1);
    }
  } else {
    if (i > 0) goToPage(i);
  }
};

const displayPageText = computed(() => {
  if (layoutMode.value === 'double') {
    const indices = activeSpreadIndices.value.filter(i => i !== -1);
    return indices.map(i => i + 1).join('-');
  }
  return currentPageIndex.value + 1;
});

// --- Spread Calculation (Double Mode) ---
const activeSpreadIndices = computed(() => {
  if (layoutMode.value !== 'double') return [];
  const idx = currentPageIndex.value;
  const isRTL = readingDirection.value === 'rtl';
  
  if (doublePageCover.value && idx === 0) {
    return [0, -1]; // Only cover
  }
  
  const offset = doublePageCover.value ? 1 : 0;
  const pairIndex = Math.floor((idx - offset) / 2);
  const leftPageIdx = offset + pairIndex * 2;
  const rightPageIdx = leftPageIdx + 1;
  
  const rightValid = rightPageIdx < chapterPages.value.length ? rightPageIdx : -1;
  
  if (isRTL) {
    return [rightValid, leftPageIdx];
  } else {
    return [leftPageIdx, rightValid];
  }
});

// --- Sizing & Styles ---
const maxZoomPercent = computed(() => {
  if (fitMode.value !== 'height') return 200;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const maxWidth = Math.min(windowWidth, 1200);

  if (layoutMode.value === 'cascade') {
    // En cascada el ancho es (zoom / 100) * 800px.
    // Queremos que no supere maxWidth.
    return Math.max(100, (maxWidth / 800) * 100);
  }

  // En modo doble, el aspect ratio efectivo del spread es el doble
  const factor = layoutMode.value === 'double' ? 2 : 1;
  const effectiveAR = currentAspectRatio.value * factor;

  const calculatedMax = (maxWidth / (windowHeight * effectiveAR)) * 100;
  return Math.max(100, calculatedMax);
});

const effectiveZoom = computed(() => {
  if (fitMode.value === 'width') {
    return 100; // Deshabilitado en modo ancho
  }
  return Math.min(zoomPercent.value, maxZoomPercent.value);
});

const cascadeWidth = computed(() => {
  if (fitMode.value === 'width') return '100%';
  return `${(effectiveZoom.value / 100) * 800}px`;
});

const pageContainerStyle = computed(() => {
  if (fitMode.value === 'height') {
    return { height: `${effectiveZoom.value}vh`, width: 'auto' };
  } else {
    return { width: '100vw', maxWidth: '1200px', height: 'auto' };
  }
});

const doubleContainerStyle = computed(() => {
  if (fitMode.value === 'height') {
    return { height: `${effectiveZoom.value}vh` };
  } else {
    return { width: '100vw', maxWidth: '1200px' };
  }
});

// --- Cascade Lazy Render ---
const cascadeScrollRef = ref<HTMLElement | null>(null);
const visiblePages = ref<Set<number>>(new Set([0, 1, 2]));
let visibleObserver: IntersectionObserver | null = null;
let currentObserver: IntersectionObserver | null = null;

const onCascadeScroll = () => {
  showTopBarTemp();
};

const setupObservers = () => {
  if (visibleObserver) visibleObserver.disconnect();
  if (currentObserver) currentObserver.disconnect();
  
  if (!cascadeScrollRef.value) return;

  visibleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = Number(entry.target.getAttribute('data-index'));
      if (entry.isIntersecting) visiblePages.value.add(idx);
      else visiblePages.value.delete(idx);
    });
  }, { root: cascadeScrollRef.value, rootMargin: '100% 0px' });

  currentObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = Number(entry.target.getAttribute('data-index'));
      if (entry.isIntersecting) {
        currentPageIndex.value = idx;
      }
    });
  }, { root: cascadeScrollRef.value, rootMargin: '-49% 0px -49% 0px' });
};

onMounted(() => {
  watch(() => layoutMode.value, async (val) => {
    if (val === 'cascade') {
      await nextTick();
      setupObservers();
      const els = document.querySelectorAll('.cascade-page-container');
      els.forEach(el => {
        visibleObserver?.observe(el);
        currentObserver?.observe(el);
      });
      // Restaurar scroll a la página actual al cambiar a cascada
      const targetEl = document.querySelector(`.cascade-page-container[data-index="${currentPageIndex.value}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    } else {
      if (visibleObserver) visibleObserver.disconnect();
      if (currentObserver) currentObserver.disconnect();
    }
  }, { immediate: true });
});

onUnmounted(() => {
  visibleObserver?.disconnect();
  currentObserver?.disconnect();
  window.removeEventListener('keydown', handleKeydown);
});

// --- Keyboard & Tap Zones ---
const handleTapZone = (zone: 'left' | 'center' | 'right') => {
  if (zone === 'center') {
    isTopBarVisible.value = !isTopBarVisible.value;
    return;
  }
  
  const isRTL = readingDirection.value === 'rtl';
  if (zone === 'left') {
    isRTL ? nextPage() : prevPage();
  } else {
    isRTL ? prevPage() : nextPage();
  }
};

const onImageClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  // Ignore clicks on translation boxes and other UI overlays
  if (target.closest('.absolute.rounded-lg.border-2')) return;
  
  let didDeselect = false;
  if (selectedItemId.value !== undefined) {
    selectedItemId.value = undefined;
    didDeselect = true;
  }
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = rect.width;
  
  if (x < width / 3) {
    handleTapZone('left');
  } else if (x > width * 2 / 3) {
    handleTapZone('right');
  } else {
    if (!didDeselect) {
      handleTapZone('center');
    }
  }
};

const onBackgroundClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  // Ignore if clicking on the image containers or translation boxes (they handle their own clicks)
  if (target.closest('.relative.z-20')) return;
  if (target.closest('.cascade-page-container')) return;
  if (target.closest('.absolute.rounded-lg.border-2')) return;
  
  if (selectedItemId.value !== undefined) {
    selectedItemId.value = undefined;
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (activePanel.value) {
      activePanel.value = null;
    } else {
      emit('close');
    }
    return;
  }
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

  const isRTL = readingDirection.value === 'rtl';
  
  if (e.key === 'ArrowRight') {
    if (layoutMode.value !== 'cascade') {
      isRTL ? prevPage() : nextPage();
    }
  } else if (e.key === 'ArrowLeft') {
    if (layoutMode.value !== 'cascade') {
      isRTL ? nextPage() : prevPage();
    }
  } else if (e.key === ' ') {
    e.preventDefault();
    if (layoutMode.value === 'cascade') {
      cascadeScrollRef.value?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    } else {
      nextPage();
    }
  } else if (e.key === 'm' || e.key === 'M') {
    showOverlay.value = !showOverlay.value;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

watch(currentPageIndex, () => {
  showTopBarTemp();
  selectedItemId.value = undefined;
  hoveredItemId.value = undefined;
});
</script>
