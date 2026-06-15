<template>
  <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Roles de trabajo</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Roles que pueden asignarse al personal. Los roles secundarios heredan la jerarquía del rol padre.
      </p>
    </div>

    <div class="p-6 space-y-4">
      <!-- Árbol de roles -->
      <div v-if="empresa.work_roles?.length" class="space-y-1">
        <RoleTreeItem
          v-for="role in rolesRaiz"
          :key="role.id"
          :role="role"
          :all-roles="empresa.work_roles"
          :can-manage="canManage"
          @remove="removeRole"
        />
      </div>
      <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Sin roles definidos.</p>

      <!-- Formulario agregar -->
      <form v-if="canManage" @submit.prevent="addRole" class="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Agregar rol</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            v-model="newNombre"
            type="text"
            placeholder="Nombre  (ej: Supervisor)"
            maxlength="40"
            class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
          />
          <input
            v-model="newSlug"
            type="text"
            placeholder="Slug  (ej: supervisor)"
            maxlength="40"
            class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <div class="flex gap-2">
          <select
            v-model="newParentId"
            class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">Sin rol padre (raíz)</option>
            <option v-for="r in empresa.work_roles" :key="r.id" :value="r.id">
              {{ r.nombre }}
            </option>
          </select>
          <button
            type="submit"
            :disabled="!newNombre.trim() || !newSlug.trim() || adding"
            class="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            + Agregar
          </button>
        </div>
        <p v-if="error" class="text-xs text-red-500 dark:text-red-400">{{ error }}</p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useEmpresaStore } from '../../stores/empresaStore';
import type { Empresa } from '../../models/Empresa';
import type { Role } from '../../models/Role';
import RoleTreeItem from './RoleTreeItem.vue';

const props = defineProps<{ empresa: Empresa; canManage: boolean }>();

const empresaStore = useEmpresaStore();

const newNombre   = ref('');
const newSlug     = ref('');
const newParentId = ref('');
const adding      = ref(false);
const error       = ref('');

const rolesRaiz = computed(() =>
  (props.empresa.work_roles ?? []).filter(r => r.parent_role === null)
);

function autoSlug(nombre: string) {
  return nombre.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

let slugManual = false;
let updatingFromNombre = false;

watch(newNombre, (nombre) => {
  if (!slugManual) {
    updatingFromNombre = true;
    newSlug.value = autoSlug(nombre);
    updatingFromNombre = false;
  }
});

watch(newSlug, (val) => {
  if (!updatingFromNombre) {
    slugManual = val !== '' && val !== autoSlug(newNombre.value);
  }
});

async function addRole() {
  error.value = '';
  adding.value = true;
  try {
    await empresaStore.addWorkRole(props.empresa.id, {
      nombre: newNombre.value.trim(),
      slug: newSlug.value.trim(),
      parent_role: newParentId.value || null,
    });
    newNombre.value = '';
    newSlug.value = '';
    newParentId.value = '';
    slugManual = false;
  } catch (e: any) {
    error.value = e.message || 'Error al agregar el rol.';
  } finally {
    adding.value = false;
  }
}

async function removeRole(role: Role) {
  if (!confirm(`¿Eliminar el rol "${role.nombre}"?`)) return;
  error.value = '';
  try {
    await empresaStore.removeWorkRole(props.empresa.id, role.id);
  } catch (e: any) {
    error.value = e.message || 'Error al eliminar el rol.';
  }
}
</script>
