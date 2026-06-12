<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors duration-300">
    
    <!-- Cabecera de la tabla -->
    <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Usuarios y Personal</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los accesos al sistema y el personal general.</p>
      </div>
      <button class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
        + Añadir Usuario
      </button>
    </div>

    <!-- Tabla de Usuarios -->
    <div v-if="usuarioStore.usuarios && usuarioStore.usuarios.length > 0" class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <th class="p-4 font-medium">Nombre</th>
            <th class="p-4 font-medium">RUT</th>
            <th class="p-4 font-medium">Correo</th>
            <th class="p-4 font-medium">Empresa</th>
            <th class="p-4 font-medium">Rol en Sistema</th>
            <th class="p-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="user in usuarioStore.usuarios" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors">
            <td class="p-4 text-sm text-gray-900 dark:text-white font-medium">{{ user.contacto?.first_name || 'Cargando...' }} {{ user.contacto?.last_name || '' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{{ user.contacto?.rut || '...' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ user.contacto?.email || '...' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{{ user.empresa?.nombre || (user.empresa_id ? 'Cargando...' : 'N/A') }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
              <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-md">
                {{ user.system_role.replace('_', ' ') }}
              </span>
            </td>
            <td class="p-4 text-sm">
              <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Contenido vacío -->
    <div v-else class="p-16 flex flex-col items-center justify-center text-center">
      <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <span class="text-2xl">👥</span>
      </div>
      <h3 class="text-md font-semibold text-gray-900 dark:text-white">Aún no hay registros</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
        Aquí aparecerá el listado obtenido desde Firestore. Utiliza el botón superior para empezar a registrar.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUsuarioStore } from '../stores/usuarioStore';
import { useSessionStore } from '../stores/sessionStore';

const usuarioStore = useUsuarioStore();
const sessionStore = useSessionStore();

onMounted(() => {
  // Inicia la escucha de la colección Firebase utilizando el contexto de seguridad del usuario actual
  if (sessionStore.currentUser) {
    usuarioStore.listarUsuarios(
      sessionStore.currentUser.system_role,
      sessionStore.currentUser.empresa_id
    );
  }
});
</script>