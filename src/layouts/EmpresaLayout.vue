<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    
    <!-- Barra Lateral (Sidebar) -->
    <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
      <!-- Logo o Título -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Nexturn</h1>
      </div>

      <!-- Perfil del Usuario y Empresa -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {{ sessionStore.currentUser?.contacto?.first_name || 'Usuario' }} 
          {{ sessionStore.currentUser?.contacto?.last_name || '' }}
          <span v-if="sessionStore.userRole === 'super_admin'" class="text-xs text-red-500 font-bold ml-1">(Admin)</span>
        </p>
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1 truncate" title="Empresa activa">
          🏢 {{ activeCompany }}
        </p>
      </div>

      <!-- Menú de Navegación -->
      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="{ name: item.routeName, params: { companySlug: $route.params.companySlug } }"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="[
            $route.name === item.routeName
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
          ]"
        >
          <span class="mr-3 text-lg">{{ item.icon }}</span>
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Pie del Sidebar (Preferencias y Salir) -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
        <router-link
          v-if="sessionStore.userRole === 'super_admin'"
          to="/dashboard"
          class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span class="mr-3">🔙</span>
          Volver a Admin
        </router-link>
        <button
          @click="sessionStore.toggleTheme()"
          class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span class="mr-3">{{ sessionStore.isDarkMode ? '🌞' : '🌙' }}</span>
          {{ sessionStore.isDarkMode ? 'Modo Claro' : 'Modo Oscuro' }}
        </button>
        <button
          @click="handleLogout"
          class="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <span class="mr-3">🚪</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Contenedor Principal -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Cabecera Móvil (Solo visible en pantallas pequeñas) -->
      <header class="md:hidden h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Nexturn</h1>
        <div class="text-xs font-medium text-blue-600 dark:text-blue-400 truncate max-w-[120px] px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded">
          {{ activeCompany }}
        </div>
      </header>

      <!-- Vista del Router (Todo el contenido hijo renderizará aquí) -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useEmpresaStore } from '../stores/empresaStore';

const router = useRouter();
const route = useRoute(); // Usado en el template para validar menú activo
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();

const menuItems = [
  { name: 'Dashboard', routeName: 'empresa-dashboard', icon: '📊' },
  { name: 'Usuarios', routeName: 'empresa-usuarios', icon: '👥' },
  { name: 'Personal', routeName: 'empresa-personal', icon: '👷' },
  { name: 'Sucursales', routeName: 'empresa-sucursales', icon: '🏢' },
  { name: 'Turnos', routeName: 'empresa-turnos', icon: '📋' },
  { name: 'Calendario', routeName: 'empresa-calendario', icon: '📅' }
];

const activeCompany = computed(() => {
  if (sessionStore.userRole !== 'super_admin') {
    return sessionStore.currentUser?.empresa?.nombre || sessionStore.currentUser?.contacto?.first_name || 'Cargando empresa...';
  }
  const slug = route.params.companySlug;
  const emp = empresaStore.empresas?.find((e: any) => e.slug === slug);
  return emp?.contacto?.first_name || slug;
});

onMounted(() => {
  // Si un super_admin recarga la página dentro de una empresa, necesitamos cargar la lista de empresas para obtener su nombre real
  if (sessionStore.userRole === 'super_admin' && (!empresaStore.empresas || empresaStore.empresas.length === 0)) {
    empresaStore.listarEmpresas('super_admin', null);
  }
});

const handleLogout = async () => {
  await sessionStore.logout();
  router.push('/login');
};
</script>