<template>
  <div v-if="empresa" class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
    <EmpresaInfoCard :empresa="empresa" />

    <div class="flex flex-col gap-6">
      <WorkRolesCard :empresa="empresa" :can-manage="canManage" />
      <ZonasCard v-if="empresa.isEmpresa" :empresa="empresa" :can-manage="canManage" />
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
    Cargando organización…
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../stores/empresaStore';
import { useSessionStore } from '../stores/sessionStore';
import EmpresaInfoCard from '../components/empresa/EmpresaInfoCard.vue';
import WorkRolesCard   from '../components/empresa/WorkRolesCard.vue';
import ZonasCard       from '../components/empresa/ZonasCard.vue';

const route        = useRoute();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);
</script>
