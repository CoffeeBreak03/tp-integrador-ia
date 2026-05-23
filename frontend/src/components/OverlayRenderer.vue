<template>
  <div class="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/80">
    <div class="relative min-h-[320px] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      <div v-if="!imageData" class="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Carga una imagen o PDF para ver las capas de traducción superpuestas.
      </div>

      <div v-else class="relative h-full w-full">
        <img
          :src="imageData"
          alt="Documento cargado"
          @load="onImageLoad"
          class="h-full w-full object-contain"
        />

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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TranslationContract } from '@/lib/contract';

const props = defineProps<{
  imageData: string;
  translations: TranslationContract[];
  selectedItemId?: number;
}>();

const imageAspectRatio = ref(16 / 9);

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img.naturalWidth && img.naturalHeight) {
    imageAspectRatio.value = img.naturalWidth / img.naturalHeight;
  }
};

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
