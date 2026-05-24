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
            Frontend mock-driven con datos locales.
          </div>
        </div>
        <p class="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Carga una imagen o PDF, valida el contrato JSON local y visualiza las traducciones con posicionamiento normalizado.
        </p>
      </header>

      <main class="space-y-5">
        <section class="space-y-4">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-x-2">
                <button
                  type="button"
                  @click="showOverlay = !showOverlay"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ showOverlay ? 'Ocultar overlays' : 'Mostrar overlays' }}
                </button>
                <button
                  type="button"
                  @click="showTranslations = !showTranslations"
                  class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
                >
                  {{ showTranslations ? 'Ocultar lista' : 'Mostrar lista' }}
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
                    />
                  </div>

                  <div v-if="imageData" class="mt-4 flex justify-center">
                    <button
                      type="button"
                      @click="openExplorer"
                      class="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
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
import { TranslationContract, validateContract } from '@/lib/contract';

const imageUploader = ref<{ openExplorer: () => void } | null>(null);
const imageData = ref('');
const translations = ref<TranslationContract[]>([]);
const selectedItemId = ref<number | undefined>(undefined);
const showOverlay = ref(true);
const showTranslations = ref(false);

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
  const aside = asidePanel.value;
  if (!center) return;

  const parent = center.parentElement ?? center;
  const parentWidth = parent.getBoundingClientRect().width;
  const centerRect = center.getBoundingClientRect();
  const asideWidth = aside ? aside.getBoundingClientRect().width : 0;
  const available = parentWidth - (showTranslations.value ? asideWidth : 0);
  let s = available / centerRect.width;
  if (!isFinite(s) || s <= 0) s = 1;
  if (s > 1) s = 1;
  if (s < 0.5) s = 0.5;
  scale.value = s;
};

watch(showTranslations, async () => {
  await nextTick();
  recalcScale();
});

watch(imageData, async () => {
  await nextTick();
  recalcScale();
});

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

onMounted(async () => {
  try {
    const module = await import('./mock/mock-data.json');
    const mockData = module.default as unknown;
    if (validateContract(mockData)) {
      translations.value = mockData;
    } else {
      console.warn('mock-data.json no cumple el contrato de traducción');
    }
  } catch (error) {
    console.warn('No se pudo cargar mock-data.json', error);
  }
});
</script>
