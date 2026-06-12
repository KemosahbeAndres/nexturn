<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
      
      <!-- Sección Superior: Perfil de Usuario -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col">
        <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">Nexturn</span>
        
        <template v-if="sessionStore.currentUser?.contacto">
          <span class="text-sm font-bold text-gray-800 dark:text-white mt-4 truncate">
            {{ sessionStore.currentUser.contacto.first_name }} {{ sessionStore.currentUser.contacto.last_name }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {{ sessionStore.currentUser.contacto.email }}
          </span>
          <span class="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-lg w-max capitalize tracking-wide">
            {{ sessionStore.currentUser.system_role.replace('_', ' ') }}
          </span>
        </template>
      </div>

      <!-- Sección Central: Navegación -->
      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <router-link to="/dashboard" class="block p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">Dashboard</router-link>
        <router-link to="/usuarios" class="block p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">Usuarios</router-link>
        <router-link to="/empresas" class="block p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" active-class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">Empresas</router-link>
      </nav>

      <!-- Sección Inferior: Acciones Finales -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="handleLogout" class="w-full text-left p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium transition-colors">
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Barra Superior -->
      <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 transition-colors duration-300">
        <span class="text-gray-800 dark:text-white font-semibold text-lg">{{ route.meta.title || 'Nexturn' }}</span>
        
        <button type="button" @click="sessionStore.toggleTheme()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
          {{ !sessionStore.isDarkMode ? '🌞' : '🌜' }}
        </button>
      </header>

      <!-- Contenedor de Vistas -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <!-- Las vistas hijas se renderizarán aquí -->
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';

const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute();

onMounted(() => {
  // Limpiar el contexto local si el super_admin regresa a la vista de administración global
  sessionStore.activeCompanyId = null;
});

const handleLogout = async () => {
  try {
    await sessionStore.logout();
    router.push('/login');
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};
</script>