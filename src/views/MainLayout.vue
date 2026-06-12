<template>
  <ion-page>
    <div class="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      
      <!-- Overlay Menu Móvil -->
      <div 
        v-if="isMobileMenuOpen" 
        class="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden transition-opacity" 
        @click="isMobileMenuOpen = false"
      ></div>

      <!-- Sidebar -->
      <aside 
        :class="[
          'fixed inset-y-0 left-0 z-30 w-[var(--sidebar-width,256px)] h-full shrink-0 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <!-- Sección Superior: Perfil de Usuario -->
        <div class="p-5 border-b dark:border-gray-700 relative shrink-0 transition-colors">
          <button @click="isMobileMenuOpen = false" class="md:hidden absolute top-4 right-4 btn-close">
            ✕
          </button>
          
          <div v-if="sessionStore.currentUser?.contacto" class="flex flex-col mt-2">
            <div class="text-lg font-bold text-gray-800 dark:text-white truncate">
              {{ sessionStore.currentUser.contacto.first_name }} {{ sessionStore.currentUser.contacto.last_name }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {{ sessionStore.currentUser.contacto.email }}
            </div>
            <div class="mt-3">
              <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-md capitalize tracking-wide">
                {{ sessionStore.currentUser.system_role.replace('_', ' ') }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Sección Central: Navegación -->
        <div class="p-4 flex-1 overflow-y-auto">
          <nav class="space-y-3">
            <button @click="navigate('/dashboard')" :class="['btn-menu', route.path === '/dashboard' ? 'btn-menu-active' : 'btn-menu-inactive']">
              Inicio
            </button>
            <button @click="navigate('/usuarios')" :class="['btn-menu', route.path === '/usuarios' ? 'btn-menu-active' : 'btn-menu-inactive']">
              Usuarios
            </button>
          </nav>
        </div>
        
        <!-- Sección Inferior: Acciones Finales -->
        <div class="p-4 border-t dark:border-gray-700 shrink-0 transition-colors">
          <ul class="space-y-1">
            <li>
              <button type="button" @click="handleLogout" class="btn-logout">
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header Dinámico -->
        <header class="h-[var(--topbar-height,64px)] w-full shrink-0 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between p-4 md:px-6 z-10 transition-colors duration-300">
          <div class="flex items-center">
            <button @click="isMobileMenuOpen = true" class="mr-4 btn-icon md:hidden">
              ☰
            </button>
            <h1 class="text-xl font-bold text-gray-800 dark:text-white">{{ route.meta.title || route.name || 'App' }}</h1>
          </div>
          
          <button @click="sessionStore.toggleTheme()" class="btn-icon">
            {{ !sessionStore.isDarkMode ? '🌞' : '🌜' }}
          </button>
        </header>

        <!-- Contenido Dinámico: Router Outlet de Ionic -->
        <main class="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
          <ion-router-outlet></ion-router-outlet>
        </main>
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';

const isMobileMenuOpen = ref(false);
const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute();

const navigate = (path: string) => {
  isMobileMenuOpen.value = false;
  router.push(path);
};

const handleLogout = async () => {
  try {
    await sessionStore.logout();
    router.push('/login');
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};
</script>

<style scoped>

</style>