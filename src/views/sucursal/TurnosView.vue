<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Menú lateral izquierdo: configuraciones ────────────────────────── -->
    <div class="w-52 shrink-0 flex flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">

      <!-- Cabecera -->
      <div class="px-4 pt-5 pb-3">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Configuraciones</p>
      </div>

      <!-- Lista de configuraciones -->
      <div class="flex-1 px-2 space-y-0.5">
        <button
          v-for="cfg in configuracionesActivas"
          :key="cfg.id"
          type="button"
          @click="selectedConfig = cfg.id"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors group"
          :class="selectedConfig === cfg.id
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'"
        >
          <span class="w-2 h-2 rounded-full shrink-0"
            :class="cfg.scope === 'default' ? 'bg-blue-500' : cfg.scope === 'month' ? 'bg-amber-500' : 'bg-emerald-500'" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate"
              :class="selectedConfig === cfg.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'">
              {{ cfg.name }}
            </p>
            <p class="text-[10px] truncate mt-0.5"
              :class="selectedConfig === cfg.id ? 'text-blue-400 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'">
              {{ labelScope(cfg.scope) }}
            </p>
          </div>
          <!-- Botón editar -->
          <button v-if="canManage"
            type="button"
            @click.stop="abrirEditarConfig(cfg)"
            class="shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
            :class="selectedConfig === cfg.id ? 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
            title="Editar configuración">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
            </svg>
          </button>
        </button>

        <p v-if="!configuracionesActivas.length"
          class="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 italic">
          Sin configuraciones.
        </p>
      </div>

      <!-- Botón agregar -->
      <div class="px-2 py-3 border-t border-gray-100 dark:border-gray-700">
        <button v-if="canManage" @click="openNewConfig = true"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva configuración
        </button>
      </div>
    </div>

    <!-- ── Cuerpo principal ───────────────────────────────────────────────── -->
    <div v-if="configActiva" class="flex flex-1 min-h-0 overflow-hidden">

      <!-- ── Grilla semanal ────────────────────────────────────────────── -->
      <div class="flex-1 overflow-auto p-4 sm:p-6">

        <!-- Info de la configuración activa -->
        <div class="flex items-center gap-3 mb-5">
          <span class="px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="configActiva.scope === 'default'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : configActiva.scope === 'month'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'">
            {{ labelScope(configActiva.scope) }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ subtituloConfig(configActiva) }}</span>
        </div>

        <!-- Grilla 7 días -->
        <div class="grid grid-cols-7 gap-2 min-w-[640px]">
          <div v-for="dia in diasSemana" :key="dia" class="flex flex-col gap-1.5">

            <!-- Cabecera día -->
            <div class="px-1 py-1.5 text-center text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 uppercase tracking-wide select-none">
              {{ dia.slice(0, 3) }}
            </div>

            <!-- Tarjetas de turno -->
            <button
              v-for="turno in turnosDelDia(dia)"
              :key="turno.id"
              type="button"
              @click="abrirEditor(turno)"
              class="w-full text-left p-2 rounded-xl border transition-all"
              :class="editandoId === turno.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-sm'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'"
            >
              <!-- Horario + duración -->
              <p class="text-[11px] font-bold text-gray-800 dark:text-gray-100 leading-tight tabular-nums">
                {{ turno.start_time }} – {{ turno.end_time }}
              </p>
              <p class="text-[10px] text-blue-500 dark:text-blue-400 font-medium mt-0.5">
                {{ calcDuracion(turno.start_time, turno.end_time) }}
              </p>
              <!-- Resumen requerimientos -->
              <div v-if="turno.requerimientos.length" class="mt-1.5 space-y-0.5">
                <p v-for="req in turno.requerimientos" :key="req.estacion_id"
                  class="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                  {{ req.cantidad }}× {{ nombreEstacion(req.estacion_id) }}
                </p>
              </div>
              <!-- Total personas -->
              <p class="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium">
                {{ totalPersonas(turno) }} persona{{ totalPersonas(turno) !== 1 ? 's' : '' }}
              </p>
            </button>

            <!-- Agregar turno -->
            <button v-if="canManage" type="button" @click="abrirNuevo(dia)"
              class="w-full py-1.5 flex items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 hover:border-blue-300 hover:text-blue-400 dark:hover:border-blue-700 dark:hover:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

          </div>
        </div>

        <p v-if="!turnosActivosConfig.length"
          class="text-sm text-gray-400 dark:text-gray-500 italic text-center mt-10">
          Sin turnos. Haz clic en <strong class="not-italic font-bold">＋</strong> bajo cualquier día para agregar.
        </p>
      </div>

      <!-- ── Panel editor lateral ─────────────────────────────────────── -->
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-6"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-6"
      >
        <div v-if="panelAbierto"
          class="w-96 shrink-0 border-l border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">

          <div class="flex-1 p-5 space-y-5">

            <!-- Cabecera panel -->
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-bold text-gray-900 dark:text-white">
                  {{ modoPanel === 'add' ? 'Nuevo turno' : 'Editar turno' }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ formDia }}</p>
              </div>
              <button @click="cerrarPanel"
                class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- ── Horario ── -->
            <section class="space-y-3">
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Horario</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora inicio</label>
                  <input v-model="form.start_time" type="time"
                    class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white tabular-nums" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora fin</label>
                  <input v-model="form.end_time" type="time"
                    class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white tabular-nums" />
                </div>
              </div>
              <!-- Duración calculada -->
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-blue-500 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="text-xs text-blue-700 dark:text-blue-300">
                  Duración:
                  <strong class="font-semibold tabular-nums">{{ calcDuracion(form.start_time, form.end_time) }}</strong>
                </span>
              </div>
            </section>

            <hr class="border-gray-100 dark:border-gray-700" />

            <!-- ── Estaciones requeridas ── -->
            <section class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Estaciones requeridas</p>
                <span class="text-[10px] text-gray-400 dark:text-gray-500">
                  Total: <strong class="font-semibold text-gray-700 dark:text-gray-300">{{ totalPersonasForm }} persona{{ totalPersonasForm !== 1 ? 's' : '' }}</strong>
                </span>
              </div>

              <!-- Requerimientos seleccionados con cantidad -->
              <div v-if="form.requerimientos.length" class="space-y-2">
                <div v-for="(req, idx) in form.requerimientos" :key="idx"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                  <span class="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ nombreEstacion(req.estacion_id) }}</span>
                  <!-- Stepper de cantidad -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" @click="decrementarEstacion(idx)"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 transition-colors text-sm font-bold leading-none">
                      −
                    </button>
                    <span class="w-5 text-center text-sm font-bold text-gray-900 dark:text-white tabular-nums">{{ req.cantidad }}</span>
                    <button type="button" @click="req.cantidad++"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 transition-colors text-sm font-bold leading-none">
                      +
                    </button>
                  </div>
                  <button type="button" @click="quitarEstacion(idx)"
                    class="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Sin estaciones asignadas.</p>

              <!-- Picker de estaciones disponibles -->
              <div v-if="estacionesParaAgregar.length" class="flex flex-wrap gap-1.5">
                <button
                  v-for="est in estacionesParaAgregar"
                  :key="est.id"
                  type="button"
                  @click="agregarEstacion(est.id)"
                  class="px-2.5 py-1 text-xs font-medium rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-2.5 h-2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {{ est.nombre }}
                </button>
              </div>
              <p v-else-if="estacionesActivas.length && !estacionesParaAgregar.length"
                class="text-xs text-gray-400 dark:text-gray-500 italic">Todas las estaciones ya están agregadas.</p>
              <p v-else-if="!estacionesActivas.length" class="text-xs text-gray-400 dark:text-gray-500 italic">
                Sin estaciones definidas. Créalas en Mi Equipo → Estaciones.
              </p>
            </section>

          </div>

          <!-- ── Footer de acciones ────────────────────────────────────── -->
          <div class="shrink-0 border-t border-gray-100 dark:border-gray-700 p-4 space-y-2">
            <p v-if="panelError" class="text-xs text-red-500 dark:text-red-400">{{ panelError }}</p>

            <div v-if="modoPanel === 'edit'" class="flex items-center gap-2">
              <button type="button" @click="confirmarEliminarTurno"
                class="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
                Eliminar
              </button>
              <button type="button" @click="resetForm" :disabled="!isDirty"
                class="flex-1 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-40">
                Deshacer
              </button>
              <button type="button" @click="guardar" :disabled="!isDirty || saving"
                class="flex-1 px-3 py-2 text-xs text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40">
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>

            <button v-else-if="modoPanel === 'add'" type="button" @click="guardar" :disabled="saving"
              class="w-full px-3 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40">
              {{ saving ? 'Creando…' : 'Crear turno' }}
            </button>
          </div>

        </div>
      </transition>

    </div>

    <!-- Estado: sin configuración seleccionada -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
      <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Sin configuraciones</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 max-w-xs">Crea una configuración en el menú izquierdo para comenzar.</p>
      <button v-if="canManage" @click="openNewConfig = true"
        class="mt-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
        + Crear primera configuración
      </button>
    </div>

    <!-- ── Modal: nueva configuración ────────────────────────────────────── -->
    <transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="openNewConfig"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="openNewConfig = false">

        <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Nueva configuración</p>
            <button @click="openNewConfig = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
            <input v-model="newConfigForm.name" type="text" placeholder="Ej: Semana regular, Verano 2026…"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Tipo de alcance</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="scope in scopeOpciones" :key="scope.value" type="button"
                @click="newConfigForm.scope = scope.value"
                class="px-2 py-2.5 text-xs font-medium rounded-lg border text-center transition-colors"
                :class="newConfigForm.scope === scope.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'">
                <span class="block text-base leading-none mb-1">{{ scope.emoji }}</span>
                {{ scope.label }}
              </button>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{{ descripcionScope(newConfigForm.scope) }}</p>
          </div>

          <div v-if="newConfigForm.scope === 'month'">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mes</label>
            <input v-model="newConfigForm.month" type="month"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          </div>

          <div v-if="newConfigForm.scope === 'range'" class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Desde</label>
              <input v-model="newConfigForm.date_start" type="date"
                class="w-full px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hasta</label>
              <input v-model="newConfigForm.date_end" type="date"
                class="w-full px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
          </div>

          <p v-if="newConfigError" class="text-xs text-red-500 dark:text-red-400">{{ newConfigError }}</p>

          <div class="flex gap-2 pt-1">
            <button type="button" @click="openNewConfig = false"
              class="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="crearConfiguracion" :disabled="creatingConfig"
              class="flex-1 px-3 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40">
              {{ creatingConfig ? 'Creando…' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── Modal: editar configuración ───────────────────────────────────── -->
    <transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="openEditConfig"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="openEditConfig = false">

        <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Editar configuración</p>
            <button @click="openEditConfig = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
            <input v-model="editConfigForm.name" type="text" placeholder="Nombre de la configuración"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          </div>

          <div v-if="editConfigForm.scope !== 'default'">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Tipo de alcance</label>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="scope in scopeOpciones.filter(s => s.value !== 'default')" :key="scope.value" type="button"
                @click="editConfigForm.scope = scope.value"
                class="px-2 py-2.5 text-xs font-medium rounded-lg border text-center transition-colors"
                :class="editConfigForm.scope === scope.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'">
                <span class="block text-base leading-none mb-1">{{ scope.emoji }}</span>
                {{ scope.label }}
              </button>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{{ descripcionScope(editConfigForm.scope) }}</p>
          </div>
          <div v-else class="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <p class="text-xs text-blue-700 dark:text-blue-300">Configuración base — el alcance no se puede cambiar.</p>
          </div>

          <div v-if="editConfigForm.scope === 'month'">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mes</label>
            <input v-model="editConfigForm.month" type="month"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
          </div>

          <div v-if="editConfigForm.scope === 'range'" class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Desde</label>
              <input v-model="editConfigForm.date_start" type="date"
                class="w-full px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hasta</label>
              <input v-model="editConfigForm.date_end" type="date"
                class="w-full px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
          </div>

          <p v-if="editConfigError" class="text-xs text-red-500 dark:text-red-400">{{ editConfigError }}</p>

          <div class="flex gap-2 pt-1">
            <button v-if="editConfigForm.scope !== 'default'" type="button" @click="confirmarEliminarConfigDesdeModal"
              class="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors">
              Eliminar
            </button>
            <div class="flex-1" />
            <button type="button" @click="openEditConfig = false"
              class="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="button" @click="guardarEditarConfig" :disabled="savingEditConfig"
              class="px-4 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40">
              {{ savingEditConfig ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { useSessionStore } from '../../stores/sessionStore';
import { useUbicacionStore } from '../../stores/ubicacionStore';
import { useEstacionStore } from '../../stores/estacionStore';
import { functions } from '../../firebase';
import type { Turno, Requerimiento, ConfiguracionTurnos, ConfigScope } from '../../models/Ubicacion';

const sessionStore = useSessionStore();
const ubicacionStore = useUbicacionStore();
const estacionStore = useEstacionStore();

const canManage = computed(() => ['super_admin', 'admin'].includes(sessionStore.currentUser?.system_role ?? ''));
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Llama actualizarBorrador en background para la semana en curso
const actualizarBorradorFn = httpsCallable<
  { empresa_id: string; ubicacion_id: string; week_start: string },
  unknown
>(functions, 'actualizarBorrador');

function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function triggerActualizarBorrador() {
  const companyId = sessionStore.activeCompanyId;
  const ubicacionId = sessionStore.activeUbicacionId;
  if (!companyId || !ubicacionId) return;
  const hoy = new Date().toISOString().slice(0, 10);
  actualizarBorradorFn({ empresa_id: companyId, ubicacion_id: ubicacionId, week_start: hoy, dias: 28 })
    .catch(() => { /* silencioso — el borrador se actualiza en background */ });
}

const ubicacion = computed(() =>
  ubicacionStore.ubicaciones?.find(u => u.id === sessionStore.activeUbicacionId)
);

const estacionesActivas = computed(() => estacionStore.estacionesActivas);

watch(() => sessionStore.activeCompanyId, (id) => {
  if (id) estacionStore.listarEstaciones(id);
}, { immediate: true });

// ── Helpers de display ────────────────────────────────────────────────────────

function calcDuracion(start: string, end: string): string {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function totalPersonas(turno: Turno): number {
  return turno.requerimientos.reduce((sum, req) => sum + req.cantidad, 0);
}

function nombreEstacion(id: string): string {
  return estacionesActivas.value.find(e => e.id === id)?.nombre ?? id;
}

const scopeOpciones: { value: ConfigScope; label: string; emoji: string }[] = [
  { value: 'default', label: 'Base',  emoji: '📅' },
  { value: 'month',   label: 'Mes',   emoji: '🗓️' },
  { value: 'range',   label: 'Rango', emoji: '📆' },
];

function labelScope(scope: ConfigScope): string {
  return scope === 'default' ? 'Semana base' : scope === 'month' ? 'Mes específico' : 'Rango de fechas';
}

function descripcionScope(scope: ConfigScope): string {
  if (scope === 'default') return 'Semana estándar que aplica durante todo el año por defecto.';
  if (scope === 'month')   return 'Reemplaza la semana base durante el mes seleccionado.';
  return 'Reemplaza la semana base entre las fechas indicadas.';
}

function subtituloConfig(cfg: ConfiguracionTurnos): string {
  if (cfg.scope === 'month' && cfg.month) return cfg.month;
  if (cfg.scope === 'range' && cfg.date_start && cfg.date_end) return `${cfg.date_start} → ${cfg.date_end}`;
  return 'Aplica todo el año';
}

// ── Configuraciones ───────────────────────────────────────────────────────────

const configuracionesActivas = computed((): ConfiguracionTurnos[] =>
  (ubicacion.value?.configuraciones ?? []).filter(c => !c.deletedAt)
);

const selectedConfig = ref<string | null>(null);

watch(configuracionesActivas, (cfgs) => {
  if (!cfgs.length) { selectedConfig.value = null; return; }
  if (selectedConfig.value && cfgs.some(c => c.id === selectedConfig.value)) return;
  selectedConfig.value = cfgs.find(c => c.scope === 'default')?.id ?? cfgs[0].id;
}, { immediate: true });

const configActiva = computed((): ConfiguracionTurnos | null =>
  configuracionesActivas.value.find(c => c.id === selectedConfig.value) ?? null
);

const turnosActivosConfig = computed(() =>
  (configActiva.value?.turnos ?? []).filter(t => !t.deletedAt)
);

function turnosDelDia(dia: string): Turno[] {
  return turnosActivosConfig.value.filter(t => t.day_of_week === dia);
}

// ── Formulario del turno ──────────────────────────────────────────────────────

type TurnoForm = {
  start_time: string;
  end_time: string;
  requerimientos: Requerimiento[];
};

function formVacio(): TurnoForm {
  return { start_time: '09:00', end_time: '12:00', requerimientos: [] };
}

function snapshot(f: TurnoForm): TurnoForm {
  return {
    start_time: f.start_time,
    end_time: f.end_time,
    requerimientos: f.requerimientos.map(r => ({ ...r })),
  };
}

const form = ref<TurnoForm>(formVacio());
const formSnap = ref<TurnoForm>(formVacio());

const isDirty = computed(() =>
  JSON.stringify(form.value) !== JSON.stringify(formSnap.value)
);

const totalPersonasForm = computed(() =>
  form.value.requerimientos.reduce((sum, req) => sum + req.cantidad, 0)
);

const estacionesParaAgregar = computed(() =>
  estacionesActivas.value.filter(e => !form.value.requerimientos.some(r => r.estacion_id === e.id))
);

function agregarEstacion(id: string) {
  form.value.requerimientos.push({ estacion_id: id, cantidad: 1 });
}

function decrementarEstacion(idx: number) {
  if (form.value.requerimientos[idx].cantidad > 1) {
    form.value.requerimientos[idx].cantidad--;
  } else {
    form.value.requerimientos.splice(idx, 1);
  }
}

function quitarEstacion(idx: number) {
  form.value.requerimientos.splice(idx, 1);
}

function resetForm() {
  form.value = snapshot(formSnap.value);
}

// ── Panel lateral ─────────────────────────────────────────────────────────────

type PanelMode = 'add' | 'edit';

const panelAbierto = ref(false);
const modoPanel = ref<PanelMode>('add');
const editandoId = ref<string | null>(null);
const formDia = ref('Lunes');
const panelError = ref('');
const saving = ref(false);

function abrirNuevo(dia: string) {
  formDia.value = dia;
  modoPanel.value = 'add';
  editandoId.value = null;
  const f = formVacio();
  form.value = f;
  formSnap.value = snapshot(f);
  panelError.value = '';
  panelAbierto.value = true;
}

function abrirEditor(turno: Turno) {
  if (!canManage.value) return;
  editandoId.value = turno.id;
  formDia.value = turno.day_of_week;
  modoPanel.value = 'edit';
  const f: TurnoForm = {
    start_time: turno.start_time,
    end_time: turno.end_time,
    requerimientos: turno.requerimientos.map(r => ({ ...r })),
  };
  form.value = f;
  formSnap.value = snapshot(f);
  panelError.value = '';
  panelAbierto.value = true;
}

function cerrarPanel() {
  panelAbierto.value = false;
  editandoId.value = null;
}

async function guardar() {
  if (!ubicacion.value || !configActiva.value) return;
  saving.value = true;
  panelError.value = '';
  try {
    if (modoPanel.value === 'add') {
      await ubicacionStore.addTurnoAConfiguracion(
        ubicacion.value.id,
        configActiva.value.id,
        {
          day_of_week: formDia.value,
          start_time: form.value.start_time,
          end_time: form.value.end_time,
          requerimientos: form.value.requerimientos,
        },
        ubicacion.value.configuraciones
      );
      cerrarPanel();
      triggerActualizarBorrador();
    } else if (editandoId.value) {
      const original = configActiva.value.turnos.find(t => t.id === editandoId.value);
      if (!original) return;
      const actualizado: Turno = {
        ...original,
        start_time: form.value.start_time,
        end_time: form.value.end_time,
        requerimientos: form.value.requerimientos,
        updatedAt: new Date(),
      };
      await ubicacionStore.updateTurnoEnConfiguracion(
        ubicacion.value.id,
        configActiva.value.id,
        actualizado,
        ubicacion.value.configuraciones
      );
      formSnap.value = snapshot(form.value);
      triggerActualizarBorrador();
    }
  } catch (e: any) {
    panelError.value = e.message ?? 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

async function confirmarEliminarTurno() {
  if (!editandoId.value || !ubicacion.value || !configActiva.value) return;
  const turno = configActiva.value.turnos.find(t => t.id === editandoId.value);
  if (!confirm(`¿Eliminar el turno del ${turno?.day_of_week} (${turno?.start_time}–${turno?.end_time})?`)) return;
  try {
    await ubicacionStore.softDeleteTurnoEnConfiguracion(
      ubicacion.value.id,
      configActiva.value.id,
      editandoId.value,
      ubicacion.value.configuraciones
    );
    cerrarPanel();
  } catch (e: any) {
    panelError.value = e.message ?? 'Error al eliminar.';
  }
}

// ── Modal nueva configuración ─────────────────────────────────────────────────

const openNewConfig = ref(false);
const creatingConfig = ref(false);
const newConfigError = ref('');

const newConfigForm = ref<{ name: string; scope: ConfigScope; month: string; date_start: string; date_end: string }>({
  name: '', scope: 'default', month: '', date_start: '', date_end: '',
});

watch(openNewConfig, (open) => {
  if (open) {
    newConfigForm.value = { name: '', scope: 'default', month: '', date_start: '', date_end: '' };
    newConfigError.value = '';
  }
});

async function crearConfiguracion() {
  if (!ubicacion.value) return;
  const { name, scope, month, date_start, date_end } = newConfigForm.value;
  if (!name.trim()) { newConfigError.value = 'El nombre es obligatorio.'; return; }
  if (scope === 'month' && !month) { newConfigError.value = 'Selecciona el mes.'; return; }
  if (scope === 'range' && (!date_start || !date_end)) { newConfigError.value = 'Indica las fechas inicio y fin.'; return; }
  if (scope === 'default' && configuracionesActivas.value.some(c => c.scope === 'default')) {
    newConfigError.value = 'Ya existe una configuración base. Solo puede haber una.'; return;
  }
  creatingConfig.value = true;
  newConfigError.value = '';
  try {
    const newId = await ubicacionStore.addConfiguracion(ubicacion.value.id, {
      name: name.trim(),
      scope,
      month: scope === 'month' ? month : null,
      date_start: scope === 'range' ? date_start : null,
      date_end: scope === 'range' ? date_end : null,
    });
    selectedConfig.value = newId;
    openNewConfig.value = false;
  } catch (e: any) {
    newConfigError.value = e.message ?? 'Error al crear.';
  } finally {
    creatingConfig.value = false;
  }
}

async function confirmarEliminarConfig(cfg: ConfiguracionTurnos) {
  if (!ubicacion.value) return;
  if (!confirm(`¿Eliminar la configuración "${cfg.name}"? Se perderán todos sus turnos.`)) return;
  try {
    await ubicacionStore.softDeleteConfiguracion(ubicacion.value.id, cfg.id, ubicacion.value.configuraciones);
  } catch (e: any) {
    console.error(e);
  }
}

// ── Modal editar configuración ────────────────────────────────────────────────

const openEditConfig = ref(false);
const savingEditConfig = ref(false);
const editConfigError = ref('');
const editConfigForm = ref<{ id: string; name: string; scope: ConfigScope; month: string; date_start: string; date_end: string }>({
  id: '', name: '', scope: 'default', month: '', date_start: '', date_end: '',
});

function abrirEditarConfig(cfg: ConfiguracionTurnos) {
  editConfigForm.value = {
    id: cfg.id,
    name: cfg.name,
    scope: cfg.scope,
    month: cfg.month ?? '',
    date_start: cfg.date_start ?? '',
    date_end: cfg.date_end ?? '',
  };
  editConfigError.value = '';
  openEditConfig.value = true;
}

async function guardarEditarConfig() {
  if (!ubicacion.value) return;
  const { id, name, scope, month, date_start, date_end } = editConfigForm.value;
  if (!name.trim()) { editConfigError.value = 'El nombre es obligatorio.'; return; }
  if (scope === 'month' && !month) { editConfigError.value = 'Selecciona el mes.'; return; }
  if (scope === 'range' && (!date_start || !date_end)) { editConfigError.value = 'Indica las fechas inicio y fin.'; return; }
  savingEditConfig.value = true;
  editConfigError.value = '';
  try {
    const actualizadas = ubicacion.value.configuraciones.map(c =>
      c.id === id
        ? { ...c, name: name.trim(), scope, month: scope === 'month' ? month : null, date_start: scope === 'range' ? date_start : null, date_end: scope === 'range' ? date_end : null, updatedAt: new Date() }
        : c
    );
    await ubicacionStore.updateConfiguracionesArray(ubicacion.value.id, actualizadas);
    openEditConfig.value = false;
  } catch (e: any) {
    editConfigError.value = e.message ?? 'Error al guardar.';
  } finally {
    savingEditConfig.value = false;
  }
}

async function confirmarEliminarConfigDesdeModal() {
  const cfg = configuracionesActivas.value.find(c => c.id === editConfigForm.value.id);
  if (!cfg) return;
  openEditConfig.value = false;
  await confirmarEliminarConfig(cfg);
}
</script>
