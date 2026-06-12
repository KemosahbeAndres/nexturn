<template>
  <main class="min-h-screen w-full overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Tarjeta {{ i }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">Subtítulo</p>
            <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Aquí va el contenido de la tarjeta. Puedes añadir gráficos, resúmenes o accesos directos.
            </p>
          </div>
        </div>
  </main>
</template>

<script setup lang="ts">
</script>
