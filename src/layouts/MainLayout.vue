<template>
  <div class="flex h-[100dvh] bg-gray-100 dark:bg-gray-900 transition-colors duration-300">

    <!-- ===================== SIDEBAR (md+) ===================== -->
    <aside class="hidden md:flex md:w-44 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col shrink-0 transition-[width] duration-300">

      <!-- Perfil -->
      <div class="p-3 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col">
        <span class="text-base lg:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">Nexturn</span>
        <template v-if="sessionStore.currentUser?.contacto">
          <span class="text-xs lg:text-sm font-bold text-gray-800 dark:text-white mt-3 lg:mt-4 truncate">
            {{ sessionStore.currentUser.contacto.first_name }} {{ sessionStore.currentUser.contacto.last_name }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {{ sessionStore.currentUser.contacto.email }}
          </span>
          <span class="mt-2 lg:mt-3 inline-block px-2 lg:px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-lg w-max capitalize tracking-wide">
            {{ sessionStore.currentUser.system_role.replace('_', ' ') }}
          </span>
        </template>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 px-2 lg:p-4 py-3 space-y-0.5 lg:space-y-1 overflow-y-auto">
        <router-link to="/dashboard" class="flex items-center gap-2 lg:gap-3 px-2 lg:p-3 py-2 rounded-lg text-xs lg:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 lg:w-5 lg:h-5 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
          Dashboard
        </router-link>
        <router-link to="/usuarios" class="flex items-center gap-2 lg:gap-3 px-2 lg:p-3 py-2 rounded-lg text-xs lg:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 lg:w-5 lg:h-5 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
          Usuarios
        </router-link>
        <router-link to="/empresas" class="flex items-center gap-2 lg:gap-3 px-2 lg:p-3 py-2 rounded-lg text-xs lg:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 lg:w-5 lg:h-5 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
          Empresas
        </router-link>
      </nav>

      <!-- Pie -->
      <div class="p-2 lg:p-4 border-t border-gray-200 dark:border-gray-700 space-y-0.5 lg:space-y-1">
        <router-link to="/perfil" class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
          Mi perfil
        </router-link>
        <button @click="sessionStore.toggleTheme()" class="w-full flex items-center justify-between px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div class="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 min-w-0">
            <svg v-if="!sessionStore.isDarkMode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-amber-500"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 text-blue-400"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" /></svg>
            <span class="truncate hidden lg:inline">{{ sessionStore.isDarkMode ? 'Modo oscuro' : 'Modo claro' }}</span>
          </div>
          <div class="relative w-8 lg:w-10 h-4 lg:h-5 rounded-full transition-colors duration-300 shrink-0" :class="sessionStore.isDarkMode ? 'bg-blue-500' : 'bg-gray-300'">
            <span class="absolute top-0.5 left-0.5 w-3 lg:w-4 h-3 lg:h-4 bg-white rounded-full shadow transition-transform duration-300" :class="sessionStore.isDarkMode ? 'translate-x-4 lg:translate-x-5' : 'translate-x-0'"></span>
          </div>
        </button>
        <button @click="handleLogout" class="w-full flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- ===================== ÁREA PRINCIPAL ===================== -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- TOPBAR (solo móvil) -->
      <header class="md:hidden shrink-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 transition-colors duration-300">
        <span class="text-base font-semibold text-gray-800 dark:text-white truncate">{{ route.meta.title || 'Nexturn' }}</span>
        <button @click="profileOpen = true" class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-600 dark:text-blue-300">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </button>
      </header>

      <!-- CONTENIDO -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-20 md:pb-6">
        <router-view />
      </main>
    </div>

    <!-- BOTTOMBAR (solo móvil) — fixed para no depender del viewport del browser -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-2 transition-colors duration-300">
      <router-link to="/dashboard" class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors" :class="route.name === 'admin-dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
        <span class="text-[10px] font-medium">Dashboard</span>
      </router-link>
      <router-link to="/usuarios" class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors" :class="route.name === 'admin-usuarios' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
        <span class="text-[10px] font-medium">Usuarios</span>
      </router-link>
      <router-link to="/empresas" class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors" :class="route.name === 'admin-empresas' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
        <span class="text-[10px] font-medium">Empresas</span>
      </router-link>
    </nav>

    <!-- ===================== OFFCANVAS PERFIL (solo móvil) ===================== -->
    <Transition name="offcanvas">
      <div v-if="profileOpen" class="md:hidden fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="profileOpen = false" />

        <!-- Panel -->
        <div class="relative w-80 max-w-[90vw] h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden">
          <!-- Header del panel -->
          <div class="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <span class="text-base font-semibold text-gray-900 dark:text-white">Mi perfil</span>
            <button @click="profileOpen = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Contenido scrolleable -->
          <div class="flex-1 overflow-y-auto p-4">
            <PerfilView />
          </div>

          <!-- Pie: cerrar sesión -->
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
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import PerfilView from '../views/PerfilView.vue';

const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute();
const profileOpen = ref(false);

onMounted(() => {
  sessionStore.activeCompanyId = null;
});

const handleLogout = async () => {
  try {
    await sessionStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
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
