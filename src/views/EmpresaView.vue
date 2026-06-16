<template>
  <div v-if="empresa" class="space-y-6">

    <!-- ───────────────────────── 1. KPIs Globales ───────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cobertura total</span>
          <span class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">% de turnos cubiertos esta semana a nivel global</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ausentismo global</span>
          <span class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Ausencias reportadas hoy en toda la empresa</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fuerza laboral activa</span>
          <span class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl font-bold text-gray-300 dark:text-gray-600">— / —</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Trabajadores activos hoy vs. plantilla total</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Horas programadas</span>
          <span class="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Horas totales a utilizar esta semana en toda la empresa</p>
      </div>

    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

      <!-- ─────────────────── 2. Alertas Críticas de Sucursales ─────────────────── -->
      <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800 dark:text-white text-sm">Alertas críticas de sucursales</h3>
          <span class="text-xs text-gray-400 dark:text-gray-500">El foco de atención</span>
        </div>

        <div class="px-5 py-10 flex flex-col items-center justify-center text-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400 dark:text-gray-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M12 15.75h.007" />
            </svg>
          </div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Sin alertas por el momento</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 max-w-sm">
            Aquí aparecerán sucursales con turnos críticos sin cubrir, calendarios sin publicar
            o conflictos de horas extra no autorizadas.
          </p>
        </div>
      </div>

      <!-- ─────────────────── 4. Distribución de Cargos ─────────────────── -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-800 dark:text-white text-sm">Distribución de cargos</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Métricas estructurales</p>
        </div>

        <div class="px-5 py-8 flex flex-col items-center justify-center text-center gap-3">
          <!-- Anillo placeholder -->
          <div class="relative w-28 h-28 rounded-full border-[10px] border-gray-100 dark:border-gray-700 flex items-center justify-center">
            <span class="text-xs font-medium text-gray-300 dark:text-gray-600">Sin datos</span>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
            Distribución de cargos en toda la empresa y rol con mayor escasez de cobertura.
          </p>
        </div>
      </div>

    </div>

    <!-- ─────────────────── 3. Rendimiento por Sucursal / Zona ─────────────────── -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 class="font-semibold text-gray-800 dark:text-white text-sm">Rendimiento por sucursal / zona</h3>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ ubicaciones.length }} ubicaci{{ ubicaciones.length === 1 ? 'ón' : 'ones' }}</span>
      </div>

      <div v-if="ubicaciones.length === 0" class="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
        No hay sucursales registradas aún.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
              <th class="px-5 py-3">Sucursal / Zona</th>
              <th class="px-5 py-3">Cobertura semanal</th>
              <th class="px-5 py-3">Ausencias hoy</th>
              <th class="px-5 py-3">Estado</th>
              <th class="px-5 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <tr v-for="ub in ubicaciones" :key="ub.id">
              <td class="px-5 py-3">
                <p class="font-medium text-gray-800 dark:text-white">{{ ub.name }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ nombreZona(ub.zone_id) || 'Sin zona' }}</p>
              </td>
              <td class="px-5 py-3 text-gray-300 dark:text-gray-600">—</td>
              <td class="px-5 py-3 text-gray-300 dark:text-gray-600">—</td>
              <td class="px-5 py-3">
                <span class="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  Sin datos
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <button type="button" disabled
                  class="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed">
                  Auditar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <div v-else class="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
    Cargando organización…
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../stores/empresaStore';
import { useUbicacionStore } from '../stores/ubicacionStore';
import { useZonaStore } from '../stores/zonaStore';

const route        = useRoute();
const empresaStore = useEmpresaStore();
const ubicacionStore = useUbicacionStore();
const zonaStore     = useZonaStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

onMounted(() => {
  if (empresa.value?.id) {
    ubicacionStore.listarUbicaciones(empresa.value.id);
    zonaStore.listarZonas(empresa.value.id);
  }
});

const ubicaciones = computed(() => (ubicacionStore.ubicaciones ?? []).filter(u => u.active));

function nombreZona(zoneId: string | null): string {
  if (!zoneId) return '';
  return zonaStore.zonas?.find(z => z.id === zoneId)?.name ?? '';
}
</script>
