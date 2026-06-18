<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <img src="/favicon.png" alt="Manga Translate Logo" class="h-10 w-10 object-contain sm:h-12 sm:w-12" />
            <h1 class="text-3xl font-bold sm:text-4xl">Manga Translate</h1>
          </div>
          <button
            id="dark-mode-toggle"
            type="button"
            @click="toggleDark"
            :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg shadow-sm transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-400 dark:hover:bg-slate-700"
          >
            <span v-if="isDark" class="transition-transform duration-300">☀️</span>
            <span v-else class="transition-transform duration-300">🌙</span>
          </button>
        </div>
        <p class="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Traduce tus páginas de manga al instante. Sube una imagen, PDF o ZIP para digitalizar y traducir su contenido automáticamente.
        </p>
      </header>

      <main class="space-y-5">
        <section class="space-y-4">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
            <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300">
              <p class="font-semibold">Error al procesar la imagen:</p>
              <p class="mt-1">{{ errorMessage }}</p>
            </div>

            <div v-if="isLoading && !isChapterMode" class="mb-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-blue-600"></div>
                <div class="flex-1">
                  <p class="font-semibold">{{ loadingMessage }}</p>
                  <p class="mt-1 text-xs opacity-75">Tiempo: {{ loadingElapsedSeconds }}s</p>
                  <p v-if="loadingElapsedSeconds > 10" class="mt-1 text-xs opacity-75 italic">
                    ⚡ Iniciando servicio remoto (primera solicitud). Esto puede tomar hasta 60 segundos...
                  </p>
                </div>
              </div>
              <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                <div class="h-full animate-pulse bg-blue-400" style="width: 100%"></div>
              </div>
            </div>

            <!-- Barra de progreso del capítulo -->
            <div v-if="isChapterMode && isProcessingChapter" class="mb-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-blue-600"></div>
                <div class="flex-1">
                  <p class="font-semibold">Procesando capítulo...</p>
                  <p class="mt-1 text-xs opacity-75">
                    Página {{ processedPagesCount }} de {{ chapterPages.length }} procesadas
                  </p>
                </div>
              </div>
              <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                <div
                  class="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                  :style="{ width: `${(processedPagesCount / chapterPages.length) * 100}%` }"
                ></div>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-x-2">
                <button
                  type="button"
                  @click="showOverlay = !showOverlay"
                  :disabled="isLoading && !isChapterMode"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ showOverlay ? 'Ocultar overlays' : 'Mostrar overlays' }}
                </button>
                <button
                  type="button"
                  @click="showTranslations = !showTranslations"
                  :disabled="isLoading && !isChapterMode"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ showTranslations ? 'Ocultar lista' : 'Mostrar lista' }}
                </button>
                <button
                  type="button"
                  @click="isFitToScreen = !isFitToScreen"
                  :disabled="isLoading && !isChapterMode"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ isFitToScreen ? 'Restaurar tamaño' : 'Ajustar tamaño' }}
                </button>
              </div>
            </div>

            <!-- Navegación de páginas (solo en modo capítulo) -->
            <PageNavigator
              v-if="isChapterMode"
              class="mt-4"
              :currentPage="currentPageIndex + 1"
              :totalPages="chapterPages.length"
              :isCurrentPageLoading="isCurrentPageLoading"
              :processedPages="processedPagesCount"
              @goToPage="goToPage"
            />

            <div class="relative mt-4 overflow-hidden rounded-3xl bg-slate-100 p-4 dark:bg-slate-950">
              <div class="relative mx-auto flex max-w-6xl justify-center">
                <div
                  ref="centerContainer"
                  class="w-full max-w-4xl transition-transform duration-300"
                  :style="centerStyle"
                >
                  <div class="relative" style="transform-origin: right bottom;">
                    <ImageUploader
                      ref="imageUploader"
                      :imageData="currentImageData"
                      @update:imageData="handleSingleImage"
                      @chapterLoaded="handleChapterLoaded"
                    />

                    <OverlayRenderer
                      v-if="currentImageData"
                      :imageData="currentImageData"
                      :translations="currentTranslations"
                      :selectedItemId="selectedItemId"
                      :hoveredItemId="hoveredItemId"
                      :showOverlay="showOverlay"
                      :fitToScreen="isFitToScreen"
                      :isLoading="isCurrentPageLoading"
                      @selectBox="handleBoxClick"
                    />
                  </div>

                  <div v-if="currentImageData" class="mt-4 flex justify-center">
                    <button
                      type="button"
                      @click="openExplorer"
                      :disabled="isLoading && !isChapterMode"
                      class="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                    >
                      Cargar otro archivo
                    </button>
                  </div>
                </div>

                <aside
                  ref="asidePanel"
                  class="pointer-events-none absolute right-0 top-0 h-full w-80 overflow-auto transition-transform duration-300"
                  :class="showTranslations ? 'pointer-events-auto translate-x-0' : 'translate-x-full'"
                >
                  <TranslationPanel
                    v-if="currentTranslations.length"
                    :translations="currentTranslations"
                    :selectedItemId="selectedItemId"
                    :hoveredItemId="hoveredItemId"
                    @selectItem="highlightItem"
                    @hoverItem="handleHoverItem"
                  />
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick, onUnmounted } from 'vue';

// --- Dark mode ---
const isDark = ref(false);

const applyDark = (value: boolean) => {
  isDark.value = value;
  if (value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', value ? 'dark' : 'light');
};

const toggleDark = () => applyDark(!isDark.value);
import ImageUploader from '@/components/ImageUploader.vue';
import OverlayRenderer from '@/components/OverlayRenderer.vue';
import TranslationPanel from '@/components/TranslationPanel.vue';
import PageNavigator from '@/components/PageNavigator.vue';
import { TranslationContract } from '@/lib/contract';
import { processPage } from '@/lib/api';

// --- Refs del DOM ---
const imageUploader = ref<{ openExplorer: () => void } | null>(null);
const centerContainer = ref<HTMLElement | null>(null);
const asidePanel = ref<HTMLElement | null>(null);

// --- Estado común ---
const selectedItemId = ref<number | undefined>(undefined);
const hoveredItemId = ref<number | undefined>(undefined);
const showOverlay = ref(true);
const showTranslations = ref(false);
const isFitToScreen = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const loadingElapsedSeconds = ref(0);
const loadingMessage = ref('Procesando imagen...');
let loadingTimer: number | null = null;
let loadingStartTime: number | null = null;

// --- Estado de imagen individual (legacy) ---
const singleImageData = ref('');
const singleTranslations = ref<TranslationContract[]>([]);

// --- Estado del capítulo (multi-página) ---
const chapterPages = ref<string[]>([]);
const currentPageIndex = ref(0);
const chapterContext = ref('');
const isProcessingChapter = ref(false);
let chapterProcessingAborted = false;

interface CachedPage {
  translations: TranslationContract[];
  contexto: string;
}
const pageCache = ref<Map<number, CachedPage>>(new Map());
const pagesInProcess = ref<Set<number>>(new Set());

// --- Computed ---
const isChapterMode = computed(() => chapterPages.value.length > 1);

const currentImageData = computed(() => {
  if (isChapterMode.value) {
    return chapterPages.value[currentPageIndex.value] ?? '';
  }
  return singleImageData.value;
});

const currentTranslations = computed(() => {
  if (isChapterMode.value) {
    const cached = pageCache.value.get(currentPageIndex.value);
    return cached?.translations ?? [];
  }
  return singleTranslations.value;
});

const isCurrentPageLoading = computed(() => {
  if (isChapterMode.value) {
    const idx = currentPageIndex.value;
    return pagesInProcess.value.has(idx) || (!pageCache.value.has(idx) && isProcessingChapter.value);
  }
  return isLoading.value;
});

const processedPagesCount = computed(() => pageCache.value.size);

// --- Escala del contenedor ---
const scale = ref(1);

const centerStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'right bottom',
  transition: 'transform 300ms ease'
}));

const recalcScale = () => {
  const center = centerContainer.value;
  if (!center) return;

  const parent = center.parentElement ?? center;
  const parentWidth = parent.getBoundingClientRect().width;
  const centerRect = center.getBoundingClientRect();
  const available = parentWidth;
  let s = available / centerRect.width;
  if (!isFinite(s) || s <= 0) s = 1;
  if (s > 1) s = 1;
  if (s < 0.5) s = 0.5;
  scale.value = s;
};

// --- Procesamiento de imagen individual ---
const startLoadingTimer = () => {
  loadingElapsedSeconds.value = 0;
  loadingStartTime = Date.now();
  loadingTimer = window.setInterval(() => {
    if (loadingStartTime) {
      loadingElapsedSeconds.value = Math.floor((Date.now() - loadingStartTime) / 1000);
    }
  }, 1000);
};

const stopLoadingTimer = () => {
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = null;
};

const handleSingleImage = async (imageDataUrl: string) => {
  // Resetear modo capítulo
  resetChapter();
  singleImageData.value = imageDataUrl;
  singleTranslations.value = [];
  selectedItemId.value = undefined;
  errorMessage.value = null;

  if (!imageDataUrl) return;

  isLoading.value = true;
  loadingMessage.value = 'Procesando imagen...';
  startLoadingTimer();

  try {
    const result = await processPage(imageDataUrl);
    singleTranslations.value = result.translations || [];
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Error desconocido al procesar la imagen';
    singleTranslations.value = [];
  } finally {
    isLoading.value = false;
    stopLoadingTimer();
  }
};

// --- Procesamiento de capítulo (multi-página) ---
const resetChapter = () => {
  chapterProcessingAborted = true;
  chapterPages.value = [];
  currentPageIndex.value = 0;
  chapterContext.value = '';
  pageCache.value = new Map();
  pagesInProcess.value = new Set();
  isProcessingChapter.value = false;
};

const handleChapterLoaded = async (pages: string[]) => {
  // Resetear estado anterior
  resetChapter();
  singleImageData.value = '';
  singleTranslations.value = [];
  errorMessage.value = null;
  selectedItemId.value = undefined;

  // Cargar nuevas páginas
  chapterProcessingAborted = false;
  chapterPages.value = pages;
  currentPageIndex.value = 0;

  await nextTick();
  recalcScale();

  // Iniciar procesamiento secuencial
  processChapterSequentially();
};

const processChapterSequentially = async () => {
  isProcessingChapter.value = true;

  for (let i = 0; i < chapterPages.value.length; i++) {
    // Verificar si se abortó el procesamiento (por ej. si el usuario cargó otro archivo)
    if (chapterProcessingAborted) {
      console.log('[CHAPTER] Processing aborted at page', i);
      break;
    }

    // Saltar si ya está en caché
    if (pageCache.value.has(i)) {
      console.log('[CHAPTER] Page', i, 'already cached, skipping');
      continue;
    }

    pagesInProcess.value.add(i);

    try {
      console.log('[CHAPTER] Processing page', i + 1, '/', chapterPages.value.length);
      const result = await processPage(
        chapterPages.value[i],
        chapterContext.value || undefined
      );

      // Si se abortó mientras procesaba, no cachear
      if (chapterProcessingAborted) break;

      // Cachear resultado
      pageCache.value.set(i, {
        translations: result.translations,
        contexto: result.contexto,
      });

      // Actualizar contexto acumulativo para la siguiente página
      if (result.contexto) {
        chapterContext.value = result.contexto;
      }

      console.log('[CHAPTER] Page', i + 1, 'complete:', result.translations.length, 'boxes, context:', result.contexto.length, 'chars');
    } catch (error) {
      console.error('[CHAPTER] Error processing page', i + 1, ':', error);

      // Si se abortó, no mostrar error
      if (chapterProcessingAborted) break;

      // Cachear una entrada vacía para no bloquear la cola
      pageCache.value.set(i, {
        translations: [],
        contexto: chapterContext.value,
      });

      // Mostrar error solo si es la página actual
      if (i === currentPageIndex.value) {
        errorMessage.value = error instanceof Error
          ? `Error en página ${i + 1}: ${error.message}`
          : `Error desconocido en página ${i + 1}`;
      }
    } finally {
      pagesInProcess.value.delete(i);
    }
  }

  isProcessingChapter.value = false;
};

// --- Navegación de páginas ---
const goToPage = (pageNumber: number) => {
  const idx = pageNumber - 1;
  if (idx < 0 || idx >= chapterPages.value.length) return;

  currentPageIndex.value = idx;
  selectedItemId.value = undefined;
  errorMessage.value = null;
};

// --- Watchers ---
watch(currentImageData, async () => {
  await nextTick();
  recalcScale();
});

// --- Lifecycle ---
onMounted(() => {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyDark(saved === 'dark' || (!saved && prefersDark));

  recalcScale();
  window.addEventListener('resize', recalcScale);
});

onUnmounted(() => {
  window.removeEventListener('resize', recalcScale);
  stopLoadingTimer();
  chapterProcessingAborted = true;
});

// --- Handlers de UI ---
const highlightItem = (item: TranslationContract) => {
  selectedItemId.value = item.id;
};

const handleHoverItem = (id: number | undefined) => {
  hoveredItemId.value = id;
};

const handleBoxClick = async (item: TranslationContract) => {
  selectedItemId.value = item.id;
  const wasClosed = !showTranslations.value;
  if (wasClosed) {
    showTranslations.value = true;
    await nextTick();
  }
  setTimeout(() => {
    const el = document.getElementById(`translation-item-${item.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, wasClosed ? 300 : 50);
};

const openExplorer = () => {
  imageUploader.value?.openExplorer();
};
</script>
