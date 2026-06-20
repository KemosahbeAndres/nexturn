<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: selector de fecha + tabla de presencias ───────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Presencias</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Registra las ventanas de disponibilidad del equipo para cada día antes de generar el borrador de turnos.</p>
        </div>

        <!-- Selector de fecha -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha</label>
          <input v-model="fechaSeleccionada" type="date" @change="cargarPresenciasDelDia"
            class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white tabular-nums" />
        </div>

        <!-- Lista de presencias registradas -->
        <div v-if="fechaSeleccionada" class="space-y-1.5">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Registradas</p>

          <div v-if="presenciaStore.loading" class="py-4 text-center">
            <p class="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Cargando…</p>
          </div>

          <div v-else-if="!presenciaStore.presencias.length" class="py-4 text-center">
            <p class="text-xs text-gray-400 dark:text-gray-500 italic">Sin presencias para esta fecha.</p>
          </div>

          <div v-else class="space-y-1.5">
            <div v-for="p in presenciaStore.presencias" :key="p.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {{ nombreEmpleado(p.empleado_id) }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                  {{ p.start }} – {{ p.end }}
                </p>
              </div>
              <button v-if="canManage" type="button" @click="eliminarPresencia(p.id)"
                class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="py-6 text-center">
          <p class="text-xs text-gray-400 dark:text-gray-500 italic">Selecciona una fecha para ver o registrar presencias.</p>
        </div>

      </div>
    </div>

    <!-- ── Panel derecho: formulario de registro ───────────────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <div v-if="!canManage" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <p class="text-sm text-gray-400 dark:text-gray-500">Solo los gestores pueden registrar presencias.</p>
      </div>

      <div v-else-if="!fechaSeleccionada" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <p class="text-sm text-gray-400 dark:text-gray-500">Selecciona una fecha primero.</p>
      </div>

      <div v-else class="p-4 sm:p-6 space-y-5">
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Registrar presencia</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Fecha: <strong class="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{{ fechaSeleccionada }}</strong></p>
        </div>

        <!-- Empleado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empleado</label>
          <select v-model="registerForm.empleado_id"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white">
            <option value="">Seleccionar…</option>
            <option v-for="emp in empleadosSucursal" :key="emp.id" :value="emp.id">
              {{ emp.displayName }}
            </option>
          </select>
        </div>

        <!-- Horario -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entrada</label>
            <input v-model="registerForm.start" type="time"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white tabular-nums" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salida</label>
            <input v-model="registerForm.end" type="time"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white tabular-nums" />
          </div>
        </div>

        <p v-if="registerError" class="text-xs text-red-500 dark:text-red-400">{{ registerError }}</p>
        <p v-if="registerSuccess" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{{ registerSuccess }}</p>

        <button type="button" @click="registrar" :disabled="registrando"
          class="w-full px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition-colors">
          {{ registrando ? 'Registrando…' : 'Registrar presencia' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpleadoStore } from '../../stores/empleadoStore';
import { usePresenciaStore } from '../../stores/presenciaStore';

const sessionStore = useSessionStore();
const empleadoStore = useEmpleadoStore();
const presenciaStore = usePresenciaStore();

const companyId = computed(() => sessionStore.activeCompanyId ?? '');
const ubicacionId = computed(() => sessionStore.activeUbicacionId ?? '');

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);

onMounted(() => {
  if (companyId.value) empleadoStore.listarEmpleados(companyId.value);
});

// Solo empleados con contrato en esta ubicación
const empleadosSucursal = computed(() =>
  empleadoStore.empleadosActivos.filter(e =>
    e.contratos.some(c => c.ubicacion_id === ubicacionId.value && c.active)
  )
);

function nombreEmpleado(id: string): string {
  return empleadoStore.empleadosActivos.find(e => e.id === id)?.displayName ?? id;
}

// ── Fecha y carga de presencias ───────────────────────────────────────────────

const fechaSeleccionada = ref('');

async function cargarPresenciasDelDia() {
  if (!ubicacionId.value || !fechaSeleccionada.value) return;
  await presenciaStore.cargarPresencias(ubicacionId.value, fechaSeleccionada.value);
}

// ── Formulario de registro ────────────────────────────────────────────────────

const registerForm = ref({ empleado_id: '', start: '', end: '' });
const registrando = ref(false);
const registerError = ref('');
const registerSuccess = ref('');

async function registrar() {
  if (!registerForm.value.empleado_id || !registerForm.value.start || !registerForm.value.end) {
    registerError.value = 'Completa todos los campos.';
    return;
  }
  if (!ubicacionId.value || !companyId.value || !fechaSeleccionada.value) return;
  registrando.value = true;
  registerError.value = '';
  registerSuccess.value = '';
  try {
    await presenciaStore.createPresencia({
      empresa_id: companyId.value,
      ubicacion_id: ubicacionId.value,
      empleado_id: registerForm.value.empleado_id,
      date: fechaSeleccionada.value,
      start: registerForm.value.start,
      end: registerForm.value.end,
    });
    registerSuccess.value = 'Presencia registrada.';
    registerForm.value = { empleado_id: '', start: '', end: '' };
    setTimeout(() => { registerSuccess.value = ''; }, 3000);
    await presenciaStore.cargarPresencias(ubicacionId.value, fechaSeleccionada.value);
  } catch (e: any) {
    registerError.value = e.message ?? 'Error al registrar.';
  } finally {
    registrando.value = false;
  }
}

async function eliminarPresencia(id: string) {
  await presenciaStore.softDeletePresencia(id);
}
</script>
