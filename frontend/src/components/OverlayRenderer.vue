<template>
  <div class="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/80">
    <div class="relative min-h-[320px] w-full bg-slate-100 dark:bg-slate-900">
      <div v-if="!imageData" class="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Carga una imagen o PDF para ver las capas de traducción superpuestas.
      </div>

      <div v-else class="flex justify-center">
        <div
          ref="wrapperRef"
          class="relative inline-block overflow-visible"
          :class="props.fitToScreen ? 'max-h-[calc(100vh-180px)] max-w-full' : 'w-full'"
          :style="wrapperStyle"
        >
          <img
            ref="imgRef"
            :src="imageData"
            alt="Documento cargado"
            @load="onImageLoad"
            :class="imageClass"
          />

          <!-- Spinner de carga centrado sobre la imagen -->
          <div
            v-if="isLoading && translations.length === 0"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm"
          >
            <div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
            <p class="mt-3 text-sm font-medium text-white">Procesando página...</p>
          </div>

          <template v-if="showOverlay">
            <div
              v-for="item in translations"
              :key="item.id"
              :style="styleFromBox(item.box)"
              class="absolute rounded-xl border-2 bg-white/80 p-2 text-[11px] leading-tight shadow-md backdrop-blur dark:bg-slate-950/80"
              :class="{
                'border-blue-500 ring-2 ring-blue-400/40': item.id === selectedItemId,
                'border-transparent': item.id !== selectedItemId,
              }"
            >
              <p class="font-semibold text-slate-900 dark:text-slate-100">{{ item.texto_traducido }}</p>
              <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">{{ item.texto_original }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { TranslationContract } from '@/lib/contract';

const props = defineProps<{
  imageData: string;
  translations: TranslationContract[];
  selectedItemId?: number;
  showOverlay: boolean;
  fitToScreen?: boolean;
  isLoading?: boolean;
}>();

const imgRef = ref<HTMLImageElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const wrapperStyle = ref<Record<string, string>>({});
const imageAspectRatio = ref(16 / 9);
const imageClass = computed(() => {
  return props.fitToScreen
    ? 'block max-h-full w-auto max-w-full object-contain'
    : 'block w-full h-auto object-contain';
});

const updateWrapperSize = async () => {
  const img = imgRef.value;
  const wrapper = wrapperRef.value;
  if (!img || !wrapper) return;
  if (!props.fitToScreen) {
    wrapperStyle.value = {};
    return;
  }

  // Remove any previously locked pixel dimensions so the image
  // can size itself according to CSS (max-height / aspect ratio).
  // This prevents measuring a size that was already constrained by
  // an earlier wrapperStyle and avoids accumulating shrinkage.
  wrapperStyle.value = {};

  // Wait for DOM to update so the image can reflow with the cleared styles.
  await nextTick();

  const rect = img.getBoundingClientRect();
  wrapperStyle.value = {
    width: `${Math.round(rect.width)}px`,
    height: `${Math.round(rect.height)}px`,
  };
};

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img.naturalWidth && img.naturalHeight) {
    imageAspectRatio.value = img.naturalWidth / img.naturalHeight;
  }
  nextTick(updateWrapperSize);
};

const handleResize = () => {
  if (props.fitToScreen) updateWrapperSize();
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

watch(() => props.fitToScreen, async () => {
  await nextTick();
  updateWrapperSize();
});

watch(() => props.imageData, async () => {
  await nextTick();
  updateWrapperSize();
});

const styleFromBox = (box: [number, number, number, number]) => {
  const [ymin, xmin, ymax, xmax] = box;
  return {
    top: `${ymin / 10}%`,
    left: `${xmin / 10}%`,
    width: `${(xmax - xmin) / 10}%`,
    height: `${(ymax - ymin) / 10}%`,
    position: 'absolute',
    overflow: 'hidden',
  } as const;
};
</script>
