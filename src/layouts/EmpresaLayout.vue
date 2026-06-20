<template>
  <AppShell
    :nav-items="menuItems"
    :bottom-items="bottomItems"
    :route-params="{ companySlug: String($route.params.companySlug) }"
    :context-label="activeCompany"
    :page-title="currentPageTitle"
    perfil-route-name="empresa-perfil"
    :perfil-route-params="{ companySlug: String($route.params.companySlug) }"
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
import { computed, defineComponent, h, onMounted, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useEmpresaStore } from '../stores/empresaStore';
import AppShell from './AppShell.vue';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();

// ---- Iconos ----
const IconDashboard   = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) });
const IconEmpresaConfig = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' })]) });
const IconUsuarios    = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' })]) });
const IconSucursales  = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) });
const IconCargos      = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6 6h.008v.008H6V6Z' })]) });

interface MenuItem { name: string; routeName: string; icon: any }

const isMenuItemActive = (routeName: string) => route.name === routeName;

const activeOrg = computed(() => {
  const slug = route.params.companySlug;
  return empresaStore.empresas?.find((e: any) => e.slug === slug);
});

const menuItems = computed((): MenuItem[] => [
  { name: 'Panel',        routeName: 'empresa-home',             icon: IconDashboard },
  { name: 'Empresa',      routeName: 'empresa-ajustes-empresa',  icon: IconEmpresaConfig },
  { name: 'Organización', routeName: 'empresa-organizacion',     icon: IconSucursales },
  { name: 'Usuarios',     routeName: 'empresa-ajustes-usuarios', icon: IconUsuarios },
  { name: 'Cargos',       routeName: 'empresa-ajustes-cargos',   icon: IconCargos },
]);

const bottomItems = computed((): MenuItem[] => [
  { name: 'Panel',        routeName: 'empresa-home',             icon: IconDashboard },
  { name: 'Organización', routeName: 'empresa-organizacion',     icon: IconSucursales },
  { name: 'Usuarios',     routeName: 'empresa-ajustes-usuarios', icon: IconUsuarios },
  { name: 'Cargos',       routeName: 'empresa-ajustes-cargos',   icon: IconCargos },
]);

const activeCompany = computed(() => {
  if (sessionStore.userRole !== 'super_admin') {
    const emp = empresaStore.empresas?.find((e: any) => e.id === sessionStore.currentUser?.empresa_id);
    return emp?.contacto?.first_name || emp?.slug || 'Cargando...';
  }
  return activeOrg.value?.contacto?.first_name || String(route.params.companySlug);
});

const currentPageTitle = computed(() => {
  if (route.name === 'empresa-perfil') return 'Mi perfil';
  return menuItems.value.find(item => item.routeName === route.name)?.name || String(activeCompany.value);
});

watchEffect(() => {
  if (sessionStore.userRole !== 'super_admin') {
    // Para client_user: usar empresa_id del usuario o activeCompanyId ya resuelto
    sessionStore.activeCompanyId =
      sessionStore.currentUser?.empresa_id ?? sessionStore.activeCompanyId ?? null;
  } else {
    const slug = route.params.companySlug;
    if (slug && empresaStore.empresas) {
      const emp = empresaStore.empresas.find((e: any) => e.slug === slug);
      sessionStore.activeCompanyId = emp ? emp.id : null;
    }
  }
});

onMounted(async () => {
  const role = sessionStore.userRole;

  // Redirigir si el usuario no tiene acceso al scope empresa (ej: gerente de sucursal)
  if (role !== 'super_admin') {
    const destino = await sessionStore.resolverHomeRoute();
    if (destino.name !== 'empresa-home') {
      router.replace(destino);
      return;
    }
  }

  const empresaId = sessionStore.currentUser?.empresa_id ?? sessionStore.activeCompanyId;
  if (!empresaStore.empresas || empresaStore.empresas.length === 0) {
    if (role === 'super_admin' || empresaId) {
      empresaStore.listarEmpresas(role, role === 'super_admin' ? null : empresaId);
    }
  }
});

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>
