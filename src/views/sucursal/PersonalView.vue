<template>
  <div class="h-full min-h-0 overflow-y-auto">
  <div class="p-4 sm:p-6 space-y-6">

    <!-- Encabezado -->
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personal</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ empleadosActivos.length }} miembro{{ empleadosActivos.length !== 1 ? 's' : '' }} activo{{ empleadosActivos.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        @click="abrirModalCrear"
        class="shrink-0 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        + Agregar
      </button>
    </div>

    <!-- Barra de búsqueda y filtro -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre o RUT..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        v-model="filtroHabilidad"
        class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todas las habilidades</option>
        <option v-for="h in habilidadesActivas" :key="h.id" :value="h.id">{{ h.nombre }}</option>
      </select>
    </div>

    <!-- Estado vacío -->
    <div v-if="empleadosFiltrados.length === 0 && empleadosActivos.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor"
        class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
        {{ busqueda || filtroHabilidad ? 'Sin resultados para la búsqueda.' : 'No hay personal registrado aún.' }}
      </p>
      <button v-if="!busqueda && !filtroHabilidad" @click="abrirModalCrear"
        class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
        Agregar el primero
      </button>
    </div>

    <!-- Lista / Tabla -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">

      <!-- Tabla md+ -->
      <table class="hidden md:table w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
          <tr>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Miembro</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Habilidades</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Contacto</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <tr v-for="emp in empleadosFiltrados" :key="emp.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <span class="text-xs font-bold text-blue-600 dark:text-blue-300">{{ emp.initials }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ emp.displayName }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ emp.contacto?.rut || '—' }}</p>
                </div>
              </div>
            </td>
            <td class="px-5 py-3">
              <div class="flex flex-wrap gap-1">
                <span v-for="hId in emp.skill_ids" :key="hId"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  {{ habilidadNombre(hId) }}
                </span>
                <span v-if="!emp.skill_ids.length" class="text-xs text-gray-400 dark:text-gray-500">—</span>
              </div>
            </td>
            <td class="px-5 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400">
              <p class="truncate">{{ emp.contacto?.email || '—' }}</p>
              <p class="text-xs">{{ emp.contacto?.phone || '' }}</p>
            </td>
            <td class="px-5 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="emp.active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'">
                {{ emp.active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-5 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button @click="abrirModalAsignar(emp)"
                  title="Asignar a ubicación"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </button>
                <button @click="abrirModalEditar(emp)"
                  title="Editar"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Cards móvil -->
      <ul class="md:hidden divide-y divide-gray-50 dark:divide-gray-700/50">
        <li v-for="emp in empleadosFiltrados" :key="emp.id" class="px-4 py-3 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <span class="text-sm font-bold text-blue-600 dark:text-blue-300">{{ emp.initials }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ emp.displayName }}</p>
            <div class="flex flex-wrap gap-1 mt-0.5">
              <span v-for="hId in emp.skill_ids.slice(0, 2)" :key="hId"
                class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {{ habilidadNombre(hId) }}
              </span>
              <span v-if="emp.skill_ids.length > 2" class="text-[10px] text-gray-400">+{{ emp.skill_ids.length - 2 }}</span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              :class="emp.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'">
              {{ emp.active ? 'Activo' : 'Inactivo' }}
            </span>
            <div class="flex gap-1">
              <button @click="abrirModalAsignar(emp)" class="p-1 rounded text-gray-400 hover:text-emerald-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </button>
              <button @click="abrirModalEditar(emp)" class="p-1 rounded text-gray-400 hover:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- ===================== MODAL CREAR/EDITAR ===================== -->
    <Transition name="modal">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModal" />
        <div class="relative w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">

          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ modoEdicion ? 'Editar miembro' : 'Agregar miembro' }}
            </h3>
            <button @click="cerrarModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="guardar" class="p-5 space-y-4">

            <!-- PASO 1: RUT (solo creación) -->
            <div v-if="!modoEdicion" class="space-y-3">
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
                <p v-if="rutShowError" class="mt-1 text-xs text-red-500">RUT inválido. Verifica el dígito verificador.</p>
              </div>

              <div v-if="alertaPersonalDuplicado"
                class="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-red-500 shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div class="text-sm">
                  <p class="font-semibold text-red-700 dark:text-red-400">Ya es personal de esta empresa</p>
                  <p class="text-red-600 dark:text-red-300 text-xs mt-0.5">{{ contactoEncontrado?.first_name }} {{ contactoEncontrado?.last_name }} ya está registrado como personal.</p>
                </div>
              </div>

              <div v-else-if="alertaUsuarioMismaEmpresa"
                class="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div class="text-sm">
                  <p class="font-semibold text-amber-700 dark:text-amber-400">Este RUT ya tiene un usuario en la empresa</p>
                  <p class="text-amber-600 dark:text-amber-300 text-xs mt-0.5">Se usará el mismo contacto.</p>
                </div>
              </div>

              <div v-else-if="alertaContactoOtraEmpresa"
                class="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <div class="text-sm">
                  <p class="font-semibold text-blue-700 dark:text-blue-400">Contacto existente encontrado</p>
                  <p class="text-blue-600 dark:text-blue-300 text-xs mt-0.5">Se vinculará {{ contactoEncontrado?.first_name }} {{ contactoEncontrado?.last_name }} a esta empresa.</p>
                </div>
              </div>
            </div>

            <!-- CAMPOS -->
            <template v-if="modoEdicion || rutIsValid">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span class="text-red-500">*</span></label>
                  <input v-model="form.first_name" type="text" required placeholder="Juan"
                    :disabled="!!contactoEncontrado && !modoEdicion"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido <span class="text-red-500">*</span></label>
                  <input v-model="form.last_name" type="text" required placeholder="Pérez"
                    :disabled="!!contactoEncontrado && !modoEdicion"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-if="modoEdicion">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">RUT</label>
                  <input v-model="form.rut" type="text" disabled
                    class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input v-model="form.phone" type="tel" placeholder="+56 9 1234 5678"
                    :disabled="!!contactoEncontrado && !modoEdicion"
                    class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input v-model="form.email" type="email" placeholder="juan@email.com"
                  :disabled="!!contactoEncontrado && !modoEdicion"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
              </div>

              <!-- Habilidades (multi-chip toggle) -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Habilidades / Experiencia
                </label>
                <div v-if="habilidadesActivas.length" class="flex flex-wrap gap-2">
                  <button v-for="h in habilidadesActivas" :key="h.id" type="button"
                    @click="toggleHabilidad(h.id)"
                    class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    :class="form.skill_ids.includes(h.id)
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-violet-400'">
                    {{ h.nombre }}
                  </button>
                </div>
                <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
                  Sin habilidades definidas. Agrega algunas en Ajustes → Habilidades.
                </p>
              </div>

              <!-- Asignación a ubicación (opcional, solo creación) -->
              <div v-if="!modoEdicion">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ubicación <span class="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select v-model="form.ubicacion_id"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin asignación</option>
                  <option v-for="ub in ubicacionesActivas" :key="ub.id" :value="ub.id">
                    {{ ub.name }}<template v-if="ub.category"> ({{ ub.category }})</template>
                  </option>
                </select>
              </div>

              <div v-if="modoEdicion" class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Miembro activo</span>
                <button type="button" @click="form.active = !form.active"
                  class="relative w-10 h-5 rounded-full transition-colors duration-300"
                  :class="form.active ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                    :class="form.active ? 'translate-x-5' : 'translate-x-0'" />
                </button>
              </div>
            </template>

            <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="cerrarModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button
                v-if="modoEdicion || rutIsValid"
                type="submit"
                :disabled="guardando || alertaPersonalDuplicado"
                class="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                :class="alertaPersonalDuplicado ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'"
              >
                {{ guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Agregar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ===================== MODAL ASIGNAR A UBICACIÓN ===================== -->
    <Transition name="modal">
      <div v-if="modalAsignarOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModalAsignar" />
        <div class="relative w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85dvh] overflow-y-auto">

          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Asignar ubicación</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ empleadoAsignar?.displayName }}</p>
            </div>
            <button @click="cerrarModalAsignar" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-5 space-y-4">

            <!-- Tabs -->
            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
              <button
                v-for="tab in [{ id: 'ubicacion', label: 'Ubicación' }, { id: 'habilidades', label: 'Habilidades' }]"
                :key="tab.id"
                type="button"
                @click="asignarTab = tab.id as 'ubicacion' | 'habilidades'"
                class="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                :class="asignarTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab: Ubicación -->
            <template v-if="asignarTab === 'ubicacion'">
              <div class="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-blue-500 shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  Asignar como encargado de una o más ubicaciones. Esto también permite transferirlo entre zonas.
                </p>
              </div>

              <div v-if="ubicacionesActivas.length === 0" class="text-center py-6">
                <p class="text-sm text-gray-500 dark:text-gray-400">No hay ubicaciones activas disponibles.</p>
              </div>

              <ul v-else class="space-y-2">
                <li v-for="ub in ubicacionesActivas" :key="ub.id"
                  class="flex items-start gap-3 p-3 rounded-lg border transition-colors"
                  :class="asignacionSeleccionada[ub.id]
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'">
                  <input
                    type="checkbox"
                    :id="`ub-${ub.id}`"
                    v-model="asignacionSeleccionada[ub.id]"
                    class="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div class="flex-1 min-w-0">
                    <label :for="`ub-${ub.id}`" class="cursor-pointer">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ ub.name }}</p>
                      <p v-if="ub.address" class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ ub.address }}</p>
                      <span class="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 capitalize">
                        {{ ub.category }}
                      </span>
                    </label>
                  </div>
                </li>
              </ul>
            </template>

            <!-- Tab: Habilidades -->
            <template v-else>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Selecciona las habilidades y experiencia de <strong>{{ empleadoAsignar?.displayName }}</strong>.
              </p>
              <div v-if="habilidadesActivas.length" class="flex flex-wrap gap-2">
                <button v-for="h in habilidadesActivas" :key="h.id" type="button"
                  @click="toggleAsignarHabilidad(h.id)"
                  class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  :class="asignarSkillIds.includes(h.id)
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-violet-400'">
                  {{ h.nombre }}
                </button>
              </div>
              <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
                Sin habilidades definidas. Agrega en Ajustes → Habilidades.
              </p>
            </template>

            <p v-if="errorAsignar" class="text-xs text-red-500">{{ errorAsignar }}</p>

            <div class="flex gap-3 pt-1">
              <button type="button" @click="cerrarModalAsignar"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button @click="guardarAsignacion" :disabled="guardandoAsignacion"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
                {{ guardandoAsignacion ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
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
import { useHabilidadStore } from '../../stores/habilidadStore';
import { useRut } from '../../composables/useRut';
import { db } from '../../firebase';
import { contactoConverter, Contacto } from '../../models/Contacto';
import type { Empleado } from '../../models/Empleado';

const route = useRoute();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();
const empleadoStore = useEmpleadoStore();
const ubicacionStore = useUbicacionStore();
const habilidadStore = useHabilidadStore();

const activeCompanyId = computed(() => {
  if (sessionStore.userRole !== 'super_admin') return sessionStore.activeCompanyId;
  const slug = route.params.companySlug as string;
  return empresaStore.empresas?.find(e => e.slug === slug)?.id ?? null;
});

onMounted(() => {
  if (activeCompanyId.value) {
    empleadoStore.listarEmpleados(activeCompanyId.value);
    ubicacionStore.listarUbicaciones(activeCompanyId.value);
    habilidadStore.listarHabilidades(activeCompanyId.value);
  }
});

// ── Habilidades ────────────────────────────────────────────────────────────────

const habilidadesActivas = computed(() => habilidadStore.habilidadesActivas);

function habilidadNombre(id: string): string {
  return habilidadesActivas.value.find(h => h.id === id)?.nombre ?? id;
}

// ── Lista y filtros ────────────────────────────────────────────────────────────

const busqueda = ref('');
const filtroHabilidad = ref('');

const empleadosActivos = computed(() => empleadoStore.empleadosActivos);

const ubicacionesActivas = computed(() =>
  (ubicacionStore.ubicaciones ?? []).filter(u => u.active)
);

const empleadosFiltrados = computed(() => {
  let lista = empleadoStore.empleados ?? [];
  if (filtroHabilidad.value) lista = lista.filter(e => e.skill_ids.includes(filtroHabilidad.value));
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase();
    lista = lista.filter(e =>
      e.displayName.toLowerCase().includes(q) ||
      (e.contacto?.rut ?? '').toLowerCase().includes(q)
    );
  }
  return lista;
});

// ── Modal crear/editar ─────────────────────────────────────────────────────────

const modalOpen = ref(false);
const modoEdicion = ref(false);
const empleadoSeleccionado = ref<Empleado | null>(null);
const guardando = ref(false);
const error = ref('');

const { rut, isValid: rutIsValid, showError: rutShowError, onInput: onRutInput, onBlur: rutBlur, setRut } = useRut();

const buscandoRut = ref(false);
const contactoEncontrado = ref<Contacto | null>(null);
const alertaPersonalDuplicado = ref(false);
const alertaUsuarioMismaEmpresa = ref(false);
const alertaContactoOtraEmpresa = ref(false);

function resetVerificacion() {
  contactoEncontrado.value = null;
  alertaPersonalDuplicado.value = false;
  alertaUsuarioMismaEmpresa.value = false;
  alertaContactoOtraEmpresa.value = false;
}

watch(rutIsValid, async (valido) => {
  if (!valido || modoEdicion.value) { resetVerificacion(); return; }
  buscandoRut.value = true;
  resetVerificacion();
  try {
    const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
    const snap = await getDocs(query(contactosRef,
      where('rut', '==', rut.value.toUpperCase()),
      where('deletedAt', '==', null)
    ));
    if (snap.empty) { form.value.rut = rut.value.toUpperCase(); return; }

    const contacto = snap.docs[0].data();
    contactoEncontrado.value = contacto;
    form.value = { ...form.value, first_name: contacto.first_name, last_name: contacto.last_name, rut: contacto.rut, email: contacto.email, phone: contacto.phone };

    const empSnap = await getDocs(query(collection(db, 'empleados'),
      where('contact_id', '==', contacto.id),
      where('company_id', '==', activeCompanyId.value),
      where('deletedAt', '==', null)
    ));
    if (!empSnap.empty) { alertaPersonalDuplicado.value = true; return; }

    const usuSnap = await getDocs(query(collection(db, 'usuarios'),
      where('contact_id', '==', contacto.id),
      where('empresa_id', '==', activeCompanyId.value),
      where('deletedAt', '==', null)
    ));
    if (!usuSnap.empty) { alertaUsuarioMismaEmpresa.value = true; return; }

    alertaContactoOtraEmpresa.value = true;
  } catch (e) {
    console.error('Error verificando RUT:', e);
  } finally {
    buscandoRut.value = false;
  }
});

function onRutBlur() { rutBlur(); }

const formVacio = () => ({
  first_name: '',
  last_name: '',
  rut: '',
  email: '',
  phone: '',
  skill_ids: [] as string[],
  active: true,
  ubicacion_id: '',
});

const form = ref(formVacio());

function toggleHabilidad(id: string) {
  const idx = form.value.skill_ids.indexOf(id);
  if (idx === -1) form.value.skill_ids.push(id);
  else form.value.skill_ids.splice(idx, 1);
}

function abrirModalCrear() {
  form.value = formVacio();
  modoEdicion.value = false;
  empleadoSeleccionado.value = null;
  error.value = '';
  setRut('');
  resetVerificacion();
  modalOpen.value = true;
}

function abrirModalEditar(emp: Empleado) {
  form.value = {
    first_name: emp.contacto?.first_name ?? '',
    last_name: emp.contacto?.last_name ?? '',
    rut: emp.contacto?.rut ?? '',
    email: emp.contacto?.email ?? '',
    phone: emp.contacto?.phone ?? '',
    skill_ids: [...emp.skill_ids],
    active: emp.active,
    ubicacion_id: '',
  };
  modoEdicion.value = true;
  empleadoSeleccionado.value = emp;
  error.value = '';
  resetVerificacion();
  modalOpen.value = true;
}

function cerrarModal() { modalOpen.value = false; }

async function guardar() {
  if (!activeCompanyId.value || alertaPersonalDuplicado.value) return;
  error.value = '';
  guardando.value = true;
  try {
    if (modoEdicion.value && empleadoSeleccionado.value) {
      await updateDoc(doc(db, 'contactos', empleadoSeleccionado.value.contact_id), {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        email: form.value.email,
        phone: form.value.phone,
        updatedAt: Timestamp.now(),
      });
      await empleadoStore.updateEmpleado(empleadoSeleccionado.value.id, {
        skill_ids: form.value.skill_ids,
        active: form.value.active,
      });

    } else if (contactoEncontrado.value) {
      const empleadoId = await empleadoStore.createEmpleado({
        company_id: activeCompanyId.value,
        contact_id: contactoEncontrado.value.id,
        active: true,
        skill_ids: form.value.skill_ids,
        contratos: [],
        disponibilidad: null,
      });
      if (form.value.ubicacion_id && empleadoId) {
        await ubicacionStore.updateUbicacion(form.value.ubicacion_id, { manager_id: empleadoId });
      }

    } else {
      const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
      const newContactoRef = doc(contactosRef);
      await setDoc(newContactoRef, new Contacto(
        newContactoRef.id, form.value.first_name, form.value.last_name,
        rut.value.toUpperCase(), form.value.email, form.value.phone, '', false, true
      ));
      const empleadoId = await empleadoStore.createEmpleado({
        company_id: activeCompanyId.value,
        contact_id: newContactoRef.id,
        active: true,
        skill_ids: form.value.skill_ids,
        contratos: [],
        disponibilidad: null,
      });
      if (form.value.ubicacion_id && empleadoId) {
        await ubicacionStore.updateUbicacion(form.value.ubicacion_id, { manager_id: empleadoId });
      }
    }
    cerrarModal();
  } catch (e: any) {
    error.value = e.message || 'Error al guardar.';
  } finally {
    guardando.value = false;
  }
}

// ── Modal asignar a ubicación ──────────────────────────────────────────────────

const modalAsignarOpen = ref(false);
const empleadoAsignar = ref<Empleado | null>(null);
const asignacionSeleccionada = reactive<Record<string, boolean>>({});
const asignarSkillIds = ref<string[]>([]);
const asignarTab = ref<'ubicacion' | 'habilidades'>('ubicacion');
const guardandoAsignacion = ref(false);
const errorAsignar = ref('');

function toggleAsignarHabilidad(id: string) {
  const idx = asignarSkillIds.value.indexOf(id);
  if (idx === -1) asignarSkillIds.value.push(id);
  else asignarSkillIds.value.splice(idx, 1);
}

async function abrirModalAsignar(emp: Empleado) {
  empleadoAsignar.value = emp;
  errorAsignar.value = '';
  asignarTab.value = 'ubicacion';
  asignarSkillIds.value = [...emp.skill_ids];

  for (const key of Object.keys(asignacionSeleccionada)) delete asignacionSeleccionada[key];
  for (const ub of ubicacionesActivas.value) {
    asignacionSeleccionada[ub.id] = ub.manager_id === emp.id;
  }
  modalAsignarOpen.value = true;
}

function cerrarModalAsignar() {
  modalAsignarOpen.value = false;
  empleadoAsignar.value = null;
}

async function guardarAsignacion() {
  if (!empleadoAsignar.value) return;
  guardandoAsignacion.value = true;
  errorAsignar.value = '';
  try {
    // Actualizar encargado en ubicaciones
    for (const ub of ubicacionesActivas.value) {
      const seleccionado = asignacionSeleccionada[ub.id];
      const eraManager = ub.manager_id === empleadoAsignar.value!.id;
      if (seleccionado && !eraManager) {
        await ubicacionStore.updateUbicacion(ub.id, { manager_id: empleadoAsignar.value!.id });
      } else if (!seleccionado && eraManager) {
        await ubicacionStore.updateUbicacion(ub.id, { manager_id: null });
      }
    }
    // Actualizar habilidades del empleado
    await empleadoStore.updateEmpleado(empleadoAsignar.value!.id, { skill_ids: asignarSkillIds.value });
    cerrarModalAsignar();
  } catch (e: any) {
    errorAsignar.value = e.message || 'Error al guardar la asignación.';
  } finally {
    guardandoAsignacion.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
