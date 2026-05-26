<template>
  <aside class="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/90">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Traducciones</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">Busca y selecciona bloques de texto.</p>
      </div>
      <span class="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">{{ translations.length }}</span>
    </div>

    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Buscar original o traducido"
        class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
      />
    </div>

    <div class="space-y-3">
      <button
        v-for="item in filteredTranslations"
        :key="item.id"
        @click="selectItem(item)"
        class="w-full rounded-3xl border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-slate-900/80"
      >
        <p class="font-semibold text-slate-900 dark:text-slate-100">{{ item.texto_traducido }}</p>
        <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">{{ item.texto_original }}</p>
        <p class="mt-2 text-right text-[11px] text-slate-500 dark:text-slate-500">ID {{ item.id }}</p>
      </button>
      <p v-if="filteredTranslations.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No se encontraron traducciones que coincidan con la búsqueda.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TranslationContract } from '@/lib/contract';

const props = defineProps<{
  translations: TranslationContract[];
}>();

const emit = defineEmits<{
  (e: 'selectItem', item: TranslationContract): void;
}>();

const searchQuery = ref('');

const filteredTranslations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return props.translations;
  }
  return props.translations.filter((item) =>
    item.texto_original.toLowerCase().includes(query) ||
    item.texto_traducido.toLowerCase().includes(query)
  );
});

const selectItem = (item: TranslationContract) => {
  emit('selectItem', item);
};
</script>
