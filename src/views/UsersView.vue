<template>
  <ion-page>
    <ion-content :scroll-y="false">
      <div class="h-full w-full overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          
          <!-- Cabecera de la tabla -->
          <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los accesos y roles (ej. super_admin, admin, user).</p>
            </div>
            <button class="shrink-0 btn-primary">
              + Añadir Usuario
            </button>
          </div>

          <!-- En el futuro aquí renderizarás tu lista usando la colección de Firebase -->
          <div class="p-6 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span class="text-2xl">👥</span>
            </div>
            <h3 class="text-md font-semibold text-gray-900 dark:text-white">Aún no hay usuarios listados</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Aquí aparecerá la tabla obtenida desde Firestore. Utiliza el botón superior para empezar a registrar.
            </p>
          </div>

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
</script>

<style scoped>

</style>