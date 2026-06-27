<template>
  <div class="flex flex-1 min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: árbol acordeón ─────────────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Organización</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Zonas y sucursales de la empresa.</p>
          </div>
          <button v-if="canManage" @click="openAdd('zona')"
            class="px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
            + Zona
          </button>
        </div>

        <!-- Árbol: zonas activas con sucursales anidadas -->
        <div class="space-y-1" v-if="empresa">

          <div v-for="zona in zonasActivas" :key="zona.id">

            <!-- Fila de zona -->
            <div class="flex items-center gap-1">
              <!-- Botón de expansión -->
              <button type="button" @click="toggleZona(zona.id)"
                class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                  class="w-3 h-3 transition-transform duration-200"
                  :class="isZonaExpanded(zona.id) ? 'rotate-90' : ''">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <!-- Botón de selección de zona -->
              <button type="button" @click="selectZona(zona)"
                class="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group"
                :class="selectedZona?.id === zona.id && !selectedUbicacion
                  ? 'bg-indigo-50 dark:bg-indigo-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'">
                <span class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                  :class="selectedZona?.id === zona.id && !selectedUbicacion
                    ? 'bg-indigo-100 dark:bg-indigo-800/60 text-indigo-600 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate"
                    :class="selectedZona?.id === zona.id && !selectedUbicacion ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'">
                    {{ zona.name }}
                  </p>
                  <p class="text-xs truncate text-gray-400 dark:text-gray-500">
                    {{ ubicacionesPorZona(zona.id).length }} sucursal{{ ubicacionesPorZona(zona.id).length !== 1 ? 'es' : '' }}
                    <template v-if="zona.manager_id"> · {{ empleadoNombre(zona.manager_id) }}</template>
                  </p>
                </div>
                <span v-if="!zona.active" class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">inactiva</span>
              </button>
            </div>

            <!-- Sucursales anidadas (acordeón) -->
            <div v-if="isZonaExpanded(zona.id)" class="ml-6 mt-0.5 space-y-0.5">

              <!-- Sucursales de esta zona -->
              <button
                v-for="ub in ubicacionesPorZona(zona.id)"
                :key="ub.id"
                type="button"
                @click="selectUbicacion(ub, zona)"
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group"
                :class="selectedUbicacion?.id === ub.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'">
                <span class="shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
                  :class="selectedUbicacion?.id === ub.id
                    ? 'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate"
                    :class="selectedUbicacion?.id === ub.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'">
                    {{ ub.name }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ capitalize(ub.category) }}</p>
                </div>
                <span v-if="!ub.active" class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-medium">inactiva</span>
              </button>

              <!-- Estado vacío en zona -->
              <p v-if="!ubicacionesPorZona(zona.id).length" class="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-1.5">
                Sin sucursales.
              </p>

              <!-- Botón añadir sucursal a esta zona -->
              <button v-if="canManage" type="button"
                @click="openAddUbicacion(zona)"
                class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Añadir sucursal
              </button>
            </div>
          </div>

          <!-- Sin zonas -->
          <p v-if="!zonasActivas.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin zonas definidas aún.
          </p>

          <!-- Formulario agregar zona -->
          <div v-if="addType === 'zona'" class="mt-3 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3">
            <p class="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Nueva zona</p>
            <input v-model="addZonaForm.name" type="text" placeholder="Nombre de la zona"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            <p v-if="addError" class="text-xs text-red-500">{{ addError }}</p>
            <div class="flex gap-2">
              <button type="button" @click="closeAdd"
                class="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button type="button" @click="submitAdd" :disabled="adding"
                class="flex-1 px-3 py-1.5 text-xs text-white font-medium bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40">
                {{ adding ? 'Creando…' : 'Crear' }}
              </button>
            </div>
          </div>

          <!-- Formulario agregar sucursal (inline bajo la zona) -->
          <div v-if="addType === 'ubicacion'" class="mt-1 ml-6 p-4 rounded-xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10 space-y-3">
            <p class="text-xs font-semibold text-blue-500 uppercase tracking-widest">Nueva sucursal en {{ addTargetZona?.name }}</p>
            <input v-model="addUbForm.name" type="text" placeholder="Nombre de la sucursal"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            <select v-model="addUbForm.category"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
              <option value="sucursal">Sucursal</option>
              <option value="territorio">Territorio</option>
              <option value="stand">Stand</option>
            </select>
            <p v-if="addError" class="text-xs text-red-500">{{ addError }}</p>
            <div class="flex gap-2">
              <button type="button" @click="closeAdd"
                class="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button type="button" @click="submitAdd" :disabled="adding"
                class="flex-1 px-3 py-1.5 text-xs text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40">
                {{ adding ? 'Creando…' : 'Crear' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── Panel derecho: detalle ────────────────────────────────────────── -->
    <div class="w-1/2 flex flex-col overflow-y-auto">

      <!-- Estado vacío -->
      <div v-if="!selectedZona && !selectedUbicacion" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona una zona o sucursal</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Su información aparecerá aquí.</p>
      </div>

      <!-- ── Detalle de ZONA seleccionada ─────────────────────────────── -->
      <div v-else-if="selectedZona && !selectedUbicacion" class="p-4 sm:p-6 space-y-5">

        <div class="flex items-center gap-2 mb-1">
          <span class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </span>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Zona</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input v-model="zonaForm.name" type="text" :disabled="!canManage"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white disabled:opacity-60" />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Encargado</label>
          <SearchSelect
            :options="empleadosActivos"
            v-model="zonaManagerEmpleado"
            :key-fn="e => e.id"
            :label-fn="e => e.displayName"
            :sublabel-fn="e => e.contacto?.rut ?? ''"
            :initials-fn="e => e.initials"
            :search-fn="(e, q) => e.displayName.toLowerCase().includes(q) || (e.contacto?.rut ?? '').toLowerCase().includes(q)"
            placeholder="Sin encargado"
            search-placeholder="Buscar por nombre o RUT..."
            :disabled="!canManage"
            color="indigo"
          />
        </div>

        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Zona activa</span>
          <button type="button" :disabled="!canManage" @click="zonaForm.active = !zonaForm.active"
            class="relative w-9 h-5 rounded-full transition-colors duration-300 disabled:cursor-not-allowed"
            :class="zonaForm.active ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'">
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
              :class="zonaForm.active ? 'translate-x-4' : 'translate-x-0'" />
          </button>
        </div>

        <p v-if="editError" class="text-xs text-red-500">{{ editError }}</p>
        <p v-if="editSuccess" class="text-xs text-green-600 font-medium">{{ editSuccess }}</p>

        <div v-if="canManage" class="flex items-center gap-2">
          <button type="button" @click="confirmDeleteZona"
            class="px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Eliminar
          </button>
          <div class="flex-1" />
          <button type="button" @click="resetZonaForm" :disabled="!isZonaFormDirty"
            class="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
            Deshacer
          </button>
          <button type="button" @click="saveZona" :disabled="!isZonaFormDirty || saving"
            class="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>

      <!-- ── Detalle de SUCURSAL seleccionada ──────────────────────────── -->
      <div v-else-if="selectedUbicacion" class="p-4 sm:p-6 space-y-5">

        <!-- Cabecera con breadcrumb -->
        <div class="flex items-center gap-2 mb-1">
          <button type="button" @click="volverAZona"
            class="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {{ selectedZona?.name ?? 'Zona' }}
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 text-gray-300 dark:text-gray-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span class="w-5 h-5 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </span>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sucursal</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input v-model="ubForm.name" type="text" :disabled="!canManage"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60" />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
          <select v-model="ubForm.category" :disabled="!canManage"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60">
            <option value="sucursal">Sucursal</option>
            <option value="territorio">Territorio</option>
            <option value="stand">Stand</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
          <input v-model="ubForm.address" type="text" :disabled="!canManage" placeholder="Sin dirección"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60" />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Encargado</label>
          <SearchSelect
            :options="empleadosActivos"
            v-model="ubManagerEmpleado"
            :key-fn="e => e.id"
            :label-fn="e => e.displayName"
            :sublabel-fn="e => e.contacto?.rut ?? ''"
            :initials-fn="e => e.initials"
            :search-fn="(e, q) => e.displayName.toLowerCase().includes(q) || (e.contacto?.rut ?? '').toLowerCase().includes(q)"
            placeholder="Sin encargado"
            search-placeholder="Buscar por nombre o RUT..."
            :disabled="!canManage"
            color="blue"
          />
        </div>

        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sucursal activa</span>
          <button type="button" :disabled="!canManage" @click="ubForm.active = !ubForm.active"
            class="relative w-9 h-5 rounded-full transition-colors duration-300 disabled:cursor-not-allowed"
            :class="ubForm.active ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'">
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
              :class="ubForm.active ? 'translate-x-4' : 'translate-x-0'" />
          </button>
        </div>

        <!-- Ir a la sucursal -->
        <router-link
          :to="{ name: 'sucursal-dashboard', params: { companySlug: route.params.companySlug, ubicacionSlug: ubicacionSlugFor(selectedUbicacion) } }"
          class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-blue-100 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
          <span class="text-sm text-blue-700 dark:text-blue-300 font-medium">Ir a la sucursal</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </router-link>

        <p v-if="editError" class="text-xs text-red-500">{{ editError }}</p>
        <p v-if="editSuccess" class="text-xs text-green-600 font-medium">{{ editSuccess }}</p>

        <div v-if="canManage" class="flex items-center gap-2">
          <button type="button" @click="confirmDeleteUbicacion"
            class="px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Eliminar
          </button>
          <div class="flex-1" />
          <button type="button" @click="resetUbForm" :disabled="!isUbFormDirty"
            class="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
            Deshacer
          </button>
          <button type="button" @click="saveUbicacion" :disabled="!isUbFormDirty || saving"
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useZonaStore } from '../../stores/zonaStore';
import { useUbicacionStore } from '../../stores/ubicacionStore';
import { useEmpleadoStore } from '../../stores/empleadoStore';
import SearchSelect from '../../components/SearchSelect.vue';
import type { Zona } from '../../models/Zona';
import type { Ubicacion, UbicacionCategory } from '../../models/Ubicacion';
import type { Empleado } from '../../models/Empleado';

const route = useRoute();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();
const zonaStore = useZonaStore();
const ubicacionStore = useUbicacionStore();
const empleadoStore = useEmpleadoStore();

const empresa = computed(() =>
  empresaStore.empresas?.find(e => e.slug === route.params.companySlug)
);

const canManage = computed(() =>
  ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? '')
);

onMounted(() => {
  if (empresa.value?.id) {
    zonaStore.listarZonas(empresa.value.id);
    ubicacionStore.listarUbicaciones(empresa.value.id);
    empleadoStore.listarEmpleados(empresa.value.id);
  }
});

watch(() => empresa.value?.id, (id) => {
  if (id) {
    zonaStore.listarZonas(id);
    ubicacionStore.listarUbicaciones(id);
    empleadoStore.listarEmpleados(id);
  }
});

const zonasActivas = computed(() =>
  (zonaStore.zonas ?? []).filter(z => z.active && !z.deletedAt)
);
const empleadosActivos = computed(() => empleadoStore.empleadosActivos);

const ubicacionesPorZona = (zonaId: string) =>
  (ubicacionStore.ubicaciones ?? []).filter(u => u.zone_id === zonaId && u.active && !u.deletedAt);

function empleadoNombre(id: string): string {
  return empleadosActivos.value.find(e => e.id === id)?.displayName ?? '—';
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ubicacionSlugFor(ub: Ubicacion): string {
  return ub.slug || slugify(ub.name);
}

// ── Acordeón: zonas expandidas ─────────────────────────────────────────────────

const expandedZonas = ref<Set<string>>(new Set());

function toggleZona(id: string) {
  if (expandedZonas.value.has(id)) {
    expandedZonas.value.delete(id);
  } else {
    expandedZonas.value.add(id);
  }
}

function isZonaExpanded(id: string) {
  return expandedZonas.value.has(id);
}

// ── Selección ──────────────────────────────────────────────────────────────────

const selectedZona = ref<Zona | null>(null);
const selectedUbicacion = ref<Ubicacion | null>(null);

function selectZona(zona: Zona) {
  if (selectedZona.value?.id === zona.id && !selectedUbicacion.value) {
    selectedZona.value = null;
    return;
  }
  selectedUbicacion.value = null;
  selectedZona.value = zona;
  addType.value = null;
  editError.value = '';
  editSuccess.value = '';
  const f = zonaToForm(zona);
  zonaForm.value = { ...f };
  zonaSnapshot.value = { ...f };
  // Expandir la zona al seleccionarla
  expandedZonas.value.add(zona.id);
}

function selectUbicacion(ub: Ubicacion, zona: Zona) {
  selectedZona.value = zona;
  selectedUbicacion.value = ub;
  addType.value = null;
  editError.value = '';
  editSuccess.value = '';
  const f = ubToForm(ub);
  ubForm.value = { ...f };
  ubSnapshot.value = { ...f };
}

function volverAZona() {
  selectedUbicacion.value = null;
  if (selectedZona.value) {
    const f = zonaToForm(selectedZona.value);
    zonaForm.value = { ...f };
    zonaSnapshot.value = { ...f };
  }
  editError.value = '';
  editSuccess.value = '';
}

// ── Formulario zona ────────────────────────────────────────────────────────────

type ZonaForm = { name: string; manager_id: string | null; active: boolean };

const zonaForm = ref<ZonaForm>({ name: '', manager_id: null, active: true });
const zonaSnapshot = ref<ZonaForm>({ name: '', manager_id: null, active: true });

const zonaManagerEmpleado = computed<Empleado | null>({
  get: () => empleadosActivos.value.find(e => e.id === zonaForm.value.manager_id) ?? null,
  set: (emp) => { zonaForm.value.manager_id = emp?.id ?? null; },
});

function zonaToForm(z: Zona): ZonaForm {
  return { name: z.name, manager_id: z.manager_id, active: z.active };
}

const isZonaFormDirty = computed(() => {
  const a = zonaForm.value; const b = zonaSnapshot.value;
  return a.name !== b.name || a.active !== b.active || a.manager_id !== b.manager_id;
});

function resetZonaForm() { zonaForm.value = { ...zonaSnapshot.value }; }

// ── Formulario ubicacion ───────────────────────────────────────────────────────

type UbForm = { name: string; category: UbicacionCategory; address: string; manager_id: string | null; active: boolean };

const ubForm = ref<UbForm>({ name: '', category: 'sucursal', address: '', manager_id: null, active: true });
const ubSnapshot = ref<UbForm>({ name: '', category: 'sucursal', address: '', manager_id: null, active: true });

const ubManagerEmpleado = computed<Empleado | null>({
  get: () => empleadosActivos.value.find(e => e.id === ubForm.value.manager_id) ?? null,
  set: (emp) => { ubForm.value.manager_id = emp?.id ?? null; },
});

function ubToForm(u: Ubicacion): UbForm {
  return { name: u.name, category: u.category, address: u.address, manager_id: u.manager_id, active: u.active };
}

const isUbFormDirty = computed(() => {
  const a = ubForm.value; const b = ubSnapshot.value;
  return a.name !== b.name || a.category !== b.category || a.address !== b.address
    || a.manager_id !== b.manager_id || a.active !== b.active;
});

function resetUbForm() { ubForm.value = { ...ubSnapshot.value }; }

// ── Estado compartido ──────────────────────────────────────────────────────────

const saving = ref(false);
const editError = ref('');
const editSuccess = ref('');

function showSuccess() {
  editSuccess.value = 'Guardado correctamente.';
  setTimeout(() => { editSuccess.value = ''; }, 3000);
}

// ── Guardar zona ───────────────────────────────────────────────────────────────

async function saveZona() {
  if (!selectedZona.value || !isZonaFormDirty.value) return;
  saving.value = true; editError.value = '';
  try {
    await zonaStore.updateZona(selectedZona.value.id, {
      name: zonaForm.value.name.trim(),
      manager_id: zonaForm.value.manager_id,
      active: zonaForm.value.active,
    });
    zonaSnapshot.value = { ...zonaForm.value };
    showSuccess();
  } catch (e: any) {
    editError.value = e.message ?? 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteZona() {
  if (!selectedZona.value) return;
  const hasUbs = ubicacionesPorZona(selectedZona.value.id).length > 0;
  const msg = hasUbs
    ? `Esta zona tiene sucursales asignadas. ¿Eliminarla de todas formas? Las sucursales quedarán sin zona.`
    : `¿Eliminar la zona "${selectedZona.value.name}"?`;
  if (!confirm(msg)) return;
  try {
    await zonaStore.softDeleteZona(selectedZona.value.id);
    selectedZona.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Guardar ubicacion ──────────────────────────────────────────────────────────

async function saveUbicacion() {
  if (!selectedUbicacion.value || !isUbFormDirty.value) return;
  saving.value = true; editError.value = '';
  try {
    await ubicacionStore.updateUbicacion(selectedUbicacion.value.id, {
      name: ubForm.value.name.trim(),
      category: ubForm.value.category,
      address: ubForm.value.address.trim(),
      manager_id: ubForm.value.manager_id,
      active: ubForm.value.active,
    });
    ubSnapshot.value = { ...ubForm.value };
    showSuccess();
  } catch (e: any) {
    editError.value = e.message ?? 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

async function confirmDeleteUbicacion() {
  if (!selectedUbicacion.value) return;
  if (!confirm(`¿Eliminar la sucursal "${selectedUbicacion.value.name}"?`)) return;
  try {
    await ubicacionStore.softDeleteUbicacion(selectedUbicacion.value.id);
    selectedUbicacion.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Formularios de agregar ─────────────────────────────────────────────────────

const addType = ref<'zona' | 'ubicacion' | null>(null);
const addTargetZona = ref<Zona | null>(null);
const addZonaForm = ref({ name: '' });
const addUbForm = ref({ name: '', category: 'sucursal' as UbicacionCategory });
const adding = ref(false);
const addError = ref('');

function openAdd(type: 'zona') {
  addType.value = type;
  addTargetZona.value = null;
  addZonaForm.value = { name: '' };
  addError.value = '';
}

function openAddUbicacion(zona: Zona) {
  addType.value = 'ubicacion';
  addTargetZona.value = zona;
  addUbForm.value = { name: '', category: 'sucursal' };
  addError.value = '';
  // Expandir la zona al abrir el formulario
  expandedZonas.value.add(zona.id);
}

function closeAdd() {
  addType.value = null;
  addTargetZona.value = null;
  addError.value = '';
}

async function submitAdd() {
  if (!empresa.value) return;
  adding.value = true; addError.value = '';
  try {
    if (addType.value === 'zona') {
      if (!addZonaForm.value.name.trim()) { addError.value = 'El nombre es obligatorio.'; adding.value = false; return; }
      const id = await zonaStore.createZona({
        empresa_id: empresa.value.id,
        name: addZonaForm.value.name.trim(),
        manager_id: null,
        active: true,
      });
      expandedZonas.value.add(id);
    } else {
      if (!addUbForm.value.name.trim()) { addError.value = 'El nombre es obligatorio.'; adding.value = false; return; }
      await ubicacionStore.createUbicacion({
        company_id: empresa.value.id,
        name: addUbForm.value.name.trim(),
        address: '',
        category: addUbForm.value.category,
        zone_id: addTargetZona.value?.id ?? null,
        manager_id: null,
        active: true,
        turnos: [],
        configuraciones: [],
      });
    }
    closeAdd();
  } catch (e: any) {
    addError.value = e.message ?? 'Error al crear.';
  } finally {
    adding.value = false;
  }
}
</script>
