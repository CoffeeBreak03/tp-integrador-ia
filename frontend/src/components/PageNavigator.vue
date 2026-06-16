<template>
  <nav
    id="page-navigator"
    class="flex items-center justify-center gap-3"
  >
    <!-- Botón Anterior -->
    <button
      id="btn-prev-page"
      type="button"
      :disabled="currentPage <= 1"
      @click="goTo(currentPage - 1)"
      class="flex h-10 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
      aria-label="Página anterior"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="hidden sm:inline">Anterior</span>
    </button>

    <!-- Indicador de página -->
    <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span>Página</span>
      <span class="font-bold text-blue-600 dark:text-blue-400">{{ currentPage }}</span>
      <span>/</span>
      <span>{{ totalPages }}</span>

      <!-- Indicador de procesamiento -->
      <div
        v-if="isCurrentPageLoading"
        class="ml-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"
        title="Procesando esta página..."
      ></div>

      <!-- Indicador de progreso general del capítulo -->
      <div
        v-else-if="processedPages < totalPages"
        class="ml-1 text-xs text-slate-500 dark:text-slate-400"
        :title="`${processedPages} de ${totalPages} páginas procesadas`"
      >
        ({{ processedPages }}/{{ totalPages }})
      </div>
    </div>

    <!-- Botón Siguiente -->
    <button
      id="btn-next-page"
      type="button"
      :disabled="currentPage >= totalPages"
      @click="goTo(currentPage + 1)"
      class="flex h-10 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400"
      aria-label="Página siguiente"
    >
      <span class="hidden sm:inline">Siguiente</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number;
  totalPages: number;
  isCurrentPageLoading: boolean;
  processedPages: number;
}>();

const emit = defineEmits<{
  (e: 'goToPage', page: number): void;
}>();

const goTo = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('goToPage', page);
  }
};
</script>
