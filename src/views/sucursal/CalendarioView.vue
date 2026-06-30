<template>
  <!-- Layout externo: grilla + sidebar derecha -->
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
            {{ formatRango(fechaInicio, fechaFin) }}
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button v-if="canManage && haySegmentosSugeridos" @click="aprobarTodo" :disabled="accionando"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Aprobar todo
          </button>
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
          <button @click="cargar" :disabled="cargando || generandoBorrador"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
            title="Actualizar">
            <svg class="w-3.5 h-3.5" :class="(cargando || generandoBorrador) ? 'animate-spin' : ''"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Panel diagnóstico -->
      <div v-if="canManage"
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
            <span v-else-if="generandoBorrador" class="text-[10px] text-blue-500 animate-pulse truncate">generando borrador…</span>
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

      <!-- Banner generando -->
      <div v-if="generandoBorrador"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-xs text-blue-700 dark:text-blue-300">
        <svg class="w-3.5 h-3.5 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Generando borrador del mes (4 semanas)…
      </div>

      <!-- Sin acceso -->
      <div v-if="!puedeVer && !cargando" class="flex-1 flex items-center justify-center">
        <p class="text-sm text-gray-400">Necesitas una cuenta activa para ver este calendario.</p>
      </div>

      <!-- Cargando -->
      <div v-else-if="cargando" class="flex-1 flex items-center justify-center">
        <p class="text-sm text-gray-400 animate-pulse">Cargando…</p>
      </div>

      <!-- ── Grilla semanal ──────────────────────────────────────────────── -->
      <div v-else class="flex-1 overflow-auto">
        <div class="grid grid-cols-7 gap-2 min-w-[720px]">
          <div v-for="(dia, i) in diasSemana" :key="dia" class="flex flex-col gap-1.5">

            <div class="px-1 py-2 text-center rounded-xl"
              :class="esDiaHoy(i) ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400'">
              <p class="text-[10px] font-bold uppercase tracking-wide">{{ dia.slice(0, 3) }}</p>
              <p class="text-xs font-semibold tabular-nums mt-0.5">{{ fechaDia(i).slice(8) }}</p>
            </div>

            <button v-if="canManage && tieneTodosAprobados(i)" @click="publicarDia(i)" :disabled="accionando"
              class="w-full py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40">
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
                  <template v-for="req in turno.requerimientos.filter(r => r.estacion_id && r.cantidad > 0)" :key="req.estacion_id">
                    <div v-for="cupoIdx in req.cantidad" :key="`${req.estacion_id}-${cupoIdx}`">
                      <!-- Cupo asignado -->
                      <button v-if="segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)"
                        class="w-full text-left px-2 pt-1.5 pb-1 rounded-lg text-xs border transition-all"
                        :class="[
                          claseSeg(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status),
                          sidebarSeg?.id === segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.id
                            ? 'ring-2 ring-violet-400 dark:ring-violet-500'
                            : 'hover:brightness-95'
                        ]"
                        @click="abrirSidebar(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!, turno, req.estacion_id, fechaDia(i))">
                        <div class="flex items-center justify-between gap-1">
                          <span class="text-[10px] font-semibold opacity-70 truncate">{{ nombreEstacion(req.estacion_id) }}</span>
                          <span class="text-[9px] font-bold uppercase tracking-wide shrink-0"
                            :class="claseChipStatus(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status)">
                            {{ labelStatus(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                          <div class="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 bg-current/20">
                            {{ inicialesById(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.empleado_id) }}
                          </div>
                          <span class="text-[10px] font-medium truncate flex-1">
                            {{ nombreById(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.empleado_id) }}
                          </span>
                          <!-- Botón aprobar inline (solo sugerido) -->
                          <button v-if="segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.status === 'sugerido'"
                            @click.stop="aprobar(segmentoParaCupo(i, turno, req.estacion_id, cupoIdx - 1)!.id)"
                            :disabled="accionando"
                            class="w-5 h-5 flex items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-40 shrink-0"
                            title="Aprobar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-2.5 h-2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </button>
                        </div>
                      </button>

                      <!-- Cupo vacío -->
                      <button
                        class="w-full text-left px-2 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                        v-else
                        @click="abrirSidebarVacio(turno, req.estacion_id, fechaDia(i))">
                        <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 truncate">{{ nombreEstacion(req.estacion_id) }}</p>
                        <p class="text-[10px] text-gray-300 dark:text-gray-600 italic">Sin asignar — click para asignar</p>
                      </button>
                    </div>
                  </template>

                  <div v-if="!turno.requerimientos.filter(r => r.estacion_id && r.cantidad > 0).length"
                    class="px-2 py-2 rounded-lg border border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-900/10">
                    <p class="text-[10px] text-amber-500 dark:text-amber-400 italic">Sin estaciones requeridas</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Vista empleado -->
            <template v-else>
              <div v-if="!segmentosDia(i).length"
                class="flex-1 flex items-center justify-center py-4 text-[10px] text-gray-300 dark:text-gray-600 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                Libre
              </div>
              <div v-for="seg in segmentosDia(i)" :key="seg.id"
                class="px-2 py-2 rounded-xl text-xs font-medium border"
                :class="seg.tipo === 'descanso'
                  ? 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 text-gray-400'
                  : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300'">
                <p class="tabular-nums font-semibold leading-tight">{{ seg.start }} – {{ seg.end }}</p>
                <p class="text-[10px] mt-0.5 opacity-75">{{ seg.tipo === 'descanso' ? 'Descanso' : nombreEstacion(seg.estacion_id) }}</p>
              </div>
            </template>

          </div>
        </div>
      </div>

      <!-- Leyenda -->
      <div class="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex-wrap">
        <template v-if="canManage">
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded border-2 border-dashed border-gray-300 dark:border-gray-600"></span><span class="text-xs text-gray-500 dark:text-gray-400">Sin asignar</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Sugerido</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Aprobado</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-200 dark:bg-red-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Rechazado</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-violet-200 dark:bg-violet-800"></span><span class="text-xs text-gray-500 dark:text-gray-400">Publicado</span></div>
          <span class="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">Click en un cupo para asignar/cambiar empleado</span>
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

        <!-- Cabecera sidebar -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div class="min-w-0">
            <p class="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
              {{ nombreEstacion(sidebarEstacionId) }}
            </p>
            <p class="text-[10px] text-gray-400 tabular-nums mt-0.5">
              {{ sidebarFecha }} · {{ sidebarTurno?.start_time }} – {{ sidebarTurno?.end_time }}
            </p>
          </div>
          <button @click="cerrarSidebar" class="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Empleado asignado actualmente -->
        <div v-if="sidebarSeg" class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Asignado actualmente</p>
          <div class="flex items-center gap-2 p-2 rounded-lg"
            :class="claseSeg(sidebarSeg.status)">
            <div class="w-7 h-7 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold shrink-0">
              {{ inicialesById(sidebarSeg.empleado_id) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold truncate">{{ nombreById(sidebarSeg.empleado_id) }}</p>
              <p class="text-[10px] opacity-70">{{ labelStatus(sidebarSeg.status) }}</p>
            </div>
            <!-- Aprobar desde sidebar -->
            <button v-if="sidebarSeg.status === 'sugerido'"
              @click="aprobarDesideSidebar"
              :disabled="accionando"
              class="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors disabled:opacity-40 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Aprobar
            </button>
          </div>
        </div>

        <!-- Buscador -->
        <div class="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            {{ sidebarSeg ? 'Cambiar empleado' : 'Asignar empleado' }}
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

        <!-- Lista de empleados -->
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <p v-if="!empleadosSidebar.length" class="text-[11px] text-gray-400 italic text-center py-4">
            Sin empleados disponibles para este turno
          </p>

          <button v-for="emp in empleadosFiltrados" :key="emp.id"
            @click="reasignar(emp.id)"
            :disabled="accionando"
            class="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all disabled:opacity-40"
            :class="[
              emp.id === sidebarSeg?.empleado_id
                ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20'
                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
              emp.disponible ? '' : 'opacity-50'
            ]">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="emp.id === sidebarSeg?.empleado_id
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
              {{ emp.iniciales }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{{ emp.nombre }}</p>
              <p class="text-[10px] text-gray-400 truncate">
                <span v-if="emp.id === sidebarSeg?.empleado_id" class="text-violet-500 font-semibold">Asignado · </span>
                <span v-if="!emp.disponible" class="text-amber-500">Sin disponibilidad en este horario · </span>
                {{ emp.estacionesNombre || 'Sin estaciones' }}
              </p>
            </div>
            <svg v-if="emp.id === sidebarSeg?.empleado_id"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 text-violet-500 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </div>

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
import { httpsCallable } from 'firebase/functions';
import { getDocs, getDoc, doc as fsDoc, query, collection, where, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useSessionStore } from '../../stores/sessionStore';
import { useSegmentoStore } from '../../stores/segmentoStore';
import { useGrantStore } from '../../stores/grantStore';
import { ubicacionConverter } from '../../models/Ubicacion';
import { estacionConverter } from '../../models/Estacion';
import { empleadoConverter } from '../../models/Empleado';
import { contactoConverter } from '../../models/Contacto';
import { functions, db } from '../../firebase';
import type { Segmento, SegmentoStatus } from '../../models/Segmento';
import type { Turno } from '../../models/Ubicacion';

const sessionStore = useSessionStore();
const segmentoStore = useSegmentoStore();
const grantStore = useGrantStore();

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
  const snap = await getDocs(query(
    collection(db, 'empleados'),
    where('company_id', '==', companyId.value),
    where('contact_id', '==', user.contact_id),
    where('active', '==', true)
  ));
  const doc = snap.docs.find(d => !d.data().deletedAt);
  return doc?.id ?? null;
}

const puedeVer = computed(() => canManage.value || !!miEmpleadoId.value);

// ── Caché local (llenado en calcularDiagnostico vía getDocs, nunca del store reactivo) ──
// Los stores de useCollection llegan vacíos en el primer render; el caché los evita.

interface EmpleadoCacheEntry {
  id: string;
  nombre: string;
  iniciales: string;
  estacion_ids: string[];
  disponibilidad: any;
  contratos: any[];
}

const empleadosCache = ref<EmpleadoCacheEntry[]>([]);
const estacionesCache = ref<Map<string, string>>(new Map()); // id → nombre

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

const segmentos = ref<Segmento[]>([]);
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
  cargando.value = true;
  try {
    if (canManage.value) {
      await calcularDiagnostico();
      segmentos.value = await segmentoStore.cargarSegmentosManager(
        ubicacionId.value, fechaInicio.value, fechaFin.value
      );
    } else if (miEmpleadoId.value) {
      segmentos.value = await segmentoStore.cargarSegmentosEmpleado(
        miEmpleadoId.value, fechaInicio.value, fechaFin.value
      );
    }
  } finally {
    cargando.value = false;
  }
}

// ── Grilla ────────────────────────────────────────────────────────────────────

function turnosDelDia(diaIdx: number): Turno[] {
  return turnosConfiguracion.value.filter(t => t.day_of_week === diasSemana[diaIdx]);
}

function segmentosDia(diaIdx: number): Segmento[] {
  return segmentos.value
    .filter(s => s.date === fechaDia(diaIdx))
    .sort((a, b) => a.start.localeCompare(b.start));
}

// Devuelve un segmento representante por empleado para el cupo N.
// El algoritmo escribe N buckets de 30 min por empleado por turno; aquí
// los colapsamos: un cupo = un empleado distinto. El representante es el
// primer bucket de ese empleado en el turno (para tener id, status, empleado_id).
function empleadosPorTurno(diaIdx: number, turno: Turno, estacionId: string): Segmento[] {
  const fecha = fechaDia(diaIdx);
  // Segmentos que solapan con el turno en esa estación
  const del_turno = segmentos.value.filter(s =>
    s.date === fecha &&
    s.estacion_id === estacionId &&
    s.status !== 'rechazado' &&
    s.start < turno.end_time && s.end > turno.start_time
  );
  // Un representante por empleado (el de menor start)
  const porEmpleado = new Map<string, Segmento>();
  for (const s of del_turno.sort((a, b) => a.start.localeCompare(b.start))) {
    if (!porEmpleado.has(s.empleado_id)) porEmpleado.set(s.empleado_id, s);
  }
  return [...porEmpleado.values()].sort((a, b) => a.empleado_id.localeCompare(b.empleado_id));
}

function segmentoParaCupo(diaIdx: number, turno: Turno, estacionId: string, cupoOffset: number): Segmento | undefined {
  return empleadosPorTurno(diaIdx, turno, estacionId)[cupoOffset];
}

const haySegmentosSugeridos = computed(() => segmentos.value.some(s => s.status === 'sugerido'));

function tieneTodosAprobados(diaIdx: number): boolean {
  const delDia = segmentosDia(diaIdx);
  return delDia.length > 0 && delDia.every(s => s.status === 'aprobado');
}

// ── Sidebar de asignación ─────────────────────────────────────────────────────

const sidebarAbierta = ref(true);
const sidebarSeg = ref<Segmento | null>(null);         // null si cupo vacío
const sidebarTurno = ref<Turno | null>(null);
const sidebarEstacionId = ref<string>('');
const sidebarFecha = ref<string>('');
const busquedaEmpleado = ref('');

interface EmpleadoSidebar {
  id: string;
  nombre: string;
  iniciales: string;
  estacionesNombre: string;
  disponible: boolean;   // si su disponibilidad cubre el horario del turno
}

const empleadosSidebar = ref<EmpleadoSidebar[]>([]);

const empleadosFiltrados = computed(() => {
  const q = busquedaEmpleado.value.toLowerCase().trim();
  if (!q) return empleadosSidebar.value;
  return empleadosSidebar.value.filter(e => e.nombre.toLowerCase().includes(q));
});

function abrirSidebar(seg: Segmento, turno: Turno, estacionId: string, fecha: string) {
  sidebarSeg.value = seg;
  sidebarTurno.value = turno;
  sidebarEstacionId.value = estacionId;
  sidebarFecha.value = fecha;
  busquedaEmpleado.value = '';
  sidebarAbierta.value = true;
  cargarEmpleadosSidebar(turno, estacionId, fecha);
}

function abrirSidebarVacio(turno: Turno, estacionId: string, fecha: string) {
  sidebarSeg.value = null;
  sidebarTurno.value = turno;
  sidebarEstacionId.value = estacionId;
  sidebarFecha.value = fecha;
  busquedaEmpleado.value = '';
  sidebarAbierta.value = true;
  cargarEmpleadosSidebar(turno, estacionId, fecha);
}

function cerrarSidebar() {
  sidebarAbierta.value = false;
  sidebarSeg.value = null;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMin(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generarBuckets30(start: string, end: string): { start: string; end: string }[] {
  const buckets: { start: string; end: string }[] = [];
  let cur = toMin(start);
  const fin = toMin(end);
  while (cur < fin) {
    const next = Math.min(cur + 30, fin);
    buckets.push({ start: fromMin(cur), end: fromMin(next) });
    cur = next;
  }
  return buckets;
}

function cargarEmpleadosSidebar(turno: Turno, estacionId: string, fecha: string) {
  const diasES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [y, mo, d] = fecha.split('-').map(Number);
  const diaSemana = diasES[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  const tStart = toMin(turno.start_time);
  const tEnd = toMin(turno.end_time);

  // IDs de empleados ya asignados en cualquier otro turno de este día (excluir el cupo actual)
  const yaAsignadosHoy = new Set(
    segmentos.value
      .filter(s =>
        s.date === fecha &&
        s.status !== 'rechazado' &&
        s.empleado_id !== sidebarSeg.value?.empleado_id  // el actual puede reasignarse a sí mismo
      )
      .map(s => s.empleado_id)
  );

  // Empleados con contrato en esta sucursal (ya en caché)
  // Primero los que tienen la estación requerida y disponibilidad, luego el resto
  const lista: EmpleadoSidebar[] = empleadosCache.value
    .filter(emp => !yaAsignadosHoy.has(emp.id))  // excluir ya ocupados en el día
    .map(emp => {
      const tieneEstacion = emp.estacion_ids.includes(estacionId);
      const ventanas: any[] = emp.disponibilidad?.ventanas ?? [];
      const disponible = ventanas.some((v: any) =>
        v.day_of_week === diaSemana &&
        toMin(v.start) <= tStart && toMin(v.end) >= tEnd
      );
      const estacionesNombre = emp.estacion_ids
        .map(id => nombreEstacion(id))
        .filter(Boolean)
        .join(', ');
      return { id: emp.id, nombre: emp.nombre, iniciales: emp.iniciales, estacionesNombre, disponible: tieneEstacion && disponible };
    });

  // Ordenar: asignado primero, luego disponibles con estación, luego el resto
  lista.sort((a, b) => {
    const aEsAsignado = a.id === sidebarSeg.value?.empleado_id ? -1 : 0;
    const bEsAsignado = b.id === sidebarSeg.value?.empleado_id ? -1 : 0;
    if (aEsAsignado !== bEsAsignado) return aEsAsignado - bEsAsignado;
    return (b.disponible ? 1 : 0) - (a.disponible ? 1 : 0);
  });

  empleadosSidebar.value = lista;
}

// Devuelve todos los buckets de un empleado en un turno+estación+fecha
function bucketsDeTurno(empleadoId: string, turno: Turno, estacionId: string, fecha: string): Segmento[] {
  return segmentos.value.filter(s =>
    s.date === fecha &&
    s.empleado_id === empleadoId &&
    s.estacion_id === estacionId &&
    s.start < turno.end_time && s.end > turno.start_time
  );
}

async function aprobarDesideSidebar() {
  if (!sidebarSeg.value || !sidebarTurno.value) return;
  accionando.value = true;
  try {
    // Aprobar todos los buckets de este empleado en este turno
    const buckets = bucketsDeTurno(
      sidebarSeg.value.empleado_id,
      sidebarTurno.value,
      sidebarEstacionId.value,
      sidebarFecha.value
    );
    await Promise.all(buckets.map(s => segmentoStore.aprobarSegmento(s.id)));
    buckets.forEach(s => { s.status = 'aprobado'; });
    sidebarSeg.value = { ...sidebarSeg.value, status: 'aprobado' };
  } finally {
    accionando.value = false;
  }
}

async function reasignar(nuevoEmpleadoId: string) {
  if (!sidebarTurno.value || !sidebarFecha.value) return;
  // Click en el empleado ya asignado → deseleccionar (eliminar segmentos del turno)
  if (nuevoEmpleadoId === sidebarSeg.value?.empleado_id && sidebarSeg.value) {
    accionando.value = true;
    try {
      const buckets = bucketsDeTurno(
        sidebarSeg.value.empleado_id,
        sidebarTurno.value,
        sidebarEstacionId.value,
        sidebarFecha.value
      );
      await Promise.all(buckets.map(s =>
        updateDoc(fsDoc(db, 'segmentos', s.id), {
          active: false,
          deletedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      ));
      segmentos.value = segmentos.value.filter(s => !buckets.some(b => b.id === s.id));
      sidebarSeg.value = null;
      cargarEmpleadosSidebar(sidebarTurno.value, sidebarEstacionId.value, sidebarFecha.value);
    } finally {
      accionando.value = false;
    }
    return;
  }
  accionando.value = true;
  try {
    if (sidebarSeg.value) {
      // Actualizar TODOS los buckets del empleado actual en este turno
      const buckets = bucketsDeTurno(
        sidebarSeg.value.empleado_id,
        sidebarTurno.value,
        sidebarEstacionId.value,
        sidebarFecha.value
      );
      await Promise.all(buckets.map(s =>
        updateDoc(fsDoc(db, 'segmentos', s.id), {
          empleado_id: nuevoEmpleadoId,
          status: 'sugerido',
          updatedAt: Timestamp.now(),
        })
      ));
      // Actualizar estado local
      buckets.forEach(s => {
        s.empleado_id = nuevoEmpleadoId;
        s.status = 'sugerido';
      });
      sidebarSeg.value = { ...sidebarSeg.value, empleado_id: nuevoEmpleadoId, status: 'sugerido' };
    } else {
      // Cupo vacío: generar buckets de 30 min para el turno completo
      let asignacionId = segmentos.value.find(s =>
        s.date === sidebarFecha.value && s.ubicacion_id === ubicacionId.value
      )?.asignacion_id ?? '';

      if (!asignacionId) {
        const aRef = await addDoc(collection(db, 'asignaciones'), {
          empresa_id: companyId.value,
          ubicacion_id: ubicacionId.value,
          date: sidebarFecha.value,
          status: 'draft',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          deletedAt: null,
        });
        asignacionId = aRef.id;
      }

      // Crear buckets de 30 min igual que el algoritmo
      const buckets = generarBuckets30(sidebarTurno.value.start_time, sidebarTurno.value.end_time);
      const primeroRef = await addDoc(collection(db, 'segmentos'), {
        empresa_id: companyId.value,
        ubicacion_id: ubicacionId.value,
        empleado_id: nuevoEmpleadoId,
        date: sidebarFecha.value,
        estacion_id: sidebarEstacionId.value,
        tipo: 'estacion',
        start: buckets[0].start,
        end: buckets[0].end,
        asignacion_id: asignacionId,
        status: 'sugerido',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        deletedAt: null,
      });
      await Promise.all(buckets.slice(1).map(b =>
        addDoc(collection(db, 'segmentos'), {
          empresa_id: companyId.value,
          ubicacion_id: ubicacionId.value,
          empleado_id: nuevoEmpleadoId,
          date: sidebarFecha.value,
          estacion_id: sidebarEstacionId.value,
          tipo: 'estacion',
          start: b.start,
          end: b.end,
          asignacion_id: asignacionId,
          status: 'sugerido',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          deletedAt: null,
        })
      ));

      // Recargar y apuntar al representante
      segmentos.value = await segmentoStore.cargarSegmentosManager(
        ubicacionId.value, fechaInicio.value, fechaFin.value
      );
      const nuevo = segmentos.value.find(s => s.id === primeroRef.id);
      if (nuevo) sidebarSeg.value = nuevo;
    }
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

function claseSeg(status: SegmentoStatus): string {
  switch (status) {
    case 'sugerido':  return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
    case 'aprobado':  return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
    case 'rechazado': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500 line-through opacity-60';
    case 'publicado': return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300';
    default:          return 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 text-gray-500';
  }
}

function claseChipStatus(status: SegmentoStatus): string {
  switch (status) {
    case 'sugerido':  return 'text-amber-600 dark:text-amber-400';
    case 'aprobado':  return 'text-emerald-600 dark:text-emerald-400';
    case 'rechazado': return 'text-red-500 dark:text-red-400';
    case 'publicado': return 'text-violet-600 dark:text-violet-400';
    default:          return 'text-gray-400';
  }
}

function labelStatus(status: SegmentoStatus): string {
  const map: Record<string, string> = { sugerido: 'Sugerido', aprobado: 'Aprobado', rechazado: 'Rechazado', publicado: 'Publicado' };
  return map[status] ?? status;
}

// ── CF ────────────────────────────────────────────────────────────────────────

const actualizarBorradorFn = httpsCallable(functions, 'actualizarBorrador', { timeout: 120000 });

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
const panelAbierto = ref(true);
const errorBorrador = ref('');

const diagnosticoListo = computed(() =>
  !!diagnostico.value &&
  diagnostico.value.tieneTurnos &&
  diagnostico.value.tieneEstaciones &&
  diagnostico.value.turnosTienenRequerimientos &&
  diagnostico.value.tieneEmpleadosConContrato &&
  diagnostico.value.detalleEmpleados.every(e => e.listo)
);

const problemasTotal = computed(() => {
  if (!diagnostico.value) return 0;
  let n = 0;
  if (!diagnostico.value.tieneTurnos) n++;
  if (!diagnostico.value.tieneEstaciones) n++;
  if (!diagnostico.value.turnosTienenRequerimientos) n++;
  if (!diagnostico.value.tieneEmpleadosConContrato) n++;
  n += diagnostico.value.detalleEmpleados.filter(e => !e.listo).length;
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
      (t.requerimientos ?? []).some((r: any) => r.estacion_id && r.cantidad > 0)
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

    // Poblar caché de estaciones (id → nombre) para que el template no dependa del store reactivo
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

    // Hidratar contactos en paralelo
    await Promise.all(todos.map(async emp => {
      if (!emp.contacto && emp.contact_id) {
        try {
          const cSnap = await getDoc(fsDoc(db, 'contactos', emp.contact_id).withConverter(contactoConverter));
          if (cSnap.exists()) emp.contacto = cSnap.data();
        } catch { /* degraded */ }
      }
    }));

    // Poblar caché de empleados (todos los de la empresa, para la sidebar)
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
    if (canManage.value) {
      await calcularDiagnostico();
      segmentos.value = await segmentoStore.cargarSegmentosManager(
        ubicacionId.value, fechaInicio.value, fechaFin.value
      );
      if (diagnostico.value?.tieneTurnos && diagnostico.value?.tieneEmpleadosConContrato) {
        generandoBorrador.value = true;
        try {
          await actualizarBorradorFn({
            empresa_id: companyId.value,
            ubicacion_id: ubicacionId.value,
            week_start: hoy(),
            dias: 28,
          });
          segmentos.value = await segmentoStore.cargarSegmentosManager(
            ubicacionId.value, fechaInicio.value, fechaFin.value
          );
        } catch (err: any) {
          errorBorrador.value = err?.message ?? String(err);
        } finally {
          generandoBorrador.value = false;
        }
      }
    } else {
      if (!miEmpleadoId.value) return;
      segmentos.value = await segmentoStore.cargarSegmentosEmpleado(
        miEmpleadoId.value, fechaInicio.value, fechaFin.value
      );
    }
  } finally {
    cargando.value = false;
  }
}

// ── Acciones ──────────────────────────────────────────────────────────────────

// Elimina segmentos duplicados sugeridos: si el mismo empleado aparece en más de un
// turno el mismo día, conserva el turno con start más temprano y borra los demás.
// Opera sobre segmentos.value en memoria y los sincroniza con Firestore.
async function limpiarDuplicadosSugeridos(fechasFiltro?: Set<string>) {
  // Agrupar sugeridos por (date, empleado_id) → lista de buckets
  const porDiaEmpleado = new Map<string, Segmento[]>();
  for (const s of segmentos.value) {
    if (s.status !== 'sugerido' && s.status !== ('draft' as any)) continue;
    if (fechasFiltro && !fechasFiltro.has(s.date)) continue;
    const key = `${s.date}__${s.empleado_id}`;
    const arr = porDiaEmpleado.get(key) ?? [];
    arr.push(s);
    porDiaEmpleado.set(key, arr);
  }

  const aBorrar: Segmento[] = [];
  porDiaEmpleado.forEach((segs) => {
    if (segs.length <= 1) return;
    // Identificar los turnos distintos: agrupamos buckets por rango contiguo (mismo turno)
    // Un "turno" = grupo de buckets donde cada uno empieza donde termina el anterior.
    segs.sort((a, b) => a.start.localeCompare(b.start));
    // Detectar cambios de turno: hay un salto si el start del siguiente != end del anterior
    const turnos: Segmento[][] = [];
    let grupoActual: Segmento[] = [segs[0]];
    for (let i = 1; i < segs.length; i++) {
      const prev = segs[i - 1];
      const curr = segs[i];
      // Si el bucket actual empieza exactamente donde terminó el anterior → mismo turno
      if (curr.start === prev.end) {
        grupoActual.push(curr);
      } else {
        turnos.push(grupoActual);
        grupoActual = [curr];
      }
    }
    turnos.push(grupoActual);
    if (turnos.length <= 1) return; // solo 1 turno, sin duplicado
    // Conservar el primer turno (menor start), borrar los demás
    for (let t = 1; t < turnos.length; t++) aBorrar.push(...turnos[t]);
  });

  if (!aBorrar.length) return;

  // Borrar en Firestore
  await Promise.all(aBorrar.map(s =>
    updateDoc(fsDoc(db, 'segmentos', s.id), {
      active: false,
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  ));
  // Eliminar del estado local
  const idsBorrados = new Set(aBorrar.map(s => s.id));
  segmentos.value = segmentos.value.filter(s => !idsBorrados.has(s.id));
}

// Aprobar el cupo completo: busca todos los buckets del mismo empleado+estación+turno
async function aprobar(segRepresentanteId: string) {
  accionando.value = true;
  try {
    const rep = segmentos.value.find(s => s.id === segRepresentanteId);
    if (!rep) return;
    // Limpiar duplicados sugeridos del mismo día antes de aprobar
    await limpiarDuplicadosSugeridos(new Set([rep.date]));
    // Todos los buckets de este empleado en esta estación y fecha que se solapen
    const todos = segmentos.value.filter(s =>
      s.date === rep.date &&
      s.empleado_id === rep.empleado_id &&
      s.estacion_id === rep.estacion_id &&
      s.status === 'sugerido'
    );
    await Promise.all(todos.map(s => segmentoStore.aprobarSegmento(s.id)));
    todos.forEach(s => { s.status = 'aprobado'; });
  } finally { accionando.value = false; }
}

async function aprobarTodo() {
  accionando.value = true;
  try {
    // Limpiar todos los duplicados sugeridos de la semana visible antes de aprobar
    await limpiarDuplicadosSugeridos();
    const sugeridos = segmentos.value.filter(s => s.status === 'sugerido');
    await Promise.all(sugeridos.map(s => segmentoStore.aprobarSegmento(s.id)));
    sugeridos.forEach(s => { s.status = 'aprobado'; });
  } finally { accionando.value = false; }
}

async function publicarDia(diaIdx: number) {
  if (!ubicacionId.value) return;
  const fecha = fechaDia(diaIdx);
  accionando.value = true;
  try {
    await segmentoStore.publicarDia(ubicacionId.value, fecha);
    segmentos.value
      .filter(s => s.date === fecha && s.status === 'aprobado')
      .forEach(s => { s.status = 'publicado'; });
  } finally { accionando.value = false; }
}

// ── Montaje ───────────────────────────────────────────────────────────────────

onMounted(async () => {
  miEmpleadoId.value = await resolverMiEmpleadoId();
  // Esperar a que SucursalLayout resuelva activeUbicacionId antes de cargar.
  // Si ya está disponible, cargar de inmediato; si no, observar hasta que llegue.
  if (sessionStore.activeUbicacionId) {
    await cargar();
  } else {
    const stop = watch(
      () => sessionStore.activeUbicacionId,
      async (val) => { if (val) { stop(); await cargar(); } }
    );
  }
});
</script>
