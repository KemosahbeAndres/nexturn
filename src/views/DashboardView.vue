<template>
  <div class="space-y-8">
    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Resumen general</h2>

    <!-- Tarjetas de conteo rápido -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-1">
        <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ empresaStore.empresasTipo.length }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Empresas</span>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-1">
        <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ empresaStore.congregaciones.length }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Congregaciones</span>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-1">
        <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ sesionesStore.sesiones.length }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Sesiones activas</span>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-1">
        <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalTenants }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total tenants</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Sesiones activas -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800 dark:text-white text-sm">Sesiones activas ahora</h3>
          <span class="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            En vivo
          </span>
        </div>

        <div v-if="sesionesStore.sesiones.length === 0" class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No hay sesiones activas en este momento.
        </div>

        <ul v-else class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <li
            v-for="sesion in sesionesRecientes"
            :key="sesion.id"
            class="px-5 py-3 flex items-center gap-3"
          >
            <!-- Avatar inicial -->
            <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                {{ iniciales(sesion.usuario) }}
              </span>
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-white truncate">
                {{ nombreUsuario(sesion.usuario) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 truncate">
                {{ rolLabel(sesion.usuario?.system_role) }}
                <span class="mx-1">·</span>
                {{ navegador(sesion.browser_agent) }}
              </p>
            </div>

            <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
              {{ tiempoDesde(sesion.createdAt) }}
            </span>
          </li>
        </ul>

        <div v-if="sesionesStore.sesiones.length > 5" class="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700/50 text-right">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            +{{ sesionesStore.sesiones.length - 5 }} más
          </span>
        </div>
      </div>

      <!-- Resumen de empresas -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800 dark:text-white text-sm">Tenants registrados</h3>
          <a href="/empresas" class="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors">
            Ver todos
          </a>
        </div>

        <div v-if="empresaStore.empresas.length === 0" class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No hay empresas registradas aún.
        </div>

        <ul v-else class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <li
            v-for="empresa in empresasRecientes"
            :key="empresa.id"
            class="px-5 py-3 flex items-center gap-3"
          >
            <!-- Icono tipo -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
              :class="empresa.isEmpresa
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300'"
            >
              {{ empresa.isEmpresa ? 'E' : 'C' }}
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-white truncate">
                {{ empresa.displayName }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ empresa.isEmpresa ? 'Empresa' : 'Congregación' }}
                <span class="mx-1">·</span>
                {{ empresa.cargos.length }} roles
              </p>
            </div>

            <span
              class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="empresa.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'"
            >
              {{ empresa.active ? 'Activa' : 'Inactiva' }}
            </span>
          </li>
        </ul>

        <div v-if="empresaStore.empresas.length > 5" class="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700/50 text-right">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            +{{ empresaStore.empresas.length - 5 }} más
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmpresaStore } from '../stores/empresaStore';
import { useSesionesActivasStore } from '../stores/sesionesActivasStore';
import type { Usuario } from '../models/Usuario';

const empresaStore = useEmpresaStore();
const sesionesStore = useSesionesActivasStore();

onMounted(() => {
  empresaStore.listarEmpresas('super_admin');
  sesionesStore.activar();
});

const totalTenants = computed(() => empresaStore.empresas.length);
const sesionesRecientes = computed(() => sesionesStore.sesiones.slice(0, 5));
const empresasRecientes = computed(() => empresaStore.empresas.slice(0, 5));

function nombreUsuario(usuario?: Usuario): string {
  if (!usuario?.contacto) return 'Usuario desconocido';
  return `${usuario.contacto.first_name} ${usuario.contacto.last_name}`.trim();
}

function iniciales(usuario?: Usuario): string {
  if (!usuario?.contacto) return '?';
  const fn = usuario.contacto.first_name?.[0] ?? '';
  const ln = usuario.contacto.last_name?.[0] ?? '';
  return (fn + ln).toUpperCase() || '?';
}

function rolLabel(role?: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'Usuario',
    visitor: 'Visitante',
  };
  return labels[role ?? ''] ?? role ?? 'Sin rol';
}

function navegador(agent: string): string {
  if (!agent) return 'Desconocido';
  if (agent.includes('Chrome') && !agent.includes('Edg')) return 'Chrome';
  if (agent.includes('Firefox')) return 'Firefox';
  if (agent.includes('Safari') && !agent.includes('Chrome')) return 'Safari';
  if (agent.includes('Edg')) return 'Edge';
  return 'Otro';
}

function tiempoDesde(fecha: Date): string {
  const ahora = Date.now();
  const diff = ahora - fecha.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  return `hace ${dias}d`;
}
</script>
