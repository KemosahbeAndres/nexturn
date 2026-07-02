<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel principal ──────────────────────────────────────────────────── -->
    <div class="flex flex-col flex-1 min-w-0 h-full min-h-0 p-4 sm:p-6 gap-4 overflow-y-auto">

      <!-- Encabezado -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {{ canManage ? 'Borrador de turnos' : 'Mi Calendario' }}
          </p>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
            {{ isCongregacion ? labelMes : formatRango(fechaInicio, fechaFin) }}
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Navegación congregación: por mes -->
          <template v-if="isCongregacion">
            <button @click="irMes(-1)"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button @click="irMesHoy"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Este mes
            </button>
            <button @click="irMes(1)"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </template>
          <!-- Navegación empresa: por semana -->
          <template v-else>
            <button @click="irSemana(-1)"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button @click="irSemana(0)"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Esta semana
            </button>
            <button @click="irSemana(1)"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </template>
          <button @click="isCongregacion ? cargarMes() : cargar()" :disabled="cargando || generandoBorrador"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
            title="Recargar">
            <svg class="w-3.5 h-3.5" :class="cargando ? 'animate-spin' : ''"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button v-if="canManage" @click="isCongregacion ? regenerarBorradorMes() : regenerarBorradorSemana()" :disabled="cargando || generandoBorrador"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-40"
            title="Regenerar sugerencias del algoritmo">
            <svg class="w-3.5 h-3.5" :class="generandoBorrador ? 'animate-spin' : ''"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            {{ generandoBorrador ? 'Generando…' : 'Generar sugerencias' }}
          </button>
        </div>
      </div>

      <!-- Panel diagnóstico (solo empresa, solo manager) -->
      <div v-if="canManage && !isCongregacion"
        class="rounded-xl border bg-white dark:bg-gray-800/60 overflow-hidden"
        :class="diagnosticoListo ? 'border-gray-200 dark:border-gray-700' : 'border-amber-200 dark:border-amber-700/40'">

        <button type="button" @click="panelAbierto = !panelAbierto"
          class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
          <div class="flex items-center gap-2 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              class="w-4 h-4 shrink-0"
              :class="diagnosticoListo ? 'text-emerald-500' : 'text-amber-500'">
              <path v-if="diagnosticoListo" stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">Diagnóstico</span>
            <span v-if="cargandoDiagnostico" class="text-[10px] text-gray-400 animate-pulse truncate">calculando…</span>
            <span v-else-if="errorBorrador" class="text-[10px] font-medium text-red-500 truncate">Error: {{ errorBorrador }}</span>
            <span v-else-if="generandoBorrador" class="text-[10px] text-blue-500 animate-pulse truncate">generando sugerencias…</span>
            <span v-else-if="diagnosticoListo" class="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">Todo listo</span>
            <span v-else-if="diagnostico" class="text-[10px] text-amber-600 dark:text-amber-400 truncate">{{ problemasTotal }} problema(s)</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
            class="w-3.5 h-3.5 text-gray-400 transition-transform shrink-0" :class="panelAbierto ? 'rotate-180' : ''">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <div v-if="panelAbierto" class="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
          <div v-if="cargandoDiagnostico" class="flex items-center gap-2 py-2">
            <svg class="w-4 h-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-xs text-gray-400">Cargando datos…</span>
          </div>

          <template v-else-if="diagnostico">
            <div class="flex items-start gap-3 px-3 py-2.5 rounded-lg"
              :class="diagnostico.tieneTurnos ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-red-50 dark:bg-red-900/15'">
              <span class="text-sm mt-0.5 shrink-0">{{ diagnostico.tieneTurnos ? '✅' : '❌' }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold" :class="diagnostico.tieneTurnos ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'">Turnos configurados</p>
                <p class="text-[11px] mt-0.5" :class="diagnostico.tieneTurnos ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-500 dark:text-red-400'">
                  {{ diagnostico.tieneTurnos ? `${diagnostico.cantTurnos} turno(s) — días: ${diagnostico.diasConTurno}` : 'Ve a Turnos → Configuraciones y agrega al menos un turno' }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3 px-3 py-2.5 rounded-lg"
              :class="diagnostico.tieneEstaciones ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-red-50 dark:bg-red-900/15'">
              <span class="text-sm mt-0.5 shrink-0">{{ diagnostico.tieneEstaciones ? '✅' : '❌' }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold" :class="diagnostico.tieneEstaciones ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'">Estaciones activas</p>
                <p class="text-[11px] mt-0.5" :class="diagnostico.tieneEstaciones ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-500 dark:text-red-400'">
                  {{ diagnostico.tieneEstaciones ? diagnostico.nombresEstaciones : 'Ve a Mi Equipo → Estaciones y crea al menos una' }}
                </p>
              </div>
            </div>
            <div v-if="diagnostico.tieneTurnos" class="flex items-start gap-3 px-3 py-2.5 rounded-lg"
              :class="diagnostico.turnosTienenRequerimientos ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-red-50 dark:bg-red-900/15'">
              <span class="text-sm mt-0.5 shrink-0">{{ diagnostico.turnosTienenRequerimientos ? '✅' : '❌' }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold" :class="diagnostico.turnosTienenRequerimientos ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'">Turnos con requerimientos</p>
                <p class="text-[11px] mt-0.5" :class="diagnostico.turnosTienenRequerimientos ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-500 dark:text-red-400'">
                  {{ diagnostico.turnosTienenRequerimientos ? `Estaciones requeridas: ${diagnostico.nombresEstacionesRequeridas}` : 'Edita cada turno en Turnos y agrega estaciones con cantidad' }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3 px-3 py-2.5 rounded-lg"
              :class="diagnostico.tieneEmpleadosConContrato ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-red-50 dark:bg-red-900/15'">
              <span class="text-sm mt-0.5 shrink-0">{{ diagnostico.tieneEmpleadosConContrato ? '✅' : '❌' }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold" :class="diagnostico.tieneEmpleadosConContrato ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'">Empleados asignados</p>
                <p class="text-[11px] mt-0.5" :class="diagnostico.tieneEmpleadosConContrato ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-500 dark:text-red-400'">
                  {{ diagnostico.tieneEmpleadosConContrato ? `${diagnostico.cantConContrato} empleado(s) con contrato activo` : 'Ve a Mi Equipo → Personal y agrégales un contrato en esta sucursal' }}
                </p>
              </div>
            </div>
            <div v-if="diagnostico.tieneEmpleadosConContrato && diagnostico.detalleEmpleados.length">
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Estado por empleado</p>
              <div class="space-y-1.5">
                <div v-for="emp in diagnostico.detalleEmpleados" :key="emp.id"
                  class="px-3 py-2 rounded-lg border"
                  :class="emp.listo ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40' : 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/40'">
                  <div class="flex items-center gap-2">
                    <span class="text-sm shrink-0">{{ emp.listo ? '✅' : '⚠️' }}</span>
                    <p class="text-xs font-semibold flex-1 truncate" :class="emp.listo ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'">{{ emp.nombre }}</p>
                    <span v-if="emp.listo" class="text-[10px] text-emerald-600 shrink-0">listo</span>
                  </div>
                  <ul v-if="emp.problemas.length" class="mt-1.5 space-y-1 ml-6">
                    <li v-for="p in emp.problemas" :key="p" class="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
                      <span class="shrink-0 mt-0.5">›</span><span>{{ p }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="text-xs text-gray-400 italic px-1">Presiona Actualizar (↻) para calcular el diagnóstico.</p>
        </div>
      </div>

      <!-- Banner error -->
      <div v-if="errorBorrador"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-xs text-red-700 dark:text-red-300">
        <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        {{ errorBorrador }}
      </div>

      <!-- Banner generando -->
      <div v-if="generandoBorrador"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-xs text-blue-700 dark:text-blue-300">
        <svg class="w-3.5 h-3.5 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Generando sugerencias…
      </div>

      <!-- Sin acceso -->
      <div v-if="!puedeVer && !cargando" class="flex-1 flex items-center justify-center">
        <p class="text-sm text-gray-400">Necesitas una cuenta activa para ver este calendario.</p>
      </div>

      <!-- Cargando -->
      <div v-else-if="cargando" class="flex-1 flex items-center justify-center">
        <p class="text-sm text-gray-400 animate-pulse">Cargando…</p>
      </div>

      <!-- ── Grilla mensual (congregación) ──────────────────────────────────── -->
      <div v-else-if="isCongregacion" class="flex-1 overflow-auto">
        <div class="grid grid-cols-7 gap-px mb-1">
          <div v-for="d in ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']" :key="d"
            class="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 py-1">
            {{ d }}
          </div>
        </div>
        <div class="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div v-for="celda in diasDelMes" :key="celda.date"
            class="min-h-[90px] p-1.5 flex flex-col gap-0.5 transition-colors"
            :class="[
              celda.esMes ? 'bg-white dark:bg-gray-800/80' : 'bg-gray-50/60 dark:bg-gray-800/30',
              canManage && celda.esMes && turnosEnFecha(celda.date) ? 'cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-900/10' : '',
              sidebarFechaCong === celda.date ? 'ring-2 ring-inset ring-blue-400 dark:ring-blue-600' : ''
            ]"
            @click="canManage && celda.esMes && turnosEnFecha(celda.date) ? abrirSidebarCong(celda.date) : undefined">

            <div class="flex items-center justify-between mb-0.5">
              <span class="text-xs font-semibold tabular-nums w-6 h-6 flex items-center justify-center rounded-full"
                :class="celda.esHoy
                  ? 'bg-violet-600 text-white'
                  : celda.esMes
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-300 dark:text-gray-600'">
                {{ celda.date.slice(8) }}
              </span>
              <button v-if="canManage && celda.esMes && tieneSugeridosPorFecha(celda.date)"
                @click.stop="publicarFecha(celda.date)" :disabled="accionando"
                class="text-[9px] font-semibold text-violet-700 dark:text-violet-400 hover:underline disabled:opacity-40">
                Pub.
              </button>
            </div>

            <!-- Manager: chips por turno agrupados -->
            <template v-if="canManage && celda.esMes">
              <template v-for="turno in turnosDeFecha(celda.date)" :key="turno.start_time">
                <div class="text-[8px] font-bold text-gray-400 dark:text-gray-500 leading-none mt-0.5 px-0.5">
                  {{ turno.start_time }}–{{ turno.end_time }}
                </div>
                <div v-for="asig in asignacionesPorTurnoFecha(celda.date, turno)" :key="asig.id"
                  class="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium border leading-tight"
                  :class="claseAsig(asig.status)"
                  @click.stop="abrirSidebarCong(celda.date)">
                  <span class="flex-1 truncate">{{ nombreById(asig.empleado_id) }}</span>
                  <span class="text-[8px] opacity-70 shrink-0">{{ labelStatus(asig.status) }}</span>
                </div>
                <div v-if="!asignacionesPorTurnoFecha(celda.date, turno).length"
                  class="px-1 py-0.5 text-[9px] text-amber-400 italic leading-tight">
                  Sin asignar
                </div>
              </template>
            </template>

            <!-- Voluntario: sus turnos publicados -->
            <template v-else-if="!canManage && celda.esMes">
              <div v-for="asig in asignacionesFecha(celda.date).filter(a => a.status === 'publicado')" :key="asig.id"
                class="px-1 py-0.5 rounded text-[9px] font-medium bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 leading-tight truncate">
                {{ asig.start }}–{{ asig.end }}
              </div>
            </template>

          </div>
        </div>
      </div>

      <!-- ── Grilla semanal (empresa) ──────────────────────────────────────── -->
      <div v-else class="flex-1 overflow-auto">
        <div class="grid grid-cols-7 gap-2 min-w-[720px]">
          <div v-for="(dia, i) in diasSemana" :key="dia" class="flex flex-col gap-1.5">

            <div class="px-1 py-2 text-center rounded-xl"
              :class="esDiaHoy(i) ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400'">
              <p class="text-[10px] font-bold uppercase tracking-wide">{{ dia.slice(0, 3) }}</p>
              <p class="text-xs font-semibold tabular-nums mt-0.5">{{ fechaDia(i).slice(8) }}</p>
            </div>

            <button v-if="canManage && tieneSugeridosDia(i)" @click="publicarDia(i)" :disabled="accionando"
              class="w-full py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/40 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-40">
              Publicar día
            </button>

            <!-- Vista manager -->
            <template v-if="canManage">
              <div v-if="!turnosDelDia(i).length"
                class="flex-1 flex items-center justify-center py-4 text-[10px] text-gray-300 dark:text-gray-600 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                Sin turnos
              </div>

              <div v-for="turno in turnosDelDia(i)" :key="`${fechaDia(i)}-${turno.id}`"
                class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 overflow-hidden">

                <div class="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <p class="text-[11px] font-bold tabular-nums text-gray-700 dark:text-gray-200">
                    {{ turno.start_time }} – {{ turno.end_time }}
                  </p>
                </div>

                <div class="p-1.5 space-y-1">
                  <template v-for="req in turno.requerimientos.filter(r => r.cantidad > 0)" :key="req.estacion_id ?? 'general'">
                    <div v-for="cupoIdx in req.cantidad" :key="`${req.estacion_id}-${cupoIdx}`">
                      <button v-if="asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)"
                        class="w-full text-left px-2 pt-1.5 pb-1 rounded-lg text-xs border transition-all"
                        :class="[
                          claseAsig(asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status),
                          sidebarAsig?.id === asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.id
                            ? 'ring-2 ring-violet-400 dark:ring-violet-500'
                            : 'hover:brightness-95'
                        ]"
                        @click="abrirSidebar(asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!, turno, req.estacion_id, fechaDia(i))">
                        <div class="flex items-center justify-between gap-1">
                          <span class="text-[10px] font-semibold opacity-70 truncate">{{ nombreEstacion(req.estacion_id) }}</span>
                          <span class="text-[9px] font-bold uppercase tracking-wide shrink-0"
                            :class="claseChipStatus(asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status)">
                            {{ labelStatus(asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                          <div class="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 bg-current/20">
                            {{ inicialesById(asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.empleado_id) }}
                          </div>
                          <span class="text-[10px] font-medium truncate flex-1">
                            {{ nombreById(asignacionParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.empleado_id) }}
                          </span>
                        </div>
                      </button>
                      <button v-else
                        class="w-full text-left px-2 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                        @click="abrirSidebarVacio(turno, req.estacion_id, fechaDia(i))">
                        <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 truncate">{{ nombreEstacion(req.estacion_id) }}</p>
                        <p class="text-[10px] text-gray-300 dark:text-gray-600 italic">Sin asignar — click para asignar</p>
                      </button>
                    </div>
                  </template>
                  <div v-if="!turno.requerimientos.filter(r => r.cantidad > 0).length"
                    class="px-2 py-2 rounded-lg border border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-900/10">
                    <p class="text-[10px] text-amber-500 dark:text-amber-400 italic">Sin requerimientos</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Vista empleado -->
            <template v-else>
              <div v-if="!asignacionesDia(i).length"
                class="flex-1 flex items-center justify-center py-4 text-[10px] text-gray-300 dark:text-gray-600 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                Libre
              </div>
              <div v-for="asig in asignacionesDia(i)" :key="asig.id"
                class="px-2 py-2 rounded-xl text-xs font-medium border bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
                <p class="tabular-nums font-semibold leading-tight">{{ asig.start }} – {{ asig.end }}</p>
                <p class="text-[10px] mt-0.5 opacity-75">{{ nombreEstacion(asig.estacion_id) }}</p>
              </div>
            </template>

          </div>
        </div>
      </div>

      <!-- Leyenda -->
      <div class="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex-wrap">
        <template v-if="canManage && !isCongregacion">
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-dashed border-gray-300 dark:border-gray-600"></span><span class="text-xs text-gray-500 dark:text-gray-400">Sin asignar</span></div>
        </template>
        <template v-if="canManage">
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Sugerido</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-violet-200 dark:bg-violet-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Publicado</span></div>
        </template>
        <template v-else>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-violet-200 dark:bg-violet-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Turno asignado</span></div>
          <span class="text-xs text-gray-400 ml-auto">Solo turnos publicados</span>
        </template>
      </div>

    </div><!-- fin panel principal -->

    <!-- ── Sidebar de asignación ─────────────────────────────────────────── -->
    <transition name="sidebar">
      <div v-if="sidebarAbierta && canManage"
        class="w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full overflow-hidden">

        <!-- Cabecera -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div class="min-w-0">
            <p class="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
              {{ isCongregacion ? labelFechaCong : nombreEstacion(sidebarEstacionId) }}
            </p>
            <p class="text-[10px] text-gray-400 tabular-nums mt-0.5">
              {{ isCongregacion ? sidebarFechaCong : `${sidebarFecha} · ${sidebarTurno?.start_time} – ${sidebarTurno?.end_time}` }}
            </p>
          </div>
          <button @click="cerrarSidebar" class="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- ── Sidebar CONGREGACIÓN ── -->
        <template v-if="isCongregacion">
          <div class="flex-1 overflow-y-auto">
            <div v-for="turno in turnosDeFecha(sidebarFechaCong)" :key="turno.start_time" class="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
                <div>
                  <p class="text-xs font-bold text-gray-700 dark:text-gray-200 tabular-nums">{{ turno.start_time }} – {{ turno.end_time }}</p>
                  <p class="text-[10px] text-gray-400">
                    {{ asignacionesPorTurnoFecha(sidebarFechaCong, turno).length }} /
                    {{ turno.requerimientos[0]?.cantidad ?? 0 }} voluntarios
                  </p>
                </div>
                <button v-if="asignacionesPorTurnoFecha(sidebarFechaCong, turno).some(a => a.status === 'sugerido')"
                  @click="publicarFecha(sidebarFechaCong)" :disabled="accionando"
                  class="text-[9px] px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold hover:bg-violet-200 disabled:opacity-40">
                  Publicar
                </button>
              </div>

              <div class="px-3 py-2 space-y-1">
                <p class="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Asignados</p>
                <div v-if="!asignacionesPorTurnoFecha(sidebarFechaCong, turno).length"
                  class="text-[10px] text-gray-400 italic py-1">Sin asignar</div>
                <div v-for="asig in asignacionesPorTurnoFecha(sidebarFechaCong, turno)" :key="asig.id"
                  class="flex items-center gap-2 px-2 py-1.5 rounded-lg border"
                  :class="claseAsig(asig.status)">
                  <div class="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {{ inicialesById(asig.empleado_id) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-semibold truncate">{{ nombreById(asig.empleado_id) }}</p>
                    <p class="text-[9px] opacity-60">{{ labelStatus(asig.status) }}</p>
                  </div>
                  <div class="flex gap-1 shrink-0">
                    <button @click="quitarVoluntarioCong(asig.id)" :disabled="accionando"
                      class="w-5 h-5 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 disabled:opacity-40"
                      title="Quitar">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-2.5 h-2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p class="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mt-2 mb-1">Disponibles</p>
                <div class="relative mb-1">
                  <input v-model="busquedaCong" type="text" placeholder="Buscar voluntario…"
                    class="w-full pl-3 pr-3 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
                <div v-if="!disponiblesParaTurno(sidebarFechaCong, turno).length"
                  class="text-[10px] text-gray-400 italic py-1">Sin voluntarios disponibles</div>
                <button v-for="vol in disponiblesParaTurno(sidebarFechaCong, turno)" :key="vol.id"
                  @click="agregarVoluntarioCong(vol.id, turno, sidebarFechaCong)" :disabled="accionando"
                  class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left disabled:opacity-40"
                  :class="vol.disponible ? '' : 'opacity-50'">
                  <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold shrink-0 text-gray-600 dark:text-gray-300">
                    {{ vol.iniciales }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-medium truncate text-gray-800 dark:text-gray-200">{{ vol.nombre }}</p>
                    <p v-if="!vol.disponible" class="text-[9px] text-amber-500">Sin disponibilidad en este horario</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                    class="w-3 h-3 text-blue-400 shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Sidebar EMPRESA ── -->
        <template v-else>
          <div v-if="sidebarAsig" class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Asignado actualmente</p>
            <div class="flex items-center gap-2 p-2 rounded-lg" :class="claseAsig(sidebarAsig.status)">
              <div class="w-7 h-7 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold shrink-0">
                {{ inicialesById(sidebarAsig.empleado_id) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold truncate">{{ nombreById(sidebarAsig.empleado_id) }}</p>
                <p class="text-[10px] opacity-70">{{ labelStatus(sidebarAsig.status) }}</p>
              </div>
              <button @click="quitarAsignacion(sidebarAsig.id)" :disabled="accionando"
                class="w-6 h-6 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 disabled:opacity-40 shrink-0"
                title="Quitar asignación">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              {{ sidebarAsig ? 'Cambiar empleado' : 'Asignar empleado' }}
            </p>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input v-model="busquedaEmpleado" type="text" placeholder="Buscar empleado…"
                class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors" />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <p v-if="!empleadosFiltrados.length" class="text-[11px] text-gray-400 italic text-center py-4">
              Sin empleados disponibles
            </p>
            <button v-for="emp in empleadosFiltrados" :key="emp.id"
              @click="reasignar(emp.id)" :disabled="accionando"
              class="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all disabled:opacity-40"
              :class="[
                emp.id === sidebarAsig?.empleado_id
                  ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
                emp.disponible ? '' : 'opacity-50'
              ]">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="emp.id === sidebarAsig?.empleado_id
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
                {{ emp.iniciales }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{{ emp.nombre }}</p>
                <p class="text-[10px] text-gray-400 truncate">
                  <span v-if="emp.id === sidebarAsig?.empleado_id" class="text-violet-500 font-semibold">Asignado · </span>
                  <span v-if="!emp.disponible" class="text-amber-500">Sin disponibilidad · </span>
                  {{ emp.estacionesNombre || '—' }}
                </p>
              </div>
              <svg v-if="emp.id === sidebarAsig?.empleado_id"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                class="w-3.5 h-3.5 text-violet-500 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>
          </div>
        </template>

      </div>
    </transition>

  </div>
</template>

<style scoped>
.sidebar-enter-active, .sidebar-leave-active { transition: width 0.2s ease, opacity 0.2s ease; }
.sidebar-enter-from, .sidebar-leave-to { width: 0; opacity: 0; overflow: hidden; }
.sidebar-enter-to, .sidebar-leave-from { width: 18rem; opacity: 1; }
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { getDocs, getDoc, doc as fsDoc, query, collection, where, updateDoc, Timestamp } from 'firebase/firestore';
import { useSessionStore } from '../../stores/sessionStore';
import { useAsignacionStore } from '../../stores/asignacionStore';
import { useGrantStore } from '../../stores/grantStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useLogStore } from '../../stores/logStore';
import { ubicacionConverter } from '../../models/Ubicacion';
import { estacionConverter } from '../../models/Estacion';
import { empleadoConverter } from '../../models/Empleado';
import { contactoConverter } from '../../models/Contacto';
import { db } from '../../firebase';
import type { Asignacion, AsignacionStatus } from '../../models/Asignacion';
import type { Turno } from '../../models/Ubicacion';

const sessionStore = useSessionStore();
const asignacionStore = useAsignacionStore();
const grantStore = useGrantStore();
const empresaStore = useEmpresaStore();
const logStore = useLogStore();

const isCongregacion = computed(() => empresaStore.isCongregacion);

// ── Permisos ──────────────────────────────────────────────────────────────────

const canManage = computed(() => {
  const user = sessionStore.currentUser;
  if (!user) return false;
  if (user.system_role === 'super_admin') return true;
  const ubicId = sessionStore.activeUbicacionId;
  const compId = sessionStore.activeCompanyId;
  if (!ubicId || !compId) return false;
  return grantStore.grants.some(g =>
    g.active && g.deletedAt === null &&
    ['owner', 'company_admin', 'zone_manager', 'branch_manager'].includes(g.role) && (
      g.scope_type === 'client' ||
      (g.scope_type === 'company' && g.scope_id === compId) ||
      g.scope_type === 'zone' ||
      (g.scope_type === 'branch' && g.scope_id === ubicId)
    )
  );
});

const companyId = computed(() => sessionStore.activeCompanyId ?? '');
const ubicacionId = computed(() => sessionStore.activeUbicacionId ?? '');

const miEmpleadoId = ref<string | null>(null);

async function resolverMiEmpleadoId(): Promise<string | null> {
  const user = sessionStore.currentUser;
  if (!user?.contact_id || !companyId.value) return null;
  try {
    const snap = await getDocs(query(
      collection(db, 'empleados'),
      where('company_id', '==', companyId.value),
      where('contact_id', '==', user.contact_id),
      where('active', '==', true)
    ));
    const docFound = snap.docs.find(d => !d.data().deletedAt);
    if (!docFound) logStore.warn('CalendarioView: no se encontró empleado para este usuario', { scope: 'calendario' });
    return docFound?.id ?? null;
  } catch (err: any) {
    logStore.error(`CalendarioView: error resolviendo empleadoId — ${err?.message ?? err}`, { scope: 'calendario' });
    return null;
  }
}

const puedeVer = computed(() => canManage.value || !!miEmpleadoId.value);

// ── Caché local ───────────────────────────────────────────────────────────────

interface EmpleadoCacheEntry {
  id: string;
  nombre: string;
  iniciales: string;
  estacion_ids: string[];
  disponibilidad: any;
  contratos: any[];
}

const empleadosCache = ref<EmpleadoCacheEntry[]>([]);
const estacionesCache = ref<Map<string, string>>(new Map());

function nombreById(id: string): string {
  return empleadosCache.value.find(e => e.id === id)?.nombre ?? id.slice(0, 8) + '…';
}

function inicialesById(id: string): string {
  return empleadosCache.value.find(e => e.id === id)?.iniciales ?? '?';
}

function nombreEstacion(id: string | null): string {
  if (!id) return 'General';
  return estacionesCache.value.get(id) ?? id.slice(0, 8);
}

// ── Estado ────────────────────────────────────────────────────────────────────

const asignaciones = ref<Asignacion[]>([]);
const cargando = ref(false);
const generandoBorrador = ref(false);
const accionando = ref(false);
const turnosConfiguracion = ref<Turno[]>([]);

// ── Semana ────────────────────────────────────────────────────────────────────

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function inicioSemana(offset = 0): string {
  const hoy = new Date();
  const dow = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((dow + 6) % 7) + offset * 7);
  return lunes.toISOString().slice(0, 10);
}

const fechaInicio = ref(inicioSemana(0));
const fechaFin = computed(() => {
  const d = new Date(fechaInicio.value + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
});

function fechaDia(diaIdx: number): string {
  const d = new Date(fechaInicio.value + 'T12:00:00');
  d.setDate(d.getDate() + diaIdx);
  return d.toISOString().slice(0, 10);
}

function esDiaHoy(diaIdx: number): boolean {
  return fechaDia(diaIdx) === new Date().toISOString().slice(0, 10);
}

async function irSemana(dir: number) {
  if (dir === 0) {
    fechaInicio.value = inicioSemana(0);
  } else {
    const d = new Date(fechaInicio.value + 'T12:00:00');
    d.setDate(d.getDate() + dir * 7);
    fechaInicio.value = d.toISOString().slice(0, 10);
  }
  cerrarSidebar();
  await cargar();
}

// ── Grilla empresa ────────────────────────────────────────────────────────────

function turnosDelDia(diaIdx: number): Turno[] {
  return turnosConfiguracion.value.filter(t => t.day_of_week === diasSemana[diaIdx]);
}

function asignacionesDia(diaIdx: number): Asignacion[] {
  return asignaciones.value
    .filter(a => a.date === fechaDia(diaIdx))
    .sort((a, b) => a.start.localeCompare(b.start));
}

// Un cupo de un turno = una asignación con esa estación que se solapa con el turno.
// cupoOffset: el N-ésimo empleado asignado a esa estación en ese turno.
function asignacionesParaTurno(diaIdx: number, turno: Turno, estacionId: string | null): Asignacion[] {
  const fecha = fechaDia(diaIdx);
  return asignaciones.value.filter(a =>
    a.date === fecha &&
    a.estacion_id === estacionId &&
    a.start < turno.end_time && a.end > turno.start_time
  );
}

function asignacionParaCupo(diaIdx: number, turno: Turno, estacionId: string | null, cupoOffset: number): Asignacion | undefined {
  return asignacionesParaTurno(diaIdx, turno, estacionId)[cupoOffset];
}

function tieneSugeridosDia(diaIdx: number): boolean {
  return asignacionesDia(diaIdx).some(a => a.status === 'sugerido');
}

// ── Sidebar de asignación (empresa) ──────────────────────────────────────────

const sidebarAbierta = ref(false);
const sidebarAsig = ref<Asignacion | null>(null);
const sidebarTurno = ref<Turno | null>(null);
const sidebarEstacionId = ref<string | null>(null);
const sidebarFecha = ref<string>('');
const busquedaEmpleado = ref('');

interface EmpleadoSidebar {
  id: string;
  nombre: string;
  iniciales: string;
  estacionesNombre: string;
  disponible: boolean;
}

const empleadosSidebar = ref<EmpleadoSidebar[]>([]);

const empleadosFiltrados = computed(() => {
  const q = busquedaEmpleado.value.toLowerCase().trim();
  if (!q) return empleadosSidebar.value;
  return empleadosSidebar.value.filter(e => e.nombre.toLowerCase().includes(q));
});

function abrirSidebar(asig: Asignacion, turno: Turno, estacionId: string | null, fecha: string) {
  sidebarAsig.value = asig;
  sidebarTurno.value = turno;
  sidebarEstacionId.value = estacionId;
  sidebarFecha.value = fecha;
  busquedaEmpleado.value = '';
  sidebarAbierta.value = true;
  cargarEmpleadosSidebar(turno, estacionId, fecha);
}

function abrirSidebarVacio(turno: Turno, estacionId: string | null, fecha: string) {
  sidebarAsig.value = null;
  sidebarTurno.value = turno;
  sidebarEstacionId.value = estacionId;
  sidebarFecha.value = fecha;
  busquedaEmpleado.value = '';
  sidebarAbierta.value = true;
  cargarEmpleadosSidebar(turno, estacionId, fecha);
}

function cerrarSidebar() {
  sidebarAbierta.value = false;
  sidebarAsig.value = null;
  sidebarFechaCong.value = '';
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function cargarEmpleadosSidebar(turno: Turno, estacionId: string | null, fecha: string) {
  const diasES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [y, mo, d] = fecha.split('-').map(Number);
  const diaSemana = diasES[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  const tStart = toMin(turno.start_time);
  const tEnd = toMin(turno.end_time);

  // Empleados que ya tienen una asignación que se solapa con este turno ese día (D4)
  const yaOcupadosEnTurno = new Set(
    asignaciones.value
      .filter(a =>
        a.date === fecha &&
        a.empleado_id !== sidebarAsig.value?.empleado_id &&
        toMin(a.start) < tEnd && toMin(a.end) > tStart
      )
      .map(a => a.empleado_id)
  );

  const lista: EmpleadoSidebar[] = empleadosCache.value
    .filter(emp => !yaOcupadosEnTurno.has(emp.id))
    .map(emp => {
      const ventanas: any[] = emp.disponibilidad?.ventanas ?? [];
      const tieneDisponibilidad = ventanas.some((v: any) =>
        v.day_of_week === diaSemana &&
        toMin(v.start) <= tStart && toMin(v.end) >= tEnd
      );
      const disponible = estacionId
        ? emp.estacion_ids.includes(estacionId) && tieneDisponibilidad
        : tieneDisponibilidad;
      const estacionesNombre = emp.estacion_ids
        .map((id: string) => nombreEstacion(id))
        .filter(Boolean)
        .join(', ');
      return { id: emp.id, nombre: emp.nombre, iniciales: emp.iniciales, estacionesNombre, disponible };
    });

  lista.sort((a, b) => {
    if (a.id === sidebarAsig.value?.empleado_id) return -1;
    if (b.id === sidebarAsig.value?.empleado_id) return 1;
    return (b.disponible ? 1 : 0) - (a.disponible ? 1 : 0);
  });

  empleadosSidebar.value = lista;
}

async function quitarAsignacion(id: string) {
  accionando.value = true;
  try {
    await asignacionStore.softDeleteAsignacion(id);
    asignaciones.value = asignaciones.value.filter(a => a.id !== id);
    sidebarAsig.value = null;
    if (sidebarTurno.value) cargarEmpleadosSidebar(sidebarTurno.value, sidebarEstacionId.value, sidebarFecha.value);
  } catch (err: any) {
    logStore.error(`Error quitando asignación: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    accionando.value = false;
  }
}

async function reasignar(nuevoEmpleadoId: string) {
  if (!sidebarTurno.value || !sidebarFecha.value) return;

  // Click en el empleado ya asignado → quitar
  if (nuevoEmpleadoId === sidebarAsig.value?.empleado_id && sidebarAsig.value) {
    await quitarAsignacion(sidebarAsig.value.id);
    return;
  }

  accionando.value = true;
  try {
    if (sidebarAsig.value) {
      // Actualizar empleado de la asignación existente
      await asignacionStore.actualizarEmpleadoAsignacion(sidebarAsig.value.id, nuevoEmpleadoId);
      const asig = asignaciones.value.find(a => a.id === sidebarAsig.value!.id);
      if (asig) {
        asig.empleado_id = nuevoEmpleadoId;
        asig.status = 'sugerido';
      }
      sidebarAsig.value = { ...sidebarAsig.value, empleado_id: nuevoEmpleadoId, status: 'sugerido' };
    } else {
      // Crear nueva asignación
      const id = await asignacionStore.crearAsignacion({
        empresa_id: companyId.value,
        ubicacion_id: ubicacionId.value,
        empleado_id: nuevoEmpleadoId,
        date: sidebarFecha.value,
        estacion_id: sidebarEstacionId.value,
        start: sidebarTurno.value.start_time,
        end: sidebarTurno.value.end_time,
      });
      asignaciones.value.push({
        id,
        empresa_id: companyId.value,
        ubicacion_id: ubicacionId.value,
        empleado_id: nuevoEmpleadoId,
        date: sidebarFecha.value,
        estacion_id: sidebarEstacionId.value,
        start: sidebarTurno.value.start_time,
        end: sidebarTurno.value.end_time,
        status: 'sugerido',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        get isPublished() { return this.status === 'publicado'; },
      });
      sidebarAsig.value = asignaciones.value.find(a => a.id === id) ?? null;
    }
    cargarEmpleadosSidebar(sidebarTurno.value, sidebarEstacionId.value, sidebarFecha.value);
  } catch (err: any) {
    logStore.error(`Error reasignando: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    accionando.value = false;
  }
}

// ── Helpers de presentación ───────────────────────────────────────────────────

function formatRango(ini: string, fin: string): string {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fmt = (d: string) => { const [, m, dd] = d.split('-'); return `${parseInt(dd)} ${meses[parseInt(m) - 1]}`; };
  return `${fmt(ini)} – ${fmt(fin)}`;
}

function claseAsig(status: AsignacionStatus): string {
  switch (status) {
    case 'sugerido':  return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
    case 'publicado': return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300';
    default:          return 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 text-gray-500';
  }
}

function claseChipStatus(status: AsignacionStatus): string {
  switch (status) {
    case 'sugerido':  return 'text-amber-600 dark:text-amber-400';
    case 'publicado': return 'text-violet-600 dark:text-violet-400';
    default:          return 'text-gray-400';
  }
}

function labelStatus(status: AsignacionStatus): string {
  const map: Record<string, string> = { sugerido: 'Sugerido', publicado: 'Publicado' };
  return map[status] ?? status;
}

// ── Diagnóstico ───────────────────────────────────────────────────────────────

interface DiagnosticoEmpleado { id: string; nombre: string; listo: boolean; problemas: string[]; }
interface Diagnostico {
  tieneTurnos: boolean; cantTurnos: number; diasConTurno: string;
  tieneEstaciones: boolean; cantEstaciones: number; nombresEstaciones: string;
  turnosTienenRequerimientos: boolean; nombresEstacionesRequeridas: string;
  tieneEmpleadosConContrato: boolean; cantConContrato: number;
  detalleEmpleados: DiagnosticoEmpleado[];
}

const diagnostico = ref<Diagnostico | null>(null);
const cargandoDiagnostico = ref(false);
const panelAbierto = ref(false);
const errorBorrador = ref('');

const diagnosticoListo = computed(() => {
  if (!diagnostico.value) return false;
  const d = diagnostico.value;
  if (!d.tieneTurnos || !d.tieneEmpleadosConContrato) return false;
  if (!isCongregacion.value && (!d.tieneEstaciones || !d.turnosTienenRequerimientos)) return false;
  return d.detalleEmpleados.every(e => e.listo);
});

const problemasTotal = computed(() => {
  if (!diagnostico.value) return 0;
  const d = diagnostico.value;
  let n = 0;
  if (!d.tieneTurnos) n++;
  if (!isCongregacion.value && !d.tieneEstaciones) n++;
  if (!isCongregacion.value && !d.turnosTienenRequerimientos) n++;
  if (!d.tieneEmpleadosConContrato) n++;
  n += d.detalleEmpleados.filter(e => !e.listo).length;
  return n;
});

async function calcularDiagnostico() {
  if (!canManage.value || !companyId.value || !ubicacionId.value) return;
  cargandoDiagnostico.value = true;
  try {
    const toM = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
    const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const ubicSnap = await getDoc(fsDoc(db, 'ubicaciones', ubicacionId.value).withConverter(ubicacionConverter));
    if (!ubicSnap.exists()) { diagnostico.value = null; return; }
    const ubicacion = ubicSnap.data();
    const managerId: string | null = (ubicacion as any).manager_id ?? null;

    const configuracionesActivas = (ubicacion.configuraciones ?? []).filter((c: any) => !c.deletedAt);
    const todosLosTurnos = configuracionesActivas.flatMap((c: any) => (c.turnos ?? []).filter((t: any) => !t.deletedAt));
    const turnosValidos = todosLosTurnos.filter((t: any) => DIAS.includes(t.day_of_week));
    const diasConTurno = [...new Set(turnosValidos.map((t: any) => t.day_of_week))].join(', ') || '(ninguno)';
    turnosConfiguracion.value = turnosValidos as Turno[];

    const turnosConReq = turnosValidos.filter((t: any) =>
      (t.requerimientos ?? []).some((r: any) => r.cantidad > 0)
    );
    const estacionIdsRequeridas = new Set<string>(
      turnosConReq.flatMap((t: any) => (t.requerimientos ?? []).map((r: any) => r.estacion_id).filter(Boolean))
    );

    const estSnap = await getDocs(query(
      collection(db, 'estaciones').withConverter(estacionConverter),
      where('empresa_id', '==', companyId.value),
      where('active', '==', true)
    ));
    const estaciones = estSnap.docs.map(d => d.data());

    const cacheEst = new Map<string, string>();
    estaciones.forEach(e => cacheEst.set(e.id, e.nombre));
    estacionesCache.value = cacheEst;

    const nombresEstaciones = estaciones.map(e => e.nombre).join(', ') || '(ninguna)';
    const nombresEstacionesRequeridas = [...estacionIdsRequeridas]
      .map(id => estaciones.find(e => e.id === id)?.nombre ?? id).join(', ') || '(ninguna)';

    const empSnap = await getDocs(query(
      collection(db, 'empleados').withConverter(empleadoConverter),
      where('company_id', '==', companyId.value),
      where('active', '==', true)
    ));

    const todos = empSnap.docs.map(d => d.data()).filter(e => !e.deletedAt);
    const conContrato = todos.filter(e =>
      e.contratos.some((c: any) => c.active && !c.deletedAt && c.ubicacion_id === ubicacionId.value) ||
      e.id === managerId
    );

    await Promise.all(todos.map(async emp => {
      if (!emp.contacto && emp.contact_id) {
        try {
          const cSnap = await getDoc(fsDoc(db, 'contactos', emp.contact_id).withConverter(contactoConverter));
          if (cSnap.exists()) emp.contacto = cSnap.data();
        } catch { /* degraded */ }
      }
    }));

    empleadosCache.value = conContrato.map(emp => ({
      id: emp.id,
      nombre: emp.displayName,
      iniciales: emp.initials,
      estacion_ids: emp.estacion_ids ?? [],
      disponibilidad: emp.disponibilidad,
      contratos: emp.contratos,
    }));

    const turnosPorDia = new Map<string, { start: string; end: string }[]>();
    turnosValidos.forEach((t: any) => {
      if (!turnosPorDia.has(t.day_of_week)) turnosPorDia.set(t.day_of_week, []);
      turnosPorDia.get(t.day_of_week)!.push({ start: t.start_time, end: t.end_time });
    });

    const detalleEmpleados: DiagnosticoEmpleado[] = conContrato.map(emp => {
      const problemas: string[] = [];
      const ventanas = emp.disponibilidad?.ventanas ?? [];
      if (ventanas.length === 0) {
        problemas.push('Sin disponibilidad — agrégala en Mi Equipo → Personal');
      } else {
        const diasConVentana = new Set(ventanas.map((v: any) => v.day_of_week));
        const diasConTurnoSet = new Set(turnosValidos.map((t: any) => t.day_of_week));
        if (![...diasConTurnoSet].some(d => diasConVentana.has(d))) {
          problemas.push(`Disponibilidad (${[...diasConVentana].join(', ')}) no coincide con días de turnos (${[...diasConTurnoSet].join(', ')})`);
        } else {
          const hayUtil = ventanas.some((v: any) => {
            const ts = turnosPorDia.get(v.day_of_week) ?? [];
            return ts.some(t => toM(v.start) < toM(t.end) && toM(v.end) > toM(t.start));
          });
          if (!hayUtil) {
            const ej = turnosValidos.find((t: any) => new Set(ventanas.map((v: any) => v.day_of_week)).has(t.day_of_week));
            problemas.push(`Ventanas no solapan los turnos. Ej: ${ej ? `${ej.day_of_week} ${ej.start_time}–${ej.end_time}` : ''}`);
          }
        }
      }
      if (estacionIdsRequeridas.size > 0) {
        const empEst = new Set(emp.estacion_ids ?? []);
        if (![...estacionIdsRequeridas].some(id => empEst.has(id))) {
          const req = [...estacionIdsRequeridas].map(id => estaciones.find(e => e.id === id)?.nombre ?? id).join(', ');
          problemas.push(`Sin estaciones calificadas (necesita alguna de: ${req})`);
        }
      }
      return { id: emp.id, nombre: emp.displayName, listo: problemas.length === 0, problemas };
    });

    diagnostico.value = {
      tieneTurnos: turnosValidos.length > 0, cantTurnos: turnosValidos.length, diasConTurno,
      tieneEstaciones: estaciones.length > 0, cantEstaciones: estaciones.length, nombresEstaciones,
      turnosTienenRequerimientos: turnosConReq.length > 0, nombresEstacionesRequeridas,
      tieneEmpleadosConContrato: conContrato.length > 0, cantConContrato: conContrato.length,
      detalleEmpleados,
    };
    logStore.info(`Diagnóstico: ${turnosValidos.length} turnos, ${conContrato.length} empleados con contrato, ${detalleEmpleados.filter(e=>e.listo).length} listos`, { scope: 'calendario' });
  } catch (err: any) {
    logStore.error(`Error en diagnóstico: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    cargandoDiagnostico.value = false;
  }
}

// ── Carga principal ───────────────────────────────────────────────────────────

function hoy(): string { return new Date().toISOString().slice(0, 10); }

async function cargar() {
  if (!companyId.value || !ubicacionId.value) return;
  cargando.value = true;
  errorBorrador.value = '';
  try {
    logStore.info(`CalendarioView: cargando semana ${fechaInicio.value}–${fechaFin.value}`, { scope: 'calendario' });
    if (canManage.value) {
      await calcularDiagnostico();
      asignaciones.value = await asignacionStore.cargarAsignacionesManager(
        ubicacionId.value, fechaInicio.value, fechaFin.value
      );
      logStore.info(`CalendarioView: ${asignaciones.value.length} asignaciones cargadas`, { scope: 'calendario' });
    } else {
      if (!miEmpleadoId.value) return;
      asignaciones.value = await asignacionStore.cargarAsignacionesEmpleado(
        miEmpleadoId.value, fechaInicio.value, fechaFin.value
      );
      logStore.info(`CalendarioView: ${asignaciones.value.length} asignaciones publicadas cargadas`, { scope: 'calendario' });
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    logStore.error(`Error cargando calendario: ${msg}`, { scope: 'calendario' });
    errorBorrador.value = msg;
  } finally {
    cargando.value = false;
  }
}

async function regenerarBorradorSemana() {
  if (!canManage.value || !companyId.value || !ubicacionId.value) return;
  errorBorrador.value = '';
  generandoBorrador.value = true;
  logStore.info('Iniciando regeneración de sugerencias (semana)…', { scope: 'calendario' });
  try {
    const resp = await asignacionStore.regenerarSugerencias(
      companyId.value, ubicacionId.value, hoy(), 28
    );
    if (resp.logs?.length) logStore.pushServerLogs(resp.logs, 'generarAsignaciones');
    logStore.info(`Regeneración completada: ${resp.dias_procesados} días, ${resp.asignaciones_creadas} asignaciones, ${resp.huecos?.length ?? 0} huecos`, { scope: 'calendario' });
    asignaciones.value = await asignacionStore.cargarAsignacionesManager(
      ubicacionId.value, fechaInicio.value, fechaFin.value
    );
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    logStore.error(`Error regenerando sugerencias: ${msg}`, { scope: 'calendario' });
    errorBorrador.value = msg;
  } finally {
    generandoBorrador.value = false;
  }
}

// ── Acciones ──────────────────────────────────────────────────────────────────

async function publicarDia(diaIdx: number) {
  if (!ubicacionId.value) return;
  const fecha = fechaDia(diaIdx);
  accionando.value = true;
  try {
    await asignacionStore.publicarDia(ubicacionId.value, fecha);
    asignaciones.value
      .filter(a => a.date === fecha && a.status === 'sugerido')
      .forEach(a => { a.status = 'publicado'; });
  } catch (err: any) {
    logStore.error(`Error publicando día ${fecha}: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    accionando.value = false;
  }
}

// ── Mes (congregación) ────────────────────────────────────────────────────────

const mesBase = ref<{ year: number; month: number }>({ year: new Date().getFullYear(), month: new Date().getMonth() });

function primerDiaMes(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}

function ultimoDiaMes(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

const mesInicio = computed(() => primerDiaMes(mesBase.value.year, mesBase.value.month));
const mesFin = computed(() => ultimoDiaMes(mesBase.value.year, mesBase.value.month));

const diasDelMes = computed<{ date: string; esHoy: boolean; esMes: boolean }[]>(() => {
  const { year, month } = mesBase.value;
  const primer = new Date(year, month, 1);
  const offsetLunes = (primer.getDay() + 6) % 7;
  const cells: { date: string; esHoy: boolean; esMes: boolean }[] = [];
  const hoyStr = new Date().toISOString().slice(0, 10);
  for (let i = offsetLunes - 1; i >= 0; i--) {
    const str = new Date(year, month, -i).toISOString().slice(0, 10);
    cells.push({ date: str, esHoy: str === hoyStr, esMes: false });
  }
  const diasTotal = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= diasTotal; d++) {
    const str = new Date(year, month, d).toISOString().slice(0, 10);
    cells.push({ date: str, esHoy: str === hoyStr, esMes: true });
  }
  let d = 1;
  while (cells.length < 42) {
    const str = new Date(year, month + 1, d++).toISOString().slice(0, 10);
    cells.push({ date: str, esHoy: str === hoyStr, esMes: false });
  }
  return cells;
});

const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const labelMes = computed(() =>
  `${nombresMeses[mesBase.value.month]} ${mesBase.value.year}`
);

async function irMes(dir: number) {
  let { year, month } = mesBase.value;
  month += dir;
  if (month > 11) { month = 0; year++; }
  if (month < 0) { month = 11; year--; }
  mesBase.value = { year, month };
  cerrarSidebar();
  await cargarMes();
}

async function irMesHoy() {
  const hoyD = new Date();
  mesBase.value = { year: hoyD.getFullYear(), month: hoyD.getMonth() };
  cerrarSidebar();
  await cargarMes();
}

async function cargarMes() {
  if (!companyId.value || !ubicacionId.value) return;
  cargando.value = true;
  errorBorrador.value = '';
  try {
    logStore.info(`CalendarioView: cargando mes ${mesInicio.value}–${mesFin.value}`, { scope: 'calendario' });
    if (canManage.value) {
      await calcularDiagnostico();
      asignaciones.value = await asignacionStore.cargarAsignacionesManager(
        ubicacionId.value, mesInicio.value, mesFin.value
      );
      logStore.info(`CalendarioView: ${asignaciones.value.length} asignaciones cargadas`, { scope: 'calendario' });
    } else if (miEmpleadoId.value) {
      asignaciones.value = await asignacionStore.cargarAsignacionesEmpleado(
        miEmpleadoId.value, mesInicio.value, mesFin.value
      );
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    logStore.error(`Error cargando calendario mes: ${msg}`, { scope: 'calendario' });
    errorBorrador.value = msg;
  } finally {
    cargando.value = false;
  }
}

async function regenerarBorradorMes() {
  if (!canManage.value || !companyId.value || !ubicacionId.value) return;
  errorBorrador.value = '';
  generandoBorrador.value = true;
  const diasDelMesN = new Date(mesBase.value.year, mesBase.value.month + 1, 0).getDate();
  logStore.info(`Iniciando regeneración de sugerencias (mes ${labelMes.value})…`, { scope: 'calendario' });
  try {
    const resp = await asignacionStore.regenerarSugerencias(
      companyId.value, ubicacionId.value, mesInicio.value, diasDelMesN
    );
    if (resp.logs?.length) logStore.pushServerLogs(resp.logs, 'generarAsignaciones');
    logStore.info(`Regeneración completada: ${resp.dias_procesados} días, ${resp.asignaciones_creadas} asignaciones, ${resp.huecos?.length ?? 0} huecos`, { scope: 'calendario' });
    asignaciones.value = await asignacionStore.cargarAsignacionesManager(
      ubicacionId.value, mesInicio.value, mesFin.value
    );
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    logStore.error(`Error regenerando sugerencias: ${msg}`, { scope: 'calendario' });
    errorBorrador.value = msg;
  } finally {
    generandoBorrador.value = false;
  }
}

// ── Helpers congregación ──────────────────────────────────────────────────────

function asignacionesFecha(date: string): Asignacion[] {
  return asignaciones.value
    .filter(a => a.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
}

function tieneSugeridosPorFecha(date: string): boolean {
  return asignaciones.value.some(a => a.date === date && a.status === 'sugerido');
}

async function publicarFecha(date: string) {
  if (!ubicacionId.value) return;
  accionando.value = true;
  try {
    await asignacionStore.publicarDia(ubicacionId.value, date);
    asignaciones.value
      .filter(a => a.date === date && a.status === 'sugerido')
      .forEach(a => { a.status = 'publicado'; });
  } catch (err: any) {
    logStore.error(`Error publicando fecha ${date}: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    accionando.value = false;
  }
}

function turnosEnFecha(date: string): boolean {
  const [y, mo, d] = date.split('-').map(Number);
  const diasES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaSemana = diasES[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return turnosConfiguracion.value.some(t => t.day_of_week === diaSemana);
}

// ── Sidebar congregación ──────────────────────────────────────────────────────

const sidebarFechaCong = ref('');
const busquedaCong = ref('');

const labelFechaCong = computed(() => {
  if (!sidebarFechaCong.value) return '';
  const [y, m, d] = sidebarFechaCong.value.split('-').map(Number);
  const diasES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dow = diasES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dow} ${d}/${m}/${y}`;
});

function turnosDeFecha(fecha: string): Turno[] {
  if (!fecha) return [];
  const diasES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [y, m, d] = fecha.split('-').map(Number);
  const dow = diasES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return turnosConfiguracion.value.filter(t => t.day_of_week === dow);
}

// Asignaciones para un turno en una fecha: compara por solape (B2 del plan)
function asignacionesPorTurnoFecha(fecha: string, turno: Turno): Asignacion[] {
  return asignaciones.value.filter(a =>
    a.date === fecha &&
    a.start < turno.end_time && a.end > turno.start_time
  );
}

function disponiblesParaTurno(fecha: string, turno: Turno): { id: string; nombre: string; iniciales: string; disponible: boolean }[] {
  if (!fecha) return [];
  const diasES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [y, m, d] = fecha.split('-').map(Number);
  const dow = diasES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const tStart = toMin(turno.start_time);
  const tEnd = toMin(turno.end_time);

  const yaAsignados = new Set(asignacionesPorTurnoFecha(fecha, turno).map(a => a.empleado_id));

  const q = busquedaCong.value.toLowerCase().trim();
  return empleadosCache.value
    .filter(emp => !yaAsignados.has(emp.id))
    .filter(emp => !q || emp.nombre.toLowerCase().includes(q))
    .map(emp => {
      const ventanas: any[] = emp.disponibilidad?.ventanas ?? [];
      const disponible = ventanas.some((v: any) =>
        v.day_of_week === dow && toMin(v.start) <= tStart && toMin(v.end) >= tEnd
      );
      return { id: emp.id, nombre: emp.nombre, iniciales: emp.iniciales, disponible };
    })
    .sort((a, b) => (b.disponible ? 1 : 0) - (a.disponible ? 1 : 0));
}

function abrirSidebarCong(fecha: string) {
  sidebarFechaCong.value = fecha;
  busquedaCong.value = '';
  sidebarAsig.value = null;
  sidebarTurno.value = null;
  sidebarAbierta.value = true;
}

async function quitarVoluntarioCong(asigId: string) {
  accionando.value = true;
  try {
    await asignacionStore.softDeleteAsignacion(asigId);
    asignaciones.value = asignaciones.value.filter(a => a.id !== asigId);
  } catch (err: any) {
    logStore.error(`Error quitando voluntario: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    accionando.value = false;
  }
}

async function agregarVoluntarioCong(empId: string, turno: Turno, fecha: string) {
  accionando.value = true;
  try {
    const id = await asignacionStore.crearAsignacion({
      empresa_id: companyId.value,
      ubicacion_id: ubicacionId.value,
      empleado_id: empId,
      date: fecha,
      estacion_id: null,
      start: turno.start_time,
      end: turno.end_time,
    });
    asignaciones.value.push({
      id,
      empresa_id: companyId.value,
      ubicacion_id: ubicacionId.value,
      empleado_id: empId,
      date: fecha,
      estacion_id: null,
      start: turno.start_time,
      end: turno.end_time,
      status: 'sugerido',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      get isPublished() { return this.status === 'publicado'; },
    });
  } catch (err: any) {
    logStore.error(`Error agregando voluntario: ${err?.message ?? err}`, { scope: 'calendario' });
  } finally {
    accionando.value = false;
  }
}

// ── Montaje ───────────────────────────────────────────────────────────────────

onMounted(async () => {
  logStore.info(`CalendarioView montado — ubicacion=${ubicacionId.value || '(pending)'}, isCongregacion=${isCongregacion.value}, canManage=${canManage.value}`, { scope: 'calendario' });
  miEmpleadoId.value = await resolverMiEmpleadoId();
  const cargarSegunTipo = () => isCongregacion.value ? cargarMes() : cargar();
  if (sessionStore.activeUbicacionId) {
    await cargarSegunTipo();
  } else {
    logStore.warn('CalendarioView: activeUbicacionId no disponible, esperando…', { scope: 'calendario' });
    const stop = watch(
      () => sessionStore.activeUbicacionId,
      async (val) => {
        if (val) {
          stop();
          logStore.info(`CalendarioView: activeUbicacionId resuelto: ${val}`, { scope: 'calendario' });
          await cargarSegunTipo();
        }
      }
    );
  }
});
</script>
