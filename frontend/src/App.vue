<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header class="space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">TP Integrador IA</p>
            <h1 class="text-3xl font-bold sm:text-4xl">Traductor de Manga</h1>
          </div>
          <div class="rounded-3xl bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-300">
            Frontend integrado con backend .netlify/functions/process
          </div>
        </div>
        <p class="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Carga una imagen o PDF, envíala al backend para OCR y traducción, luego visualiza las traducciones con posicionamiento normalizado.
        </p>
      </header>

      <main class="space-y-5">
        <section class="space-y-4">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
            <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300">
              <p class="font-semibold">Error al procesar la imagen:</p>
              <p class="mt-1">{{ errorMessage }}</p>
            </div>

            <div v-if="isLoading" class="mb-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <div class="flex items-center gap-2">
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-blue-600"></div>
                <p class="font-semibold">Procesando imagen...</p>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-x-2">
                <button
                  type="button"
                  @click="showOverlay = !showOverlay"
                  :disabled="isLoading"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ showOverlay ? 'Ocultar overlays' : 'Mostrar overlays' }}
                </button>
                <button
                  type="button"
                  @click="showTranslations = !showTranslations"
                  :disabled="isLoading"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ showTranslations ? 'Ocultar lista' : 'Mostrar lista' }}
                </button>
                <button
                  type="button"
                  @click="isFitToScreen = !isFitToScreen"
                  :disabled="isLoading"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ isFitToScreen ? 'Restaurar tamaño' : 'Ajustar tamaño' }}
                </button>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Imagen céntrica con overlay opcional. El panel derecho se desliza para mostrar las traducciones.
              </p>
            </div>

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
                      :imageData="imageData"
                      @update:imageData="(value) => imageData = value"
                    />

                    <OverlayRenderer
                      v-if="imageData"
                      :imageData="imageData"
                      :translations="translations"
                      :selectedItemId="selectedItemId"
                      :showOverlay="showOverlay"
                      :fitToScreen="isFitToScreen"
                    />
                  </div>

                  <div v-if="imageData" class="mt-4 flex justify-center">
                    <button
                      type="button"
                      @click="openExplorer"
                      :disabled="isLoading"
                      class="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                    >
                      Agregar otra imagen
                    </button>
                  </div>
                </div>

                <aside
                  ref="asidePanel"
                  class="pointer-events-none absolute right-0 top-0 h-full w-80 overflow-auto transition-transform duration-300"
                  :class="showTranslations ? 'pointer-events-auto translate-x-0' : 'translate-x-full'"
                >
                  <TranslationPanel v-if="translations.length" :translations="translations" @selectItem="highlightItem" />
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
import ImageUploader from '@/components/ImageUploader.vue';
import OverlayRenderer from '@/components/OverlayRenderer.vue';
import TranslationPanel from '@/components/TranslationPanel.vue';
import { TranslationContract } from '@/lib/contract';
import { processImage } from '@/lib/api';

const imageUploader = ref<{ openExplorer: () => void } | null>(null);
const imageData = ref('');
const translations = ref<TranslationContract[]>([]);
const selectedItemId = ref<number | undefined>(undefined);
const showOverlay = ref(true);
const showTranslations = ref(false);
const isFitToScreen = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const centerContainer = ref<HTMLElement | null>(null);
const asidePanel = ref<HTMLElement | null>(null);
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

watch(imageData, async () => {
  await nextTick();
  recalcScale();
});

// Procesar imagen cuando se carga
watch(
  imageData,
  async (newImageData) => {
    if (!newImageData) {
      translations.value = [];
      selectedItemId.value = undefined;
      errorMessage.value = null;
      return;
    }

    translations.value = [];
    selectedItemId.value = undefined;
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const result = await processImage(newImageData);
      translations.value = result || [];
    } catch (error) {
      errorMessage.value = error instanceof Error 
        ? error.message 
        : 'Error desconocido al procesar la imagen';
      translations.value = [];
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: false }
);

onMounted(() => {
  recalcScale();
  window.addEventListener('resize', recalcScale);
});

onUnmounted(() => window.removeEventListener('resize', recalcScale));

const highlightItem = (item: TranslationContract) => {
  selectedItemId.value = item.id;
};

const openExplorer = () => {
  imageUploader.value?.openExplorer();
};
</script>
