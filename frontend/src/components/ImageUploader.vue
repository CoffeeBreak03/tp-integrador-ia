<template>
  <div class="relative">
    <div v-if="!imageData" class="relative min-h-[320px] overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950/80">
        <div class="mx-auto flex max-w-xs flex-col items-center justify-center gap-4">
          <button
            type="button"
            @click="openExplorer"
            class="flex h-20 w-20 items-center justify-center rounded-full border border-slate-300 bg-white text-4xl font-bold text-slate-700 shadow transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
            aria-label="Agregar imagen"
          >
            +
          </button>
          <div>
            <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">Carga tu capítulo o imagen</p>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Soporta imágenes, PDFs multi-página y archivos ZIP con imágenes.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Máximo {{ MAX_PAGES }} páginas por capítulo.
            </p>
          </div>
        </div>
      </div>

    <input
      ref="fileInput"
      type="file"
      :accept="acceptTypes"
      :multiple="true"
      class="hidden"
      @change="handleFileUpload"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

const MAX_PAGES = 50;
const MAX_CANVAS_WIDTH = 1200;
const MAX_CANVAS_HEIGHT = 1600;

const props = defineProps<{ imageData: string }>();
const emit = defineEmits<{
  (e: 'update:imageData', value: string): void;
  (e: 'chapterLoaded', pages: string[]): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const acceptTypes = 'image/*,application/pdf,.zip,application/zip';

const buildImageDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('No se pudo leer el archivo como base64.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Error leyendo el archivo.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Extrae TODAS las páginas de un PDF como Data URLs (PNG).
 */
const handlePdfFile = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // @ts-ignore
  const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = (workerModule.default ?? workerModule) as string;

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = Math.min(pdf.numPages, MAX_PAGES);
  const pages: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(MAX_CANVAS_WIDTH / viewport.width, MAX_CANVAS_HEIGHT / viewport.height, 1);
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No se pudo obtener el contexto del canvas.');
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    pages.push(canvas.toDataURL('image/png'));
  }

  return pages;
};

/**
 * Extrae las imágenes de un archivo ZIP y las retorna como Data URLs.
 */
const handleZipFile = async (file: File): Promise<string[]> => {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);

  // Filtrar solo archivos de imagen y ordenar alfabéticamente
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'];
  const imageFiles = Object.keys(zip.files)
    .filter((name) => {
      const lowerName = name.toLowerCase();
      return !zip.files[name].dir && imageExtensions.some((ext) => lowerName.endsWith(ext));
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const limitedFiles = imageFiles.slice(0, MAX_PAGES);
  const pages: string[] = [];

  for (const fileName of limitedFiles) {
    const fileData = await zip.files[fileName].async('base64');
    const ext = fileName.toLowerCase().split('.').pop() || 'png';
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'webp' ? 'image/webp'
      : ext === 'bmp' ? 'image/bmp'
      : 'image/png';
    pages.push(`data:${mimeType};base64,${fileData}`);
  }

  return pages;
};

const openExplorer = () => {
  if (!fileInput.value) return;
  fileInput.value.value = '';
  fileInput.value.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  try {
    // Caso: un solo archivo
    if (files.length === 1) {
      const file = files[0];

      if (file.type === 'application/pdf') {
        // PDF multi-página
        const pages = await handlePdfFile(file);
        if (pages.length === 1) {
          // PDF de una sola página → comportamiento legacy
          emit('update:imageData', pages[0]);
        } else {
          emit('chapterLoaded', pages);
        }
        return;
      }

      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
        // Archivo ZIP con imágenes
        const pages = await handleZipFile(file);
        if (pages.length === 0) {
          throw new Error('No se encontraron imágenes en el archivo ZIP.');
        }
        if (pages.length === 1) {
          emit('update:imageData', pages[0]);
        } else {
          emit('chapterLoaded', pages);
        }
        return;
      }

      if (file.type.startsWith('image/')) {
        // Imagen individual
        const imageData = await buildImageDataUrl(file);
        emit('update:imageData', imageData);
        return;
      }

      throw new Error('Formato no compatible. Usa JPG, PNG, PDF o ZIP.');
    }

    // Caso: múltiples archivos de imagen
    const sortedFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (sortedFiles.length === 0) {
      throw new Error('No se seleccionaron archivos de imagen válidos.');
    }

    const limitedFiles = sortedFiles.slice(0, MAX_PAGES);
    const pages: string[] = [];
    for (const file of limitedFiles) {
      const dataUrl = await buildImageDataUrl(file);
      pages.push(dataUrl);
    }

    if (pages.length === 1) {
      emit('update:imageData', pages[0]);
    } else {
      emit('chapterLoaded', pages);
    }
  } catch (error) {
    console.warn(error);
  }
};

defineExpose({ openExplorer });
</script>
