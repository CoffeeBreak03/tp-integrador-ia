<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <!-- Dashboard / Landing -->
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
             
            <!-- Vista cuando hay un archivo cargado pero el visor está cerrado -->
            <div v-if="hasLoadedContent" class="flex flex-col items-center justify-center p-10 space-y-6">
               <p class="text-lg font-medium text-slate-600 dark:text-slate-400">Tienes un archivo procesándose o listo para leer.</p>
               <div class="flex flex-wrap justify-center gap-4">
                 <button @click="isReaderOpen = true" class="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-500 transition-colors">
                    Continuar leyendo
                 </button>
                 <button @click="onReset" class="rounded-full border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-200 transition-colors dark:border-slate-700 dark:hover:bg-slate-800">
                    Cargar otro archivo
                 </button>
               </div>
            </div>

            <!-- Upload Area (solo visible cuando no hay nada cargado) -->
            <div v-else class="relative mx-auto max-w-2xl">
               <ImageUploader
                 ref="imageUploader"
                 @update:imageData="onSingleImageUploaded"
                 @chapterLoaded="onChapterUploaded"
                 @fileHashed="handleFileHashed"
               />
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


          </div>
        </section>
      </main>
    </div>

    <!-- The Focus Mode Reader -->
    <Transition name="fade">
      <MangaReader
        v-if="hasLoadedContent && isReaderOpen"
        :fileName="loadedFileName"
        @close="isReaderOpen = false"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import ImageUploader from '@/components/ImageUploader.vue';
import MangaReader from '@/components/MangaReader.vue';
import { useChapterProcessor } from '@/composables/useChapterProcessor';

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
onMounted(() => {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyDark(saved === 'dark' || (!saved && prefersDark));
});

// --- Pipeline ---
const processor = useChapterProcessor();
// Compartimos todo el estado del pipeline para que MangaReader lo consuma sin prop drilling
provide('chapterProcessor', processor);

const { 
  hasLoadedContent, 
  resetChapter, 
  handleSingleImage, 
  handleChapterLoaded,
  handleFileHashed,
  isChapterMode,
  isProcessingChapter,
  processedPagesCount,
  chapterPages
} = processor;

// --- App State ---
const isReaderOpen = ref(false);
const loadedFileName = ref<string>('');
const imageUploader = ref<{ openExplorer: () => void } | null>(null);

const onSingleImageUploaded = (dataUrl: string) => {
  loadedFileName.value = 'Imagen individual';
  handleSingleImage(dataUrl);
  isReaderOpen.value = true;
};

const onChapterUploaded = (pages: string[]) => {
  loadedFileName.value = `Capítulo de ${pages.length} páginas`;
  handleChapterLoaded(pages);
  isReaderOpen.value = true;
};

const onReset = () => {
  resetChapter();
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
