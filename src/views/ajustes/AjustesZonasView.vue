<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-2xl">
    <div v-if="empresa">
      <ZonasCard :empresa="empresa" :can-manage="canManage" />
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
import { useSessionStore } from '../../stores/sessionStore';
import ZonasCard from '../../components/empresa/ZonasCard.vue';

const route = useRoute();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);
</script>
