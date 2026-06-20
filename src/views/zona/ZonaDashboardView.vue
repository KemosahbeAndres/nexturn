<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">{{ zona?.name || 'Zona' }}</h3>
      <p class="text-xs text-gray-500 dark:text-gray-400">Vista de zona — en construcción.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useZonaStore } from '../../stores/zonaStore';

const route = useRoute();
const zonaStore = useZonaStore();

const zona = computed(() =>
  zonaStore.resolverZonaSlug(route.params.zonaSlug as string)
);
</script>
