<template>
  <div class="flex h-[100dvh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

    <!-- ===================== SIDEBAR (md+) ===================== -->
    <aside class="hidden md:flex md:w-44 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0 transition-[width] duration-300">

      <!-- Slot superior del sidebar (ej: botón volver) -->
      <div class="p-3 lg:p-5 border-b border-gray-200 dark:border-gray-700">
        <slot name="sidebar-top" />
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
          {{ contextLabel }}
        </p>
      </div>

      <!-- Navegación principal -->
      <nav class="flex-1 px-2 lg:px-3 py-3 lg:py-4 space-y-0.5 lg:space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.routeName"
          :to="{ name: item.routeName, params: routeParams }"
          class="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors"
          :class="isActive(item.routeName)
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'"
        >
          <component :is="item.icon" class="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Menú secundario (pie) -->
      <div class="p-2 lg:p-3 border-t border-gray-200 dark:border-gray-700 space-y-0.5 shrink-0">
        <slot name="sidebar-footer-top" />

        <router-link
          :to="{ name: perfilRouteName, params: perfilRouteParams }"
          class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors"
          :class="route.name === perfilRouteName
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          Mi perfil
        </router-link>

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

        <button
          @click="emit('logout')"
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
        <slot name="topbar-left" />
        <span class="flex-1 text-base font-semibold text-gray-800 dark:text-white truncate">{{ pageTitle }}</span>
        <button @click="profileOpen = true" class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-600 dark:text-blue-300">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </button>
      </header>

      <!-- HEADER FIJO -->
      <PageHeader
        :title="String(route.meta.title || pageTitle)"
        :subtitle="String(route.meta.subtitle || contextLabel)"
      />

      <!-- CONTENIDO -->
      <main class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <router-view />
      </main>
    </div>

    <!-- BOTTOMBAR (solo móvil) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-1 transition-colors duration-300">
      <router-link
        v-for="item in (bottomItems ?? navItems)"
        :key="item.routeName"
        :to="{ name: item.routeName, params: routeParams }"
        class="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0"
        :class="isActive(item.routeName) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'"
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
            <button @click="emit('logout'); profileOpen = false" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';
import { useSessionStore } from '../stores/sessionStore';
import PerfilView from '../views/shared/PerfilView.vue';
import PageHeader from '../components/PageHeader.vue';

interface NavItem {
  name: string;
  routeName: string;
  icon: Component;
}

const props = defineProps<{
  navItems: NavItem[];
  bottomItems?: NavItem[];
  routeParams: Record<string, string>;
  contextLabel: string;
  pageTitle: string;
  perfilRouteName: string;
  perfilRouteParams: Record<string, string>;
  isActive: (routeName: string) => boolean;
}>();

const emit = defineEmits<{ logout: [] }>();

const route = useRoute();
const sessionStore = useSessionStore();
const profileOpen = ref(false);

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    user: 'Usuario',
    visitor: 'Visitante',
  };
  return map[sessionStore.userRole || ''] || sessionStore.userRole || '';
});
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
