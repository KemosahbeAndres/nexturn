<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-xl">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Apariencia</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Personaliza el aspecto visual de la aplicación.</p>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
      <div class="flex items-center justify-between px-4 py-4">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Modo oscuro</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cambia entre tema claro y oscuro</p>
        </div>
        <button
          @click="sessionStore.toggleTheme()"
          class="relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          :class="sessionStore.isDarkMode ? 'bg-blue-500' : 'bg-gray-300'"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
            :class="sessionStore.isDarkMode ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSessionStore } from '../../stores/sessionStore';
const sessionStore = useSessionStore();
</script>
