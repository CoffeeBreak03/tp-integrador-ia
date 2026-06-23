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
               />
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
  isDark.value = localStorage.getItem('theme') === 'dark' || 
                 (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  applyDark(isDark.value);
});

// --- Pipeline ---
const processor = useChapterProcessor();
// Compartimos todo el estado del pipeline para que MangaReader lo consuma sin prop drilling
provide('chapterProcessor', processor);

const { hasLoadedContent, resetChapter, handleSingleImage, handleChapterLoaded } = processor;

// --- App State ---
const isReaderOpen = ref(false);
const loadedFileName = ref<string>('');

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
  isReaderOpen.value = false;
  loadedFileName.value = '';
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
