<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de estaciones ──────────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estaciones</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Puestos operativos que se cubren en cada turno.</p>
          </div>
          <button v-if="canManage" @click="openAdd"
            class="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
            + Estación
          </button>
        </div>

        <!-- Lista -->
        <div class="space-y-0.5">
          <button
            v-for="e in estaciones"
            :key="e.id"
            type="button"
            @click="selectEstacion(e)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
            :class="selectedEstacion?.id === e.id
              ? 'bg-violet-50 dark:bg-violet-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
          >
            <span class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              :class="selectedEstacion?.id === e.id
                ? 'bg-violet-100 dark:bg-violet-800/60 text-violet-600 dark:text-violet-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate"
                :class="selectedEstacion?.id === e.id ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-200'">
                {{ e.nombre }}
              </p>
              <p v-if="e.descripcion" class="text-xs truncate"
                :class="selectedEstacion?.id === e.id ? 'text-violet-400 dark:text-violet-500' : 'text-gray-400 dark:text-gray-500'">
                {{ e.descripcion }}
              </p>
            </div>
            <span v-if="!e.active"
              class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
              inactiva
            </span>
            <svg v-if="selectedEstacion?.id === e.id"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 shrink-0 text-violet-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <p v-if="!estaciones.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin estaciones definidas aún.
          </p>
        </div>

        <!-- Formulario agregar -->
        <div v-if="addOpen && canManage" class="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">Nueva estación</p>
          <input v-model="addForm.nombre" type="text" placeholder="Ej: Caja, Plancha, Salsera"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white" />
          <input v-model="addForm.descripcion" type="text" placeholder="Descripción (opcional)"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white" />
          <p v-if="addError" class="text-xs text-red-500 dark:text-red-400">{{ addError }}</p>
          <div class="flex gap-2">
            <button type="button" @click="closeAdd"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="submitAdd" :disabled="adding"
              class="flex-1 px-3 py-2 text-sm text-white font-medium rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-40">
              {{ adding ? 'Creando…' : 'Crear' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Panel derecho: editor ─────────────────────────────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selectedEstacion" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona una estación</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Haz clic en una estación de la lista para editarla.</p>
      </div>

      <!-- Editor -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera del editor -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center text-violet-600 dark:text-violet-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selectedEstacion.nombre }}</p>
                <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="selectedEstacion.active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'">
                  {{ selectedEstacion.active ? 'activa' : 'inactiva' }}
                </span>
              </div>
              <p class="text-xs text-violet-500 dark:text-violet-400 font-medium">Estación</p>
            </div>
          </div>
          <button @click="selectedEstacion = null" class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Campos -->
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input v-model="editForm.nombre" type="text" :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white disabled:opacity-60 transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea v-model="editForm.descripcion" rows="3" :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white disabled:opacity-60 resize-none transition-colors"
              placeholder="Descripción de la estación..." />
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Estación activa</span>
            <button type="button" :disabled="!canManage" @click="editForm.active = !editForm.active"
              class="relative w-10 h-5 rounded-full transition-colors duration-300 disabled:cursor-not-allowed"
              :class="editForm.active ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                :class="editForm.active ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>
        </div>

        <p v-if="editError" class="text-xs text-red-500 dark:text-red-400">{{ editError }}</p>
        <p v-if="editSuccess" class="text-xs text-green-600 dark:text-green-400 font-medium">{{ editSuccess }}</p>

        <div v-if="canManage" class="flex items-center gap-2 pt-1">
          <button type="button" @click="confirmDelete"
            class="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
            Eliminar
          </button>
          <div class="flex-1" />
          <button type="button" @click="resetEdit" :disabled="!isDirty"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
            Deshacer
          </button>
          <button type="button" @click="save" :disabled="!isDirty || saving"
            class="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../../../stores/empresaStore';
import { useSessionStore } from '../../../stores/sessionStore';
import { useEstacionStore } from '../../../stores/estacionStore';
import type { Estacion } from '../../../models/Estacion';

const route = useRoute();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();
const estacionStore = useEstacionStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);

onMounted(() => {
  if (empresa.value?.id) estacionStore.listarEstaciones(empresa.value.id);
});

watch(() => empresa.value?.id, (id) => {
  if (id) estacionStore.listarEstaciones(id);
});

const estaciones = computed(() => estacionStore.estaciones ?? []);

// ── Selección ─────────────────────────────────────────────────────────────────

const selectedEstacion = ref<Estacion | null>(null);

function selectEstacion(e: Estacion) {
  if (selectedEstacion.value?.id === e.id) {
    selectedEstacion.value = null;
    return;
  }
  selectedEstacion.value = e;
}

// ── Formulario edición ────────────────────────────────────────────────────────

type EditForm = { nombre: string; descripcion: string; active: boolean };

const editForm = ref<EditForm>({ nombre: '', descripcion: '', active: true });
const editSnapshot = ref<EditForm>({ nombre: '', descripcion: '', active: true });

watch(selectedEstacion, (e) => {
  editError.value = '';
  editSuccess.value = '';
  if (!e) return;
  const f: EditForm = { nombre: e.nombre, descripcion: e.descripcion, active: e.active };
  editForm.value = { ...f };
  editSnapshot.value = { ...f };
});

const isDirty = computed(() =>
  editForm.value.nombre !== editSnapshot.value.nombre ||
  editForm.value.descripcion !== editSnapshot.value.descripcion ||
  editForm.value.active !== editSnapshot.value.active
);

function resetEdit() {
  editForm.value = { ...editSnapshot.value };
}

// ── Estado ────────────────────────────────────────────────────────────────────

const saving = ref(false);
const editError = ref('');
const editSuccess = ref('');

function showSuccess() {
  editSuccess.value = 'Guardado correctamente.';
  setTimeout(() => { editSuccess.value = ''; }, 3000);
}

async function save() {
  if (!selectedEstacion.value || !isDirty.value) return;
  if (!editForm.value.nombre.trim()) { editError.value = 'El nombre es obligatorio.'; return; }
  saving.value = true;
  editError.value = '';
  try {
    await estacionStore.updateEstacion(selectedEstacion.value.id, {
      nombre: editForm.value.nombre.trim(),
      descripcion: editForm.value.descripcion.trim(),
      active: editForm.value.active,
    });
    editSnapshot.value = { ...editForm.value };
    showSuccess();
  } catch (e: any) {
    editError.value = e.message ?? 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!selectedEstacion.value) return;
  if (!confirm(`¿Eliminar la estación "${selectedEstacion.value.nombre}"?`)) return;
  try {
    await estacionStore.softDeleteEstacion(selectedEstacion.value.id);
    selectedEstacion.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Formulario agregar ────────────────────────────────────────────────────────

const addOpen = ref(false);
const addForm = ref({ nombre: '', descripcion: '' });
const adding = ref(false);
const addError = ref('');

function openAdd() {
  addOpen.value = true;
  addForm.value = { nombre: '', descripcion: '' };
  addError.value = '';
  selectedEstacion.value = null;
}

function closeAdd() {
  addOpen.value = false;
  addError.value = '';
}

async function submitAdd() {
  if (!empresa.value) return;
  if (!addForm.value.nombre.trim()) { addError.value = 'El nombre es obligatorio.'; return; }
  adding.value = true;
  addError.value = '';
  try {
    await estacionStore.createEstacion({
      empresa_id: empresa.value.id,
      nombre: addForm.value.nombre.trim(),
      descripcion: addForm.value.descripcion.trim(),
    });
    closeAdd();
  } catch (e: any) {
    addError.value = e.message ?? 'Error al crear.';
  } finally {
    adding.value = false;
  }
}
</script>
