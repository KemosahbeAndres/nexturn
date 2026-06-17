<template>
  <div class="h-full min-h-0 flex overflow-hidden">

    <!-- ══════════════════════ PANEL IZQUIERDO: Lista ══════════════════════ -->
    <div class="w-2/5 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">

      <!-- Cabecera -->
      <div class="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personal</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ empleadosActivos.length }} activo{{ empleadosActivos.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <button
          @click="abrirModalAgregar"
          class="shrink-0 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Agregar
        </button>
      </div>

      <!-- Buscador -->
      <div class="px-3 pb-3 shrink-0">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar..."
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Filtro estaciones -->
      <div class="px-3 pb-3 shrink-0">
        <select
          v-model="filtroEstacion"
          class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las estaciones</option>
          <option v-for="e in estacionesActivas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select>
      </div>

      <!-- Lista scrolleable -->
      <div class="flex-1 overflow-y-auto min-h-0">

        <!-- Vacío -->
        <div v-if="empleadosFiltrados.length === 0" class="px-4 py-10 text-center">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ busqueda || filtroEstacion ? 'Sin resultados.' : 'No hay personal aún.' }}
          </p>
          <button v-if="!busqueda && !filtroEstacion" @click="abrirModalAgregar"
            class="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Agregar el primero
          </button>
        </div>

        <!-- Items -->
        <ul v-else class="pb-2">
          <li
            v-for="emp in empleadosFiltrados"
            :key="emp.id"
            @click="seleccionar(emp)"
            class="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-l-2"
            :class="empleadoSeleccionado?.id === emp.id
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'"
          >
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-blue-600 dark:text-blue-300">{{ emp.initials }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">{{ emp.displayName }}</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {{ cargoEmpleado(emp) || emp.contacto?.rut || emp.contacto?.email || '—' }}
              </p>
            </div>
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="emp.active ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'"
            />
          </li>
        </ul>
      </div>
    </div>

    <!-- ══════════════════════ PANEL DERECHO: Detalle / Editor ══════════════════════ -->
    <div class="flex-1 overflow-y-auto min-h-0">

      <!-- Sin selección -->
      <div v-if="!empleadoSeleccionado" class="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"
          class="w-12 h-12 text-gray-200 dark:text-gray-700">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <p class="text-sm text-gray-400 dark:text-gray-500">Selecciona un miembro para ver su detalle</p>
      </div>

      <!-- Detalle -->
      <div v-else class="p-5 space-y-6 max-w-2xl">

        <!-- Encabezado del miembro -->
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <span class="text-xl font-bold text-blue-600 dark:text-blue-300">{{ empleadoSeleccionado.initials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{{ empleadoSeleccionado.displayName }}</h2>
            <p class="text-sm text-gray-400 dark:text-gray-500">{{ empleadoSeleccionado.contacto?.rut || '—' }}</p>
          </div>
          <button type="button" @click="form.active = !form.active; guardarCampoActivo()"
            class="relative w-10 h-5 rounded-full transition-colors duration-300 shrink-0 mt-1"
            :class="form.active ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
            :title="form.active ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'"
          >
            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
              :class="form.active ? 'translate-x-5' : 'translate-x-0'" />
          </button>
        </div>

        <!-- Sección: Datos de contacto -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datos de contacto</p>
            <button v-if="!editandoContacto" type="button" @click="editandoContacto = true"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Editar</button>
            <div v-else class="flex gap-2">
              <button type="button" @click="cancelarContacto"
                class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
              <button type="button" @click="guardarContacto" :disabled="guardandoContacto"
                class="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:opacity-50">
                {{ guardandoContacto ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Nombre</p>
              <input v-if="editandoContacto" v-model="formContacto.first_name" type="text"
                class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p v-else class="text-sm text-gray-900 dark:text-white">{{ empleadoSeleccionado.contacto?.first_name || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Apellido</p>
              <input v-if="editandoContacto" v-model="formContacto.last_name" type="text"
                class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p v-else class="text-sm text-gray-900 dark:text-white">{{ empleadoSeleccionado.contacto?.last_name || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Email</p>
              <input v-if="editandoContacto" v-model="formContacto.email" type="email"
                class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p v-else class="text-sm text-gray-900 dark:text-white">{{ empleadoSeleccionado.contacto?.email || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Teléfono</p>
              <input v-if="editandoContacto" v-model="formContacto.phone" type="tel"
                class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p v-else class="text-sm text-gray-900 dark:text-white">{{ empleadoSeleccionado.contacto?.phone || '—' }}</p>
            </div>
          </div>
        </section>

        <!-- Sección: Estaciones -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estaciones que opera</p>
            <button v-if="estacionesCambiadas" type="button" @click="guardarEstaciones" :disabled="guardandoEstaciones"
              class="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:opacity-50">
              {{ guardandoEstaciones ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
          <div class="p-4">
            <div v-if="estacionesActivas.length" class="flex flex-wrap gap-2">
              <button v-for="e in estacionesActivas" :key="e.id" type="button"
                @click="toggleEstacion(e.id)"
                class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                :class="form.estacion_ids.includes(e.id)
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-violet-400'"
              >
                {{ e.nombre }}
              </button>
            </div>
            <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
              Sin estaciones definidas. Agrégalas en Mi Equipo → Estaciones.
            </p>
          </div>
        </section>

        <!-- Sección: Contrato / Ubicaciones -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contratos y ubicaciones</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Asigna a qué sucursal pertenece, su cargo y límite horario.</p>
          </div>

          <!-- Contratos existentes -->
          <ul v-if="contratosActivos.length" class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <li v-for="contrato in contratosActivos" :key="contrato.id" class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ nombreUbicacion(contrato.ubicacion_id) }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Cargo: <span class="text-gray-600 dark:text-gray-300">{{ nombreCargo(contrato.cargo_id) || '—' }}</span>
                    · Desde: <span class="text-gray-600 dark:text-gray-300">{{ formatFecha(contrato.fecha_inicio) }}</span>
                    <template v-if="contrato.fecha_fin"> · Hasta: <span class="text-amber-600 dark:text-amber-400">{{ formatFecha(contrato.fecha_fin) }}</span></template>
                    <template v-if="contrato.limite_horas"> · Límite: <span class="text-gray-600 dark:text-gray-300">{{ contrato.limite_horas }}h/sem</span></template>
                  </p>
                </div>
                <button type="button" @click="toggleEditarContrato(contrato.id)"
                  class="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 transition-colors">
                  {{ editandoContratoId === contrato.id ? 'Cerrar' : 'Editar' }}
                </button>
              </div>

              <!-- Mini formulario edición contrato -->
              <div v-if="editandoContratoId === contrato.id" class="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Cargo</label>
                  <select v-model="formContrato.cargo_id"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Sin cargo</option>
                    <option v-for="c in cargosEmpresa" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Límite horas/sem</label>
                  <input v-model.number="formContrato.limite_horas" type="number" min="0" max="168" placeholder="0 = sin límite"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha fin de contrato</label>
                  <input v-model="formContrato.fecha_fin" type="date"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div class="col-span-2 flex gap-2 justify-end">
                  <button type="button" @click="editandoContratoId = null"
                    class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" @click="guardarContrato(contrato.id)" :disabled="guardandoContrato"
                    class="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
                    {{ guardandoContrato ? 'Guardando…' : 'Guardar' }}
                  </button>
                  <button type="button" @click="eliminarContrato(contrato.id)" :disabled="guardandoContrato"
                    class="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <!-- Sin contratos -->
          <div v-else class="px-4 py-5 text-center">
            <p class="text-xs text-gray-400 dark:text-gray-500">Sin contratos vigentes en esta sucursal.</p>
          </div>

          <!-- Añadir contrato -->
          <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <button v-if="!agregandoContrato" type="button" @click="abrirAgregarContrato"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              + Añadir a otra ubicación
            </button>
            <div v-else class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Ubicación <span class="text-red-500">*</span></label>
                  <select v-model="nuevoContrato.ubicacion_id"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Seleccionar…</option>
                    <option v-for="ub in ubicacionesActivas" :key="ub.id" :value="ub.id">{{ ub.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Cargo</label>
                  <select v-model="nuevoContrato.cargo_id"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Sin cargo</option>
                    <option v-for="c in cargosEmpresa" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Límite horas/sem</label>
                  <input v-model.number="nuevoContrato.limite_horas" type="number" min="0" max="168" placeholder="0 = sin límite"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha fin contrato</label>
                  <input v-model="nuevoContrato.fecha_fin" type="date"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <p v-if="errorContrato" class="text-xs text-red-500">{{ errorContrato }}</p>
              <div class="flex gap-2 justify-end">
                <button type="button" @click="agregandoContrato = false"
                  class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="button" @click="crearContrato" :disabled="guardandoContrato"
                  class="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
                  {{ guardandoContrato ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>

    <!-- ══════════════════════ MODAL: Agregar personal ══════════════════════ -->
    <Transition name="modal">
      <div v-if="modalAgregarOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModalAgregar" />
        <div class="relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85dvh]">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Agregar personal</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Empleados disponibles para asignar</p>
            </div>
            <button @click="cerrarModalAgregar" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5 mx-5 mt-4 shrink-0">
            <button v-for="tab in modalTabs" :key="tab.id" type="button"
              @click="modalTab = tab.id"
              class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="modalTab === tab.id
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab: Buscar empleado existente -->
          <template v-if="modalTab === 'buscar'">
            <!-- Buscador modal -->
            <div class="px-5 pt-4 pb-2 shrink-0">
              <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                  class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  v-model="busquedaModal"
                  type="search"
                  placeholder="Buscar por nombre o RUT..."
                  class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Lista empleados disponibles -->
            <div class="flex-1 overflow-y-auto min-h-0 px-5 pb-5">
              <div v-if="empleadosDisponibles.length === 0" class="py-10 text-center">
                <p class="text-sm text-gray-400 dark:text-gray-500">
                  {{ busquedaModal ? 'Sin resultados.' : 'Todos los empleados ya tienen contrato vigente.' }}
                </p>
              </div>
              <ul v-else class="space-y-1 mt-1">
                <li
                  v-for="emp in empleadosDisponibles"
                  :key="emp.id"
                  @click="seleccionarParaAgregar(emp)"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors"
                  :class="empleadoParaAgregar?.id === emp.id
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'"
                >
                  <div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                    <span class="text-xs font-bold text-blue-600 dark:text-blue-300">{{ emp.initials }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ emp.displayName }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {{ emp.contacto?.rut || emp.contacto?.email || '—' }}
                      <template v-if="contratoVenciendo(emp)">
                        · <span class="text-amber-500">contrato por vencer</span>
                      </template>
                    </p>
                  </div>
                  <svg v-if="empleadoParaAgregar?.id === emp.id" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-blue-600 shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </li>
              </ul>
            </div>

            <!-- Footer -->
            <div class="px-5 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0 flex gap-3">
              <button type="button" @click="cerrarModalAgregar"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button type="button" @click="confirmarAgregarEmpleado" :disabled="!empleadoParaAgregar"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
                Seleccionar
              </button>
            </div>
          </template>

          <!-- Tab: Crear empleado nuevo -->
          <template v-else>
            <form @submit.prevent="guardarNuevoEmpleado" class="flex-1 overflow-y-auto p-5 space-y-4">

              <!-- RUT con validación -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RUT <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    :value="rut"
                    @input="onRutInput"
                    @blur="onRutBlur"
                    type="text"
                    placeholder="12345678-9"
                    maxlength="10"
                    autocomplete="off"
                    required
                    :class="[
                      'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10',
                      rutShowError ? 'border-red-400 dark:border-red-500'
                        : rutIsValid ? 'border-emerald-400 dark:border-emerald-500'
                        : 'border-gray-200 dark:border-gray-600'
                    ]"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg v-if="buscandoRut" class="w-4 h-4 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <svg v-else-if="rutIsValid && !rutShowError" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-emerald-500">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <svg v-else-if="rutShowError" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-red-500">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <p v-if="rutShowError" class="mt-1 text-xs text-red-500">RUT inválido.</p>
              </div>

              <!-- Alertas -->
              <div v-if="alertaPersonalDuplicado" class="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p class="text-xs text-red-600 dark:text-red-300 font-medium">Este RUT ya está registrado como personal de esta empresa.</p>
              </div>
              <div v-else-if="alertaContactoOtraEmpresa" class="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p class="text-xs text-blue-600 dark:text-blue-300">Contacto existente: <strong>{{ contactoEncontrado?.first_name }} {{ contactoEncontrado?.last_name }}</strong>. Se vinculará a esta empresa.</p>
              </div>

              <!-- Campos (solo si RUT válido) -->
              <template v-if="rutIsValid && !alertaPersonalDuplicado">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span class="text-red-500">*</span></label>
                    <input v-model="formNuevo.first_name" type="text" required :disabled="!!contactoEncontrado"
                      class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido <span class="text-red-500">*</span></label>
                    <input v-model="formNuevo.last_name" type="text" required :disabled="!!contactoEncontrado"
                      class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input v-model="formNuevo.email" type="email" :disabled="!!contactoEncontrado"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input v-model="formNuevo.phone" type="tel" :disabled="!!contactoEncontrado"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                </div>
              </template>

              <p v-if="errorNuevo" class="text-xs text-red-500">{{ errorNuevo }}</p>

              <div class="flex gap-3 pt-1">
                <button type="button" @click="cerrarModalAgregar"
                  class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button v-if="rutIsValid && !alertaPersonalDuplicado" type="submit" :disabled="guardandoNuevo"
                  class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
                  {{ guardandoNuevo ? 'Guardando…' : 'Crear y agregar' }}
                </button>
              </div>
            </form>
          </template>

        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useEmpleadoStore } from '../../stores/empleadoStore';
import { useUbicacionStore } from '../../stores/ubicacionStore';
import { useEstacionStore } from '../../stores/estacionStore';
import { useRut } from '../../composables/useRut';
import { db } from '../../firebase';
import { contactoConverter, Contacto } from '../../models/Contacto';
import { Contrato } from '../../models/Contrato';
import { v4 as uuidv4 } from 'uuid';
import type { Empleado } from '../../models/Empleado';

const route = useRoute();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();
const empleadoStore = useEmpleadoStore();
const ubicacionStore = useUbicacionStore();
const estacionStore = useEstacionStore();

const activeCompanyId = computed(() => {
  if (sessionStore.userRole !== 'super_admin') return sessionStore.activeCompanyId;
  const slug = route.params.companySlug as string;
  return empresaStore.empresas?.find(e => e.slug === slug)?.id ?? null;
});

onMounted(() => {
  if (activeCompanyId.value) {
    empleadoStore.listarEmpleados(activeCompanyId.value);
    ubicacionStore.listarUbicaciones(activeCompanyId.value);
    estacionStore.listarEstaciones(activeCompanyId.value);
  }
});

watch(activeCompanyId, (id) => {
  if (id) {
    empleadoStore.listarEmpleados(id);
    ubicacionStore.listarUbicaciones(id);
    estacionStore.listarEstaciones(id);
  }
});

// ── Datos derivados ────────────────────────────────────────────────────────────

const estacionesActivas = computed(() => estacionStore.estacionesActivas);
const empleadosActivos  = computed(() => empleadoStore.empleadosActivos);
const ubicacionesActivas = computed(() => (ubicacionStore.ubicaciones ?? []).filter(u => u.active && !u.deletedAt));

const cargosEmpresa = computed(() => {
  const empresa = empresaStore.empresas?.find(e => e.id === activeCompanyId.value);
  return empresa?.cargos?.filter(c => !c.deletedAt) ?? [];
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function cargoEmpleado(emp: Empleado): string {
  const contrato = (emp.contratos ?? []).find(c => c.active && !c.deletedAt);
  if (!contrato?.cargo_id) return '';
  return nombreCargo(contrato.cargo_id);
}

function nombreUbicacion(id: string): string {
  return ubicacionesActivas.value.find(u => u.id === id)?.name ?? id;
}

function nombreCargo(id: string): string {
  return cargosEmpresa.value.find(c => c.id === id)?.nombre ?? '';
}

function formatFecha(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

const hoyMasUnMes = new Date();
hoyMasUnMes.setMonth(hoyMasUnMes.getMonth() + 1);

function tieneContratoVigente(emp: Empleado): boolean {
  const hoy = new Date();
  return (emp.contratos ?? []).some(c =>
    c.active &&
    !c.deletedAt &&
    (!c.fecha_fin || c.fecha_fin > hoyMasUnMes)
  );
}

function contratoVenciendo(emp: Empleado): boolean {
  const hoy = new Date();
  return (emp.contratos ?? []).some(c =>
    c.active &&
    !c.deletedAt &&
    c.fecha_fin &&
    c.fecha_fin <= hoyMasUnMes &&
    c.fecha_fin > hoy
  );
}

// ── Lista izquierda ────────────────────────────────────────────────────────────

const busqueda = ref('');
const filtroEstacion = ref('');

const empleadosFiltrados = computed(() => {
  let lista = empleadoStore.empleados?.filter(e => e.active && !e.deletedAt) ?? [];
  if (filtroEstacion.value) lista = lista.filter(e => e.estacion_ids.includes(filtroEstacion.value));
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase();
    lista = lista.filter(e =>
      e.displayName.toLowerCase().includes(q) ||
      (e.contacto?.rut ?? '').toLowerCase().includes(q)
    );
  }
  return lista;
});

// ── Panel derecho ──────────────────────────────────────────────────────────────

const empleadoSeleccionado = ref<Empleado | null>(null);

const form = reactive({
  active: true,
  estacion_ids: [] as string[],
});

function seleccionar(emp: Empleado) {
  empleadoSeleccionado.value = emp;
  form.active = emp.active;
  form.estacion_ids = [...emp.estacion_ids];
  editandoContacto.value = false;
  editandoContratoId.value = null;
  agregandoContrato.value = false;
  formContacto.first_name = emp.contacto?.first_name ?? '';
  formContacto.last_name  = emp.contacto?.last_name  ?? '';
  formContacto.email      = emp.contacto?.email      ?? '';
  formContacto.phone      = emp.contacto?.phone      ?? '';
}

// Mantener datos del empleado seleccionado sincronizados si cambia en Firestore
watch(() => empleadoStore.empleados, (lista) => {
  if (!empleadoSeleccionado.value || !lista) return;
  const actualizado = lista.find(e => e.id === empleadoSeleccionado.value!.id);
  if (actualizado) {
    empleadoSeleccionado.value = actualizado;
    if (!editandoContacto.value) {
      formContacto.first_name = actualizado.contacto?.first_name ?? '';
      formContacto.last_name  = actualizado.contacto?.last_name  ?? '';
      formContacto.email      = actualizado.contacto?.email      ?? '';
      formContacto.phone      = actualizado.contacto?.phone      ?? '';
    }
  }
}, { deep: true });

// Toggle activo
async function guardarCampoActivo() {
  if (!empleadoSeleccionado.value) return;
  await empleadoStore.updateEmpleado(empleadoSeleccionado.value.id, { active: form.active });
}

// ── Datos de contacto ──────────────────────────────────────────────────────────

const editandoContacto  = ref(false);
const guardandoContacto = ref(false);
const formContacto = reactive({ first_name: '', last_name: '', email: '', phone: '' });

function cancelarContacto() {
  editandoContacto.value = false;
  const emp = empleadoSeleccionado.value;
  formContacto.first_name = emp?.contacto?.first_name ?? '';
  formContacto.last_name  = emp?.contacto?.last_name  ?? '';
  formContacto.email      = emp?.contacto?.email      ?? '';
  formContacto.phone      = emp?.contacto?.phone      ?? '';
}

async function guardarContacto() {
  if (!empleadoSeleccionado.value?.contact_id) return;
  guardandoContacto.value = true;
  try {
    await updateDoc(doc(db, 'contactos', empleadoSeleccionado.value.contact_id), {
      first_name: formContacto.first_name,
      last_name:  formContacto.last_name,
      email:      formContacto.email,
      phone:      formContacto.phone,
      updatedAt:  Timestamp.now(),
    });
    editandoContacto.value = false;
  } finally {
    guardandoContacto.value = false;
  }
}

// ── Estaciones ─────────────────────────────────────────────────────────────────

const guardandoEstaciones = ref(false);

const estacionesCambiadas = computed(() => {
  const original = empleadoSeleccionado.value?.estacion_ids ?? [];
  const actual = form.estacion_ids;
  return original.length !== actual.length || actual.some(id => !original.includes(id));
});

function toggleEstacion(id: string) {
  const idx = form.estacion_ids.indexOf(id);
  if (idx === -1) form.estacion_ids.push(id);
  else form.estacion_ids.splice(idx, 1);
}

async function guardarEstaciones() {
  if (!empleadoSeleccionado.value) return;
  guardandoEstaciones.value = true;
  try {
    await empleadoStore.updateEmpleado(empleadoSeleccionado.value.id, { estacion_ids: [...form.estacion_ids] });
  } finally {
    guardandoEstaciones.value = false;
  }
}

// ── Contratos ──────────────────────────────────────────────────────────────────

const contratosActivos = computed(() =>
  (empleadoSeleccionado.value?.contratos ?? []).filter(c => c.active && !c.deletedAt)
);

const editandoContratoId = ref<string | null>(null);
const guardandoContrato  = ref(false);
const errorContrato      = ref('');

const formContrato = reactive({ cargo_id: '', limite_horas: 0, fecha_fin: '' });

function toggleEditarContrato(id: string) {
  if (editandoContratoId.value === id) { editandoContratoId.value = null; return; }
  const c = contratosActivos.value.find(x => x.id === id);
  if (!c) return;
  formContrato.cargo_id     = c.cargo_id ?? '';
  formContrato.limite_horas = c.limite_horas ?? 0;
  formContrato.fecha_fin    = c.fecha_fin ? c.fecha_fin.toISOString().split('T')[0] : '';
  editandoContratoId.value = id;
}

async function guardarContrato(id: string) {
  if (!empleadoSeleccionado.value) return;
  guardandoContrato.value = true;
  try {
    await empleadoStore.updateContrato(empleadoSeleccionado.value.id, id, {
      cargo_id:     formContrato.cargo_id,
      limite_horas: formContrato.limite_horas,
      fecha_fin:    formContrato.fecha_fin ? new Date(formContrato.fecha_fin + 'T00:00:00') : null,
    });
    editandoContratoId.value = null;
  } finally {
    guardandoContrato.value = false;
  }
}

async function eliminarContrato(id: string) {
  if (!empleadoSeleccionado.value) return;
  guardandoContrato.value = true;
  try {
    await empleadoStore.removeContrato(empleadoSeleccionado.value.id, id);
    editandoContratoId.value = null;
  } finally {
    guardandoContrato.value = false;
  }
}

// Añadir contrato
const agregandoContrato = ref(false);
const nuevoContrato = reactive({ ubicacion_id: '', cargo_id: '', limite_horas: 0, fecha_fin: '' });

function abrirAgregarContrato() {
  nuevoContrato.ubicacion_id = '';
  nuevoContrato.cargo_id     = '';
  nuevoContrato.limite_horas = 0;
  nuevoContrato.fecha_fin    = '';
  errorContrato.value = '';
  agregandoContrato.value = true;
}

async function crearContrato() {
  if (!empleadoSeleccionado.value || !nuevoContrato.ubicacion_id) {
    errorContrato.value = 'Debes seleccionar una ubicación.';
    return;
  }
  guardandoContrato.value = true;
  errorContrato.value = '';
  try {
    await empleadoStore.addContrato(empleadoSeleccionado.value.id, {
      empleado_id:  empleadoSeleccionado.value.id,
      ubicacion_id: nuevoContrato.ubicacion_id,
      cargo_id:     nuevoContrato.cargo_id,
      active:       true,
      limite_horas: nuevoContrato.limite_horas,
      fecha_inicio: new Date(),
      fecha_fin:    nuevoContrato.fecha_fin ? new Date(nuevoContrato.fecha_fin + 'T00:00:00') : null,
    });
    agregandoContrato.value = false;
  } catch (e: any) {
    errorContrato.value = e.message || 'Error al crear el contrato.';
  } finally {
    guardandoContrato.value = false;
  }
}

// ── Modal agregar personal ─────────────────────────────────────────────────────

const modalAgregarOpen  = ref(false);
const modalTab          = ref<'buscar' | 'nuevo'>('buscar');
const modalTabs         = [{ id: 'buscar', label: 'Buscar empleado' }, { id: 'nuevo', label: 'Crear nuevo' }];
const busquedaModal     = ref('');
const empleadoParaAgregar = ref<Empleado | null>(null);

// Empleados sin contrato vigente O con contrato por vencer este mes
const empleadosDisponibles = computed(() => {
  const q = busquedaModal.value.toLowerCase();
  return (empleadoStore.empleados ?? [])
    .filter(e => e.active && !e.deletedAt)
    .filter(e => !tieneContratoVigente(e) || contratoVenciendo(e))
    .filter(e => !q ||
      e.displayName.toLowerCase().includes(q) ||
      (e.contacto?.rut ?? '').toLowerCase().includes(q)
    );
});

function abrirModalAgregar() {
  busquedaModal.value = '';
  empleadoParaAgregar.value = null;
  modalTab.value = 'buscar';
  resetVerificacion();
  setRut('');
  formNuevo.first_name = '';
  formNuevo.last_name  = '';
  formNuevo.email      = '';
  formNuevo.phone      = '';
  modalAgregarOpen.value = true;
}

function cerrarModalAgregar() { modalAgregarOpen.value = false; }

function seleccionarParaAgregar(emp: Empleado) {
  empleadoParaAgregar.value = emp;
}

function confirmarAgregarEmpleado() {
  if (!empleadoParaAgregar.value) return;
  cerrarModalAgregar();
  seleccionar(empleadoParaAgregar.value);
}

// ── Crear empleado nuevo (tab "nuevo") ────────────────────────────────────────

const { rut, isValid: rutIsValid, showError: rutShowError, onInput: onRutInput, onBlur: rutBlurFn, setRut } = useRut();

const buscandoRut             = ref(false);
const contactoEncontrado      = ref<Contacto | null>(null);
const alertaPersonalDuplicado = ref(false);
const alertaContactoOtraEmpresa = ref(false);

const formNuevo = reactive({ first_name: '', last_name: '', email: '', phone: '' });
const errorNuevo    = ref('');
const guardandoNuevo = ref(false);

function onRutBlur() { rutBlurFn(); }

function resetVerificacion() {
  contactoEncontrado.value       = null;
  alertaPersonalDuplicado.value  = false;
  alertaContactoOtraEmpresa.value = false;
}

watch(rutIsValid, async (valido) => {
  if (!valido) { resetVerificacion(); return; }
  buscandoRut.value = true;
  resetVerificacion();
  try {
    const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
    const snap = await getDocs(query(contactosRef, where('rut', '==', rut.value.toUpperCase())));
    if (snap.empty) return;

    const contacto = snap.docs[0].data();
    contactoEncontrado.value = contacto;
    formNuevo.first_name = contacto.first_name;
    formNuevo.last_name  = contacto.last_name;
    formNuevo.email      = contacto.email;
    formNuevo.phone      = contacto.phone;

    const empSnap = await getDocs(query(collection(db, 'empleados'),
      where('contact_id', '==', contacto.id),
      where('company_id', '==', activeCompanyId.value)
    ));
    if (!empSnap.empty) { alertaPersonalDuplicado.value = true; return; }
    alertaContactoOtraEmpresa.value = true;
  } catch (e) {
    console.error('Error verificando RUT:', e);
  } finally {
    buscandoRut.value = false;
  }
});

async function guardarNuevoEmpleado() {
  if (!activeCompanyId.value || alertaPersonalDuplicado.value) return;
  errorNuevo.value = '';
  guardandoNuevo.value = true;
  try {
    let contactId: string;
    if (contactoEncontrado.value) {
      contactId = contactoEncontrado.value.id;
    } else {
      const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
      const newRef = doc(contactosRef);
      await setDoc(newRef, new Contacto(
        newRef.id, formNuevo.first_name, formNuevo.last_name,
        rut.value.toUpperCase(), formNuevo.email, formNuevo.phone, '', false, true
      ));
      contactId = newRef.id;
    }
    await empleadoStore.createEmpleado({
      company_id:   activeCompanyId.value,
      contact_id:   contactId,
      active:       true,
      estacion_ids: [],
      contratos:    [],
      disponibilidad: null,
    });
    cerrarModalAgregar();
  } catch (e: any) {
    errorNuevo.value = e.message || 'Error al crear el empleado.';
  } finally {
    guardandoNuevo.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
