<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de empleados ──────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Disponibilidad</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Reglas base de disponibilidad del personal.</p>
        </div>

        <!-- Búsqueda -->
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input v-model="search" type="text" placeholder="Buscar empleado…"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
        </div>

        <!-- Lista -->
        <div class="space-y-0.5">
          <button
            v-for="emp in empleadosFiltrados"
            :key="emp.id"
            type="button"
            @click="selectEmpleado(emp)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
            :class="selected?.id === emp.id
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
          >
            <span class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              :class="selected?.id === emp.id
                ? 'bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'">
              {{ emp.initials }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate"
                :class="selected?.id === emp.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'">
                {{ emp.displayName }}
              </p>
              <p class="text-xs truncate"
                :class="selected?.id === emp.id ? 'text-blue-400 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'">
                {{ emp.disponibilidad ? diasLabel(emp.disponibilidad.days) : 'Sin disponibilidad definida' }}
              </p>
            </div>
            <span v-if="emp.disponibilidad"
              class="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              configurada
            </span>
            <svg v-if="selected?.id === emp.id"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 shrink-0 text-blue-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <p v-if="!empleadosFiltrados.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin empleados en esta sucursal.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho: editor de disponibilidad ──────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selected" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona un empleado</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Elige un empleado de la lista para configurar su disponibilidad.</p>
      </div>

      <!-- Editor -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-200">
              {{ selected.initials }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selected.displayName }}</p>
              <p class="text-xs text-blue-500 dark:text-blue-400 font-medium">Disponibilidad</p>
            </div>
          </div>
          <button @click="selected = null" class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Días de la semana + ventanas horarias -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días y horarios disponibles</label>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">Define de qué hora a qué hora puede trabajar cada día. Estas franjas alimentan la generación de turnos.</p>

          <!-- Selector de días -->
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="dia in diasSemana"
              :key="dia"
              type="button"
              :disabled="!canManage"
              @click="toggleDia(dia)"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:cursor-not-allowed"
              :class="diaTieneVentanas(dia)
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'"
            >
              {{ dia }}
            </button>
          </div>

          <!-- Editor de franjas por día activo -->
          <div class="space-y-2">
            <div
              v-for="dia in diasSemana.filter(diaTieneVentanas)"
              :key="dia"
              class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ dia }}</span>
                <button v-if="canManage" type="button" @click="agregarVentana(dia)"
                  class="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                  + Franja
                </button>
              </div>
              <div class="space-y-1.5">
                <div v-for="ventana in ventanasDeDia(dia)" :key="ventana.day_of_week + ventana.start + ventana.end" class="flex items-center gap-2">
                  <input v-model="ventana.start" type="time" :disabled="!canManage"
                    class="px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white tabular-nums disabled:opacity-60" />
                  <span class="text-xs text-gray-400">—</span>
                  <input v-model="ventana.end" type="time" :disabled="!canManage"
                    class="px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white tabular-nums disabled:opacity-60" />
                  <button v-if="canManage" type="button" @click="quitarVentana(ventana)"
                    class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Frecuencia mensual -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frecuencia mensual</label>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">Semanas al mes que trabaja (0 = todas).</p>
          <div class="flex gap-2">
            <button
              v-for="n in [0, 1, 2, 3, 4]"
              :key="n"
              type="button"
              :disabled="!canManage"
              @click="form.monthly_frequency = n"
              class="w-10 h-10 text-sm font-semibold rounded-lg border transition-colors disabled:cursor-not-allowed"
              :class="form.monthly_frequency === n
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400'"
            >
              {{ n === 0 ? '∞' : n }}
            </button>
          </div>
        </div>

        <!-- Frecuencia semanal -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días por semana</label>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">Cantidad de días que trabaja por semana.</p>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="n in [1, 2, 3, 4, 5, 6, 7]"
              :key="n"
              type="button"
              :disabled="!canManage"
              @click="form.weekly_frequency = n"
              class="w-10 h-10 text-sm font-semibold rounded-lg border transition-colors disabled:cursor-not-allowed"
              :class="form.weekly_frequency === n
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400'"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- Regla especial -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regla especial</label>
          <input v-model="form.special_rule" type="text" :disabled="!canManage"
            placeholder="Ej: 3 lunes y 1 miércoles al mes"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 transition-colors" />
        </div>

        <p v-if="errorMsg" class="text-xs text-red-500 dark:text-red-400">{{ errorMsg }}</p>
        <p v-if="successMsg" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{{ successMsg }}</p>

        <div v-if="canManage" class="flex items-center gap-2 pt-1">
          <button v-if="selected.disponibilidad" type="button" @click="confirmarBorrar"
            class="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
            Limpiar
          </button>
          <div class="flex-1" />
          <button type="button" @click="resetForm" :disabled="!isDirty"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
            Deshacer
          </button>
          <button type="button" @click="guardar" :disabled="!isDirty || saving"
            class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useSessionStore } from '../../../stores/sessionStore';
import { useEmpleadoStore } from '../../../stores/empleadoStore';
import { useDisponibilidadStore } from '../../../stores/disponibilidadStore';
import type { Empleado } from '../../../models/Empleado';

const sessionStore = useSessionStore();
const empleadoStore = useEmpleadoStore();
const disponibilidadStore = useDisponibilidadStore();

const canManage = computed(() => ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? ''));

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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

// Ventana editable en el formulario (una franja horaria para un día).
type Ventana = { day_of_week: string; start: string; end: string };
type FormState = { ventanas: Ventana[]; monthly_frequency: number; weekly_frequency: number; special_rule: string };

const emptyForm = (): FormState => ({ ventanas: [], monthly_frequency: 0, weekly_frequency: 1, special_rule: '' });

const form = ref<FormState>(emptyForm());
const snapshot = ref<FormState>(emptyForm());

function selectEmpleado(emp: Empleado) {
  if (selected.value?.id === emp.id) { selected.value = null; return; }
  selected.value = emp;
}

function cloneForm(f: FormState): FormState {
  return { ...f, ventanas: f.ventanas.map(v => ({ ...v })) };
}

watch(selected, (emp) => {
  errorMsg.value = '';
  successMsg.value = '';
  if (!emp) return;
  const d = emp.disponibilidad;
  const f: FormState = d
    ? {
        ventanas: (d.ventanas ?? []).map(v => ({ ...v })),
        monthly_frequency: d.monthly_frequency,
        weekly_frequency: d.weekly_frequency,
        special_rule: d.special_rule,
      }
    : emptyForm();
  form.value = cloneForm(f);
  snapshot.value = cloneForm(f);
});

const isDirty = computed(() =>
  JSON.stringify(form.value) !== JSON.stringify(snapshot.value)
);

function resetForm() {
  form.value = cloneForm(snapshot.value);
}

// ── Edición de ventanas por día ────────────────────────────────────────────────

// ¿Tiene el día al menos una ventana?
function diaTieneVentanas(dia: string): boolean {
  return form.value.ventanas.some(v => v.day_of_week === dia);
}

function ventanasDeDia(dia: string): Ventana[] {
  return form.value.ventanas.filter(v => v.day_of_week === dia);
}

// Activar/desactivar un día: al activarlo agrega una ventana por defecto; al desactivarlo
// elimina todas sus ventanas.
function toggleDia(dia: string) {
  if (diaTieneVentanas(dia)) {
    form.value.ventanas = form.value.ventanas.filter(v => v.day_of_week !== dia);
  } else {
    form.value.ventanas.push({ day_of_week: dia, start: '09:00', end: '18:00' });
  }
}

function agregarVentana(dia: string) {
  form.value.ventanas.push({ day_of_week: dia, start: '09:00', end: '18:00' });
}

function quitarVentana(ventana: Ventana) {
  const idx = form.value.ventanas.indexOf(ventana);
  if (idx >= 0) form.value.ventanas.splice(idx, 1);
}

function diasLabel(days: string[]): string {
  if (!days.length) return 'Sin días configurados';
  if (days.length <= 3) return days.join(', ');
  return `${days.slice(0, 2).join(', ')} +${days.length - 2} más`;
}

// ── Validación ─────────────────────────────────────────────────────────────────

// Devuelve un mensaje de error si las ventanas son inválidas, o null si están OK.
function validarVentanas(ventanas: Ventana[]): string | null {
  for (const v of ventanas) {
    if (!v.start || !v.end) return 'Completa las horas de inicio y fin de cada ventana.';
    if (v.start >= v.end) return `En ${v.day_of_week}, la hora de inicio debe ser menor que la de fin.`;
  }
  // Solapes intra-día
  for (const dia of diasSemana) {
    const delDia = ventanas
      .filter(v => v.day_of_week === dia)
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < delDia.length; i++) {
      if (delDia[i].start < delDia[i - 1].end) {
        return `En ${dia} hay franjas horarias que se solapan.`;
      }
    }
  }
  return null;
}

const saving = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

async function guardar() {
  if (!selected.value || !isDirty.value) return;
  const err = validarVentanas(form.value.ventanas);
  if (err) { errorMsg.value = err; return; }
  saving.value = true;
  errorMsg.value = '';
  try {
    const payload = {
      ventanas: form.value.ventanas.map(v => ({ ...v })),
      monthly_frequency: form.value.monthly_frequency,
      weekly_frequency: form.value.weekly_frequency,
      special_rule: form.value.special_rule,
    };
    if (selected.value.disponibilidad) {
      await disponibilidadStore.updateDisponibilidad(selected.value.id, payload);
    } else {
      await disponibilidadStore.setDisponibilidad(selected.value.id, payload);
    }
    snapshot.value = cloneForm(form.value);
    successMsg.value = 'Disponibilidad guardada.';
    setTimeout(() => { successMsg.value = ''; }, 3000);
  } catch (e: any) {
    errorMsg.value = e.message ?? 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

async function confirmarBorrar() {
  if (!selected.value) return;
  if (!confirm(`¿Limpiar la disponibilidad de ${selected.value.displayName}?`)) return;
  try {
    await disponibilidadStore.clearDisponibilidad(selected.value.id);
    form.value = emptyForm();
    snapshot.value = emptyForm();
  } catch (e: any) {
    errorMsg.value = e.message ?? 'Error al limpiar.';
  }
}
</script>
