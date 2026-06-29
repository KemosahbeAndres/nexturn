<template>
  <div class="flex h-full gap-0">

    <!-- Menú lateral de Mi Equipo -->
    <aside class="w-36 lg:w-48 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div class="px-4 lg:px-5 pt-6 pb-3">
        <p class="text-[10px] lg:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mi Equipo</p>
      </div>
      <nav class="flex-1 px-2 lg:px-3 pb-4 space-y-0.5 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.routeName"
          :to="{ name: item.routeName, params: { companySlug: $route.params.companySlug, ubicacionSlug: $route.params.ubicacionSlug } }"
          class="flex items-center gap-2 lg:gap-2.5 px-2 lg:px-3 py-2 text-xs lg:text-sm rounded-lg transition-colors"
          :class="$route.name === item.routeName
            ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/20'
            : 'font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-white/5'"
        >
          <component :is="item.icon" class="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 opacity-70" />
          {{ item.name }}
        </router-link>
      </nav>
    </aside>

    <!-- Contenido de la sección -->
    <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, computed } from 'vue';
import { useEmpresaStore } from '../stores/empresaStore';

const empresaStore = useEmpresaStore();
const isCongregacion = computed(() => empresaStore.isCongregacion);

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  'stroke-width': '1.5',
  stroke: 'currentColor',
};
const pathProps = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

function icon(paths: string[]) {
  return defineComponent({
    render: () => h('svg', svgProps, paths.map(d => h('path', { ...pathProps, d }))),
  });
}

const IconPersonal       = icon(['M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z']);
const IconEstaciones     = icon(['M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z']);
const IconDisponibilidad = icon(['M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5']);
const IconExcepciones    = icon(['M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z']);
const IconReglas         = icon(['M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z', 'M6 6h.008v.008H6V6Z']);

const ALL_ITEMS = [
  { name: 'Personal',       routeName: 'sucursal-mi-equipo-personal',       icon: IconPersonal,       congregacion: true  },
  { name: 'Estaciones',     routeName: 'sucursal-mi-equipo-estaciones',     icon: IconEstaciones,     congregacion: false },
  { name: 'Disponibilidad', routeName: 'sucursal-mi-equipo-disponibilidad', icon: IconDisponibilidad, congregacion: true  },
  { name: 'Excepciones',    routeName: 'sucursal-mi-equipo-excepciones',    icon: IconExcepciones,    congregacion: true  },
  { name: 'Reglas',         routeName: 'sucursal-mi-equipo-reglas',         icon: IconReglas,         congregacion: false },
];

const menuItems = computed(() =>
  isCongregacion.value ? ALL_ITEMS.filter(i => i.congregacion) : ALL_ITEMS
);
</script>
