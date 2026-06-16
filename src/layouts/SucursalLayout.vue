<template>
  <div class="flex h-[100dvh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

    <!-- ===================== SIDEBAR (md+) ===================== -->
    <aside class="hidden md:flex md:w-44 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0 transition-[width] duration-300">

      <!-- Datos de la sucursal -->
      <div class="p-3 lg:p-5 border-b border-gray-200 dark:border-gray-700">
        <router-link
          :to="{ name: 'empresa-home', params: { companySlug: $route.params.companySlug } }"
          class="flex items-center gap-1.5 text-[10px] lg:text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          Volver a la empresa
        </router-link>
        <p class="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
          {{ ubicacion?.name || 'Sucursal' }}
        </p>
        <p class="text-[10px] lg:text-xs text-blue-600 dark:text-blue-400 truncate leading-tight mt-0.5 capitalize">
          {{ ubicacion?.category }}
        </p>
      </div>

      <!-- Navegación principal -->
      <nav class="flex-1 px-2 lg:px-3 py-3 lg:py-4 space-y-0.5 lg:space-y-1 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.routeName"
          :to="{ name: item.routeName, params: { companySlug: $route.params.companySlug, ubicacionSlug: $route.params.ubicacionSlug } }"
          class="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors"
          :class="isMenuItemActive(item.routeName)
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'"
        >
          <component :is="item.icon" class="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Menú secundario (pie) -->
      <div class="p-2 lg:p-3 border-t border-gray-200 dark:border-gray-700 space-y-0.5 shrink-0">
        <router-link
          :to="{ name: 'empresa-perfil', params: { companySlug: $route.params.companySlug } }"
          class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          Mi perfil
        </router-link>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- ===================== ÁREA PRINCIPAL ===================== -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- TOPBAR (solo móvil) -->
      <header class="md:hidden shrink-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 gap-2 transition-colors duration-300">
        <router-link
          :to="{ name: 'empresa-home', params: { companySlug: $route.params.companySlug } }"
          class="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        </router-link>
        <span class="flex-1 text-base font-semibold text-gray-800 dark:text-white truncate">{{ currentPageTitle }}</span>
      </header>

      <!-- CONTENIDO -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <router-view />
      </main>
    </div>

    <!-- BOTTOMBAR (solo móvil) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-1 transition-colors duration-300">
      <router-link
        v-for="item in menuItems"
        :key="item.routeName"
        :to="{ name: item.routeName, params: { companySlug: $route.params.companySlug, ubicacionSlug: $route.params.ubicacionSlug } }"
        class="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0"
        :class="isMenuItemActive(item.routeName) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'"
      >
        <component :is="item.icon" class="w-6 h-6 shrink-0" />
        <span class="text-[10px] font-medium truncate">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useUbicacionStore } from '../stores/ubicacionStore';
import { useEmpresaStore } from '../stores/empresaStore';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();
const ubicacionStore = useUbicacionStore();
const empresaStore = useEmpresaStore();

const IconDashboard  = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) });
const IconTurnos     = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' })]) });
const IconMiEquipo   = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' })]) });
const IconSolicitudes = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12h3.75M9 15h3.75M9 18h3.75m3-15H6a2.25 2.25 0 0 0-2.25 2.25v15A2.25 2.25 0 0 0 6 21.75h12a2.25 2.25 0 0 0 2.25-2.25V8.25L15.75 3Z' })]) });

interface MenuItem { name: string; routeName: string; icon: any }

const MI_EQUIPO_ROUTES = [
  'sucursal-mi-equipo',
  'sucursal-mi-equipo-personal',
  'sucursal-mi-equipo-habilidades',
  'sucursal-mi-equipo-disponibilidad',
  'sucursal-mi-equipo-excepciones',
  'sucursal-mi-equipo-reglas',
];

const isMiEquipoActive = computed(() => MI_EQUIPO_ROUTES.includes(route.name as string));
const isMenuItemActive = (routeName: string) =>
  routeName === 'sucursal-mi-equipo' ? isMiEquipoActive.value : route.name === routeName;

const menuItems = computed((): MenuItem[] => [
  { name: 'Dashboard',   routeName: 'sucursal-dashboard',   icon: IconDashboard },
  { name: 'Turnos',      routeName: 'sucursal-turnos',      icon: IconTurnos },
  { name: 'Mi Equipo',   routeName: 'sucursal-mi-equipo',   icon: IconMiEquipo },
  { name: 'Solicitudes', routeName: 'sucursal-solicitudes', icon: IconSolicitudes },
]);

const currentPageTitle = computed(() => {
  if (isMiEquipoActive.value) return 'Mi Equipo';
  return menuItems.value.find(item => item.routeName === route.name)?.name || ubicacion.value?.name || 'Sucursal';
});

const activeCompanyId = computed(() => {
  if (sessionStore.userRole !== 'super_admin') return sessionStore.activeCompanyId;
  const slug = route.params.companySlug as string;
  return empresaStore.empresas?.find(e => e.slug === slug)?.id ?? null;
});

const ubicacion = computed(() =>
  ubicacionStore.ubicaciones?.find(u => u.slug === route.params.ubicacionSlug)
);

onMounted(() => {
  if (!empresaStore.empresas || empresaStore.empresas.length === 0) {
    empresaStore.listarEmpresas(
      sessionStore.userRole,
      sessionStore.userRole === 'super_admin' ? null : sessionStore.currentUser?.empresa_id
    );
  }
  if (activeCompanyId.value) {
    ubicacionStore.listarUbicaciones(activeCompanyId.value);
  }
});

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>
