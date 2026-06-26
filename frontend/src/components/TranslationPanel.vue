<template>
  <aside :class="flat ? 'flex h-full flex-col' : 'rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/90'">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t('panel.translations') }}</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">{{ t('panel.subtitle') }}</p>
      </div>
      <span class="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">{{ totalTranslations }}</span>
    </div>

    <div class="mb-4 shrink-0">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('panel.searchPlaceholder')"
        class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
      />
    </div>

    <div class="flex-1 space-y-4 overflow-y-auto pr-1">
      <div v-for="group in filteredGroups" :key="group.pageIndex" class="space-y-3">
        <h3 v-if="pageGroups.length > 1" class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {{ group.title }}
        </h3>
        <button
          v-for="item in group.translations"
          :key="item.id"
          :id="'translation-item-' + group.pageIndex + '-' + item.id"
          @click="selectItem(group.pageIndex, item)"
          @mouseenter="emit('hoverItem', group.pageIndex + '-' + item.id)"
          @mouseleave="emit('hoverItem', undefined)"
          class="w-full rounded-3xl border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-slate-900/80"
          :class="{
            'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20': group.pageIndex + '-' + item.id === selectedItemId,
            'border-slate-200 dark:border-slate-800': group.pageIndex + '-' + item.id !== selectedItemId
          }"
        >
          <p class="font-semibold text-slate-900 dark:text-slate-100">{{ item.texto_traducido }}</p>
          <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">{{ item.texto_original }}</p>
          <p class="mt-2 text-right text-[11px] text-slate-500 dark:text-slate-500">ID {{ item.id }}</p>
        </button>
      </div>
      <p v-if="totalTranslations === 0 || filteredGroups.every(g => g.translations.length === 0)" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {{ t('panel.noTranslations') }}
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import type { TranslationContract } from '@/lib/contract';

const { t } = inject<any>('i18n');

const props = defineProps<{
  pageGroups: { pageIndex: number; title: string; translations: TranslationContract[] }[];
  selectedItemId?: string;
  hoveredItemId?: string;
  flat?: boolean;
}>();

const emit = defineEmits<{
  (e: 'selectItem', payload: { pageIndex: number; item: TranslationContract }): void;
  (e: 'hoverItem', id: string | undefined): void;
}>();

const searchQuery = ref('');

const totalTranslations = computed(() => {
  return props.pageGroups.reduce((acc, group) => acc + group.translations.length, 0);
});

const filteredGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return props.pageGroups;
  }
  return props.pageGroups.map(group => ({
    ...group,
    translations: group.translations.filter((item) =>
      item.texto_original.toLowerCase().includes(query) ||
      item.texto_traducido.toLowerCase().includes(query)
    )
  })).filter(group => group.translations.length > 0);
});

const selectItem = (pageIndex: number, item: TranslationContract) => {
  emit('selectItem', { pageIndex, item });
};
</script>
