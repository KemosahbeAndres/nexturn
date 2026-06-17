<template>
  <div class="max-w-2xl">
    <div v-if="empresa">
      <EmpresaInfoCard :empresa="empresa" />
    </div>
    <div v-else class="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-500">
      Cargando organización…
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../../stores/empresaStore';
import EmpresaInfoCard from '../../components/empresa/EmpresaInfoCard.vue';

const route = useRoute();
const empresaStore = useEmpresaStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);
</script>
