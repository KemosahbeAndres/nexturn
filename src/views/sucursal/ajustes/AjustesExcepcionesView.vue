<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de empleados ──────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Excepciones</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ausencias puntuales (feriado, emergencia…). Restan la disponibilidad del empleado ese día; el algoritmo las respeta al generar el horario.</p>
        </div>

        <!-- Búsqueda -->
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input v-model="search" type="text" placeholder="Buscar empleado…"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
        </div>

        <!-- Lista de empleados -->
        <div class="space-y-0.5">
          <button
            v-for="emp in empleadosFiltrados"
            :key="emp.id"
            type="button"
            @click="selectEmpleado(emp)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
            :class="selected?.id === emp.id
              ? 'bg-amber-50 dark:bg-amber-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
          >
            <span class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              :class="selected?.id === emp.id
                ? 'bg-amber-100 dark:bg-amber-800/60 text-amber-700 dark:text-amber-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              {{ emp.initials }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate"
                :class="selected?.id === emp.id ? 'text-amber-700 dark:text-amber-300' : 'text-gray-800 dark:text-gray-200'">
                {{ emp.displayName }}
              </p>
            </div>
            <svg v-if="selected?.id === emp.id"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 shrink-0 text-amber-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <p v-if="!empleadosFiltrados.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin empleados en esta sucursal.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho: excepciones del empleado ──────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selected" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona un empleado</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Elige un empleado para ver y registrar sus excepciones.</p>
      </div>

      <!-- Panel con excepciones -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-200">
              {{ selected.initials }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selected.displayName }}</p>
              <p class="text-xs text-amber-500 dark:text-amber-400 font-medium">Excepciones</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="canManage" @click="openAdd = !openAdd"
              class="px-2.5 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
              + Agregar
            </button>
            <button @click="selected = null" class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Formulario agregar -->
        <div v-if="openAdd && canManage" class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Nueva excepción</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha</label>
              <input v-model="addForm.date" type="date"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora inicio</label>
              <input v-model="addForm.time_start" type="time"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora fin</label>
              <input v-model="addForm.time_end" type="time"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
              <select v-model="addForm.type"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white">
                <option value="feriado_legal">Feriado legal</option>
                <option value="dia_administrativo">Día administrativo</option>
                <option value="emergencia">Emergencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motivo</label>
              <input v-model="addForm.reason" type="text" placeholder="Describe el motivo…"
                class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
            </div>
          </div>
          <p v-if="addError" class="text-xs text-red-500 dark:text-red-400">{{ addError }}</p>
          <div class="flex gap-2">
            <button type="button" @click="openAdd = false"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="submitAdd" :disabled="adding"
              class="flex-1 px-3 py-2 text-sm text-white font-medium rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-40">
              {{ adding ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>

        <!-- Lista de excepciones -->
        <div class="space-y-2">
          <div v-if="!excepcionesActivas.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-2">
            Sin excepciones registradas.
          </div>
          <div
            v-for="exc in excepcionesActivas"
            :key="exc.id"
            class="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 space-y-1"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ formatDate(exc.date) }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" :class="tipoClass(exc.type)">
                  {{ tipoLabel(exc.type) }}
                </span>
              </div>
              <button v-if="canManage" @click="eliminar(exc.id)"
                class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ exc.time_start }} – {{ exc.time_end }}</p>
            <p v-if="exc.reason" class="text-xs text-gray-600 dark:text-gray-300">{{ exc.reason }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useSessionStore } from '../../../stores/sessionStore';
import { useEmpleadoStore } from '../../../stores/empleadoStore';
import { useExcepcionStore } from '../../../stores/excepcionStore';
import { useAsignacionStore } from '../../../stores/asignacionStore';
import { useLogStore } from '../../../stores/logStore';
import type { Empleado } from '../../../models/Empleado';
import type { ExcepcionType } from '../../../models/Excepcion';

const sessionStore = useSessionStore();
const empleadoStore = useEmpleadoStore();
const excepcionStore = useExcepcionStore();
const asignacionStore = useAsignacionStore();
const logStore = useLogStore();

const canManage = computed(() => ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? ''));

onMounted(() => {
  const companyId = sessionStore.activeCompanyId;
  if (companyId) empleadoStore.listarEmpleados(companyId);
});

const ubicacionId = computed(() => sessionStore.activeUbicacionId);

const empleadosDeSucursal = computed(() => {
  if (!ubicacionId.value) return empleadoStore.empleadosActivos;
  return empleadoStore.empleadosActivos.filter(e =>
    e.contratos?.some(c => c.active && c.ubicacion_id === ubicacionId.value)
  );
});

const search = ref('');

const empleadosFiltrados = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return empleadosDeSucursal.value;
  return empleadosDeSucursal.value.filter(e => e.displayName.toLowerCase().includes(q));
});

const selected = ref<Empleado | null>(null);

function selectEmpleado(emp: Empleado) {
  if (selected.value?.id === emp.id) { selected.value = null; return; }
  selected.value = emp;
}

watch(selected, (emp) => {
  openAdd.value = false;
  addError.value = '';
  if (emp) excepcionStore.listarExcepciones(emp.id);
  else excepcionStore.clearExcepciones();
});

const excepcionesActivas = computed(() => excepcionStore.excepcionesActivas);

// ── Formulario agregar ────────────────────────────────────────────────────

const openAdd = ref(false);
const addError = ref('');
const adding = ref(false);

const addForm = ref<{ date: string; time_start: string; time_end: string; reason: string; type: ExcepcionType }>({
  date: '',
  time_start: '08:00',
  time_end: '17:00',
  reason: '',
  type: 'otro',
});

async function submitAdd() {
  if (!selected.value) return;
  if (!addForm.value.date) { addError.value = 'La fecha es obligatoria.'; return; }
  adding.value = true;
  addError.value = '';
  try {
    await excepcionStore.createExcepcion({
      employee_id: selected.value.id,
      date: addForm.value.date,
      time_start: addForm.value.time_start,
      time_end: addForm.value.time_end,
      reason: addForm.value.reason.trim(),
      type: addForm.value.type,
    });
    openAdd.value = false;
    addForm.value = { date: '', time_start: '08:00', time_end: '17:00', reason: '', type: 'otro' };
    const compId = sessionStore.activeCompanyId;
    const ubicId = sessionStore.activeUbicacionId;
    if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, "generarAsignaciones"), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: "excepciones" }));
  } catch (e: any) {
    addError.value = e.message ?? 'Error al guardar.';
  } finally {
    adding.value = false;
  }
}

async function eliminar(id: string) {
  if (!confirm('¿Eliminar esta excepción?')) return;
  await excepcionStore.softDeleteExcepcion(id);
  const compId = sessionStore.activeCompanyId;
  const ubicId = sessionStore.activeUbicacionId;
  if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, "generarAsignaciones"), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: "excepciones" }));
}

// ── Helpers de visualización ──────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const tipoLabels: Record<string, string> = {
  feriado_legal: 'Feriado legal',
  dia_administrativo: 'Día admin.',
  emergencia: 'Emergencia',
  otro: 'Otro',
};

function tipoLabel(type: string): string {
  return tipoLabels[type] || type;
}

function tipoClass(type: string): string {
  const map: Record<string, string> = {
    feriado_legal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    dia_administrativo: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    emergencia: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    otro: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  };
  return map[type] ?? map.otro;
}
</script>
