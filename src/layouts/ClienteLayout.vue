<template>
  <AppShell
    :nav-items="menuItems"
    :route-params="{ clienteSlug: String($route.params.clienteSlug) }"
    :context-label="contextLabel"
    :page-title="currentPageTitle"
    perfil-route-name="cliente-perfil"
    :perfil-route-params="{ clienteSlug: String($route.params.clienteSlug) }"
    :is-active="isMenuItemActive"
    @logout="handleLogout"
  >
    <template #sidebar-top>
      <router-link
        v-if="sessionStore.userRole === 'super_admin'"
        to="/dashboard"
        class="flex items-center gap-1.5 text-[10px] lg:text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
        Panel Admin
      </router-link>
    </template>

    <template #topbar-left>
      <router-link
        v-if="sessionStore.userRole === 'super_admin'"
        to="/dashboard"
        class="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
        Admin
      </router-link>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import AppShell from './AppShell.vue';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();

// ---- Iconos ----
const IconEmpresas = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' })]) });

interface MenuItem { name: string; routeName: string; icon: any }

const isMenuItemActive = (routeName: string) => route.name === routeName;

const menuItems = computed((): MenuItem[] => [
  { name: 'Mis Empresas', routeName: 'cliente-empresas', icon: IconEmpresas },
]);

const contextLabel = computed(() => {
  const cliente = sessionStore.currentUser?.cliente;
  return cliente?.nombre || cliente?.slug || 'Mi Cuenta';
});

const currentPageTitle = computed(() =>
  menuItems.value.find(item => item.routeName === route.name)?.name || 'Mis Empresas'
);

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>
