<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: árbol de estructura ─────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
      <div class="p-4 sm:p-6 space-y-4 flex-1">

        <!-- Encabezado -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estructura</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Zonas y ubicaciones de la organización.</p>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="canManage" @click="openAdd('zona')"
              class="px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
              + Zona
            </button>
            <button v-if="canManage" @click="openAdd('ubicacion')"
              class="px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
              + Ubicación
            </button>
          </div>
        </div>

        <!-- Árbol -->
        <div class="space-y-0.5" v-if="empresa">

          <!-- Zonas con sus ubicaciones -->
          <template v-for="zona in zonas" :key="zona.id">

            <!-- Fila Zona -->
            <button type="button" @click="selectItem({ type: 'zona', zona })"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
              :class="isZonaSelected(zona.id)
                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'">
              <span class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                :class="isZonaSelected(zona.id)
                  ? 'bg-indigo-100 dark:bg-indigo-800/60 text-indigo-600 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate"
                  :class="isZonaSelected(zona.id) ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'">
                  {{ zona.name }}
                </p>
                <p class="text-xs truncate"
                  :class="isZonaSelected(zona.id) ? 'text-indigo-400 dark:text-indigo-500' : 'text-gray-400 dark:text-gray-500'">
                  Zona · {{ ubicacionesPorZona(zona.id).length }} ubicacion{{ ubicacionesPorZona(zona.id).length !== 1 ? 'es' : '' }}
                  <template v-if="zona.manager_id"> · <span class="font-medium">{{ empleadoNombre(zona.manager_id) }}</span></template>
                </p>
              </div>
              <span v-if="!zona.active" class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">inactiva</span>
              <svg v-if="isZonaSelected(zona.id)"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                class="w-3.5 h-3.5 shrink-0 text-indigo-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <!-- Ubicaciones de esta zona -->
            <template v-for="ub in ubicacionesPorZona(zona.id)" :key="ub.id">
              <button type="button" @click="selectItem({ type: 'ubicacion', ubicacion: ub })"
                class="w-full flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-left transition-colors group"
                :class="isUbicacionSelected(ub.id)
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'">
                <span class="shrink-0 text-gray-300 dark:text-gray-600 select-none text-sm leading-none">└</span>
                <span class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                  :class="isUbicacionSelected(ub.id)
                    ? 'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate"
                    :class="isUbicacionSelected(ub.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'">
                    {{ ub.name }}
                  </p>
                  <p class="text-xs truncate"
                    :class="isUbicacionSelected(ub.id) ? 'text-blue-400 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'">
                    {{ capitalize(ub.category) }} · {{ ub.activeTurnos.length }} turno{{ ub.activeTurnos.length !== 1 ? 's' : '' }}
                  </p>
                </div>
                <span v-if="!ub.active" class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-medium">inactiva</span>
                <svg v-if="isUbicacionSelected(ub.id)"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                  class="w-3.5 h-3.5 shrink-0 text-blue-500">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </template>

          </template>

          <!-- Separador: ubicaciones sin zona -->
          <template v-if="ubicacionesSinZona.length">
            <div v-if="zonas.length" class="pt-2 pb-1 px-1">
              <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Sin zona asignada</p>
            </div>
            <button v-for="ub in ubicacionesSinZona" :key="ub.id"
              type="button" @click="selectItem({ type: 'ubicacion', ubicacion: ub })"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
              :class="isUbicacionSelected(ub.id)
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'">
              <span class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                :class="isUbicacionSelected(ub.id)
                  ? 'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate"
                  :class="isUbicacionSelected(ub.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'">
                  {{ ub.name }}
                </p>
                <p class="text-xs truncate"
                  :class="isUbicacionSelected(ub.id) ? 'text-blue-400 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'">
                  {{ capitalize(ub.category) }} · {{ ub.activeTurnos.length }} turno{{ ub.activeTurnos.length !== 1 ? 's' : '' }}
                </p>
              </div>
              <span v-if="!ub.active" class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-medium">inactiva</span>
              <svg v-if="isUbicacionSelected(ub.id)"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                class="w-3.5 h-3.5 shrink-0 text-blue-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </template>

          <!-- Estado vacío -->
          <p v-if="!zonas.length && !ubicacionesSinZona.length"
            class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
            Sin zonas ni ubicaciones definidas aún.
          </p>
        </div>

        <!-- Formulario de agregar -->
        <div v-if="addType && canManage" class="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-widest"
            :class="addType === 'zona' ? 'text-indigo-500 dark:text-indigo-400' : 'text-blue-500 dark:text-blue-400'">
            Nueva {{ addType }}
          </p>

          <!-- Campos zona -->
          <template v-if="addType === 'zona'">
            <input v-model="addZonaForm.name" type="text" placeholder="Nombre de la zona"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
          </template>

          <!-- Campos ubicación -->
          <template v-else>
            <input v-model="addUbForm.name" type="text" placeholder="Nombre de la ubicación"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            <div class="grid grid-cols-2 gap-2">
              <select v-model="addUbForm.category"
                class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                <option value="sucursal">Sucursal</option>
                <option value="territorio">Territorio</option>
                <option value="stand">Stand</option>
              </select>
              <select v-model="addUbForm.zone_id"
                class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                <option value="">Sin zona</option>
                <option v-for="z in zonas" :key="z.id" :value="z.id">{{ z.name }}</option>
              </select>
            </div>
          </template>

          <p v-if="addError" class="text-xs text-red-500 dark:text-red-400">{{ addError }}</p>
          <div class="flex gap-2">
            <button type="button" @click="closeAdd"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="submitAdd" :disabled="adding"
              class="flex-1 px-3 py-2 text-sm text-white font-medium rounded-lg transition-colors disabled:opacity-40"
              :class="addType === 'zona' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'">
              {{ adding ? 'Creando…' : 'Crear' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Panel derecho: editor ─────────────────────────────────────── -->
    <div class="w-1/2 overflow-y-auto">

      <!-- Vacío -->
      <div v-if="!selection" class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona una zona o ubicación</p>
        <p class="text-xs text-gray-400 dark:text-gray-500">Haz clic en cualquier elemento del árbol para ver sus detalles.</p>
      </div>

      <!-- Editor zona -->
      <div v-else-if="selection.type === 'zona'" class="p-4 sm:p-6 space-y-5">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="shrink-0 w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selection.zona.name }}</p>
                <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="selection.zona.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'">
                  {{ selection.zona.active ? 'activa' : 'inactiva' }}
                </span>
              </div>
              <p class="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Zona</p>
            </div>
          </div>
          <button @click="selection = null" class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input v-model="zonaForm.name" type="text" :disabled="!canManage"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white disabled:opacity-60 transition-colors" />
          </div>

          <!-- Encargado de zona -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encargado</label>
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
              class="relative w-10 h-5 rounded-full transition-colors duration-300 disabled:cursor-not-allowed"
              :class="zonaForm.active ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                :class="zonaForm.active ? 'translate-x-5' : 'translate-x-0'" />
            </button>
          </div>
        </div>

        <!-- Ubicaciones de esta zona -->
        <div v-if="ubicacionesPorZona(selection.zona.id).length">
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Ubicaciones</p>
          <div class="space-y-1">
            <div v-for="ub in ubicacionesPorZona(selection.zona.id)" :key="ub.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-sm text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0 text-gray-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span class="font-medium truncate">{{ ub.name }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">{{ capitalize(ub.category) }}</span>
            </div>
          </div>
        </div>

        <p v-if="editError" class="text-xs text-red-500 dark:text-red-400">{{ editError }}</p>
        <p v-if="editSuccess" class="text-xs text-green-600 dark:text-green-400 font-medium">{{ editSuccess }}</p>

        <div v-if="canManage" class="flex items-center gap-2 pt-1">
          <button type="button" @click="confirmDeleteZona"
            class="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
            Eliminar
          </button>
          <div class="flex-1" />
          <button type="button" @click="resetZonaForm" :disabled="!isZonaFormDirty"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
            Deshacer
          </button>
          <button type="button" @click="saveZona" :disabled="!isZonaFormDirty || saving"
            class="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </div>

      <!-- Editor ubicación: arriba datos, abajo personal asignado -->
      <div v-else-if="selection.type === 'ubicacion'" class="flex flex-col h-full min-h-0 divide-y divide-gray-100 dark:divide-gray-700">

        <!-- ── Sección superior: datos de la ubicación ──────────────── -->
        <div class="p-4 sm:p-5 space-y-4 overflow-y-auto" style="flex: 0 0 auto; max-height: 55%;">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <span class="shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </span>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ selection.ubicacion.name }}</p>
                  <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium"
                    :class="selection.ubicacion.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'">
                    {{ selection.ubicacion.active ? 'activa' : 'inactiva' }}
                  </span>
                </div>
                <p class="text-xs text-blue-500 dark:text-blue-400 font-medium">{{ capitalize(selection.ubicacion.category) }}</p>
              </div>
            </div>
            <button @click="selection = null" class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input v-model="ubForm.name" type="text" :disabled="!canManage"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input v-model="ubForm.address" type="text" :disabled="!canManage"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 transition-colors" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select v-model="ubForm.category" :disabled="!canManage"
                  class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 transition-colors">
                  <option value="sucursal">Sucursal</option>
                  <option value="territorio">Territorio</option>
                  <option value="stand">Stand</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zona</label>
                <select v-model="ubForm.zone_id" :disabled="!canManage"
                  class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-60 transition-colors">
                  <option value="">Sin zona</option>
                  <option v-for="z in zonas" :key="z.id" :value="z.id">{{ z.name }}</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación activa</span>
              <button type="button" :disabled="!canManage" @click="ubForm.active = !ubForm.active"
                class="relative w-10 h-5 rounded-full transition-colors duration-300 disabled:cursor-not-allowed"
                :class="ubForm.active ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'">
                <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                  :class="ubForm.active ? 'translate-x-5' : 'translate-x-0'" />
              </button>
            </div>
          </div>

          <p v-if="editError" class="text-xs text-red-500 dark:text-red-400">{{ editError }}</p>
          <p v-if="editSuccess" class="text-xs text-green-600 dark:text-green-400 font-medium">{{ editSuccess }}</p>

          <div v-if="canManage" class="flex items-center gap-2 pt-1">
            <button type="button" @click="confirmDeleteUbicacion"
              class="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
              Eliminar
            </button>
            <div class="flex-1" />
            <button type="button" @click="resetUbForm" :disabled="!isUbFormDirty"
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
              Deshacer
            </button>
            <button type="button" @click="saveUbicacion" :disabled="!isUbFormDirty || saving"
              class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </div>

        <!-- ── Sección inferior: personal asignado ──────────────────── -->
        <div class="flex flex-col min-h-0 flex-1">
          <div class="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 shrink-0">
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personal asignado</p>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ staffUbicacion.length }} persona{{ staffUbicacion.length !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Buscador para agregar -->
          <div v-if="canManage" class="px-4 sm:px-5 pb-3 shrink-0 space-y-2">
            <SearchSelect
              :options="empleadosDisponiblesParaUbicacion"
              v-model="newContratoEmpleado"
              :key-fn="e => e.id"
              :label-fn="e => e.displayName"
              :sublabel-fn="e => e.contacto?.rut ?? ''"
              :initials-fn="e => e.initials"
              :search-fn="(e, q) => e.displayName.toLowerCase().includes(q) || (e.contacto?.rut ?? '').toLowerCase().includes(q)"
              placeholder="Buscar empleado para asignar…"
              search-placeholder="Nombre o RUT..."
              clearable
              color="blue"
            />
            <!-- Paso 2: seleccionar cargo una vez elegido el empleado -->
            <Transition name="dropdown">
              <div v-if="newContratoEmpleado" class="flex gap-2 items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <span class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-300">
                  {{ newContratoEmpleado.initials }}
                </span>
                <span class="flex-1 text-sm font-medium text-blue-800 dark:text-blue-200 truncate">{{ newContratoEmpleado.displayName }}</span>
                <select v-model="newContratoCargo" autofocus
                  class="px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white w-36 shrink-0">
                  <option value="">Cargo…</option>
                  <option v-for="cargo in empresa?.cargos ?? []" :key="cargo.id" :value="cargo.id">{{ cargo.nombre }}</option>
                </select>
                <button type="button" @click="addStaffToUbicacion"
                  :disabled="!newContratoCargo || addingContrato"
                  class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded-lg transition-colors whitespace-nowrap shrink-0">
                  {{ addingContrato ? '…' : 'Asignar' }}
                </button>
              </div>
            </Transition>
            <p v-if="contratoError" class="text-xs text-red-500 dark:text-red-400">{{ contratoError }}</p>
          </div>

          <!-- Lista de personal ordenado por jerarquía -->
          <div class="flex-1 overflow-y-auto px-4 sm:px-5 pb-4 space-y-1">
            <p v-if="!staffUbicacion.length" class="text-sm text-gray-400 dark:text-gray-500 italic py-2">Sin personal asignado.</p>

            <template v-for="grupo in staffPorJerarquia" :key="grupo.nivel">
              <div v-if="grupo.items.length">
                <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1 mt-2">{{ grupo.label }}</p>
                <div v-for="item in grupo.items" :key="item.contrato.id"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                  <span class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {{ item.empleado?.initials ?? '?' }}
                  </span>
                  <p class="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ item.empleado?.displayName ?? '—' }}</p>
                  <select v-if="canManage"
                    :value="item.contrato.cargo_id"
                    @change="changeContratoCargo(item.contrato, ($event.target as HTMLSelectElement).value)"
                    class="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shrink-0 max-w-[120px]">
                    <option v-for="cargo in empresa?.cargos ?? []" :key="cargo.id" :value="cargo.id">{{ cargo.nombre }}</option>
                  </select>
                  <span v-else class="text-xs text-gray-400 dark:text-gray-500 shrink-0">{{ cargoNombre(item.contrato.cargo_id) }}</span>
                  <button v-if="canManage" type="button" @click="removeStaffFromUbicacion(item.contrato.id, item.contrato.empleado_id)"
                    class="shrink-0 p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                    title="Quitar de esta ubicación">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5">
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </div>
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

const zonas = computed(() => zonaStore.zonas ?? []);
const empleadosActivos = computed(() => empleadoStore.empleadosActivos);

const ubicacionesPorZona = (zonaId: string) =>
  (ubicacionStore.ubicaciones ?? []).filter(u => u.zone_id === zonaId);

const ubicacionesSinZona = computed(() =>
  (ubicacionStore.ubicaciones ?? []).filter(u => !u.zone_id)
);

function empleadoNombre(id: string): string {
  return empleadosActivos.value.find(e => e.id === id)?.displayName ?? '—';
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

// ── Selección ──────────────────────────────────────────────────────────────────

type Selection =
  | { type: 'zona'; zona: Zona }
  | { type: 'ubicacion'; ubicacion: Ubicacion };

const selection = ref<Selection | null>(null);

function selectItem(item: Selection) {
  if (selection.value?.type === item.type) {
    const sameId = item.type === 'zona'
      ? (selection.value as any).zona?.id === (item as any).zona.id
      : (selection.value as any).ubicacion?.id === (item as any).ubicacion.id;
    if (sameId) { selection.value = null; return; }
  }
  selection.value = item;
}

function isZonaSelected(id: string) {
  return selection.value?.type === 'zona' && (selection.value as any).zona.id === id;
}
function isUbicacionSelected(id: string) {
  return selection.value?.type === 'ubicacion' && (selection.value as any).ubicacion.id === id;
}

// ── Formulario zona ────────────────────────────────────────────────────────────

type ZonaForm = { name: string; manager_id: string | null; active: boolean };

const zonaForm = ref<ZonaForm>({ name: '', manager_id: null, active: true });
const zonaSnapshot = ref<ZonaForm>({ name: '', manager_id: null, active: true });

// Proxy reactivo del empleado encargado de la zona
const zonaManagerEmpleado = computed<Empleado | null>({
  get: () => empleadosActivos.value.find(e => e.id === zonaForm.value.manager_id) ?? null,
  set: (emp) => { zonaForm.value.manager_id = emp?.id ?? null; },
});

function zonaToForm(z: Zona): ZonaForm {
  return { name: z.name, manager_id: z.manager_id, active: z.active };
}

watch(selection, (sel) => {
  editError.value = '';
  editSuccess.value = '';
  if (!sel) return;
  if (sel.type === 'zona') {
    const f = zonaToForm(sel.zona);
    zonaForm.value = { ...f };
    zonaSnapshot.value = { ...f };
  } else {
    const f = ubToForm(sel.ubicacion);
    ubForm.value = { ...f };
    ubSnapshot.value = { ...f };
  }
});

const isZonaFormDirty = computed(() => {
  const a = zonaForm.value;
  const b = zonaSnapshot.value;
  return a.name !== b.name || a.active !== b.active || a.manager_id !== b.manager_id;
});

function resetZonaForm() {
  zonaForm.value = { ...zonaSnapshot.value };
}

// ── Formulario ubicación ───────────────────────────────────────────────────────

type UbForm = { name: string; address: string; category: UbicacionCategory; zone_id: string; active: boolean };

const ubForm = ref<UbForm>({ name: '', address: '', category: 'sucursal', zone_id: '', active: true });
const ubSnapshot = ref<UbForm>({ name: '', address: '', category: 'sucursal', zone_id: '', active: true });

function ubToForm(u: Ubicacion): UbForm {
  return {
    name: u.name,
    address: u.address,
    category: u.category,
    zone_id: u.zone_id ?? '',
    active: u.active,
  };
}

const isUbFormDirty = computed(() => {
  const a = ubForm.value;
  const b = ubSnapshot.value;
  return a.name !== b.name || a.address !== b.address || a.category !== b.category
    || a.zone_id !== b.zone_id || a.active !== b.active;
});

function resetUbForm() {
  ubForm.value = { ...ubSnapshot.value };
}

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
  if (selection.value?.type !== 'zona' || !isZonaFormDirty.value) return;
  saving.value = true;
  editError.value = '';
  try {
    await zonaStore.updateZona(selection.value.zona.id, {
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
  if (selection.value?.type !== 'zona') return;
  const hasUbs = ubicacionesPorZona(selection.value.zona.id).length > 0;
  const msg = hasUbs
    ? `Esta zona tiene ubicaciones asignadas. ¿Eliminarla de todas formas? Las ubicaciones quedarán sin zona.`
    : `¿Eliminar la zona "${selection.value.zona.name}"?`;
  if (!confirm(msg)) return;
  try {
    await zonaStore.softDeleteZona(selection.value.zona.id);
    selection.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Guardar ubicación ──────────────────────────────────────────────────────────

async function saveUbicacion() {
  if (selection.value?.type !== 'ubicacion' || !isUbFormDirty.value) return;
  saving.value = true;
  editError.value = '';
  try {
    await ubicacionStore.updateUbicacion(selection.value.ubicacion.id, {
      name: ubForm.value.name.trim(),
      address: ubForm.value.address.trim(),
      category: ubForm.value.category,
      zone_id: ubForm.value.zone_id || null,
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
  if (selection.value?.type !== 'ubicacion') return;
  if (!confirm(`¿Eliminar la ubicación "${selection.value.ubicacion.name}"?`)) return;
  try {
    await ubicacionStore.softDeleteUbicacion(selection.value.ubicacion.id);
    selection.value = null;
  } catch (e: any) {
    editError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Formulario agregar ─────────────────────────────────────────────────────────

const addType = ref<'zona' | 'ubicacion' | null>(null);
const addZonaForm = ref({ name: '' });
const addUbForm = ref({ name: '', category: 'sucursal' as UbicacionCategory, zone_id: '' });
const adding = ref(false);
const addError = ref('');

function openAdd(type: 'zona' | 'ubicacion') {
  addType.value = type;
  addZonaForm.value = { name: '' };
  addUbForm.value = { name: '', category: 'sucursal', zone_id: '' };
  addError.value = '';
  selection.value = null;
}

function closeAdd() {
  addType.value = null;
  addError.value = '';
}

async function submitAdd() {
  if (!empresa.value) return;
  adding.value = true;
  addError.value = '';
  try {
    if (addType.value === 'zona') {
      if (!addZonaForm.value.name.trim()) { addError.value = 'El nombre es obligatorio.'; return; }
      await zonaStore.createZona({
        empresa_id: empresa.value.id,
        name: addZonaForm.value.name.trim(),
        manager_id: null,
        active: true,
      });
    } else {
      if (!addUbForm.value.name.trim()) { addError.value = 'El nombre es obligatorio.'; return; }
      await ubicacionStore.createUbicacion({
        company_id: empresa.value.id,
        name: addUbForm.value.name.trim(),
        address: '',
        category: addUbForm.value.category,
        zone_id: addUbForm.value.zone_id || null,
        manager_id: null,
        active: true,
        turnos: [],
      });
    }
    closeAdd();
  } catch (e: any) {
    addError.value = e.message ?? 'Error al crear.';
  } finally {
    adding.value = false;
  }
}

// ── Personal asignado a ubicación (contratos) ──────────────────────────────────

// Empleados que ya tienen un contrato en esta ubicación
const staffUbicacion = computed<Array<{ contrato: import('../../models/Contrato').Contrato; empleado: Empleado | undefined }>>(() => {
  if (selection.value?.type !== 'ubicacion') return [];
  const ubId = selection.value.ubicacion.id;
  const result: Array<{ contrato: import('../../models/Contrato').Contrato; empleado: Empleado | undefined }> = [];
  for (const emp of empleadoStore.empleados ?? []) {
    for (const c of emp.contratos ?? []) {
      if (c.ubicacion_id === ubId && !c.deletedAt) {
        result.push({ contrato: c, empleado: emp });
      }
    }
  }
  return result;
});

// Empleados disponibles (los que no tienen ya un contrato activo en esta ubicación)
const empleadosDisponiblesParaUbicacion = computed(() => {
  if (selection.value?.type !== 'ubicacion') return empleadosActivos.value;
  const asignadosIds = new Set(staffUbicacion.value.map(s => s.empleado?.id).filter(Boolean));
  return empleadosActivos.value.filter(e => !asignadosIds.has(e.id));
});

// Calcula el nivel jerárquico de un cargo (0 = raíz, 1 = hijo, 2 = nieto…)
function cargoNivel(cargoId: string): number {
  const cargos = empresa.value?.cargos ?? [];
  let nivel = 0;
  let current = cargos.find(c => c.id === cargoId);
  while (current?.parent_role) {
    nivel++;
    current = cargos.find(c => c.id === current!.parent_role);
  }
  return nivel;
}

function cargoNombre(cargoId: string): string {
  return empresa.value?.cargos.find(c => c.id === cargoId)?.nombre ?? '—';
}

// Agrupa el staff en niveles: nivel 0 = Gerentes, 1 = Asistentes, 2+ = Operadores
const staffPorJerarquia = computed(() => {
  const grupos = [
    { nivel: 0, label: 'Gerentes', items: [] as typeof staffUbicacion.value },
    { nivel: 1, label: 'Asistentes', items: [] as typeof staffUbicacion.value },
    { nivel: 2, label: 'Operadores', items: [] as typeof staffUbicacion.value },
  ];
  for (const item of staffUbicacion.value) {
    const nivel = cargoNivel(item.contrato.cargo_id);
    if (nivel === 0) grupos[0].items.push(item);
    else if (nivel === 1) grupos[1].items.push(item);
    else grupos[2].items.push(item);
  }
  return grupos;
});

// Formulario para nuevo contrato
const newContratoEmpleado = ref<Empleado | null>(null);
const newContratoCargo = ref('');
const addingContrato = ref(false);
const contratoError = ref('');

watch(selection, () => {
  newContratoEmpleado.value = null;
  newContratoCargo.value = '';
  contratoError.value = '';
});

async function addStaffToUbicacion() {
  if (!newContratoEmpleado.value || !newContratoCargo.value || selection.value?.type !== 'ubicacion') return;
  addingContrato.value = true;
  contratoError.value = '';
  try {
    await empleadoStore.addContrato(newContratoEmpleado.value.id, {
      empleado_id: newContratoEmpleado.value.id,
      ubicacion_id: selection.value.ubicacion.id,
      cargo_id: newContratoCargo.value,
      active: true,
    });
    newContratoEmpleado.value = null;
    newContratoCargo.value = '';
  } catch (e: any) {
    contratoError.value = e.message ?? 'Error al asignar.';
  } finally {
    addingContrato.value = false;
  }
}

async function changeContratoCargo(contrato: import('../../models/Contrato').Contrato, cargoId: string) {
  try {
    await empleadoStore.updateContrato(contrato.empleado_id, contrato.id, { cargo_id: cargoId });
  } catch (e: any) {
    contratoError.value = e.message ?? 'Error al cambiar cargo.';
  }
}

async function removeStaffFromUbicacion(contratoId: string, empleadoId: string) {
  if (!confirm('¿Quitar a este empleado de la ubicación?')) return;
  try {
    await empleadoStore.removeContrato(empleadoId, contratoId);
  } catch (e: any) {
    contratoError.value = e.message ?? 'Error al quitar.';
  }
}
</script>
