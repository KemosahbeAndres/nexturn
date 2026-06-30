<template>
  <div class="flex-1 overflow-hidden min-h-0 flex flex-col">

    <!-- Sub-nav de secciones de Mi Equipo (solo empresa) -->
    <div v-if="!isCongregacion" class="shrink-0 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 flex gap-1">
      <router-link
        v-for="item in menuItems"
        :key="item.routeName"
        :to="{ name: item.routeName, params: $route.params }"
        class="px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap"
        :class="$route.name === item.routeName
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      >
        {{ item.label }}
      </router-link>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmpresaStore } from '../stores/empresaStore';

const route = useRoute();
const router = useRouter();
const empresaStore = useEmpresaStore();

const isCongregacion = computed(() => empresaStore.isCongregacion);

const menuItems = [
  { label: 'Personal',   routeName: 'sucursal-mi-equipo-personal' },
  { label: 'Estaciones', routeName: 'sucursal-mi-equipo-estaciones' },
  { label: 'Reglas',     routeName: 'sucursal-mi-equipo-reglas' },
];

// Redirigir a personal si se intenta acceder a estaciones/reglas en una congregación
watchEffect(() => {
  if (!isCongregacion.value) return;
  const restringidas = ['sucursal-mi-equipo-estaciones', 'sucursal-mi-equipo-reglas'];
  if (restringidas.includes(route.name as string)) {
    router.replace({ name: 'sucursal-mi-equipo-personal', params: route.params });
  }
});
</script>
