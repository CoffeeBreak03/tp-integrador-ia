<template>
  <div :class="['relative overflow-hidden', flat ? 'h-full w-full flex items-center justify-center' : 'w-full rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/80']">
    <div :class="['relative', flat ? 'h-full w-full flex items-center justify-center' : 'w-full min-h-[320px] bg-slate-100 dark:bg-slate-900']">
      <div v-if="!imageData" class="flex h-full min-h-[320px] items-center justify-center p-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Carga una imagen o PDF para ver las capas de traducción superpuestas.
      </div>

      <div v-else class="flex justify-center" :class="[flat && fitMode === 'height' ? 'h-full' : 'w-full']">
        <div
          ref="wrapperRef"
          class="relative inline-block overflow-visible"
          :class="wrapperClass"
        >
          <img
            ref="imgRef"
            :src="imageData"
            alt="Documento cargado"
            loading="lazy"
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

          <!-- Icono de error para reintentar -->
          <div
            v-else-if="hasError"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-colors hover:bg-slate-900/50 cursor-pointer"
            @click.stop="$emit('retry')"
          >
            <div class="rounded-full bg-red-500/20 p-4 mb-3 text-red-500 ring-2 ring-red-500/50 backdrop-blur-md transition-transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </div>
            <p class="text-sm font-medium text-white drop-shadow-md">Error al procesar. Click para reintentar</p>
          </div>

          <!-- Overlay para container queries: tiene el mismo tamaño exacto que la imagen gracias a inset-0 -->
          <div class="absolute inset-0 z-10 pointer-events-none" style="container-type: inline-size;">
            <template v-if="showOverlay">
              <div
                v-for="item in translations"
                :key="item.id"
                :id="'translation-box-' + pageIndex + '-' + item.id"
                :style="{
                  ...styleFromBox(item.box),
                  fontSize: getBoxFontSize(item.box, item.texto_traducido),
                  fontFamily: fontFamily && fontFamily !== 'sans-serif' ? fontFamily : undefined,
                  backgroundColor: isBgCustomized ? `color-mix(in srgb, ${activeBgColor} ${Math.round((bgOpacity ?? 0.95) * 100)}%, transparent)` : undefined,
                  '--orig-w': `${(item.box[3] - item.box[1]) / 10}%`,
                  '--orig-h': `${(item.box[2] - item.box[0]) / 10}%`
                }"
                @click="$emit('selectBox', { pageIndex, item })"
                @mouseenter="$emit('hoverBox', pageIndex + '-' + item.id)"
                @mouseleave="$emit('hoverBox', undefined)"
                class="absolute rounded-lg border-2 p-1 leading-tight shadow-md cursor-pointer transition-all pointer-events-auto flex items-center justify-center text-center overflow-hidden break-words hyphens-auto"
                :class="{
                  'border-blue-500 ring-2 ring-blue-400/40 z-20 box-expand-active': pageIndex + '-' + item.id === selectedItemId,
                  'border-blue-400 ring-2 ring-blue-400/20 z-10 box-expand-active': pageIndex + '-' + item.id === hoveredItemId && pageIndex + '-' + item.id !== selectedItemId,
                  'border-transparent hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 hover:z-10': pageIndex + '-' + item.id !== selectedItemId && pageIndex + '-' + item.id !== hoveredItemId,
                  'bg-white/95 dark:bg-slate-950/95': !isBgCustomized
                }"
              >
                <p 
                  :style="{ color: textColor && textColor !== 'default' ? textColor : undefined }" 
                  class="font-semibold text-slate-900 dark:text-slate-100 m-0"
                  v-html="hyphenate(item.texto_traducido)"
                ></p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { TranslationContract } from '@/lib/contract';

const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 768);

const updateMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  window.addEventListener('resize', updateMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateMobile);
});

// Función para insertar guiones suaves (\u00AD) para un wrap inteligente
const hyphenate = (text: string | undefined) => {
  if (!text) return '';
  // Se inserta \u00AD heurísticamente
  return text.replace(/([aeiouáéíóú][nrsld]?)([bcdfghjklmnñpqrstvwxyz][aeiouáéíóú])/gi, '$1&shy;$2');
};

const props = defineProps<{
  pageIndex: number;
  imageData: string;
  translations: TranslationContract[];
  selectedItemId?: string;
  hoveredItemId?: string;
  showOverlay: boolean;
  fitToScreen?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  flat?: boolean;
  fitMode?: 'height' | 'width';
  fontFamily?: string;
  textColor?: string;
  bgColor?: string;
  bgOpacity?: number;
  fontSizeScale?: number;
}>();

const emit = defineEmits<{
  (e: 'selectBox', payload: { pageIndex: number; item: TranslationContract }): void;
  (e: 'hoverBox', id: string | undefined): void;
  (e: 'imageLoaded', payload: { aspectRatio: number }): void;
  (e: 'retry'): void;
}>();

const isDark = ref(typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true);
const activeBgColor = computed(() => {
  if (props.bgColor && props.bgColor !== 'default') {
    return props.bgColor;
  }
  return isDark.value ? '#020617' : '#ffffff';
});

const isBgCustomized = computed(() => {
  const hasCustomColor = props.bgColor && props.bgColor !== 'default';
  const hasCustomOpacity = props.bgOpacity !== undefined && props.bgOpacity !== 0.95;
  return hasCustomColor || hasCustomOpacity;
});

const imgRef = ref<HTMLImageElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const imageAspectRatio = ref(16 / 9);

const wrapperClass = computed(() => {
  if (props.flat) {
    // In flat mode the wrapper fills 100% of whichever axis is constrained.
    // We never set explicit pixel dimensions – the parent drives the size.
    return props.fitMode === 'width' ? 'w-full h-auto' : 'h-full w-auto';
  }
  return props.fitToScreen ? 'max-h-[calc(100vh-180px)] max-w-full' : 'w-full';
});

const imageClass = computed(() => {
  if (props.flat) {
    return props.fitMode === 'width'
      ? 'block w-full h-auto object-contain'
      : 'block h-full w-auto object-contain';
  }
  return props.fitToScreen
    ? 'block max-h-[calc(100vh-180px)] w-auto max-w-full object-contain'
    : 'block w-full h-auto object-contain';
});

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  let ar = 16 / 9;
  if (img.naturalWidth && img.naturalHeight) {
    ar = img.naturalWidth / img.naturalHeight;
    imageAspectRatio.value = ar;
  }
  emit('imageLoaded', { aspectRatio: ar });
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

const getBoxFontSize = (box: [number, number, number, number], text: string) => {
  const [ymin, xmin, ymax, xmax] = box;
  const w = (xmax - xmin) / 10; // % width
  const h = (ymax - ymin) / 10; // % height
  const ar = imageAspectRatio.value || 1;
  const h_in_w = h / ar;
  const area = w * h_in_w;
  const charCount = text.length || 1;
  
  // Calculate relative size in cqw (Container Query Width)
  const multiplier = isMobile.value ? 1.3 : 0.85;
  let fontSizeCqw = Math.sqrt(area / (charCount * 0.55)) * multiplier;
  
  // Clamp between a reasonable readable range:
  const minFont = isMobile.value ? 1.1 : 0.6;
  const maxFont = isMobile.value ? 2.5 : 1.4;
  fontSizeCqw = Math.max(minFont, Math.min(maxFont, fontSizeCqw));
  
  const scale = props.fontSizeScale ?? 1.0;
  return `${(fontSizeCqw * scale).toFixed(2)}cqw`;
};
</script>

<style scoped>
.box-expand-active {
  height: max-content !important;
  min-height: var(--orig-h);
  width: fit-content !important;
  min-width: var(--orig-w);
  max-width: calc(var(--orig-w) + 15%);
  /* Asegurar que el contenido no quede cortado al expandirse */
  overflow: visible !important;
}
</style>
