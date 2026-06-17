<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de turnos ──────────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Turnos</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Define los horarios requeridos por la organización.</p>
          </div>
          <button class="shrink-0 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            + Agregar
          </button>
        </div>

        <!-- Estado vacío -->
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"
            class="w-10 h-10 text-gray-200 dark:text-gray-600 mb-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <p class="text-xs text-gray-400 dark:text-gray-500">No hay turnos definidos aún.</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Esta sección está en construcción.</p>
        </div>

      </div>
    </div>

    <!-- ── Panel derecho: detalle ─────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-y-auto">
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"
            class="w-10 h-10 mx-auto text-gray-200 dark:text-gray-700 mb-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p class="text-xs text-gray-400 dark:text-gray-500">Selecciona un turno para ver su detalle.</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
</script>
