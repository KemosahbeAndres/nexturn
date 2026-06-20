<template>
  <div class="flex flex-1 min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista de roles ──────────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Cargos de trabajo</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Selecciona un cargo para editarlo.</p>
          </div>
          <button v-if="canManage && !showAddForm" @click="openAdd"
            class="shrink-0 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            + Agregar
          </button>
        </div>

        <!-- Lista de roles (árbol) -->
        <div v-if="empresa?.cargos?.length" class="space-y-0.5">
          <RoleRow
            v-for="role in rolesRaiz"
            :key="role.id"
            :role="role"
            :all-roles="empresa.cargos"
            :selected-id="selectedRole?.id ?? null"
            @select="selectRole"
          />
        </div>
        <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic py-4">Sin roles definidos aún.</p>

        <!-- Formulario agregar -->
        <div v-if="showAddForm && canManage" class="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nuevo rol</p>
          <div class="space-y-2">
            <input v-model="addForm.nombre" type="text" placeholder="Nombre (ej: Supervisor)" maxlength="40"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400" />
            <input v-model="addForm.slug" type="text" placeholder="Slug (ej: supervisor)" maxlength="40"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400 font-mono" />
            <select v-model="addForm.parent_role"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
              <option value="">Sin rol padre (raíz)</option>
              <option v-for="r in empresa?.cargos" :key="r.id" :value="r.id">{{ r.nombre }}</option>
            </select>
            <select v-model="addForm.scope_role_template"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
              <option value="">Sin acceso al sistema</option>
              <option value="zone_manager">Gestor de zona</option>
              <option value="branch_manager">Gestor de sucursal</option>
              <option value="member">Miembro</option>
            </select>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input v-model="addForm.elegible_encargado" type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Elegible como encargado</span>
            </label>
          </div>
          <p v-if="addError" class="text-xs text-red-500 dark:text-red-400">{{ addError }}</p>
          <div class="flex gap-2">
            <button type="button" @click="closeAdd"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="submitAdd" :disabled="!addForm.nombre.trim() || !addForm.slug.trim() || adding"
              class="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded-lg transition-colors">
              {{ adding ? 'Agregando…' : 'Agregar' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Panel derecho: editor del rol seleccionado ──────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Estado vacío -->
      <div v-if="!selectedRole" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona un rol de la lista</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Haz clic en cualquier rol para ver y editar sus detalles.</p>
      </div>

      <!-- Editor -->
      <div v-else class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera del panel -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selectedRole.nombre }}</p>
              <p class="text-xs font-mono text-gray-400 dark:text-gray-500 truncate">{{ selectedRole.slug }}</p>
            </div>
          </div>
          <button @click="selectedRole = null"
            class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Formulario de edición -->
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input v-model="editForm.nombre" type="text" maxlength="40"
              :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
            <input v-model="editForm.slug" type="text" maxlength="40"
              :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono disabled:opacity-60 disabled:cursor-not-allowed transition-colors" />
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">El slug se usa internamente para asignar roles al personal.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol padre</label>
            <select v-model="editForm.parent_role"
              :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              <option value="">Sin rol padre (raíz)</option>
              <option
                v-for="r in rolesDisponiblesComoParent"
                :key="r.id"
                :value="r.id">
                {{ r.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Acceso al sistema (template)</label>
            <select v-model="editForm.scope_role_template"
              :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              <option value="">Sin acceso al sistema</option>
              <option value="zone_manager">Gestor de zona</option>
              <option value="branch_manager">Gestor de sucursal</option>
              <option value="member">Miembro</option>
            </select>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Grant que se sugiere al crear un usuario para este cargo.</p>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="editForm.elegible_encargado" type="checkbox" id="edit-elegible-encargado"
              :disabled="!canManage"
              class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 disabled:opacity-60" />
            <label for="edit-elegible-encargado" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Elegible como encargado de zona o sucursal
            </label>
          </div>
        </div>

        <!-- Hijos del rol -->
        <div v-if="childRoles.length">
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Roles dependientes</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="child in childRoles" :key="child.id"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              {{ child.nombre }}
            </span>
          </div>
        </div>

        <p v-if="editError" class="text-xs text-red-500 dark:text-red-400">{{ editError }}</p>
        <p v-if="editSuccess" class="text-xs text-green-600 dark:text-green-400 font-medium">{{ editSuccess }}</p>

        <!-- Acciones -->
        <div v-if="canManage" class="flex items-center gap-2 pt-1">
          <button type="button" @click="submitDelete"
            class="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
            Eliminar
          </button>
          <div class="flex-1" />
          <button type="button" @click="resetEdit"
            :disabled="!isEditDirty"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
            Deshacer
          </button>
          <button type="button" @click="submitEdit"
            :disabled="!isEditDirty || saving"
            class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useSessionStore } from '../../stores/sessionStore';
import type { Role, ScopeRoleTemplate } from '../../models/Role';
import RoleRow from '../../components/empresa/RoleRow.vue';

const route = useRoute();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);

// ── Árbol de roles ──────────────────────────────────────────────────────────

const rolesRaiz = computed(() =>
  (empresa.value?.cargos ?? []).filter(r => r.parent_role === null)
);

// ── Selección ───────────────────────────────────────────────────────────────

const selectedRole = ref<Role | null>(null);

function selectRole(role: Role) {
  if (selectedRole.value?.id === role.id) {
    selectedRole.value = null;
  } else {
    selectedRole.value = role;
  }
}

// Mantener selectedRole sincronizado con el store (tras guardar, el objeto muta)
watch(() => empresa.value?.cargos, (roles) => {
  if (!roles || !selectedRole.value) return;
  const updated = roles.find(r => r.id === selectedRole.value!.id);
  if (!updated) { selectedRole.value = null; return; }
  selectedRole.value = updated;
}, { deep: true });

// ── Editor del rol seleccionado ─────────────────────────────────────────────

type EditForm = { nombre: string; slug: string; parent_role: string; scope_role_template: ScopeRoleTemplate | ''; elegible_encargado: boolean };
const editForm = ref<EditForm>({ nombre: '', slug: '', parent_role: '', scope_role_template: '', elegible_encargado: false });
const editSnapshot = ref<EditForm>({ nombre: '', slug: '', parent_role: '', scope_role_template: '', elegible_encargado: false });
const saving = ref(false);
const editError = ref('');
const editSuccess = ref('');

watch(selectedRole, (role) => {
  if (!role) return;
  const snap: EditForm = {
    nombre: role.nombre,
    slug: role.slug,
    parent_role: role.parent_role ?? '',
    scope_role_template: role.scope_role_template ?? '',
    elegible_encargado: role.elegible_encargado,
  };
  editForm.value = { ...snap };
  editSnapshot.value = { ...snap };
  editError.value = '';
  editSuccess.value = '';
});

const isEditDirty = computed(() =>
  (Object.keys(editForm.value) as (keyof EditForm)[]).some(
    k => editForm.value[k] !== editSnapshot.value[k]
  )
);

function resetEdit() {
  editForm.value = { ...editSnapshot.value };
  editError.value = '';
  editSuccess.value = '';
}

// Evitar que un rol se asigne a sí mismo o a un descendiente como padre
const childRoles = computed(() => {
  if (!selectedRole.value || !empresa.value) return [];
  return empresa.value.cargos.filter(r => r.parent_role === selectedRole.value!.id);
});

const rolesDisponiblesComoParent = computed(() => {
  if (!selectedRole.value || !empresa.value) return empresa.value?.cargos ?? [];
  const roles = empresa.value.cargos;
  const descIds = new Set(getDescendants(selectedRole.value.id, roles).map(r => r.id));
  descIds.add(selectedRole.value.id);
  return roles.filter(r => !descIds.has(r.id));
});

function getDescendants(roleId: string, roles: Role[]): Role[] {
  const result: Role[] = [];
  const queue = [roleId];
  while (queue.length) {
    const cur = queue.shift()!;
    const children = roles.filter(r => r.parent_role === cur);
    result.push(...children);
    queue.push(...children.map(c => c.id));
  }
  return result;
}

async function submitEdit() {
  if (!selectedRole.value || !empresa.value || !isEditDirty.value) return;
  saving.value = true;
  editError.value = '';
  editSuccess.value = '';
  try {
    await empresaStore.updateWorkRole(empresa.value.id, selectedRole.value.id, {
      nombre: editForm.value.nombre.trim(),
      slug: editForm.value.slug.trim(),
      parent_role: editForm.value.parent_role || null,
      scope_role_template: (editForm.value.scope_role_template || null) as ScopeRoleTemplate,
      elegible_encargado: editForm.value.elegible_encargado,
      estaciones_default: selectedRole.value.estaciones_default,
    });
    editSuccess.value = 'Rol actualizado correctamente.';
    setTimeout(() => { editSuccess.value = ''; }, 3000);
  } catch (e: any) {
    editError.value = e.message ?? 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

async function submitDelete() {
  if (!selectedRole.value || !empresa.value) return;
  if (!confirm(`¿Eliminar el rol "${selectedRole.value.nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    await empresaStore.removeWorkRole(empresa.value.id, selectedRole.value.id);
    selectedRole.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Formulario agregar ───────────────────────────────────────────────────────

const showAddForm = ref(false);
const addForm = ref({ nombre: '', slug: '', parent_role: '', scope_role_template: '' as ScopeRoleTemplate | '', elegible_encargado: false });
const adding = ref(false);
const addError = ref('');

let slugManual = false;
let updatingFromNombre = false;

watch(() => addForm.value.nombre, (nombre) => {
  if (!slugManual) {
    updatingFromNombre = true;
    addForm.value.slug = nombre.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    updatingFromNombre = false;
  }
});

watch(() => addForm.value.slug, (val) => {
  if (!updatingFromNombre) {
    const auto = addForm.value.nombre.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    slugManual = val !== '' && val !== auto;
  }
});

function openAdd() {
  showAddForm.value = true;
  selectedRole.value = null;
  addForm.value = { nombre: '', slug: '', parent_role: '', scope_role_template: '', elegible_encargado: false };
  addError.value = '';
  slugManual = false;
}

function closeAdd() {
  showAddForm.value = false;
  addError.value = '';
}

async function submitAdd() {
  if (!empresa.value || !addForm.value.nombre.trim() || !addForm.value.slug.trim()) return;
  adding.value = true;
  addError.value = '';
  try {
    await empresaStore.addWorkRole(empresa.value.id, {
      nombre: addForm.value.nombre.trim(),
      slug: addForm.value.slug.trim(),
      parent_role: addForm.value.parent_role || null,
      scope_role_template: (addForm.value.scope_role_template || null) as ScopeRoleTemplate,
      elegible_encargado: addForm.value.elegible_encargado,
    });
    closeAdd();
  } catch (e: any) {
    addError.value = e.message ?? 'Error al agregar el rol.';
  } finally {
    adding.value = false;
  }
}

</script>
