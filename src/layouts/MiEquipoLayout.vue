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
import { defineComponent, h } from 'vue';

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
const IconHabilidades    = icon(['M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342m-7.483 0a49.974 49.974 0 0 0 1 4.9m3.742-1.558V7.5a1.5 1.5 0 0 1 3 0v4.89m0 0 .001.009']);
const IconDisponibilidad = icon(['M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5']);
const IconExcepciones    = icon(['M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z']);
const IconReglas         = icon(['M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z', 'M6 6h.008v.008H6V6Z']);

const menuItems = [
  { name: 'Personal',       routeName: 'sucursal-mi-equipo-personal',       icon: IconPersonal },
  { name: 'Habilidades',    routeName: 'sucursal-mi-equipo-habilidades',    icon: IconHabilidades },
  { name: 'Disponibilidad', routeName: 'sucursal-mi-equipo-disponibilidad', icon: IconDisponibilidad },
  { name: 'Excepciones',    routeName: 'sucursal-mi-equipo-excepciones',    icon: IconExcepciones },
  { name: 'Reglas',         routeName: 'sucursal-mi-equipo-reglas',         icon: IconReglas },
];
</script>
