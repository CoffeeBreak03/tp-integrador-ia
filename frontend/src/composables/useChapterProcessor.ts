import { ref, computed, nextTick, onUnmounted } from 'vue';
import { type TranslationContract, type VisionBox } from '@/lib/contract';
import { processPage, detectPage, translatePageWithBoxes, checkCache, saveCache } from '@/lib/api';

export interface CachedPage {
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

export function useChapterProcessor() {
  // Estado común
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);
  const loadingElapsedSeconds = ref(0);
  const loadingMessage = ref('Procesando imagen...');
  let loadingTimer: number | null = null;
  let loadingStartTime: number | null = null;

  // Estado unificado (sirve para capítulo e imagen individual)
  const chapterPages = ref<string[]>([]);
  const currentPageIndex = ref(0);
  const isProcessingChapter = ref(false);
  const pageCache = ref<Map<number, CachedPage>>(new Map());
  let chapterProcessingAborted = false;
  const isDetectingChapter = ref(false);
  const isTranslatingChapter = ref(false);

  // Estado de caché
  const lastUploadedFile = ref<{ hash: string; type: string } | null>(null);
  const cacheHitCount = ref(0);
  const showCacheToast = ref(false);

  const handleFileHashed = (payload: { hash: string; type: string }) => {
    console.log('[CACHE] File uploaded:', payload.type, 'with hash:', payload.hash);
    lastUploadedFile.value = payload;
  };

  // Computed
  const isChapterMode = computed(() => chapterPages.value.length > 1);
  const isTimeoutError = computed(() => {
    if (!errorMessage.value) return false;
    return /500|502|504|timeout|limit/i.test(errorMessage.value);
  });
  const currentImageData = computed(() => {
    return chapterPages.value[currentPageIndex.value] ?? '';
  });
  const currentTranslations = computed(() => {
    const cached = pageCache.value.get(currentPageIndex.value);
    return cached?.translations ?? [];
  });
  const isCurrentPageLoading = computed(() => {
    const idx = currentPageIndex.value;
    const cached = pageCache.value.get(idx);
    if (!cached) return isLoading.value;
    return cached.detectionStatus === 'loading' || cached.translationStatus === 'loading';
  });
  const processedPagesCount = computed(() => {
    let count = 0;
    for (const page of pageCache.value.values()) {
      if (page.translationStatus === 'success' && !page.hasError) count++;
    }
    return count;
  });

  const hasLoadedContent = computed(() => currentImageData.value !== '');

  // Timers
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

  // Manejadores principales
  const handleSingleImage = async (imageDataUrl: string) => {
    resetChapter();
    if (!imageDataUrl) return;

    chapterPages.value = [imageDataUrl];
    currentPageIndex.value = 0;
    
    const cachedPage: CachedPage = {
      translations: [],
      contexto: '',
      boxes: [],
      croppedBubbles: [],
      detectionStatus: 'idle',
      translationStatus: 'loading'
    };
    pageCache.value.set(0, cachedPage);

    const fileHash = lastUploadedFile.value?.hash;
    const fileType = lastUploadedFile.value?.type;

    // Mostrar el spinner de carga inmediatamente para la búsqueda en caché
    isLoading.value = true;
    loadingMessage.value = 'Buscando en caché...';
    startLoadingTimer();

    if (fileHash && fileType === 'image') {
      try {
        console.log('[CACHE] Checking cache for image:', fileHash);
        const cacheResult = await checkCache(fileHash);
        if (cacheResult.cached && cacheResult.data && cacheResult.data.pages.length > 0) {
          console.log('[CACHE] Cache HIT for image:', fileHash);
          cachedPage.translations = cacheResult.data.pages[0].translations;
          cachedPage.translationStatus = 'success';
          cacheHitCount.value = 1;
          showCacheToast.value = true;
          setTimeout(() => { showCacheToast.value = false; }, 3500);

          // Ocultar el spinner porque ya recuperamos la traducción de la caché
          isLoading.value = false;
          stopLoadingTimer();
          return;
        }
      } catch (err) {
        console.warn('[CACHE] Error checking cache:', err);
      }
    }

    // Si no hubo caché, cambiamos el mensaje de carga e iniciamos procesamiento
    loadingMessage.value = 'Procesando imagen...';

    try {
      const result = await processPage(imageDataUrl);
      cachedPage.translations = result.translations || [];
      cachedPage.translationStatus = 'success';

      if (fileHash && fileType === 'image' && cachedPage.translations.length > 0) {
        try {
          await saveCache({
            fileHash,
            fileType: 'image',
            pages: [
              {
                pageIndex: 0,
                translations: cachedPage.translations,
                contexto: ''
              }
            ]
          });
          console.log('[CACHE] Successfully saved translation results for image:', fileHash);
        } catch (saveErr) {
          console.warn('[CACHE] Error saving cache for image:', saveErr);
        }
      }
    } catch (error) {
      errorMessage.value = error instanceof Error
        ? error.message
        : 'Error desconocido al procesar la imagen';
      cachedPage.translationStatus = 'error';
      cachedPage.hasError = true;
      cachedPage.errorMessage = errorMessage.value;
    } finally {
      isLoading.value = false;
      stopLoadingTimer();
    }
  };

  const resetChapter = () => {
    chapterProcessingAborted = true;
    chapterPages.value = [];
    currentPageIndex.value = 0;
    pageCache.value = new Map();
    isProcessingChapter.value = false;
    isDetectingChapter.value = false;
    isTranslatingChapter.value = false;
    errorMessage.value = null;
    stopLoadingTimer();
  };

  const handleChapterLoaded = async (pages: string[]) => {
    resetChapter();
    chapterProcessingAborted = false;
    chapterPages.value = pages;
    currentPageIndex.value = 0;

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

    // Mostrar barra de progreso inmediatamente mientras se busca en caché
    isProcessingChapter.value = true;

    const fileHash = lastUploadedFile.value?.hash;
    const fileType = lastUploadedFile.value?.type;

    if (fileHash && (fileType === 'pdf' || fileType === 'zip')) {
      try {
        console.log('[CACHE] Checking cache for chapter:', fileHash);
        const cacheResult = await checkCache(fileHash);
        if (cacheResult.cached && cacheResult.data && cacheResult.data.pages.length > 0) {
          console.log('[CACHE] Cache HIT for chapter:', fileHash);
          let hits = 0;
          for (let i = 0; i < pages.length; i++) {
            const pageData = cacheResult.data.pages.find((p) => p.pageIndex === i);
            if (pageData) {
              const cachedP = pageCache.value.get(i);
              if (cachedP) {
                cachedP.translations = pageData.translations;
                cachedP.contexto = pageData.contexto;
                cachedP.detectionStatus = 'success';
                cachedP.translationStatus = 'success';
                hits++;
              }
            }
          }
          if (hits > 0) {
            cacheHitCount.value = hits;
            showCacheToast.value = true;
            setTimeout(() => { showCacheToast.value = false; }, 3500);
          }
          if (hits === pages.length) {
            // Ocultar barra de progreso si todas las páginas fueron resueltas por caché
            isProcessingChapter.value = false;
            await nextTick();
            return;
          }
        }
      } catch (err) {
        console.warn('[CACHE] Error checking cache:', err);
      }
    }

    await nextTick();

    runDetectionChain();
    runTranslationChain();
  };

  const updateProcessingStatus = () => {
    isProcessingChapter.value = isDetectingChapter.value || isTranslatingChapter.value;
  };

  /**
   * Guarda el progreso de traducción acumulado hasta el momento de forma progresiva.
   */
  const saveCurrentProgress = async () => {
    const fileHash = lastUploadedFile.value?.hash;
    const fileType = lastUploadedFile.value?.type;
    if (fileHash && (fileType === 'pdf' || fileType === 'zip')) {
      const successfulPages = Array.from(pageCache.value.entries())
        .filter(([_, page]) => page.translationStatus === 'success' && !page.hasError)
        .map(([index, page]) => ({
          pageIndex: index,
          translations: page.translations,
          contexto: page.contexto,
        }));

      if (successfulPages.length > 0) {
        try {
          await saveCache({
            fileHash,
            fileType,
            pages: successfulPages,
          });
          console.log('[CACHE] Progressively saved translation results for chapter:', fileHash);
        } catch (saveErr) {
          console.warn('[CACHE] Error saving progressive cache for chapter:', saveErr);
        }
      }
    }
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

        if (cached.detectionStatus === 'success') continue;

        cached.detectionStatus = 'loading';

        try {
          console.log('[PIPELINE] Detecting page', i + 1);
          const result = await detectPage(chapterPages.value[i]);
          if (chapterProcessingAborted) break;

          cached.boxes = result.boxes;
          cached.croppedBubbles = result.croppedBubbles;
          cached.detectionStatus = 'success';
          console.log('[PIPELINE] Page', i + 1, 'detection complete, boxes:', result.boxes.length);

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

        if (cached.translationStatus === 'success') continue;
        if (cached.translationStatus === 'error') continue;

        if (cached.detectionStatus !== 'success') {
          if (cached.detectionStatus === 'error') continue;
          break; // Esperar a que la detección avance
        }

        let prevContext = '';
        if (i > 0) {
          const prevPage = pageCache.value.get(i - 1);
          if (!prevPage || prevPage.translationStatus !== 'success') {
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

          // Guardar el progreso después de procesar exitosamente cada página
          await saveCurrentProgress();
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
          continue;
        }
      }
    } finally {
      isTranslatingChapter.value = false;
      updateProcessingStatus();
      // Asegurar el guardado al final en el bloque finally
      await saveCurrentProgress();
    }
  };

  const triggerTranslationStep = () => {
    if (!chapterProcessingAborted) {
      runTranslationChain();
    }
  };

  const handleRetry = async (pageIdx?: number) => {
    const idx = pageIdx ?? currentPageIndex.value;
    console.log('[RETRY] Retrying page', idx + 1);

    const cached = pageCache.value.get(idx);
    if (!cached) return;

    if (idx === currentPageIndex.value) {
      errorMessage.value = null;
    }

    if (!isChapterMode.value) {
      handleSingleImage(chapterPages.value[0]);
      return;
    }

    if (cached.detectionStatus === 'error' || !cached.boxes || cached.boxes.length === 0) {
      cached.detectionStatus = 'idle';
      cached.translationStatus = 'idle';
      cached.hasError = false;
      isProcessingChapter.value = true;
      runDetectionChain();
      runTranslationChain();
    } else {
      cached.translationStatus = 'idle';
      cached.hasError = false;
      isProcessingChapter.value = true;
      runTranslationChain();
    }
  };

  const goToPage = (pageNumber: number) => {
    const idx = pageNumber - 1;
    if (idx < 0 || idx >= chapterPages.value.length) return;

    currentPageIndex.value = idx;

    const cached = pageCache.value.get(idx);
    if (cached && cached.hasError) {
      errorMessage.value = cached.errorMessage || 'Error desconocido';
    } else {
      errorMessage.value = null;
    }
  };

  onUnmounted(() => {
    stopLoadingTimer();
    chapterProcessingAborted = true;
  });

  return {
    isLoading,
    errorMessage,
    loadingElapsedSeconds,
    loadingMessage,
    chapterPages,
    currentPageIndex,
    isProcessingChapter,
    pageCache,
    
    isChapterMode,
    isTimeoutError,
    currentImageData,
    currentTranslations,
    isCurrentPageLoading,
    processedPagesCount,
    hasLoadedContent,
    
    handleSingleImage,
    handleChapterLoaded,
    handleFileHashed,
    resetChapter,
    handleRetry,
    goToPage,
    cacheHitCount,
    showCacheToast
  };
}
