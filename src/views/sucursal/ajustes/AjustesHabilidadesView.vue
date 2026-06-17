<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de habilidades ────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Habilidades</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Competencias y experiencia del personal.</p>
          </div>
          <button v-if="canManage" @click="openAdd"
            class="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
            + Habilidad
          </button>
        </div>

        <!-- Lista -->
        <div class="space-y-0.5">
          <button
            v-for="h in habilidades"
            :key="h.id"
            type="button"
            @click="selectHabilidad(h)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
            :class="selectedHabilidad?.id === h.id
              ? 'bg-violet-50 dark:bg-violet-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
          >
            <span class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              :class="selectedHabilidad?.id === h.id
                ? 'bg-violet-100 dark:bg-violet-800/60 text-violet-600 dark:text-violet-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342m-7.483 0a49.974 49.974 0 0 0 1 4.9m3.742-1.558V7.5a1.5 1.5 0 0 1 3 0v4.89m0 0 .001.009" />
              </svg>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate"
                :class="selectedHabilidad?.id === h.id ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-200'">
                {{ h.nombre }}
              </p>
              <p v-if="h.descripcion" class="text-xs truncate"
                :class="selectedHabilidad?.id === h.id ? 'text-violet-400 dark:text-violet-500' : 'text-gray-400 dark:text-gray-500'">
                {{ h.descripcion }}
              </p>
            </div>
            <span v-if="!h.active"
              class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
              inactiva
            </span>
            <svg v-if="selectedHabilidad?.id === h.id"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 shrink-0 text-violet-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <p v-if="!habilidades.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin habilidades definidas aún.
          </p>
        </div>

        <!-- Formulario agregar -->
        <div v-if="addOpen && canManage" class="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">Nueva habilidad</p>
          <input v-model="addForm.nombre" type="text" placeholder="Nombre de la habilidad"
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

    <!-- ── Panel derecho: editor ─────────────────────────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selectedHabilidad" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342m-7.483 0a49.974 49.974 0 0 0 1 4.9m3.742-1.558V7.5a1.5 1.5 0 0 1 3 0v4.89m0 0 .001.009" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona una habilidad</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Haz clic en una habilidad de la lista para editarla.</p>
      </div>

      <!-- Editor -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera del editor -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center text-violet-600 dark:text-violet-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342m-7.483 0a49.974 49.974 0 0 0 1 4.9m3.742-1.558V7.5a1.5 1.5 0 0 1 3 0v4.89m0 0 .001.009" />
              </svg>
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selectedHabilidad.nombre }}</p>
                <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="selectedHabilidad.active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'">
                  {{ selectedHabilidad.active ? 'activa' : 'inactiva' }}
                </span>
              </div>
              <p class="text-xs text-violet-500 dark:text-violet-400 font-medium">Habilidad</p>
            </div>
          </div>
          <button @click="selectedHabilidad = null" class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
              placeholder="Descripción de la habilidad..." />
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Habilidad activa</span>
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
import { useHabilidadStore } from '../../../stores/habilidadStore';
import type { Habilidad } from '../../../models/Habilidad';

const route = useRoute();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();
const habilidadStore = useHabilidadStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);

onMounted(() => {
  if (empresa.value?.id) habilidadStore.listarHabilidades(empresa.value.id);
});

watch(() => empresa.value?.id, (id) => {
  if (id) habilidadStore.listarHabilidades(id);
});

const habilidades = computed(() => habilidadStore.habilidades ?? []);

// ── Selección ────────────────────────────────────────────────────────────────

const selectedHabilidad = ref<Habilidad | null>(null);

function selectHabilidad(h: Habilidad) {
  if (selectedHabilidad.value?.id === h.id) {
    selectedHabilidad.value = null;
    return;
  }
  selectedHabilidad.value = h;
}

// ── Formulario edición ───────────────────────────────────────────────────────

type EditForm = { nombre: string; descripcion: string; active: boolean };

const editForm = ref<EditForm>({ nombre: '', descripcion: '', active: true });
const editSnapshot = ref<EditForm>({ nombre: '', descripcion: '', active: true });

watch(selectedHabilidad, (h) => {
  editError.value = '';
  editSuccess.value = '';
  if (!h) return;
  const f: EditForm = { nombre: h.nombre, descripcion: h.descripcion, active: h.active };
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

// ── Estado ───────────────────────────────────────────────────────────────────

const saving = ref(false);
const editError = ref('');
const editSuccess = ref('');

function showSuccess() {
  editSuccess.value = 'Guardado correctamente.';
  setTimeout(() => { editSuccess.value = ''; }, 3000);
}

async function save() {
  if (!selectedHabilidad.value || !isDirty.value) return;
  if (!editForm.value.nombre.trim()) { editError.value = 'El nombre es obligatorio.'; return; }
  saving.value = true;
  editError.value = '';
  try {
    await habilidadStore.updateHabilidad(selectedHabilidad.value.id, {
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
  if (!selectedHabilidad.value) return;
  if (!confirm(`¿Eliminar la habilidad "${selectedHabilidad.value.nombre}"?`)) return;
  try {
    await habilidadStore.softDeleteHabilidad(selectedHabilidad.value.id);
    selectedHabilidad.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Formulario agregar ───────────────────────────────────────────────────────

const addOpen = ref(false);
const addForm = ref({ nombre: '', descripcion: '' });
const adding = ref(false);
const addError = ref('');

function openAdd() {
  addOpen.value = true;
  addForm.value = { nombre: '', descripcion: '' };
  addError.value = '';
  selectedHabilidad.value = null;
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
    await habilidadStore.createHabilidad({
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
