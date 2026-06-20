<template>
  <div class="flex flex-col h-full min-h-0 p-4 sm:p-6 space-y-4">

    <!-- Encabezado + navegación semanal -->
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mi Calendario</p>
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
          {{ formatRango(fechaInicio, fechaFin) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="semanaOffset--; cargar()"
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button @click="semanaOffset = 0; cargar()"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Esta semana
        </button>
        <button @click="semanaOffset++; cargar()"
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <button @click="cargar" :disabled="cargando"
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
          title="Actualizar">
          <svg class="w-3.5 h-3.5" :class="cargando ? 'animate-spin' : ''"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Aviso: sin usuario / requiere cuenta -->
    <div v-if="!userId" class="flex-1 flex items-center justify-center">
      <p class="text-sm text-gray-400 dark:text-gray-500">Necesitas una cuenta activa para ver tu calendario.</p>
    </div>

    <!-- Cargando -->
    <div v-else-if="cargando" class="flex-1 flex items-center justify-center">
      <p class="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Cargando turno…</p>
    </div>

    <!-- Grilla semanal -->
    <div v-else class="flex-1 overflow-auto">
      <div class="grid grid-cols-7 gap-2 min-w-[560px] h-full">
        <div v-for="(dia, i) in diasSemana" :key="dia" class="flex flex-col gap-1.5">

          <!-- Cabecera día -->
          <div class="px-1 py-2 text-center rounded-xl"
            :class="esDiaHoy(i) ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400'">
            <p class="text-[10px] font-bold uppercase tracking-wide">{{ dia.slice(0, 3) }}</p>
            <p class="text-xs font-semibold tabular-nums mt-0.5">{{ fechaDia(i).slice(8) }}</p>
          </div>

          <!-- Segmentos del día -->
          <div class="flex-1 space-y-1.5">
            <div
              v-for="seg in segmentosDia(i)"
              :key="seg.id"
              class="px-2 py-2 rounded-xl text-xs font-medium border"
              :class="seg.tipo === 'descanso'
                ? 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300'"
            >
              <p class="tabular-nums font-semibold leading-tight">{{ seg.start }} – {{ seg.end }}</p>
              <p class="text-[10px] mt-0.5 opacity-75">
                {{ seg.tipo === 'descanso' ? 'Descanso' : nombreEstacion(seg.estacion_id) }}
              </p>
            </div>

            <div v-if="!segmentosDia(i).length"
              class="px-2 py-3 text-center text-[10px] text-gray-300 dark:text-gray-600 font-medium rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              Libre
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="flex items-center gap-4 pt-1 border-t border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-violet-200 dark:bg-violet-800"></span>
        <span class="text-xs text-gray-500 dark:text-gray-400">Estación asignada</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded bg-gray-200 dark:bg-gray-600"></span>
        <span class="text-xs text-gray-500 dark:text-gray-400">Descanso</span>
      </div>
      <span class="text-xs text-gray-400 dark:text-gray-600 ml-auto">Solo turnos publicados</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { useSegmentoStore } from '../../stores/segmentoStore';
import { useEstacionStore } from '../../stores/estacionStore';
import type { Segmento } from '../../models/Segmento';

const sessionStore = useSessionStore();
const segmentoStore = useSegmentoStore();
const estacionStore = useEstacionStore();

const userId = computed(() => sessionStore.currentUser?.id ?? '');
const companyId = computed(() => sessionStore.activeCompanyId ?? '');

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const semanaOffset = ref(0);
const segmentos = ref<Segmento[]>([]);
const cargando = ref(false);

const fechaInicio = computed(() => {
  const hoy = new Date();
  const lunes = new Date(hoy);
  const dia = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
  lunes.setDate(hoy.getDate() - dia + semanaOffset.value * 7);
  return lunes.toISOString().slice(0, 10);
});

const fechaFin = computed(() => {
  const fin = new Date(fechaInicio.value);
  fin.setDate(fin.getDate() + 6);
  return fin.toISOString().slice(0, 10);
});

function fechaDia(diaIdx: number): string {
  const d = new Date(fechaInicio.value);
  d.setDate(d.getDate() + diaIdx);
  return d.toISOString().slice(0, 10);
}

function esDiaHoy(diaIdx: number): boolean {
  return fechaDia(diaIdx) === new Date().toISOString().slice(0, 10);
}

function segmentosDia(diaIdx: number): Segmento[] {
  const fecha = fechaDia(diaIdx);
  return segmentos.value
    .filter(s => s.date === fecha)
    .sort((a, b) => a.start.localeCompare(b.start));
}

function formatRango(ini: string, fin: string): string {
  const fmt = (d: string) => {
    const [, m, dd] = d.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(dd)} ${meses[parseInt(m) - 1]}`;
  };
  return `${fmt(ini)} – ${fmt(fin)}`;
}

function nombreEstacion(id: string | null): string {
  if (!id) return 'Descanso';
  return estacionStore.estacionesActivas.find(e => e.id === id)?.nombre ?? id;
}

async function cargar() {
  if (!userId.value) return;
  cargando.value = true;
  try {
    segmentos.value = await segmentoStore.cargarSegmentosEmpleado(
      userId.value,
      fechaInicio.value,
      fechaFin.value
    );
  } finally {
    cargando.value = false;
  }
}

onMounted(() => {
  if (companyId.value) estacionStore.listarEstaciones(companyId.value);
  cargar();
});
</script>
