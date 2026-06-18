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
              <p class="font-semibold">
                {{ isTimeoutError ? 'Tiempo de espera agotado (Timeout):' : 'Error al procesar la imagen:' }}
              </p>
              <p class="mt-1">
                {{ isTimeoutError ? 'El servicio remoto tardó demasiado en responder. Esto suele suceder por un encendido en frío del servidor de Hugging Face. Puedes intentar procesarla nuevamente.' : errorMessage }}
              </p>
              
              <!-- Botón de reintento manual solo para timeouts -->
              <div v-if="isTimeoutError" class="mt-3">
                <button
                  type="button"
                  @click="handleRetry"
                  class="rounded-full border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 focus:outline-none dark:border-red-700 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-slate-800"
                >
                  Reintentar procesamiento
                </button>
              </div>
            </div>

            <div v-if="isLoading && !isChapterMode" class="mb-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-blue-600"></div>
                <div class="flex-1">
                  <p class="font-semibold">{{ loadingMessage }}</p>
                  <p class="mt-1 text-xs opacity-75">Tiempo: {{ loadingElapsedSeconds }}s</p>
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

                  <!-- Navegación de páginas inferior (solo en modo capítulo) -->
                  <PageNavigator
                    v-if="isChapterMode"
                    class="mt-4"
                    :currentPage="currentPageIndex + 1"
                    :totalPages="chapterPages.length"
                    :isCurrentPageLoading="isCurrentPageLoading"
                    :processedPages="processedPagesCount"
                    @goToPage="goToPageAndScrollUp"
                  />

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
import { TranslationContract, VisionBox } from '@/lib/contract';
import { processPage, detectPage, translatePageWithBoxes } from '@/lib/api';

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
interface QueueItem {
  index: number;
  priority: number;
}
const chapterPages = ref<string[]>([]);
const chapterQueue = ref<QueueItem[]>([]);
const currentPageIndex = ref(0);
const chapterContext = ref('');
const isProcessingChapter = ref(false);
let chapterProcessingAborted = false;

interface CachedPage {
  translations: TranslationContract[];
  contexto: string;
  boxes?: VisionBox[];
  croppedBubbles?: Array<{ id: number; base64: string }>;
  detectionStatus: 'idle' | 'loading' | 'success' | 'error';
  translationStatus: 'idle' | 'loading' | 'success' | 'error';
  hasError?: boolean;
  errorType?: 'timeout' | 'other';
  errorMessage?: string;
}
const pageCache = ref<Map<number, CachedPage>>(new Map());
const pagesInProcess = ref<Set<number>>(new Set());

// --- Computed ---
const isChapterMode = computed(() => chapterPages.value.length > 1);

const isTimeoutError = computed(() => {
  if (!errorMessage.value) return false;
  return /500|502|504|timeout|limit/i.test(errorMessage.value);
});

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
    const cached = pageCache.value.get(idx);
    if (!cached) return false;
    return cached.detectionStatus === 'loading' || cached.translationStatus === 'loading';
  }
  return isLoading.value;
});

const processedPagesCount = computed(() => {
  // Solo contar páginas que terminaron con éxito (no tienen error y tienen traducción exitosa)
  let count = 0;
  for (const page of pageCache.value.values()) {
    if (page.translationStatus === 'success' && !page.hasError) count++;
  }
  return count;
});

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
const isDetectingChapter = ref(false);
const isTranslatingChapter = ref(false);

const resetChapter = () => {
  chapterProcessingAborted = true;
  chapterPages.value = [];
  currentPageIndex.value = 0;
  chapterContext.value = '';
  pageCache.value = new Map();
  pagesInProcess.value = new Set();
  isProcessingChapter.value = false;
  isDetectingChapter.value = false;
  isTranslatingChapter.value = false;
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

  // Inicializar caché con estados idle
  for (let i = 0; i < pages.length; i++) {
    pageCache.value.set(i, {
      translations: [],
      contexto: '',
      boxes: [],
      croppedBubbles: [],
      detectionStatus: 'idle',
      translationStatus: 'idle',
    });
  }

  isProcessingChapter.value = true;

  await nextTick();
  recalcScale();

  // Iniciar el pipeline en cadena
  runDetectionChain();
  runTranslationChain();
};

const runDetectionChain = async () => {
  if (isDetectingChapter.value) return;
  isDetectingChapter.value = true;
  updateProcessingStatus();

  try {
    for (let i = 0; i < chapterPages.value.length; i++) {
      if (chapterProcessingAborted) break;

      const cached = pageCache.value.get(i);
      if (!cached) continue;

      // Si ya se detectó exitosamente, saltar
      if (cached.detectionStatus === 'success') {
        continue;
      }

      cached.detectionStatus = 'loading';

      try {
        console.log('[PIPELINE] Detecting page', i + 1);
        const result = await detectPage(chapterPages.value[i]);
        if (chapterProcessingAborted) break;

        cached.boxes = result.boxes;
        cached.croppedBubbles = result.croppedBubbles;
        cached.detectionStatus = 'success';
        console.log('[PIPELINE] Page', i + 1, 'detection complete, boxes:', result.boxes.length);

        // Intentar disparar el loop de traducción, ya que ahora esta página tiene cajas
        triggerTranslationStep();
      } catch (error) {
        console.error('[PIPELINE] Error detecting page', i + 1, ':', error);
        if (chapterProcessingAborted) break;

        const msg = error instanceof Error ? error.message : String(error);
        const isTimeout = /502|504|timeout|limit/i.test(msg);

        cached.detectionStatus = 'error';
        cached.hasError = true;
        cached.errorType = isTimeout ? 'timeout' : 'other';
        cached.errorMessage = msg;

        if (i === currentPageIndex.value) {
          errorMessage.value = msg;
        }

        // Aunque falle la detección, dejamos que la cadena continúe con las otras páginas
      }
    }
  } finally {
    isDetectingChapter.value = false;
    updateProcessingStatus();
  }
};

const runTranslationChain = async () => {
  if (isTranslatingChapter.value) return;
  isTranslatingChapter.value = true;
  updateProcessingStatus();

  try {
    for (let i = 0; i < chapterPages.value.length; i++) {
      if (chapterProcessingAborted) break;

      const cached = pageCache.value.get(i);
      if (!cached) continue;

      // Si ya está traducido, pasar
      if (cached.translationStatus === 'success') {
        continue;
      }

      // Si falló y no estamos reintentándolo, pasamos a la siguiente página (continue)
      // para que el proceso no se corte.
      if (cached.translationStatus === 'error') {
        continue;
      }

      // Condición de sincronización: Las cajas de detección deben estar listas
      if (cached.detectionStatus !== 'success') {
        // Rompemos el loop de traducción secuencial aquí.
        // Se reanudará cuando triggerTranslationStep sea llamado tras completarse la detección de esta página.
        break;
      }

      // Obtener el último contexto válido buscando hacia atrás
      let prevContext = '';
      if (i > 0) {
        const prevPage = pageCache.value.get(i - 1);
        if (!prevPage || prevPage.translationStatus !== 'success') {
          // Si la página anterior falló, buscamos hacia atrás el último contexto exitoso
          for (let prev = i - 1; prev >= 0; prev--) {
            const p = pageCache.value.get(prev);
            if (p && p.translationStatus === 'success' && p.contexto) {
              prevContext = p.contexto;
              break;
            }
          }
        } else {
          prevContext = prevPage.contexto;
        }
      }

      cached.translationStatus = 'loading';

      try {
        console.log('[PIPELINE] Translating page', i + 1, 'with context length:', prevContext.length);
        const result = await translatePageWithBoxes(
          cached.croppedBubbles || [],
          cached.boxes || [],
          prevContext || undefined
        );

        if (chapterProcessingAborted) break;

        cached.translations = result.translations;
        cached.contexto = result.contexto;
        cached.translationStatus = 'success';
        cached.hasError = false;
        cached.errorMessage = undefined;

        if (i === currentPageIndex.value) {
          errorMessage.value = null;
        }
        console.log('[PIPELINE] Page', i + 1, 'translation complete, translations:', result.translations.length);
      } catch (error) {
        console.error('[PIPELINE] Error translating page', i + 1, ':', error);
        if (chapterProcessingAborted) break;

        const msg = error instanceof Error ? error.message : String(error);
        const isTimeout = /502|504|timeout|limit/i.test(msg);

        cached.translationStatus = 'error';
        cached.hasError = true;
        cached.errorType = isTimeout ? 'timeout' : 'other';
        cached.errorMessage = msg;

        if (i === currentPageIndex.value) {
          errorMessage.value = msg;
        }

        // Si falla la traducción, no detenemos la cola; permitimos que las siguientes continúen
        // usando el último contexto exitoso encontrado.
        continue;
      }
    }
  } finally {
    isTranslatingChapter.value = false;
    updateProcessingStatus();
  }
};

const triggerTranslationStep = () => {
  if (!chapterProcessingAborted) {
    runTranslationChain();
  }
};

const updateProcessingStatus = () => {
  isProcessingChapter.value = isDetectingChapter.value || isTranslatingChapter.value;
};

const handleRetry = async () => {
  if (isChapterMode.value) {
    const idx = currentPageIndex.value;
    console.log('[RETRY] Retrying page', idx + 1);

    const cached = pageCache.value.get(idx);
    if (!cached) return;

    errorMessage.value = null;

    // Si falló la detección (o no hay cajas precalculadas)
    if (cached.detectionStatus === 'error' || !cached.boxes || cached.boxes.length === 0) {
      cached.detectionStatus = 'idle';
      cached.translationStatus = 'idle';
      cached.hasError = false;
      isProcessingChapter.value = true;
      runDetectionChain();
      runTranslationChain();
    } else {
      // Si la detección fue exitosa pero falló la traducción
      cached.translationStatus = 'idle';
      cached.hasError = false;
      isProcessingChapter.value = true;
      runTranslationChain();
    }
  } else {
    handleSingleImage(singleImageData.value);
  }
};

// --- Navegación de páginas ---
const goToPage = (pageNumber: number) => {
  const idx = pageNumber - 1;
  if (idx < 0 || idx >= chapterPages.value.length) return;

  currentPageIndex.value = idx;
  selectedItemId.value = undefined;

  // Restaurar error si la página destino falló
  const cached = pageCache.value.get(idx);
  if (cached && cached.hasError) {
    errorMessage.value = cached.errorMessage || 'Error desconocido';
  } else {
    errorMessage.value = null;
  }
};

const goToPageAndScrollUp = (pageNumber: number) => {
  goToPage(pageNumber);
  nextTick(() => {
    const el = centerContainer.value;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
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
