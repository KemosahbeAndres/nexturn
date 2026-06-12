<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-6">Resumen general</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Estadística {{ i }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">En tiempo real</p>
        <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          Aquí va el contenido del resumen. Puedes añadir gráficos, tarjetas de estado o tareas pendientes.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
