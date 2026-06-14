<template>
  <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Roles de trabajo</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Roles que pueden asignarse al personal de esta organización.
      </p>
    </div>

    <div class="p-6 space-y-4">
      <!-- Pills de roles existentes -->
      <div class="flex flex-wrap gap-2 min-h-[2rem]">
        <span v-if="!empresa.work_roles?.length" class="text-sm text-gray-400 dark:text-gray-500 italic">
          Sin roles definidos.
        </span>
        <span v-for="role in empresa.work_roles" :key="role"
          class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          {{ role }}
          <button v-if="canManage" @click="removeRole(role)"
            class="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded-full text-indigo-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
            :title="`Eliminar rol '${role}'`">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
            </svg>
          </button>
        </span>
      </div>

      <!-- Agregar rol -->
      <form v-if="canManage" @submit.prevent="addRole" class="flex gap-2">
        <input v-model="newRole" type="text" placeholder="Ej: cajero, supervisor…" maxlength="40"
          class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400">
        <button type="submit" :disabled="!newRole.trim() || adding"
          class="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors whitespace-nowrap">
          + Agregar
        </button>
      </form>
      <p v-if="error" class="text-xs text-red-500 dark:text-red-400">{{ error }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEmpresaStore } from '../../stores/empresaStore';
import type { Empresa } from '../../models/Empresa';

const props = defineProps<{ empresa: Empresa; canManage: boolean }>();

const empresaStore = useEmpresaStore();
const newRole = ref('');
const adding  = ref(false);
const error   = ref('');

async function addRole() {
  const role = newRole.value.trim().toLowerCase().replace(/\s+/g, '_');
  if (!role) return;
  if (props.empresa.work_roles.includes(role)) {
    error.value = `El rol "${role}" ya existe.`;
    return;
  }
  error.value = '';
  adding.value = true;
  try {
    await empresaStore.addWorkRole(props.empresa.id, role);
    newRole.value = '';
  } finally {
    adding.value = false;
  }
}

async function removeRole(role: string) {
  if (!confirm(`¿Eliminar el rol "${role}"? Esto no afecta al personal ya asignado.`)) return;
  await empresaStore.removeWorkRole(props.empresa.id, role);
}
</script>
