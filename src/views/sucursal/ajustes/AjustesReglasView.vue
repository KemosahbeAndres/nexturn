<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de empleados ──────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Reglas de asignación</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Preferencias de personas juntas o separadas en turnos.</p>
        </div>

        <!-- Búsqueda -->
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input v-model="search" type="text" placeholder="Buscar empleado…"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
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
              ? 'bg-indigo-50 dark:bg-indigo-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
          >
            <span class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              :class="selected?.id === emp.id
                ? 'bg-indigo-100 dark:bg-indigo-800/60 text-indigo-700 dark:text-indigo-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              {{ emp.initials }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate"
                :class="selected?.id === emp.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'">
                {{ emp.displayName }}
              </p>
            </div>
            <svg v-if="selected?.id === emp.id"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 shrink-0 text-indigo-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <p v-if="!empleadosFiltrados.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin empleados en esta sucursal.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho: reglas del empleado ───────────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selected" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona un empleado</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Elige un empleado para ver y configurar sus reglas de asignación.</p>
      </div>

      <!-- Panel con reglas -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-200">
              {{ selected.initials }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selected.displayName }}</p>
              <p class="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Reglas de asignación</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="canManage" @click="openAdd = !openAdd"
              class="px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
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
        <div v-if="openAdd && canManage" class="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/40 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Nueva regla</p>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Segunda persona</label>
            <select v-model="addForm.person_dos_id"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white">
              <option value="">Seleccionar empleado…</option>
              <option v-for="emp in otrosEmpleados" :key="emp.id" :value="emp.id">{{ emp.displayName }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo de regla</label>
            <div class="flex gap-2">
              <button type="button" @click="addForm.type = 'juntos'"
                class="flex-1 py-2 text-xs font-medium rounded-lg border transition-colors"
                :class="addForm.type === 'juntos'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'">
                Siempre juntos
              </button>
              <button type="button" @click="addForm.type = 'nunca_juntos'"
                class="flex-1 py-2 text-xs font-medium rounded-lg border transition-colors"
                :class="addForm.type === 'nunca_juntos'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'">
                Nunca juntos
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <div>
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300">Regla estricta</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">El algoritmo la aplica obligatoriamente.</p>
            </div>
            <button type="button" @click="addForm.is_strict = !addForm.is_strict"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="addForm.is_strict ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                :class="addForm.is_strict ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>

          <p v-if="addError" class="text-xs text-red-500 dark:text-red-400">{{ addError }}</p>
          <div class="flex gap-2">
            <button type="button" @click="openAdd = false"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="submitAdd" :disabled="adding"
              class="flex-1 px-3 py-2 text-sm text-white font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-40">
              {{ adding ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>

        <!-- Reglas juntos -->
        <div v-if="reglasJuntos.length" class="space-y-2">
          <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Siempre juntos</p>
          <div v-for="regla in reglasJuntos" :key="regla.id"
            class="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
            <span class="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {{ nombrePareja(regla).initials }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ nombrePareja(regla).name }}</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ regla.is_strict ? 'Obligatoria' : 'Preferencia' }}</p>
            </div>
            <button v-if="canManage" @click="eliminarRegla(regla.id)"
              class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Reglas nunca juntos -->
        <div v-if="reglasSeparados.length" class="space-y-2">
          <p class="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-widest">Nunca juntos</p>
          <div v-for="regla in reglasSeparados" :key="regla.id"
            class="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
            <span class="w-7 h-7 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center text-xs font-bold text-red-700 dark:text-red-300">
              {{ nombrePareja(regla).initials }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ nombrePareja(regla).name }}</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ regla.is_strict ? 'Obligatoria' : 'Preferencia' }}</p>
            </div>
            <button v-if="canManage" @click="eliminarRegla(regla.id)"
              class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="!reglasJuntos.length && !reglasSeparados.length"
          class="text-sm text-gray-400 dark:text-gray-500 italic py-2">
          Sin reglas configuradas para este empleado.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useSessionStore } from '../../../stores/sessionStore';
import { useEmpleadoStore } from '../../../stores/empleadoStore';
import { useReglaAsignacionStore } from '../../../stores/reglaAsignacionStore';
import type { Empleado } from '../../../models/Empleado';
import type { ReglaAsignacion, ReglaType } from '../../../models/ReglaAsignacion';

const sessionStore = useSessionStore();
const empleadoStore = useEmpleadoStore();
const reglaStore = useReglaAsignacionStore();

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
  if (emp) reglaStore.listarReglas(emp.id);
  else reglaStore.clearReglas();
});

const reglasJuntos = computed(() => reglaStore.reglasJuntos);
const reglasSeparados = computed(() => reglaStore.reglasSeparados);

// Mapea el ID de la pareja al objeto empleado
function nombrePareja(regla: ReglaAsignacion): { name: string; initials: string } {
  const parejaId = regla.person_uno_id === selected.value?.id ? regla.person_dos_id : regla.person_uno_id;
  const emp = empleadoStore.empleados?.find(e => e.id === parejaId);
  if (!emp) return { name: parejaId, initials: '?' };
  return { name: emp.displayName, initials: emp.initials };
}

// Todos los empleados menos el seleccionado para el picker
const otrosEmpleados = computed(() =>
  (empleadoStore.empleados ?? []).filter(e => e.id !== selected.value?.id)
);

// ── Formulario agregar ────────────────────────────────────────────────────

const openAdd = ref(false);
const addError = ref('');
const adding = ref(false);

const addForm = ref<{ person_dos_id: string; type: ReglaType; is_strict: boolean }>({
  person_dos_id: '',
  type: 'juntos',
  is_strict: false,
});

async function submitAdd() {
  if (!selected.value) return;
  if (!addForm.value.person_dos_id) { addError.value = 'Selecciona la segunda persona.'; return; }
  adding.value = true;
  addError.value = '';
  try {
    await reglaStore.createRegla({
      person_uno_id: selected.value.id,
      person_dos_id: addForm.value.person_dos_id,
      is_strict: addForm.value.is_strict,
      type: addForm.value.type,
    });
    openAdd.value = false;
    addForm.value = { person_dos_id: '', type: 'juntos', is_strict: false };
  } catch (e: any) {
    addError.value = e.message ?? 'Error al guardar.';
  } finally {
    adding.value = false;
  }
}

async function eliminarRegla(id: string) {
  if (!confirm('¿Eliminar esta regla?')) return;
  await reglaStore.softDeleteRegla(id);
}
</script>
