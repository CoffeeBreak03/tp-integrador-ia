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
            <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">Carga tu imagen o PDF</p>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Selecciona un archivo desde el explorador.
            </p>
          </div>
        </div>
      </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*,application/pdf"
      class="hidden"
      @change="handleFileUpload"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ imageData: string }>();
const emit = defineEmits<{
  (e: 'update:imageData', value: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

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

const handlePdfFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // @ts-ignore
  const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = (workerModule.default ?? workerModule) as string;

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const maxWidth = 1200;
  const maxHeight = 1600;
  const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height, 1);
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo obtener el contexto del canvas.');
  }

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
  return canvas.toDataURL('image/png');
};

const openExplorer = () => {
  if (!fileInput.value) return;
  fileInput.value.value = '';
  fileInput.value.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    let imageData = '';
    if (file.type.startsWith('image/')) {
      imageData = await buildImageDataUrl(file);
    } else if (file.type === 'application/pdf') {
      imageData = await handlePdfFile(file);
    } else {
      throw new Error('Formato no compatible. Usa JPG, PNG o PDF.');
    }

    emit('update:imageData', imageData);
  } catch (error) {
    console.warn(error);
  }
};

defineExpose({ openExplorer });
</script>
