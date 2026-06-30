<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista ─────────────────────────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Solicitudes</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ esManager ? 'Solicitudes del equipo de esta sucursal.' : 'Tus solicitudes de excepción.' }}
            </p>
          </div>
          <button v-if="!esManager" @click="abrirModalNueva"
            class="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
            + Solicitud
          </button>
        </div>

        <!-- Pestañas de estado -->
        <div v-if="esManager" class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
          <button v-for="tab in tabs" :key="tab.value" type="button"
            @click="tabActiva = tab.value"
            class="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
            :class="tabActiva === tab.value
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
            {{ tab.label }}
            <span v-if="tab.value === 'pendiente' && solicitudStore.pendientes.length"
              class="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
              {{ solicitudStore.pendientes.length }}
            </span>
          </button>
        </div>

        <!-- Lista de solicitudes -->
        <div class="space-y-1.5">
          <button
            v-for="s in solicitudesMostradas"
            :key="s.id"
            type="button"
            @click="seleccionar(s)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border"
            :class="selectedId === s.id
              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'"
          >
            <span class="shrink-0 w-2 h-2 rounded-full mt-0.5"
              :class="badgeEstado(s.estado)" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {{ labelTipo(s.tipo) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 truncate">
                {{ s.rango.start_date }} → {{ s.rango.end_date }}
              </p>
            </div>
            <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              :class="chipEstado(s.estado)">
              {{ s.estado }}
            </span>
          </button>

          <p v-if="!solicitudesMostradas.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
            Sin solicitudes.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho: detalle / acciones ──────────────────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selected" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-15H6a2.25 2.25 0 0 0-2.25 2.25v15A2.25 2.25 0 0 0 6 21.75h12a2.25 2.25 0 0 0 2.25-2.25V8.25L15.75 3Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona una solicitud</p>
      </div>

      <!-- Detalle -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ labelTipo(selected.tipo) }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {{ selected.rango.start_date }} → {{ selected.rango.end_date }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded-full font-medium"
              :class="chipEstado(selected.estado)">
              {{ selected.estado }}
            </span>
            <button @click="selectedId = null" class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Detalle reemplazo (si está aprobada) -->
        <div v-if="selected.estado === 'aprobada' && selected.reemplazo"
          class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 space-y-1">
          <p class="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Reemplazo definido</p>
          <p class="text-xs text-emerald-600 dark:text-emerald-500">
            Empleado: <strong>{{ selected.reemplazo.empleado_id }}</strong>
          </p>
          <p class="text-xs text-emerald-600 dark:text-emerald-500">
            Período: {{ selected.reemplazo.rango.start_date }} → {{ selected.reemplazo.rango.end_date }}
          </p>
        </div>

        <!-- Aviso de reasignación manual -->
        <div v-if="esManager && selected.estado === 'aprobada'"
          class="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
          <p class="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Atención</p>
          <p class="text-xs text-amber-600 dark:text-amber-500">
            Recuerda reasignar manualmente los turnos afectados. El algoritmo NO se re-ejecuta automáticamente.
          </p>
        </div>

        <!-- Formulario de aprobación (solo manager + pendiente) -->
        <div v-if="esManager && selected.estado === 'pendiente'" class="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">Decisión</p>

          <!-- Definir reemplazo (opcional) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Definir reemplazo</label>
              <button type="button" @click="conReemplazo = !conReemplazo"
                class="relative w-8 h-4 rounded-full transition-colors"
                :class="conReemplazo ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'">
                <span class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform"
                  :class="conReemplazo ? 'translate-x-4' : 'translate-x-0'" />
              </button>
            </div>

            <div v-if="conReemplazo" class="space-y-2">
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Empleado reemplazante</label>
                <select v-model="reemplazandoEmpleadoId"
                  class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white">
                  <option value="">Seleccionar…</option>
                  <option v-for="emp in empleadosActivos" :key="emp.id" :value="emp.id">
                    {{ emp.displayName }}
                  </option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Desde</label>
                  <input v-model="reemplazandoDesde" type="date"
                    class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hasta</label>
                  <input v-model="reemplazandoHasta" type="date"
                    class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white" />
                </div>
              </div>
            </div>
          </div>

          <p v-if="accionError" class="text-xs text-red-500 dark:text-red-400">{{ accionError }}</p>

          <div class="flex gap-2">
            <button type="button" @click="rechazar" :disabled="accionando"
              class="flex-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40">
              Rechazar
            </button>
            <button type="button" @click="aprobar" :disabled="accionando"
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-40">
              {{ accionando ? 'Guardando…' : 'Aprobar' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Modal: nueva solicitud (empleado) ──────────────────────────────── -->
    <transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modalNuevaAbierto"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="modalNuevaAbierto = false">
        <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Nueva solicitud</p>
            <button @click="modalNuevaAbierto = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
            <select v-model="nuevaForm.tipo"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white">
              <option value="licencia_medica">Licencia médica</option>
              <option value="feriado_legal">Feriado legal</option>
              <option value="emergencia">Emergencia</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Desde</label>
              <input v-model="nuevaForm.start_date" type="date"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hasta</label>
              <input v-model="nuevaForm.end_date" type="date"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white" />
            </div>
          </div>

          <p v-if="nuevaError" class="text-xs text-red-500 dark:text-red-400">{{ nuevaError }}</p>

          <div class="flex gap-2 pt-1">
            <button type="button" @click="modalNuevaAbierto = false"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="crearSolicitud" :disabled="creando"
              class="flex-1 px-3 py-2 text-sm text-white font-medium bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-40">
              {{ creando ? 'Enviando…' : 'Enviar solicitud' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../../stores/sessionStore';
import { useGrantStore } from '../../stores/grantStore';
import { useSolicitudStore } from '../../stores/solicitudStore';
import { useEmpleadoStore } from '../../stores/empleadoStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import type { Solicitud, SolicitudEstado, SolicitudReemplazo } from '../../models/Solicitud';

const router = useRouter();
const sessionStore = useSessionStore();
const grantStore = useGrantStore();
const solicitudStore = useSolicitudStore();
const empleadoStore = useEmpleadoStore();
const empresaStore = useEmpresaStore();

watchEffect(() => {
  if (empresaStore.isCongregacion) {
    router.replace({ name: 'sucursal-dashboard' });
  }
});

const ubicacionId = computed(() => sessionStore.activeUbicacionId ?? '');
const companyId = computed(() => sessionStore.activeCompanyId ?? '');
const userId = computed(() => sessionStore.currentUser?.id ?? '');

const esManager = computed(() => {
  const user = sessionStore.currentUser;
  if (!user) return false;
  return grantStore.canDo(user, 'requests.manage', 'branch', ubicacionId.value, {
    companyId: companyId.value,
  });
});

const empleadosActivos = computed(() => empleadoStore.empleadosActivos ?? []);

onMounted(() => {
  if (!ubicacionId.value) return;
  if (esManager.value) {
    solicitudStore.listarPorSucursal(ubicacionId.value);
    if (companyId.value) empleadoStore.listarEmpleados(companyId.value);
  } else {
    if (userId.value) solicitudStore.listarPorEmpleado(userId.value);
  }
});

// ── Tabs (manager) ───────────────────────────────────────────────────────────

const tabs: { value: SolicitudEstado; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
];
const tabActiva = ref<SolicitudEstado>('pendiente');

const solicitudesMostradas = computed(() => {
  const todas = solicitudStore.solicitudes ?? [];
  if (!esManager.value) return todas;
  return todas.filter(s => s.estado === tabActiva.value);
});

// ── Selección ────────────────────────────────────────────────────────────────

const selectedId = ref<string | null>(null);
const selected = computed(() =>
  solicitudStore.solicitudes?.find(s => s.id === selectedId.value) ?? null
);

function seleccionar(s: Solicitud) {
  selectedId.value = s.id === selectedId.value ? null : s.id;
  accionError.value = '';
  conReemplazo.value = false;
  reemplazandoEmpleadoId.value = '';
  reemplazandoDesde.value = '';
  reemplazandoHasta.value = '';
}

// ── Aprobación/rechazo ───────────────────────────────────────────────────────

const conReemplazo = ref(false);
const reemplazandoEmpleadoId = ref('');
const reemplazandoDesde = ref('');
const reemplazandoHasta = ref('');
const accionando = ref(false);
const accionError = ref('');

async function aprobar() {
  if (!selected.value) return;
  accionando.value = true;
  accionError.value = '';
  try {
    let reemplazo: SolicitudReemplazo | null = null;
    if (conReemplazo.value && reemplazandoEmpleadoId.value && reemplazandoDesde.value && reemplazandoHasta.value) {
      reemplazo = {
        empleado_id: reemplazandoEmpleadoId.value,
        rango: { start_date: reemplazandoDesde.value, end_date: reemplazandoHasta.value },
      };
    }
    await solicitudStore.aprobarSolicitud(selected.value.id, userId.value, reemplazo);
    selectedId.value = null;
  } catch (e: any) {
    accionError.value = e.message ?? 'Error al aprobar.';
  } finally {
    accionando.value = false;
  }
}

async function rechazar() {
  if (!selected.value) return;
  accionando.value = true;
  accionError.value = '';
  try {
    await solicitudStore.rechazarSolicitud(selected.value.id, userId.value);
    selectedId.value = null;
  } catch (e: any) {
    accionError.value = e.message ?? 'Error al rechazar.';
  } finally {
    accionando.value = false;
  }
}

// ── Modal nueva solicitud (empleado) ─────────────────────────────────────────

const modalNuevaAbierto = ref(false);
const nuevaForm = ref({ tipo: 'emergencia' as const, start_date: '', end_date: '' });
const creando = ref(false);
const nuevaError = ref('');

function abrirModalNueva() {
  nuevaForm.value = { tipo: 'emergencia', start_date: '', end_date: '' };
  nuevaError.value = '';
  modalNuevaAbierto.value = true;
}

async function crearSolicitud() {
  if (!nuevaForm.value.start_date || !nuevaForm.value.end_date) {
    nuevaError.value = 'El rango de fechas es obligatorio.';
    return;
  }
  creando.value = true;
  nuevaError.value = '';
  try {
    await solicitudStore.createSolicitud({
      empresa_id: companyId.value,
      empleado_id: userId.value,
      sucursal_id: ubicacionId.value,
      tipo: nuevaForm.value.tipo,
      rango: { start_date: nuevaForm.value.start_date, end_date: nuevaForm.value.end_date },
    });
    modalNuevaAbierto.value = false;
  } catch (e: any) {
    nuevaError.value = e.message ?? 'Error al enviar.';
  } finally {
    creando.value = false;
  }
}

// ── Helpers de display ────────────────────────────────────────────────────────

function labelTipo(tipo: string) {
  const map: Record<string, string> = {
    licencia_medica: 'Licencia médica',
    feriado_legal: 'Feriado legal',
    emergencia: 'Emergencia',
  };
  return map[tipo] ?? tipo;
}

function badgeEstado(estado: string) {
  if (estado === 'aprobada') return 'bg-emerald-500';
  if (estado === 'rechazada') return 'bg-red-500';
  return 'bg-amber-500';
}

function chipEstado(estado: string) {
  if (estado === 'aprobada') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (estado === 'rechazada') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
}
</script>
