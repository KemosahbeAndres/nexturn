<template>
  <div class="space-y-6">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Sucursales</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ ubicacionesActivas.length }} ubicación{{ ubicacionesActivas.length !== 1 ? 'es' : '' }} activa{{ ubicacionesActivas.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        @click="abrirModalCrear"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span class="hidden sm:inline">Agregar</span>
      </button>
    </div>

    <!-- Barra de búsqueda y filtro de categoría -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre o dirección..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        v-model="filtroCategoria"
        class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todas las categorías</option>
        <option v-for="cat in categoriasDisponibles" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Estado vacío -->
    <div v-if="ubicacionesFiltradas.length === 0 && ubicacionesActivas.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"
        class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
        {{ busqueda || filtroCategoria ? 'Sin resultados para la búsqueda.' : 'No hay ubicaciones registradas aún.' }}
      </p>
      <button v-if="!busqueda && !filtroCategoria" @click="abrirModalCrear"
        class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
        Agregar la primera
      </button>
    </div>

    <!-- Grid de cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <article
        v-for="ub in ubicacionesFiltradas"
        :key="ub.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
      >
        <!-- Cabecera card -->
        <div class="px-4 py-3 flex items-start justify-between gap-2 border-b border-gray-50 dark:border-gray-700/50">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ ub.name }}</h3>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 capitalize shrink-0">
                {{ ub.category }}
              </span>
            </div>
            <p v-if="ub.address" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{{ ub.address }}</p>
            <div class="flex flex-wrap gap-x-3 mt-1">
              <p v-if="nombreZona(ub.zone_id)" class="text-xs text-gray-400 dark:text-gray-500">
                <span class="font-medium">Zona:</span> {{ nombreZona(ub.zone_id) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              :class="ub.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'">
              {{ ub.active ? 'Activa' : 'Inactiva' }}
            </span>
            <button @click="abrirModalEditar(ub)"
              class="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Turnos activos -->
        <div class="px-4 py-3">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Turnos ({{ ub.activeTurnos.length }})
          </p>
          <div v-if="ub.activeTurnos.length === 0" class="text-xs text-gray-400 dark:text-gray-500 italic">
            Sin turnos configurados
          </div>
          <ul v-else class="space-y-1">
            <li
              v-for="turno in ub.activeTurnos.slice(0, 3)"
              :key="turno.id"
              class="flex items-center justify-between text-xs"
            >
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ turno.day_of_week }}</span>
              <span class="text-gray-400 dark:text-gray-500">{{ turno.start_time }} – {{ turno.end_time }}</span>
              <span class="text-gray-400 dark:text-gray-500">{{ turno.requerimientos.reduce((s, r) => s + r.cantidad, 0) }} pers.</span>
            </li>
            <li v-if="ub.activeTurnos.length > 3" class="text-xs text-gray-400 dark:text-gray-500">
              +{{ ub.activeTurnos.length - 3 }} más...
            </li>
          </ul>
        </div>
      </article>
    </div>

    <!-- ===================== MODAL CREAR/EDITAR ===================== -->
    <Transition name="modal">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModal" />
        <div class="relative w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ modoEdicion ? 'Editar ubicación' : 'Nueva ubicación' }}
            </h3>
            <button @click="cerrarModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="guardar" class="p-5 space-y-4">

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" required placeholder="Ej: Sucursal Centro"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input v-model="form.address" type="text" placeholder="Av. Principal 123"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría <span class="text-red-500">*</span></label>
                <select v-model="form.category" required
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>Seleccionar...</option>
                  <option value="sucursal">Sucursal</option>
                  <option value="territorio">Territorio</option>
                  <option value="stand">Stand</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Zona <span class="text-red-500">*</span></label>
                <select v-model="form.zone_id" required
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>Seleccionar zona...</option>
                  <option v-for="zona in zonasActivas" :key="zona.id" :value="zona.id">{{ zona.name }}</option>
                </select>
                <p v-if="zonasActivas.length === 0" class="mt-1 text-xs text-amber-500">
                  No hay zonas creadas aún.
                </p>
              </div>
            </div>


            <div v-if="modoEdicion" class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación activa</span>
              <button type="button" @click="form.active = !form.active"
                class="relative w-10 h-5 rounded-full transition-colors duration-300"
                :class="form.active ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'">
                <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                  :class="form.active ? 'translate-x-5' : 'translate-x-0'" />
              </button>
            </div>

            <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="cerrarModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button type="submit" :disabled="guardando"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
                {{ guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useUbicacionStore } from '../../stores/ubicacionStore';
import { useZonaStore } from '../../stores/zonaStore';
import { useEmpleadoStore } from '../../stores/empleadoStore';
import type { Ubicacion, UbicacionCategory } from '../../models/Ubicacion';

const route = useRoute();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();
const ubicacionStore = useUbicacionStore();
const zonaStore = useZonaStore();
const empleadoStore = useEmpleadoStore();

const activeCompanyId = computed(() => {
  if (sessionStore.userRole !== 'super_admin') return sessionStore.activeCompanyId;
  const slug = route.params.companySlug as string;
  return empresaStore.empresas?.find(e => e.slug === slug)?.id ?? null;
});

onMounted(() => {
  if (activeCompanyId.value) {
    ubicacionStore.listarUbicaciones(activeCompanyId.value);
    zonaStore.listarZonas(activeCompanyId.value);
    empleadoStore.listarEmpleados(activeCompanyId.value);
  }
});

const busqueda = ref('');
const filtroCategoria = ref('');

const categoriasDisponibles = ['sucursal', 'territorio', 'stand'];

const zonasActivas = computed(() =>
  (zonaStore.zonas ?? []).filter(z => z.active)
);

const ubicacionesActivas = computed(() =>
  (ubicacionStore.ubicaciones ?? []).filter(u => u.active)
);

const ubicacionesFiltradas = computed(() => {
  let lista = ubicacionStore.ubicaciones ?? [];
  if (filtroCategoria.value) lista = lista.filter(u => u.category === filtroCategoria.value);
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase();
    lista = lista.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.address ?? '').toLowerCase().includes(q)
    );
  }
  return lista;
});

function nombreZona(zoneId: string | null): string {
  if (!zoneId) return '';
  return zonaStore.zonas?.find(z => z.id === zoneId)?.name ?? '';
}

// Modal
const modalOpen = ref(false);
const modoEdicion = ref(false);
const ubicacionSeleccionada = ref<Ubicacion | null>(null);
const guardando = ref(false);
const error = ref('');

const formVacio = () => ({
  name: '',
  address: '',
  category: '' as UbicacionCategory,
  zone_id: '',
  active: true,
});

const form = ref(formVacio());

function abrirModalCrear() {
  form.value = formVacio();
  modoEdicion.value = false;
  ubicacionSeleccionada.value = null;
  error.value = '';
  modalOpen.value = true;
}

function abrirModalEditar(ub: Ubicacion) {
  form.value = {
    name: ub.name,
    address: ub.address,
    category: ub.category,
    zone_id: ub.zone_id ?? '',
    active: ub.active,
  };
  modoEdicion.value = true;
  ubicacionSeleccionada.value = ub;
  error.value = '';
  modalOpen.value = true;
}

function cerrarModal() {
  modalOpen.value = false;
}

async function guardar() {
  if (!activeCompanyId.value) return;
  error.value = '';
  guardando.value = true;

  try {
    if (modoEdicion.value && ubicacionSeleccionada.value) {
      await ubicacionStore.updateUbicacion(ubicacionSeleccionada.value.id, {
        name: form.value.name,
        address: form.value.address,
        category: form.value.category,
        zone_id: form.value.zone_id || null,
        active: form.value.active,
      });
    } else {
      await ubicacionStore.createUbicacion({
        company_id: activeCompanyId.value,
        zone_id: form.value.zone_id || null,
        category: form.value.category,
        name: form.value.name,
        address: form.value.address,
        active: true,
        manager_id: null,
        turnos: [],
        configuraciones: [],
      });
    }
    cerrarModal();
  } catch (e: any) {
    error.value = e.message || 'Error al guardar. Intente de nuevo.';
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
