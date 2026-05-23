<template>
  <div class="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-950/80 dark:shadow-none">
    <label class="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">Carga de imagen o PDF</label>
    <div class="flex flex-col gap-3">
      <input
        ref="fileInput"
        type="file"
        accept="image/*,application/pdf"
        @change="handleFileUpload"
        class="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
      />

      <div class="space-y-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <p class="font-medium text-slate-800 dark:text-slate-100">Estado</p>
        <p>{{ statusMessage }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">Solo se procesa la primera página de PDF y las imágenes se renderizan como base64 en canvas.</p>
      </div>

      <div v-if="errorMessage" class="rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
        <p class="font-semibold">Error</p>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type FileType = 'image' | 'pdf' | 'empty';

const fileInput = ref<HTMLInputElement | null>(null);
const errorMessage = ref('');
const statusMessage = ref('Selecciona un archivo JPG, PNG o PDF para comenzar.');
const currentFileType = ref<FileType>('empty');

const emit = defineEmits<{
  (e: 'update:imageData', value: string): void;
}>();

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

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  errorMessage.value = '';
  statusMessage.value = 'Procesando archivo...';

  try {
    if (file.type.startsWith('image/')) {
      currentFileType.value = 'image';
      const imageData = await buildImageDataUrl(file);
      emit('update:imageData', imageData);
      statusMessage.value = 'Imagen cargada correctamente. Puedes ver el overlay de traducción.';
    } else if (file.type === 'application/pdf') {
      currentFileType.value = 'pdf';
      const imageData = await handlePdfFile(file);
      emit('update:imageData', imageData);
      statusMessage.value = 'PDF convertido a canvas y cargado. Primera página visible.';
    } else {
      throw new Error('Formato no compatible. Usa JPG, PNG o PDF.');
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Error inesperado.';
    statusMessage.value = 'No se pudo cargar el archivo.';
  }
};
</script>
