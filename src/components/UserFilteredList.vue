<template>
  <div class="flex flex-col gap-4">

    <!-- Tarjeta de Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Filtros de búsqueda</h3>
      <div class="flex flex-col sm:flex-row gap-3">

        <!-- Select de empresa (solo modo multi) -->
        <select
          v-if="mode === 'multi'"
          v-model="selectedEmpresaId"
          class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="">Todas las empresas</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.contacto?.first_name || empresa.slug || empresa.id }}
          </option>
        </select>

        <!-- Input de búsqueda libre -->
        <div class="relative flex-[2]">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            v-model="searchText"
            type="text"
            :placeholder="mode === 'multi' ? 'Buscar por nombre, email, RUT o empresa...' : 'Buscar por nombre, email o RUT...'"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <!-- Botón limpiar -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="shrink-0 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>

    <!-- Tarjeta de Lista -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Usuarios</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ filteredUsers.length }} usuario{{ filteredUsers.length !== 1 ? 's' : '' }}
            <span v-if="hasActiveFilters"> encontrado{{ filteredUsers.length !== 1 ? 's' : '' }}</span>
          </p>
        </div>
        <button
          @click="$emit('add-user')"
          class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          + Añadir Usuario
        </button>
      </div>

      <div v-if="filteredUsers.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <th class="p-4 font-medium">Nombre</th>
              <th class="p-4 font-medium">RUT</th>
              <th class="p-4 font-medium">Correo</th>
              <!-- Columna empresa solo en modo multi -->
              <th v-if="mode === 'multi'" class="p-4 font-medium">Empresa</th>
              <th class="p-4 font-medium">Rol en Sistema</th>
              <th class="p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors"
            >
              <td class="p-4 text-sm text-gray-900 dark:text-white font-medium">
                {{ user.contacto?.first_name || 'Cargando...' }} {{ user.contacto?.last_name || '' }}
              </td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{{ user.contacto?.rut || '...' }}</td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ user.contacto?.email || '...' }}</td>
              <td v-if="mode === 'multi'" class="p-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                {{ getCompanyName(user.empresa_id) }}
              </td>
              <td class="p-4 text-sm">
                <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-md capitalize">
                  {{ user.system_role.replace('_', ' ') }}
                </span>
              </td>
              <td class="p-4 text-sm flex gap-3">
                <button @click="$emit('edit-user', user)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">Editar</button>
                <button @click="$emit('delete-user', user)" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-16 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <span class="text-2xl">👥</span>
        </div>
        <h3 class="text-md font-semibold text-gray-900 dark:text-white">
          {{ hasActiveFilters ? 'Sin resultados' : 'Aún no hay registros' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          {{ hasActiveFilters
            ? 'No se encontraron usuarios con los filtros actuales. Intenta con otros términos.'
            : 'Aquí aparecerá el listado de usuarios. Utiliza el botón superior para empezar a registrar.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Usuario } from '../models/Usuario';
import type { Empresa } from '../models/Empresa';

const props = defineProps<{
  mode: 'multi' | 'single'
  usuarios: Usuario[]
  empresas: Empresa[]
}>();

defineEmits<{
  'add-user': []
  'edit-user': [user: Usuario]
  'delete-user': [user: Usuario]
}>();

const selectedEmpresaId = ref('');
const searchText = ref('');

const hasActiveFilters = computed(() =>
  selectedEmpresaId.value !== '' || searchText.value.trim() !== ''
);

const getCompanyName = (empresaId: string | null): string => {
  if (!empresaId) return 'N/A';
  const empresa = props.empresas?.find((e) => e.id === empresaId);
  return empresa?.contacto?.first_name || empresa?.slug || 'Cargando...';
};

const filteredUsers = computed(() => {
  // Excluir siempre los super_admins (tienen su propia lista arriba)
  let list = (props.usuarios ?? []).filter((u) => u.system_role !== 'super_admin');

  // Filtro por empresa (solo activo en modo multi)
  if (props.mode === 'multi' && selectedEmpresaId.value) {
    list = list.filter((u) => u.empresa_id === selectedEmpresaId.value);
  }

  // Filtro por texto libre
  const term = searchText.value.trim().toLowerCase();
  if (term) {
    list = list.filter((u) => {
      const fullName = `${u.contacto?.first_name ?? ''} ${u.contacto?.last_name ?? ''}`.toLowerCase();
      const email = (u.contacto?.email ?? '').toLowerCase();
      const rut = (u.contacto?.rut ?? '').toLowerCase();
      // En modo multi también busca por nombre de empresa
      const company = props.mode === 'multi' ? getCompanyName(u.empresa_id).toLowerCase() : '';
      return fullName.includes(term) || email.includes(term) || rut.includes(term) || company.includes(term);
    });
  }

  return list;
});

const clearFilters = () => {
  selectedEmpresaId.value = '';
  searchText.value = '';
};
</script>
