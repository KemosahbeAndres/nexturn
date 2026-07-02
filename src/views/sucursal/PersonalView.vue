<template>
  <div class="h-full min-h-0 flex overflow-hidden">

    <!-- ══════════════════════ PANEL IZQUIERDO: Lista ══════════════════════ -->
    <div class="w-2/5 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">

      <!-- Cabecera -->
      <div class="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ isCongregacion ? 'Voluntarios' : 'Personal' }}</p>
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

      <!-- Filtro estaciones (solo empresa) -->
      <div v-if="!isCongregacion" class="px-3 pb-3 shrink-0">
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
            {{ busqueda || filtroEstacion ? 'Sin resultados.' : (isCongregacion ? 'No hay voluntarios aún.' : 'No hay personal aún.') }}
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

        <!-- Sección: Estaciones (solo empresa) -->
        <section v-if="!isCongregacion" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
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
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ isCongregacion ? 'Ubicación' : 'Contratos y ubicaciones' }}</p>
            <p v-if="!isCongregacion" class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Asigna a qué sucursal pertenece, su cargo y límite horario.</p>
          </div>

          <!-- Contratos existentes -->
          <ul v-if="contratosActivos.length" class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <li v-for="contrato in contratosActivos" :key="contrato.id" class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ nombreUbicacion(contrato.ubicacion_id) }}
                  </p>
                  <!-- En empresa: mostrar cargo, fechas y límite horario -->
                  <p v-if="!isCongregacion" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Cargo: <span class="text-gray-600 dark:text-gray-300">{{ nombreCargo(contrato.cargo_id) || '—' }}</span>
                    · Desde: <span class="text-gray-600 dark:text-gray-300">{{ formatFecha(contrato.fecha_inicio) }}</span>
                    <template v-if="contrato.fecha_fin"> · Hasta: <span class="text-amber-600 dark:text-amber-400">{{ formatFecha(contrato.fecha_fin) }}</span></template>
                    <template v-if="contrato.limite_horas"> · Límite: <span class="text-gray-600 dark:text-gray-300">{{ contrato.limite_horas }}h/sem</span></template>
                  </p>
                </div>
                <button v-if="!isCongregacion" type="button" @click="toggleEditarContrato(contrato.id)"
                  class="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 transition-colors">
                  {{ editandoContratoId === contrato.id ? 'Cerrar' : 'Editar' }}
                </button>
                <button v-else type="button" @click="eliminarContrato(contrato.id)" :disabled="guardandoContrato"
                  class="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0 transition-colors disabled:opacity-50">
                  Quitar
                </button>
              </div>

              <!-- Mini formulario edición contrato (solo empresa) -->
              <div v-if="!isCongregacion && editandoContratoId === contrato.id" class="mt-3 grid grid-cols-2 gap-2">
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
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ isCongregacion ? 'Sin ubicación asignada.' : 'Sin contratos vigentes en esta sucursal.' }}</p>
          </div>

          <!-- Añadir contrato / ubicación -->
          <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <button v-if="!agregandoContrato" type="button" @click="abrirAgregarContrato"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              {{ isCongregacion ? '+ Añadir a otra ubicación' : '+ Añadir a otra ubicación' }}
            </button>
            <div v-else class="space-y-2">
              <div :class="isCongregacion ? '' : 'grid grid-cols-2 gap-2'">
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Ubicación <span class="text-red-500">*</span></label>
                  <select v-model="nuevoContrato.ubicacion_id"
                    class="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Seleccionar…</option>
                    <option v-for="ub in ubicacionesActivas" :key="ub.id" :value="ub.id">{{ ub.name }}</option>
                  </select>
                </div>
                <!-- Campos extra solo en empresa -->
                <template v-if="!isCongregacion">
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
                </template>
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

        <!-- Sección: Disponibilidad -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponibilidad semanal</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Días y franjas en que puede trabajar. El algoritmo usa esto como oferta.</p>
          </div>

          <div class="p-4 space-y-4">
            <!-- Selector de días (toggle) -->
            <div>
              <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Días disponibles</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="dia in DIAS_SEMANA" :key="dia"
                  type="button"
                  @click="dispToggleDia(dia)"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors"
                  :class="dispDiaTieneVentanas(dia)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400'"
                >
                  {{ dia.slice(0, 3) }}
                </button>
              </div>
            </div>

            <!-- Franjas por día activo -->
            <div v-if="dispFormVentanas.some(v => true)" class="space-y-2">
              <div
                v-for="dia in DIAS_SEMANA.filter(dispDiaTieneVentanas)"
                :key="dia"
                class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ dia }}</span>
                  <button type="button" @click="dispAgregarVentana(dia)"
                    class="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline">+ Franja</button>
                </div>
                <div class="space-y-1.5">
                  <div v-for="v in dispVentanasDeDia(dia)" :key="v.day_of_week + v.start + v.end" class="flex items-center gap-2">
                    <input v-model="v.start" type="time"
                      class="w-24 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums" />
                    <span class="text-xs text-gray-400">–</span>
                    <input v-model="v.end" type="time"
                      class="w-24 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums" />
                    <button type="button" @click="dispQuitarVentana(v)"
                      class="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="!dispFormVentanas.length" class="text-xs text-gray-400 dark:text-gray-500 italic">Sin días seleccionados. Toca un día para activarlo.</p>

            <!-- Frecuencias -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Semanas al mes (0 = todas)</p>
                <div class="flex gap-1.5 flex-wrap">
                  <button v-for="n in [0,1,2,3,4]" :key="n" type="button" @click="dispForm.monthly_frequency = n"
                    class="w-8 h-8 text-xs font-semibold rounded-lg border transition-colors"
                    :class="dispForm.monthly_frequency === n
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400'">
                    {{ n === 0 ? '∞' : n }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Días por semana</p>
                <div class="flex gap-1.5 flex-wrap">
                  <button v-for="n in [1,2,3,4,5,6,7]" :key="n" type="button" @click="dispForm.weekly_frequency = n"
                    class="w-8 h-8 text-xs font-semibold rounded-lg border transition-colors"
                    :class="dispForm.weekly_frequency === n
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400'">
                    {{ n }}
                  </button>
                </div>
              </div>
            </div>

            <p v-if="dispErrorMsg" class="text-xs text-red-500 dark:text-red-400">{{ dispErrorMsg }}</p>
            <p v-if="dispSuccessMsg" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{{ dispSuccessMsg }}</p>

            <div class="flex items-center gap-2">
              <button v-if="empleadoSeleccionado?.disponibilidad" type="button" @click="dispLimpiar"
                class="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Limpiar
              </button>
              <div class="flex-1" />
              <button type="button" @click="dispResetForm" :disabled="!dispIsDirty"
                class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40">
                Deshacer
              </button>
              <button type="button" @click="dispGuardar" :disabled="!dispIsDirty || dispSaving"
                class="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
                {{ dispSaving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Sección: Excepciones -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Excepciones</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Ausencias puntuales. Restan disponibilidad ese día.</p>
            </div>
            <button type="button" @click="excOpenAdd = !excOpenAdd"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold transition-colors"
              :class="excOpenAdd ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'"
              title="Agregar excepción">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"
                :class="excOpenAdd ? 'rotate-45' : ''" style="transition: transform 0.15s">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          <div class="p-4 space-y-3">
            <!-- Formulario agregar -->
            <div v-if="excOpenAdd" class="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Nueva excepción</p>
              <div class="grid grid-cols-2 gap-2">
                <div class="col-span-2">
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
                  <input v-model="excAddForm.date" type="date"
                    class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white" />
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Hora inicio</label>
                  <input v-model="excAddForm.time_start" type="time"
                    class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white tabular-nums" />
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Hora fin</label>
                  <input v-model="excAddForm.time_end" type="time"
                    class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white tabular-nums" />
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                  <select v-model="excAddForm.type"
                    class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white">
                    <option value="feriado_legal">Feriado legal</option>
                    <option value="dia_administrativo">Día administrativo</option>
                    <option value="emergencia">Emergencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Motivo</label>
                  <input v-model="excAddForm.reason" type="text" placeholder="Describe el motivo…"
                    class="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white" />
                </div>
              </div>
              <p v-if="excAddError" class="text-xs text-red-500 dark:text-red-400">{{ excAddError }}</p>
              <div class="flex gap-2">
                <button type="button" @click="excOpenAdd = false"
                  class="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="button" @click="excSubmitAdd" :disabled="excAdding"
                  class="flex-1 px-3 py-1.5 text-xs text-white font-medium rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-40">
                  {{ excAdding ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </div>

            <!-- Lista de excepciones -->
            <div v-if="!excepcionesActivas.length && !excOpenAdd" class="text-xs text-gray-400 dark:text-gray-500 italic py-1">
              Sin excepciones registradas.
            </div>
            <div
              v-for="exc in excepcionesActivas" :key="exc.id"
              class="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 space-y-1"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ excFormatDate(exc.date) }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" :class="excTipoClass(exc.type)">
                    {{ excTipoLabel(exc.type) }}
                  </span>
                </div>
                <button v-if="canManage" type="button" @click="excEliminar(exc.id)"
                  class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ exc.time_start }} – {{ exc.time_end }}</p>
              <p v-if="exc.reason" class="text-xs text-gray-600 dark:text-gray-300">{{ exc.reason }}</p>
            </div>
          </div>
        </section>

        <!-- Sección: Reglas de convivencia -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reglas de convivencia</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Juntos / Nunca juntos en el mismo turno.</p>
            </div>
            <button type="button" @click="reglaOpenAdd = !reglaOpenAdd"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold transition-colors"
              :class="reglaOpenAdd ? 'bg-violet-700 hover:bg-violet-800' : 'bg-violet-600 hover:bg-violet-700'"
              title="Agregar regla">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"
                :class="reglaOpenAdd ? 'rotate-45' : ''" style="transition: transform 0.15s">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          <div class="p-4 space-y-3">
            <!-- Formulario nueva regla -->
            <div v-if="reglaOpenAdd" class="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/40 space-y-3">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Nueva regla</p>

              <div>
                <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Persona</label>
                <select v-model="reglaFormPareja"
                  class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="">Seleccionar…</option>
                  <option v-for="emp in empleadosParaRegla" :key="emp.id" :value="emp.id">{{ emp.displayName }}</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                <div class="flex gap-2">
                  <button type="button" @click="reglaFormTipo = 'juntos'"
                    class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                    :class="reglaFormTipo === 'juntos'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400'">
                    Siempre juntos
                  </button>
                  <button type="button" @click="reglaFormTipo = 'nunca_juntos'"
                    class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                    :class="reglaFormTipo === 'nunca_juntos'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-400'">
                    Nunca juntos
                  </button>
                </div>
              </div>

              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="reglaFormStrict"
                  class="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                <span class="text-xs text-gray-600 dark:text-gray-300">Regla estricta (el algoritmo la respeta en todos los turnos)</span>
              </label>

              <p v-if="reglaError" class="text-xs text-red-500">{{ reglaError }}</p>
              <div class="flex gap-2">
                <button type="button" @click="reglaOpenAdd = false"
                  class="flex-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="button" @click="reglaSubmitAdd" :disabled="!reglaFormPareja || reglaAdding"
                  class="flex-1 px-3 py-1.5 text-xs text-white font-medium rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-40">
                  {{ reglaAdding ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </div>

            <!-- Lista de reglas -->
            <div v-if="!reglas.length && !reglaOpenAdd" class="text-xs text-gray-400 dark:text-gray-500 italic py-1">
              Sin reglas definidas.
            </div>
            <div
              v-for="regla in reglas" :key="regla.id"
              class="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 space-y-2"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{{ nombreReglaPareja(regla) }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="regla.type === 'juntos'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'">
                      {{ regla.type === 'juntos' ? 'Siempre juntos' : 'Nunca juntos' }}
                    </span>
                    <span v-if="regla.is_strict" class="text-[10px] px-1.5 py-0.5 rounded font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                      Estricta
                    </span>
                  </div>
                </div>
                <button v-if="canManage" type="button" @click="reglaEliminar(regla.id)"
                  class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
              <!-- Edición inline (tipo + strict) -->
              <div v-if="canManage" class="flex items-center gap-3 pt-1">
                <button type="button" @click="reglaCambiarTipo(regla.id, regla.type === 'juntos' ? 'nunca_juntos' : 'juntos')"
                  class="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                  Cambiar a {{ regla.type === 'juntos' ? 'Nunca juntos' : 'Siempre juntos' }}
                </button>
                <button type="button" @click="reglaCambiarStrict(regla.id, !regla.is_strict)"
                  class="text-[10px] text-gray-400 dark:text-gray-500 hover:underline">
                  {{ regla.is_strict ? 'Hacer flexible' : 'Hacer estricta' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Sección: Acceso al sistema -->
        <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acceso al sistema</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Gestiona si este empleado puede iniciar sesión.</p>
          </div>

          <!-- Estado: buscando usuario -->
          <div v-if="buscandoUsuario" class="px-4 py-5 flex items-center gap-2 text-gray-400">
            <svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span class="text-xs">Verificando acceso…</span>
          </div>

          <!-- Estado: ya tiene usuario -->
          <div v-else-if="usuarioEmpleado" class="px-4 py-4 space-y-3">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="usuarioEmpleado.estado === 'activo'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : usuarioEmpleado.estado === 'invitado'
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'">
                {{ usuarioEmpleado.estado === 'activo' ? '✓' : usuarioEmpleado.estado === 'invitado' ? '~' : '✕' }}
              </span>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ usuarioEmpleado.contacto?.email || empleadoSeleccionado?.contacto?.email || '—' }}</p>
                <p class="text-xs capitalize"
                  :class="usuarioEmpleado.estado === 'activo'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : usuarioEmpleado.estado === 'invitado'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500'">
                  {{ { activo: 'Activo', invitado: 'Invitado (pendiente)', suspendido: 'Suspendido' }[usuarioEmpleado.estado] ?? usuarioEmpleado.estado }}
                </p>
              </div>
            </div>
            <!-- Grants del usuario para esta empresa -->
            <div v-if="grantsUsuarioEmpleado.length" class="space-y-1">
              <p class="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">Permisos asignados</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="g in grantsUsuarioEmpleado" :key="g.id"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  {{ GRANT_ROLE_LABELS[g.role] ?? g.role }}
                  <span class="text-[10px] text-blue-400 dark:text-blue-500">· {{ SCOPE_TYPE_LABELS[g.scope_type] ?? g.scope_type }}</span>
                </span>
              </div>
            </div>
            <p v-if="errorAcceso" class="text-xs text-red-500">{{ errorAcceso }}</p>
            <button type="button" @click="revocarAcceso" :disabled="guardandoAcceso"
              class="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50">
              {{ guardandoAcceso ? 'Procesando…' : 'Revocar acceso' }}
            </button>
          </div>

          <!-- Estado: sin usuario — formulario de invitación -->
          <div v-else class="px-4 py-4 space-y-3">
            <p class="text-xs text-gray-400 dark:text-gray-500">Este empleado aún no tiene acceso al sistema.</p>

            <!-- Si el cargo tiene scope_role_template, lo mostramos como sugerencia -->
            <div v-if="templateSugerido" class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p class="text-xs text-blue-700 dark:text-blue-300">
                Su cargo sugiere el rol <strong>{{ GRANT_ROLE_LABELS[templateSugerido] }}</strong>.
              </p>
            </div>

            <!-- Formulario de invitación -->
            <div v-if="!empleadoSeleccionado?.contacto?.email" class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <p class="text-xs text-amber-700 dark:text-amber-300">Agrega un email al empleado antes de crear su acceso.</p>
            </div>

            <template v-else>
              <div class="space-y-2">
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Rol de acceso</label>
                  <select v-model="formAcceso.role"
                    class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="zone_manager">Gestor de zona</option>
                    <option value="branch_manager">{{ isCongregacion ? 'Gestor de ubicación' : 'Gestor de sucursal' }}</option>
                    <option value="member">Miembro</option>
                    <option value="viewer">Solo lectura</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Contraseña temporal</label>
                  <input v-model="formAcceso.password" type="password" placeholder="Mín. 6 caracteres" minlength="6"
                    class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <p v-if="errorAcceso" class="text-xs text-red-500">{{ errorAcceso }}</p>
              <button type="button" @click="crearAccesoEmpleado" :disabled="guardandoAcceso || formAcceso.password.length < 6"
                class="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
                {{ guardandoAcceso ? 'Creando acceso…' : 'Crear acceso e invitar' }}
              </button>
            </template>
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
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ isCongregacion ? 'Agregar voluntario' : 'Agregar personal' }}</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ isCongregacion ? 'Voluntarios disponibles para asignar' : 'Empleados disponibles para asignar' }}</p>
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
              @click="modalTab = tab.id as 'buscar' | 'nuevo'"
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
                  :placeholder="isCongregacion ? 'Buscar por nombre…' : 'Buscar por nombre o RUT…'"
                  class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Lista empleados disponibles -->
            <div class="flex-1 overflow-y-auto min-h-0 px-5 pb-5">
              <div v-if="empleadosDisponibles.length === 0" class="py-10 text-center">
                <p class="text-sm text-gray-400 dark:text-gray-500">
                  {{ busquedaModal ? 'Sin resultados.' : (isCongregacion ? 'Todos los voluntarios ya tienen contrato vigente.' : 'Todos los empleados ya tienen contrato vigente.') }}
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

              <!-- RUT (obligatorio en empresa, opcional en congregación) -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RUT <span v-if="!isCongregacion" class="text-red-500">*</span>
                  <span v-else class="text-gray-400 font-normal">(opcional)</span>
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
                    :required="!isCongregacion"
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

              <!-- Campos nombre/apellido: siempre visibles en congregación, o cuando RUT es válido en empresa -->
              <template v-if="isCongregacion ? !alertaPersonalDuplicado : (rutIsValid && !alertaPersonalDuplicado)">
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
                <!-- En congregación: siempre mostrar Crear (RUT opcional); en empresa: solo si RUT válido -->
                <button
                  v-if="isCongregacion ? !alertaPersonalDuplicado : (rutIsValid && !alertaPersonalDuplicado)"
                  type="submit" :disabled="guardandoNuevo || !formNuevo.first_name.trim() || !formNuevo.last_name.trim()"
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
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useEmpleadoStore } from '../../stores/empleadoStore';
import { useUbicacionStore } from '../../stores/ubicacionStore';
import { useEstacionStore } from '../../stores/estacionStore';
import { useGrantStore } from '../../stores/grantStore';
import { useAsignacionStore } from '../../stores/asignacionStore';
import { useLogStore } from '../../stores/logStore';
import { useDisponibilidadStore } from '../../stores/disponibilidadStore';
import { useExcepcionStore } from '../../stores/excepcionStore';
import { useReglaAsignacionStore } from '../../stores/reglaAsignacionStore';
import { useRut } from '../../composables/useRut';
import { Contrato } from '../../models/Contrato';
import type { ExcepcionType } from '../../models/Excepcion';
import { db, firebaseApp } from '../../firebase';
import { contactoConverter, Contacto } from '../../models/Contacto';
import { Usuario, usuarioConverter } from '../../models/Usuario';
import { Grant, grantConverter } from '../../models/Grant';
import type { Empleado } from '../../models/Empleado';
import type { GrantRole, ScopeType } from '../../auth/permissions';

const GRANT_ROLE_LABELS: Record<GrantRole, string> = {
  owner: 'Owner',
  company_admin: 'Admin empresa',
  zone_manager: 'Gestor de zona',
  branch_manager: 'Gestor de sucursal',
  member: 'Miembro',
  viewer: 'Solo lectura',
};

const SCOPE_TYPE_LABELS: Record<ScopeType, string> = {
  client: 'cliente',
  company: 'empresa',
  zone: 'zona',
  branch: 'ubicación',
};

const route = useRoute();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();
const empleadoStore = useEmpleadoStore();
const ubicacionStore = useUbicacionStore();
const estacionStore = useEstacionStore();
const grantStore = useGrantStore();
const asignacionStore = useAsignacionStore();
const logStore = useLogStore();
const disponibilidadStore = useDisponibilidadStore();
const excepcionStore = useExcepcionStore();
const reglaStore = useReglaAsignacionStore();

const activeCompanyId = computed(() => {
  if (sessionStore.userRole !== 'super_admin') return sessionStore.activeCompanyId;
  const slug = route.params.companySlug as string;
  return empresaStore.empresas?.find(e => e.slug === slug)?.id ?? null;
});

const isCongregacion = computed(() => empresaStore.isCongregacion);
const canManage = computed(() => {
  const role = sessionStore.currentUser?.system_role;
  return role === 'super_admin' || role === 'client_user';
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
  const ubicId = sessionStore.activeUbicacionId;
  let lista = empleadoStore.empleados?.filter(e => e.active && !e.deletedAt) ?? [];
  // Filtrar por sucursal activa: solo empleados con contrato activo en esta sucursal
  if (ubicId) {
    lista = lista.filter(e =>
      (e.contratos ?? []).some(c => c.active && !c.deletedAt && c.ubicacion_id === ubicId)
    );
  }
  if (!isCongregacion.value && filtroEstacion.value) lista = lista.filter(e => e.estacion_ids.includes(filtroEstacion.value));
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
  excOpenAdd.value = false;
  formContacto.first_name = emp.contacto?.first_name ?? '';
  formContacto.last_name  = emp.contacto?.last_name  ?? '';
  formContacto.email      = emp.contacto?.email      ?? '';
  formContacto.phone      = emp.contacto?.phone      ?? '';
  dispLoadForm(emp);
  excepcionStore.listarExcepciones(emp.id);
  reglaStore.listarReglas(emp.id);
  reglaOpenAdd.value = false;
  reglaFormPareja.value = '';
  reglaFormTipo.value = 'juntos';
  reglaFormStrict.value = false;
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
    // Resync disponibilidad si no hay cambios pendientes
    if (!dispIsDirty.value) dispLoadForm(actualizado);
  }
}, { deep: true });

// Toggle activo
async function guardarCampoActivo() {
  if (!empleadoSeleccionado.value) return;
  await empleadoStore.updateEmpleado(empleadoSeleccionado.value.id, { active: form.active });
  const compId = sessionStore.activeCompanyId;
  const ubicId = sessionStore.activeUbicacionId;
  if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, 'generarAsignaciones'), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: 'personal' }));
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
    const compId = sessionStore.activeCompanyId;
    const ubicId = sessionStore.activeUbicacionId;
    if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, "generarAsignaciones"), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: "personal" }));
  } finally {
    guardandoEstaciones.value = false;
  }
}

// ── Disponibilidad ─────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type DispVentana = { day_of_week: string; start: string; end: string };
type DispFormState = { ventanas: DispVentana[]; monthly_frequency: number; weekly_frequency: number };

const dispFormVentanas = ref<DispVentana[]>([]);
const dispForm = reactive<{ monthly_frequency: number; weekly_frequency: number }>({ monthly_frequency: 0, weekly_frequency: 1 });
const dispSnapshot = ref<DispFormState>({ ventanas: [], monthly_frequency: 0, weekly_frequency: 1 });
const dispSaving = ref(false);
const dispErrorMsg = ref('');
const dispSuccessMsg = ref('');

const dispIsDirty = computed(() =>
  JSON.stringify({ ventanas: dispFormVentanas.value, ...dispForm }) !==
  JSON.stringify(dispSnapshot.value)
);

function dispLoadForm(emp: typeof empleadoSeleccionado.value) {
  const d = emp?.disponibilidad;
  dispFormVentanas.value = d ? (d.ventanas ?? []).map(v => ({ ...v })) : [];
  dispForm.monthly_frequency = d?.monthly_frequency ?? 0;
  dispForm.weekly_frequency = d?.weekly_frequency ?? 1;
  dispSnapshot.value = { ventanas: dispFormVentanas.value.map(v => ({ ...v })), monthly_frequency: dispForm.monthly_frequency, weekly_frequency: dispForm.weekly_frequency };
  dispErrorMsg.value = '';
  dispSuccessMsg.value = '';
}

function dispResetForm() {
  dispFormVentanas.value = dispSnapshot.value.ventanas.map(v => ({ ...v }));
  dispForm.monthly_frequency = dispSnapshot.value.monthly_frequency;
  dispForm.weekly_frequency = dispSnapshot.value.weekly_frequency;
}

function dispDiaTieneVentanas(dia: string): boolean {
  return dispFormVentanas.value.some(v => v.day_of_week === dia);
}

function dispVentanasDeDia(dia: string): DispVentana[] {
  return dispFormVentanas.value.filter(v => v.day_of_week === dia);
}

function dispToggleDia(dia: string) {
  if (dispDiaTieneVentanas(dia)) {
    dispFormVentanas.value = dispFormVentanas.value.filter(v => v.day_of_week !== dia);
  } else {
    dispFormVentanas.value.push({ day_of_week: dia, start: '09:00', end: '18:00' });
  }
}

function dispAgregarVentana(dia: string) {
  dispFormVentanas.value.push({ day_of_week: dia, start: '09:00', end: '18:00' });
}

function dispQuitarVentana(ventana: DispVentana) {
  const idx = dispFormVentanas.value.indexOf(ventana);
  if (idx >= 0) dispFormVentanas.value.splice(idx, 1);
}

function dispValidar(): string | null {
  for (const v of dispFormVentanas.value) {
    if (!v.start || !v.end) return 'Completa las horas de inicio y fin.';
    if (v.start >= v.end) return `${v.day_of_week}: inicio debe ser menor que fin.`;
  }
  for (const dia of DIAS_SEMANA) {
    const del = dispFormVentanas.value.filter(v => v.day_of_week === dia).slice().sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < del.length; i++) {
      if (del[i].start < del[i - 1].end) return `${dia}: hay franjas que se solapan.`;
    }
  }
  return null;
}

async function dispGuardar() {
  if (!empleadoSeleccionado.value || !dispIsDirty.value) return;
  const err = dispValidar();
  if (err) { dispErrorMsg.value = err; return; }
  dispSaving.value = true;
  dispErrorMsg.value = '';
  try {
    const payload = {
      ventanas: dispFormVentanas.value.map(v => ({ ...v })),
      monthly_frequency: dispForm.monthly_frequency,
      weekly_frequency: dispForm.weekly_frequency,
      special_rule: empleadoSeleccionado.value.disponibilidad?.special_rule ?? '',
    };
    if (empleadoSeleccionado.value.disponibilidad) {
      await disponibilidadStore.updateDisponibilidad(empleadoSeleccionado.value.id, payload);
    } else {
      await disponibilidadStore.setDisponibilidad(empleadoSeleccionado.value.id, payload);
    }
    dispSnapshot.value = { ventanas: dispFormVentanas.value.map(v => ({ ...v })), monthly_frequency: dispForm.monthly_frequency, weekly_frequency: dispForm.weekly_frequency };
    dispSuccessMsg.value = 'Disponibilidad guardada.';
    setTimeout(() => { dispSuccessMsg.value = ''; }, 3000);
    const compId = sessionStore.activeCompanyId;
    const ubicId = sessionStore.activeUbicacionId;
    if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, "generarAsignaciones"), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: "personal" }));
  } catch (e: any) {
    dispErrorMsg.value = e.message ?? 'Error al guardar.';
  } finally {
    dispSaving.value = false;
  }
}

async function dispLimpiar() {
  if (!empleadoSeleccionado.value) return;
  if (!confirm(`¿Limpiar la disponibilidad de ${empleadoSeleccionado.value.displayName}?`)) return;
  try {
    await disponibilidadStore.clearDisponibilidad(empleadoSeleccionado.value.id);
    dispFormVentanas.value = [];
    dispForm.monthly_frequency = 0;
    dispForm.weekly_frequency = 1;
    dispSnapshot.value = { ventanas: [], monthly_frequency: 0, weekly_frequency: 1 };
  } catch (e: any) {
    dispErrorMsg.value = e.message ?? 'Error al limpiar.';
  }
}

// ── Excepciones ────────────────────────────────────────────────────────────────

const excOpenAdd = ref(false);
const excAddError = ref('');
const excAdding = ref(false);
const excAddForm = ref<{ date: string; time_start: string; time_end: string; reason: string; type: ExcepcionType }>({
  date: '', time_start: '08:00', time_end: '17:00', reason: '', type: 'otro',
});

const excepcionesActivas = computed(() => excepcionStore.excepcionesActivas);

async function excSubmitAdd() {
  if (!empleadoSeleccionado.value) return;
  if (!excAddForm.value.date) { excAddError.value = 'La fecha es obligatoria.'; return; }
  excAdding.value = true;
  excAddError.value = '';
  try {
    await excepcionStore.createExcepcion({
      employee_id: empleadoSeleccionado.value.id,
      date: excAddForm.value.date,
      time_start: excAddForm.value.time_start,
      time_end: excAddForm.value.time_end,
      reason: excAddForm.value.reason.trim(),
      type: excAddForm.value.type,
    });
    excOpenAdd.value = false;
    excAddForm.value = { date: '', time_start: '08:00', time_end: '17:00', reason: '', type: 'otro' };
    const compId = sessionStore.activeCompanyId;
    const ubicId = sessionStore.activeUbicacionId;
    if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, "generarAsignaciones"), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: "personal" }));
  } catch (e: any) {
    excAddError.value = e.message ?? 'Error al guardar.';
  } finally {
    excAdding.value = false;
  }
}

async function excEliminar(id: string) {
  if (!confirm('¿Eliminar esta excepción?')) return;
  await excepcionStore.softDeleteExcepcion(id);
  const compId = sessionStore.activeCompanyId;
  const ubicId = sessionStore.activeUbicacionId;
  if (compId && ubicId) asignacionStore.regenerarSugerenciasSilencioso(compId, ubicId, (logs) => logStore.pushServerLogs(logs, "generarAsignaciones"), (msg) => logStore.error(`Regeneración fallida: ${msg}`, { scope: "personal" }));
}

function excFormatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const excTipoLabels: Record<string, string> = {
  feriado_legal: 'Feriado legal', dia_administrativo: 'Día admin.', emergencia: 'Emergencia', otro: 'Otro',
};
function excTipoLabel(type: string): string { return excTipoLabels[type] || type; }
function excTipoClass(type: string): string {
  const map: Record<string, string> = {
    feriado_legal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    dia_administrativo: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    emergencia: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    otro: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  };
  return map[type] ?? map.otro;
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
const modalTabs         = computed(() => [
  { id: 'buscar', label: isCongregacion.value ? 'Buscar voluntario' : 'Buscar empleado' },
  { id: 'nuevo',  label: 'Crear nuevo' },
]);
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

async function confirmarAgregarEmpleado() {
  if (!empleadoParaAgregar.value) return;
  // En congregación: crear contrato automáticamente en la ubicación activa
  if (isCongregacion.value && sessionStore.activeUbicacionId) {
    await empleadoStore.addContrato(empleadoParaAgregar.value.id, {
      empleado_id:  empleadoParaAgregar.value.id,
      ubicacion_id: sessionStore.activeUbicacionId,
      cargo_id:     '',
      active:       true,
      limite_horas: 0,
      fecha_inicio: new Date(),
      fecha_fin:    null,
    });
  }
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
  if (!formNuevo.first_name.trim() || !formNuevo.last_name.trim()) return;
  // En empresa, el RUT debe ser válido antes de guardar
  if (!isCongregacion.value && !rutIsValid.value) return;
  errorNuevo.value = '';
  guardandoNuevo.value = true;
  try {
    let contactId: string;
    if (contactoEncontrado.value) {
      contactId = contactoEncontrado.value.id;
    } else {
      const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
      const newRef = doc(contactosRef);
      const rutNormalizado = isCongregacion.value
        ? (rut.value ? rut.value.toUpperCase() : '')
        : rut.value.toUpperCase();
      await setDoc(newRef, new Contacto(
        newRef.id, formNuevo.first_name, formNuevo.last_name,
        rutNormalizado, formNuevo.email, formNuevo.phone, '', false, true
      ));
      contactId = newRef.id;
    }
    // En congregación: crear contrato en la ubicación activa directamente al crear el empleado
    const ubicacionId = sessionStore.activeUbicacionId;
    const contratosIniciales: Contrato[] = (isCongregacion.value && ubicacionId)
      ? [new Contrato(crypto.randomUUID(), 'pending', ubicacionId, '', true, 0, new Date(), null)]
      : [];

    await empleadoStore.createEmpleado({
      company_id:   activeCompanyId.value,
      contact_id:   contactId,
      active:       true,
      estacion_ids: [],
      contratos:    contratosIniciales,
      disponibilidad: null,
    });

    cerrarModalAgregar();
  } catch (e: any) {
    errorNuevo.value = e.message || (isCongregacion.value ? 'Error al crear el voluntario.' : 'Error al crear el empleado.');
  } finally {
    guardandoNuevo.value = false;
  }
}

// ── Acceso al sistema ──────────────────────────────────────────────────────────

const buscandoUsuario    = ref(false);
const usuarioEmpleado    = ref<Usuario | null>(null);
const grantsUsuarioEmpleado = ref<Grant[]>([]);
const guardandoAcceso    = ref(false);
const errorAcceso        = ref('');
const formAcceso = reactive({ role: 'member' as GrantRole, password: '' });

// Template de grant sugerido por el cargo activo del empleado
const templateSugerido = computed<GrantRole | null>(() => {
  if (!empleadoSeleccionado.value) return null;
  const contrato = (empleadoSeleccionado.value.contratos ?? []).find(c => c.active && !c.deletedAt);
  if (!contrato?.cargo_id) return null;
  const cargo = cargosEmpresa.value.find(c => c.id === contrato.cargo_id);
  return (cargo?.scope_role_template ?? null) as GrantRole | null;
});

// Cuando se selecciona un empleado, precarga el template y busca usuario existente
watch(empleadoSeleccionado, async (emp) => {
  usuarioEmpleado.value = null;
  grantsUsuarioEmpleado.value = [];
  errorAcceso.value = '';
  formAcceso.password = '';

  if (templateSugerido.value) {
    formAcceso.role = templateSugerido.value;
  }

  if (!emp?.contact_id) return;
  buscandoUsuario.value = true;
  try {
    const snap = await getDocs(
      query(collection(db, 'usuarios').withConverter(usuarioConverter),
        where('contact_id', '==', emp.contact_id),
        where('deletedAt', '==', null)
      )
    );
    if (snap.empty) return;
    const u = snap.docs[0].data();
    // Hidratar contacto
    if (emp.contacto) u.contacto = emp.contacto;
    usuarioEmpleado.value = u;

    // Cargar grants del usuario para esta empresa
    if (activeCompanyId.value) {
      const gSnap = await getDocs(
        query(collection(db, 'grants').withConverter(grantConverter),
          where('user_id', '==', u.id),
          where('company_id', '==', activeCompanyId.value),
          where('active', '==', true),
          where('deletedAt', '==', null)
        )
      );
      grantsUsuarioEmpleado.value = gSnap.docs.map(d => d.data());
    }
  } catch (e) {
    console.error('Error buscando usuario del empleado:', e);
  } finally {
    buscandoUsuario.value = false;
  }
}, { immediate: false });

async function crearAccesoEmpleado() {
  if (!empleadoSeleccionado.value || !activeCompanyId.value) return;
  if (!empleadoSeleccionado.value.contacto?.email) {
    errorAcceso.value = 'El empleado no tiene email registrado.';
    return;
  }
  if (formAcceso.password.length < 6) {
    errorAcceso.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }
  guardandoAcceso.value = true;
  errorAcceso.value = '';
  try {
    const email = empleadoSeleccionado.value.contacto.email;
    const contactId = empleadoSeleccionado.value.contact_id;

    // Obtener cliente_id desde la empresa (el super_admin no tiene activeClienteId en sesión)
    const empresa = empresaStore.empresas?.find(e => e.id === activeCompanyId.value);
    const clienteId = empresa?.cliente_id ?? sessionStore.activeClienteId;
    if (!clienteId) throw new Error('No se encontró el cliente asociado a esta empresa.');

    // Crear usuario en Firebase Auth usando app secundaria (evita cerrar sesión del admin)
    const secondaryApp = initializeApp(firebaseApp.options, `InviteApp_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    let authUid: string;
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, formAcceso.password);
      authUid = cred.user.uid;
    } finally {
      await deleteApp(secondaryApp);
    }

    // Crear doc en colección 'usuarios'
    const newUsuario = new Usuario(
      authUid,
      null,
      contactId,
      'client_user',
      new Date(),
      new Date(),
      null,
      clienteId,
      undefined,
      'invitado',
      [activeCompanyId.value]
    );
    await setDoc(
      doc(collection(db, 'usuarios').withConverter(usuarioConverter), authUid),
      newUsuario
    );

    // Determinar scope según rol elegido
    let scopeType: ScopeType = 'company';
    let scopeId = activeCompanyId.value;

    if (formAcceso.role === 'zone_manager' && sessionStore.activeZonaId) {
      scopeType = 'zone';
      scopeId = sessionStore.activeZonaId;
    } else if ((formAcceso.role === 'branch_manager' || formAcceso.role === 'member') && sessionStore.activeUbicacionId) {
      scopeType = 'branch';
      scopeId = sessionStore.activeUbicacionId;
    }

    // Crear grant
    await grantStore.crearGrant({
      user_id:    authUid,
      cliente_id: clienteId,
      company_id: activeCompanyId.value,
      scope_type: scopeType,
      scope_id:   scopeId,
      role:       formAcceso.role,
      active:     true,
    });

    // Actualizar vista local
    newUsuario.contacto = empleadoSeleccionado.value.contacto;
    usuarioEmpleado.value = newUsuario;

    // Recargar grants
    const gSnap = await getDocs(
      query(collection(db, 'grants').withConverter(grantConverter),
        where('user_id', '==', authUid),
        where('company_id', '==', activeCompanyId.value),
        where('active', '==', true),
        where('deletedAt', '==', null)
      )
    );
    grantsUsuarioEmpleado.value = gSnap.docs.map(d => d.data());
    formAcceso.password = '';
  } catch (e: any) {
    errorAcceso.value = e.message || 'Error al crear el acceso.';
  } finally {
    guardandoAcceso.value = false;
  }
}

// ── Reglas de convivencia ──────────────────────────────────────────────────────

const reglaOpenAdd = ref(false);
const reglaFormPareja = ref('');
const reglaFormTipo = ref<'juntos' | 'nunca_juntos'>('juntos');
const reglaFormStrict = ref(false);
const reglaAdding = ref(false);
const reglaError = ref('');

const reglas = computed(() => reglaStore.reglas);

// Empleados de la misma sucursal, excluyendo al seleccionado
const empleadosParaRegla = computed(() => {
  const ubicId = sessionStore.activeUbicacionId;
  const selId = empleadoSeleccionado.value?.id;
  return (empleadoStore.empleados ?? []).filter(e =>
    e.active && !e.deletedAt &&
    e.id !== selId &&
    (e.contratos ?? []).some(c => c.active && !c.deletedAt && c.ubicacion_id === ubicId)
  );
});

function nombreReglaPareja(regla: typeof reglas.value[0]): string {
  const selId = empleadoSeleccionado.value?.id;
  const parejId = regla.person_uno_id === selId ? regla.person_dos_id : regla.person_uno_id;
  return (empleadoStore.empleados ?? []).find(e => e.id === parejId)?.displayName ?? parejId;
}

async function reglaSubmitAdd() {
  if (!empleadoSeleccionado.value || !reglaFormPareja.value) {
    reglaError.value = 'Selecciona una persona para la regla.';
    return;
  }
  reglaAdding.value = true;
  reglaError.value = '';
  try {
    await reglaStore.createRegla({
      person_uno_id: empleadoSeleccionado.value.id,
      person_dos_id: reglaFormPareja.value,
      type: reglaFormTipo.value,
      is_strict: reglaFormStrict.value,
    });
    reglaOpenAdd.value = false;
    reglaFormPareja.value = '';
    reglaFormTipo.value = 'juntos';
    reglaFormStrict.value = false;
  } catch (e: any) {
    reglaError.value = e.message || 'Error al crear la regla.';
  } finally {
    reglaAdding.value = false;
  }
}

async function reglaEliminar(id: string) {
  await reglaStore.softDeleteRegla(id);
}

async function reglaCambiarTipo(id: string, tipo: 'juntos' | 'nunca_juntos') {
  await reglaStore.updateRegla(id, { type: tipo });
}

async function reglaCambiarStrict(id: string, strict: boolean) {
  await reglaStore.updateRegla(id, { is_strict: strict });
}

async function revocarAcceso() {
  if (!usuarioEmpleado.value) return;
  if (!confirm(`¿Revocar el acceso de ${empleadoSeleccionado.value?.displayName}? El usuario no podrá iniciar sesión.`)) return;
  guardandoAcceso.value = true;
  errorAcceso.value = '';
  try {
    // Revocar todos los grants del usuario para esta empresa
    for (const g of grantsUsuarioEmpleado.value) {
      await grantStore.revocarGrant(g.id, g.user_id, g.company_id);
    }
    // Suspender usuario
    await updateDoc(doc(db, 'usuarios', usuarioEmpleado.value.id), {
      estado: 'suspendido',
      updatedAt: Timestamp.now(),
    });
    usuarioEmpleado.value = null;
    grantsUsuarioEmpleado.value = [];
  } catch (e: any) {
    errorAcceso.value = e.message || 'Error al revocar acceso.';
  } finally {
    guardandoAcceso.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
