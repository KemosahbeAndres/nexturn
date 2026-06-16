<template>
  <div class="flex h-[100dvh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

    <!-- ===================== SIDEBAR (md+) ===================== -->
    <aside class="hidden md:flex md:w-44 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0 transition-[width] duration-300">

      <!-- Datos de usuario -->
      <div class="p-3 lg:p-5 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 lg:gap-3 mb-2">
          <div class="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-300">
              <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {{ sessionStore.currentUser?.contacto?.first_name || 'Usuario' }}
              {{ sessionStore.currentUser?.contacto?.last_name || '' }}
            </p>
            <p class="text-[10px] lg:text-xs text-blue-600 dark:text-blue-400 truncate leading-tight mt-0.5">
              {{ roleLabel }}
            </p>
          </div>
        </div>
        <p class="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ sessionStore.currentUser?.contacto?.email || '' }}
        </p>
        <p class="text-[10px] lg:text-xs font-medium text-gray-700 dark:text-gray-300 truncate mt-0.5">
          {{ activeCompany }}
        </p>
      </div>

      <!-- Navegación principal -->
      <nav class="flex-1 px-2 lg:px-3 py-3 lg:py-4 space-y-0.5 lg:space-y-1 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.routeName"
          :to="{ name: item.routeName, params: { companySlug: $route.params.companySlug } }"
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
        <!-- Panel Admin (solo super_admin) -->
        <router-link
          v-if="sessionStore.userRole === 'super_admin'"
          to="/dashboard"
          class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
          Panel Admin
        </router-link>

        <!-- Perfil -->
        <router-link
          :to="{ name: 'empresa-perfil', params: { companySlug: $route.params.companySlug } }"
          class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors"
          :class="route.name === 'empresa-perfil'
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          Mi perfil
        </router-link>

        <!-- Apariencia (toggle) -->
        <button
          @click="sessionStore.toggleTheme()"
          class="w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 min-w-0">
            <svg v-if="!sessionStore.isDarkMode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-amber-500"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-blue-400"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" /></svg>
            <span class="truncate hidden lg:inline">{{ sessionStore.isDarkMode ? 'Modo oscuro' : 'Modo claro' }}</span>
            <span class="lg:hidden">Tema</span>
          </div>
          <div class="relative w-8 lg:w-10 h-4 lg:h-5 rounded-full transition-colors duration-300 shrink-0" :class="sessionStore.isDarkMode ? 'bg-blue-500' : 'bg-gray-300'">
            <span class="absolute top-0.5 left-0.5 w-3 lg:w-4 h-3 lg:h-4 bg-white rounded-full shadow transition-transform duration-300" :class="sessionStore.isDarkMode ? 'translate-x-4 lg:translate-x-5' : 'translate-x-0'"></span>
          </div>
        </button>

        <!-- Cerrar sesión -->
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
          v-if="sessionStore.userRole === 'super_admin'"
          to="/dashboard"
          class="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
          Admin
        </router-link>

        <span class="flex-1 text-base font-semibold text-gray-800 dark:text-white truncate">{{ currentPageTitle }}</span>

        <button @click="profileOpen = true" class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-600 dark:text-blue-300">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </button>
      </header>

      <!-- CONTENIDO -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <router-view />
      </main>
    </div>

    <!-- BOTTOMBAR (solo móvil) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-1 transition-colors duration-300">
      <router-link
        v-for="item in bottomItems"
        :key="item.routeName"
        :to="{ name: item.routeName, params: { companySlug: $route.params.companySlug } }"
        class="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0"
        :class="isMenuItemActive(item.routeName) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'"
      >
        <component :is="item.icon" class="w-6 h-6 shrink-0" />
        <span class="text-[10px] font-medium truncate">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- ===================== OFFCANVAS PERFIL (solo móvil) ===================== -->
    <Transition name="offcanvas">
      <div v-if="profileOpen" class="md:hidden fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="profileOpen = false" />
        <div class="relative w-80 max-w-[90vw] h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <span class="text-base font-semibold text-gray-900 dark:text-white">Mi perfil</span>
            <button @click="profileOpen = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <PerfilView />
          </div>
          <div class="shrink-0 p-4 border-t border-gray-100 dark:border-gray-700">
            <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h, onMounted, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useEmpresaStore } from '../stores/empresaStore';
import PerfilView from '../views/PerfilView.vue';

const router = useRouter();
const route = useRoute();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();
const profileOpen = ref(false);

// ---- Iconos ----
const IconDashboard  = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' })]) });

const IconCalendario = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z' })]) });
const IconEmpresaConfig = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' })]) });
const IconUsuarios    = defineComponent({ render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.5', stroke: 'currentColor' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z' })]) });

interface MenuItem { name: string; routeName: string; icon: any }

const EMPRESA_CONFIG_ROUTES = [
  'empresa-ajustes',
  'empresa-ajustes-empresa',
  'empresa-ajustes-personal',
  'empresa-ajustes-turnos',
  'empresa-ajustes-excepciones',
  'empresa-ajustes-roles',
  'empresa-ajustes-estructura',
  'empresa-ajustes-habilidades',
];

const isActive = (routeName: string) => route.name === routeName;
const isAjustesActive = computed(() => EMPRESA_CONFIG_ROUTES.includes(route.name as string));
const isMenuItemActive = (routeName: string) =>
  routeName === 'empresa-ajustes' ? isAjustesActive.value : isActive(routeName);

const activeOrg = computed(() => {
  const slug = route.params.companySlug;
  return empresaStore.empresas?.find((e: any) => e.slug === slug);
});


const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    user: 'Usuario',
    visitor: 'Visitante',
  };
  return map[sessionStore.userRole || ''] || sessionStore.userRole || '';
});

const menuItems = computed((): MenuItem[] => [
  { name: 'Panel',      routeName: 'empresa-home',             icon: IconDashboard },
  { name: 'Empresa',    routeName: 'empresa-ajustes',          icon: IconEmpresaConfig },
  { name: 'Usuarios',   routeName: 'empresa-ajustes-usuarios', icon: IconUsuarios },
  { name: 'Calendario', routeName: 'empresa-calendario',       icon: IconCalendario },
]);

const bottomItems = computed((): MenuItem[] => [
  { name: 'Panel',      routeName: 'empresa-home',             icon: IconDashboard },
  { name: 'Empresa',    routeName: 'empresa-ajustes',          icon: IconEmpresaConfig },
  { name: 'Usuarios',   routeName: 'empresa-ajustes-usuarios', icon: IconUsuarios },
  { name: 'Calendario', routeName: 'empresa-calendario',       icon: IconCalendario },
]);

const activeCompany = computed(() => {
  if (sessionStore.userRole !== 'super_admin') {
    const emp = empresaStore.empresas?.find((e: any) => e.id === sessionStore.currentUser?.empresa_id);
    return emp?.contacto?.first_name || emp?.slug || 'Cargando...';
  }
  return activeOrg.value?.contacto?.first_name || route.params.companySlug;
});

const currentPageTitle = computed(() => {
  if (route.name === 'empresa-ajustes-usuarios') return 'Usuarios';
  if (isAjustesActive.value) return 'Empresa';
  if (route.name === 'empresa-perfil') return 'Mi perfil';
  const found = [...menuItems.value].find(item => item.routeName === route.name);
  return found?.name || (activeCompany.value as string);
});

watchEffect(() => {
  if (sessionStore.userRole !== 'super_admin') {
    sessionStore.activeCompanyId = sessionStore.currentUser?.empresa_id || null;
  } else {
    const slug = route.params.companySlug;
    if (slug && empresaStore.empresas) {
      const emp = empresaStore.empresas.find((e: any) => e.slug === slug);
      sessionStore.activeCompanyId = emp ? emp.id : null;
    }
  }
});

onMounted(() => {
  if (!empresaStore.empresas || empresaStore.empresas.length === 0) {
    empresaStore.listarEmpresas(
      sessionStore.userRole,
      sessionStore.userRole === 'super_admin' ? null : sessionStore.currentUser?.empresa_id
    );
  }
});

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.offcanvas-enter-active,
.offcanvas-leave-active {
  transition: opacity 0.25s ease;
}
.offcanvas-enter-active .relative,
.offcanvas-leave-active .relative {
  transition: transform 0.25s ease;
}
.offcanvas-enter-from,
.offcanvas-leave-to {
  opacity: 0;
}
.offcanvas-enter-from .relative {
  transform: translateX(100%);
}
.offcanvas-leave-to .relative {
  transform: translateX(100%);
}
</style>
