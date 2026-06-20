<template>
  <AppShell
    :nav-items="menuItems"
    :route-params="{ companySlug: String($route.params.companySlug), zonaSlug: String($route.params.zonaSlug) }"
    :context-label="zona?.name || 'Zona'"
    :page-title="currentPageTitle"
    perfil-route-name="empresa-perfil"
    :perfil-route-params="{ companySlug: String($route.params.companySlug) }"
    :is-active="isMenuItemActive"
    @logout="handleLogout"
  >
    <template #sidebar-top>
      <router-link
        :to="{ name: 'empresa-home', params: { companySlug: $route.params.companySlug } }"
        class="flex items-center gap-1.5 text-[10px] lg:text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        Volver a la empresa
      </router-link>
    </template>

    <template #topbar-left>
      <router-link
        :to="{ name: 'empresa-home', params: { companySlug: $route.params.companySlug } }"
        class="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
      </router-link>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useZonaStore } from '../stores/zonaStore';
import { useEmpresaStore } from '../stores/empresaStore';
import AppShell from './AppShell.vue';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();
const zonaStore = useZonaStore();
const empresaStore = useEmpresaStore();

// ---- Iconos ----
const IconDashboard = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) });

interface MenuItem { name: string; routeName: string; icon: any }

const isMenuItemActive = (routeName: string) => route.name === routeName;

const menuItems = computed((): MenuItem[] => [
  { name: 'Dashboard', routeName: 'zona-dashboard', icon: IconDashboard },
]);

const zona = computed(() =>
  zonaStore.resolverZonaSlug(route.params.zonaSlug as string)
);

const currentPageTitle = computed(() =>
  menuItems.value.find(item => item.routeName === route.name)?.name || zona.value?.name || 'Zona'
);

onMounted(() => {
  if (!empresaStore.empresas || empresaStore.empresas.length === 0) {
    empresaStore.listarEmpresas(
      sessionStore.userRole,
      sessionStore.userRole === 'super_admin' ? null : sessionStore.currentUser?.empresa_id
    );
  }
});

watchEffect(() => {
  const companySlug = route.params.companySlug as string;
  const zonaSlug = route.params.zonaSlug as string;

  let companyId: string | null = null;
  if (sessionStore.userRole !== 'super_admin') {
    companyId = sessionStore.currentUser?.empresa_id ?? null;
  } else if (empresaStore.empresas) {
    companyId = empresaStore.empresas.find(e => e.slug === companySlug)?.id ?? null;
  }

  if (companyId) {
    sessionStore.activeCompanyId = companyId;
    zonaStore.listarZonas(companyId);
  }

  if (zonaSlug && zonaStore.zonas) {
    const found = zonaStore.resolverZonaSlug(zonaSlug);
    sessionStore.activeZonaId = found?.id ?? null;
  }
});

onUnmounted(() => {
  sessionStore.activeZonaId = null;
});

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>
