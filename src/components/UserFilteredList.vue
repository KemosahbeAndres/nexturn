<template>
  <div class="flex flex-col gap-4">

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-300">
      <div class="flex flex-col sm:flex-row gap-3">

        <!-- Select custom empresa / rol (modo multi) -->
        <div v-if="mode === 'multi'" class="relative flex-1" ref="selectRef">
          <button
            type="button"
            @click.stop="selectOpen = !selectOpen"
            class="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-left"
          >
            <span class="truncate">{{ selectedFilterLabel }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0 ml-2 text-gray-400 transition-transform duration-150" :class="selectOpen ? 'rotate-180' : ''">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </button>
          <div
            v-if="selectOpen"
            class="absolute left-0 top-full mt-1 z-30 w-full min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto"
          >
            <button type="button" @click="selectedFilter = ''; selectOpen = false"
              class="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="selectedFilter === '' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'"
            >Todas las empresas</button>
            <button type="button" @click="selectedFilter = '__super_admin__'; selectOpen = false"
              class="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="selectedFilter === '__super_admin__' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'"
            >Solo Super Admins</button>
            <div class="my-1 border-t border-gray-100 dark:border-gray-700"></div>
            <button
              v-for="empresa in empresas"
              :key="empresa.id"
              type="button"
              @click="selectedFilter = empresa.id; selectOpen = false"
              class="w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="selectedFilter === empresa.id ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'"
            >{{ empresa.contacto?.first_name || empresa.slug || empresa.id }}</button>
          </div>
        </div>

        <!-- Búsqueda libre -->
        <div class="relative flex-[2]">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            v-model="searchText"
            type="text"
            :placeholder="mode === 'multi' ? 'Nombre, email, RUT o empresa...' : 'Nombre, email o RUT...'"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="shrink-0 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>

    <!-- Lista -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <!-- Cabecera -->
      <div class="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Usuarios</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {{ filteredUsers.length }} usuario{{ filteredUsers.length !== 1 ? 's' : '' }}
            <span v-if="hasActiveFilters"> encontrado{{ filteredUsers.length !== 1 ? 's' : '' }}</span>
          </p>
        </div>
        <button
          @click="$emit('add-user')"
          class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Añadir Usuario
        </button>
      </div>

      <!-- Tabla (lg+) -->
      <div v-if="filteredUsers.length > 0" class="hidden lg:block overflow-x-auto overflow-y-visible rounded-b-xl">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">Nombre</th>
              <th class="px-4 py-3 font-medium">RUT</th>
              <th class="px-4 py-3 font-medium">Correo</th>
              <th v-if="mode === 'multi'" class="px-4 py-3 font-medium">Empresa</th>
              <th class="px-4 py-3 font-medium">Rol</th>
              <th class="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ user.contacto?.first_name || '—' }} {{ user.contacto?.last_name || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{{ user.contacto?.rut || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ user.contacto?.email || '—' }}</td>
              <td v-if="mode === 'multi'" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ getCompanyName(user) }}
              </td>
              <td class="px-4 py-3">
                <span :class="roleBadgeClass(user.system_role)" class="inline-block px-2 py-0.5 text-xs font-semibold rounded-md capitalize">
                  {{ formatRole(user.system_role) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button @click="$emit('edit-user', user)" class="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Editar</button>
                  <button @click="$emit('delete-user', user)" class="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas (móvil + tablet) -->
      <div v-if="filteredUsers.length > 0" class="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="p-4 flex items-start justify-between gap-3"
        >
          <!-- Avatar + datos -->
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-300 font-bold text-sm">
              {{ initials(user) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ user.contacto?.first_name || '—' }} {{ user.contacto?.last_name || '' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ user.contacto?.email || '—' }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{{ user.contacto?.rut || '—' }}</p>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span :class="roleBadgeClass(user.system_role)" class="inline-block px-2 py-0.5 text-xs font-semibold rounded-md capitalize">
                  {{ formatRole(user.system_role) }}
                </span>
                <span v-if="mode === 'multi'" class="text-xs text-gray-400 dark:text-gray-500">
                  {{ getCompanyName(user) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Menú 3 puntos -->
          <div class="relative shrink-0" :ref="el => setMenuRef(user.id, el)">
            <button
              @click.stop="toggleMenu(user.id)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
                <path d="M12 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </button>
            <div
              v-if="openMenuId === user.id"
              class="absolute right-0 top-9 z-20 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 overflow-hidden"
            >
              <button
                @click="$emit('edit-user', user); closeMenu()"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
                Editar
              </button>
              <button
                @click="$emit('delete-user', user); closeMenu()"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="filteredUsers.length === 0" class="p-12 flex flex-col items-center justify-center text-center">
        <div class="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ hasActiveFilters ? 'Sin resultados' : 'Aún no hay usuarios' }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
          {{ hasActiveFilters ? 'Prueba con otros filtros.' : 'Usa el botón superior para agregar el primero.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// ---- Select custom ----
const selectOpen = ref(false);
const selectRef = ref<HTMLElement | null>(null);

// ---- Filtros ----
const selectedFilter = ref('');  // '' = todas | '__super_admin__' | empresa.id
const searchText = ref('');

const selectedFilterLabel = computed(() => {
  if (selectedFilter.value === '') return 'Todas las empresas';
  if (selectedFilter.value === '__super_admin__') return 'Solo Super Admins';
  const emp = props.empresas?.find((e) => e.id === selectedFilter.value);
  return emp?.contacto?.first_name || emp?.slug || selectedFilter.value;
});

const hasActiveFilters = computed(() =>
  selectedFilter.value !== '' || searchText.value.trim() !== ''
);

const clearFilters = () => {
  selectedFilter.value = '';
  searchText.value = '';
};

const getCompanyName = (user: Usuario): string => {
  if (user.system_role === 'super_admin') return 'Super Admin';
  if (!user.empresa_id) return '—';
  const emp = props.empresas?.find((e) => e.id === user.empresa_id);
  return emp?.contacto?.first_name || emp?.slug || 'Cargando...';
};

const filteredUsers = computed(() => {
  let list = props.usuarios ?? [];

  if (props.mode === 'multi') {
    if (selectedFilter.value === '__super_admin__') {
      list = list.filter((u) => u.system_role === 'super_admin');
    } else if (selectedFilter.value) {
      list = list.filter((u) => u.empresa_id === selectedFilter.value);
    }
    // sin filtro de empresa: muestra todos (incluyendo super_admin)
  }

  const term = searchText.value.trim().toLowerCase();
  if (term) {
    list = list.filter((u) => {
      const name = `${u.contacto?.first_name ?? ''} ${u.contacto?.last_name ?? ''}`.toLowerCase();
      const email = (u.contacto?.email ?? '').toLowerCase();
      const rut = (u.contacto?.rut ?? '').toLowerCase();
      const company = props.mode === 'multi' ? getCompanyName(u).toLowerCase() : '';
      return name.includes(term) || email.includes(term) || rut.includes(term) || company.includes(term);
    });
  }

  return list;
});

// ---- Helpers de UI ----
const initials = (user: Usuario) => {
  const f = user.contacto?.first_name?.[0] ?? '';
  const l = user.contacto?.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
};

const formatRole = (role: string) => role.replace(/_/g, ' ');

const roleBadgeClass = (role: string) => {
  const map: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    admin:       'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    user:        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    visitor:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
};

// ---- Menú 3 puntos ----
const openMenuId = ref<string | null>(null);
const menuRefs = ref<Record<string, Element | null>>({});

const setMenuRef = (id: string, el: unknown) => {
  menuRefs.value[id] = el as Element | null;
};

const toggleMenu = (id: string) => {
  openMenuId.value = openMenuId.value === id ? null : id;
};

const closeMenu = () => { openMenuId.value = null; };

const onClickOutside = (e: MouseEvent) => {
  if (selectOpen.value && selectRef.value && !selectRef.value.contains(e.target as Node)) {
    selectOpen.value = false;
  }
  if (!openMenuId.value) return;
  const ref = menuRefs.value[openMenuId.value];
  if (ref && !ref.contains(e.target as Node)) closeMenu();
};

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>
