<template>
  <div class="space-y-6">

    <!-- ══════════════════════════════════════════════════
           SECCIÓN 1 — EL PULSO DE HOY
      ══════════════════════════════════════════════════ -->
      <section>
        <h2 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">El pulso de hoy</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <!-- Tasa de asistencia -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Asistencia hoy</span>
              <span class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </span>
            </div>
            <div class="flex items-end gap-1.5 mb-2">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">–</span>
              <span class="text-sm text-gray-400 dark:text-gray-500 mb-1">/ –</span>
            </div>
            <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full w-0 bg-emerald-500 rounded-full transition-all duration-500"></div>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Pendiente de datos</p>
          </div>

          <!-- Ausencias de hoy -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800/50 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">Ausencias hoy</span>
              <span class="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </span>
            </div>
            <span class="text-3xl font-bold text-orange-600 dark:text-orange-400">–</span>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Sin registros aún</p>
          </div>

          <!-- Turnos activos ahora -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Turnos activos</span>
              <span class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                Ahora
              </span>
            </div>
            <span class="text-3xl font-bold text-gray-900 dark:text-white">–</span>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Pendiente de datos</p>
          </div>

        </div>
      </section>

      <!-- ══════════════════════════════════════════════════
           SECCIÓN 2 — TURNO ACTUAL / PRÓXIMO
      ══════════════════════════════════════════════════ -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Turno en curso / próximo</h2>
          <router-link
            :to="{ name: 'sucursal-turnos' }"
            class="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            Ver todos
          </router-link>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No hay turnos configurados</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Configura los turnos de la sucursal para verlos aquí</p>
            </div>
            <router-link
              :to="{ name: 'sucursal-turnos' }"
              class="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Crear turno
            </router-link>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════
           SECCIÓN 3 — ALERTAS DE ACCIÓN INMEDIATA
      ══════════════════════════════════════════════════ -->
      <section>
        <h2 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Requiere tu atención</h2>

        <div class="space-y-2">

          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 dark:text-white">Turnos críticos descubiertos</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sin datos disponibles aún. Los turnos sin cobertura aparecerán aquí.</p>
            </div>
            <button disabled class="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 opacity-50 cursor-not-allowed">
              Asignar
            </button>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 dark:text-white">Excepciones pendientes de aprobación</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Permisos, licencias y ausencias que requieren tu visto bueno.</p>
            </div>
            <router-link
              :to="{ name: 'sucursal-solicitudes' }"
              class="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              Revisar
            </router-link>
          </div>

          <div v-if="!isCongregacion" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 dark:text-white">Riesgo de horas semanales</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Se alertará si algún miembro está cerca de superar su límite legal.</p>
            </div>
            <span class="shrink-0 inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
              Sin alertas
            </span>
          </div>

        </div>
      </section>

      <!-- ══════════════════════════════════════════════════
           SECCIÓN 4 — SALUD DE LA PLANIFICACIÓN SEMANAL
      ══════════════════════════════════════════════════ -->
      <section>
        <h2 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Planificación semanal</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm font-semibold text-gray-800 dark:text-white">Cobertura de la semana</p>
              <span class="text-lg font-bold text-gray-300 dark:text-gray-600">–%</span>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <div v-for="dia in diasSemana" :key="dia.key" class="flex flex-col items-center gap-1">
                <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ dia.label }}</span>
                <div
                  class="w-full aspect-square rounded-md border-2 transition-all"
                  :class="dia.hoy
                    ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'"
                ></div>
              </div>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">Los días se llenarán al asignar turnos</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <p class="text-sm font-semibold text-gray-800 dark:text-white mb-4">Disponibilidad del equipo</p>
            <div class="flex flex-col items-center justify-center h-24 gap-2">
              <div class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 text-center">Agrega personal al equipo<br>para ver su disponibilidad</p>
            </div>
            <router-link
              :to="{ name: 'sucursal-mi-equipo-personal' }"
              class="mt-2 block text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              Gestionar equipo →
            </router-link>
          </div>

        </div>
      </section>

      <!-- ══════════════════════════════════════════════════
           SECCIÓN 5 — ACCESOS RÁPIDOS
      ══════════════════════════════════════════════════ -->
      <section class="pb-2">
        <h2 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Acciones rápidas</h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <router-link
            :to="{ name: 'sucursal-turnos' }"
            class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col items-center gap-2.5 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all text-center"
          >
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Crear turno extra</p>
          </router-link>

          <router-link
            :to="{ name: 'sucursal-mi-equipo-personal' }"
            class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col items-center gap-2.5 hover:border-orange-200 dark:hover:border-orange-700 hover:shadow-sm transition-all text-center"
          >
            <div class="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
              <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
            </div>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Añadir ausencia</p>
          </router-link>

          <router-link
            :to="{ name: 'sucursal-solicitudes' }"
            class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col items-center gap-2.5 hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm transition-all text-center"
          >
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Aprobar solicitudes</p>
          </router-link>

          <router-link
            :to="{ name: 'sucursal-turnos' }"
            class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col items-center gap-2.5 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-sm transition-all text-center"
          >
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
              <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Calendario semanal</p>
          </router-link>

        </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEmpresaStore } from '../../stores/empresaStore';

const empresaStore = useEmpresaStore();
const isCongregacion = computed(() => empresaStore.isCongregacion);

const ahora = ref(new Date());

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const hoyIndex = computed(() => ahora.value.getDay());

const diasSemana = computed(() =>
  DIAS_SEMANA.map((label, i) => ({ key: label, label, hoy: i === hoyIndex.value }))
);
</script>
