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

    <!-- Contenido vacío -->
    <div class="p-16 flex flex-col items-center justify-center text-center">
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
</script>