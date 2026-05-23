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

      <main class="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <section class="space-y-4">
          <ImageUploader @update:imageData="(value) => imageData = value" />
          <OverlayRenderer :imageData="imageData" :translations="translations" :selectedItemId="selectedItemId" />
        </section>

        <TranslationPanel v-if="translations.length" :translations="translations" @selectItem="highlightItem" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ImageUploader from '@/components/ImageUploader.vue';
import OverlayRenderer from '@/components/OverlayRenderer.vue';
import TranslationPanel from '@/components/TranslationPanel.vue';
import { TranslationContract, validateContract } from '@/lib/contract';

const imageData = ref('');
const translations = ref<TranslationContract[]>([]);
const selectedItemId = ref<number | undefined>(undefined);

const highlightItem = (item: TranslationContract) => {
  selectedItemId.value = item.id;
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
