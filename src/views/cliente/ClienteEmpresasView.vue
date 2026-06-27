<template>
  <div class="space-y-6">

    <!-- Encabezado -->
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Mis Empresas</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Selecciona la empresa que quieres gestionar.</p>
    </div>

    <!-- Estado de carga -->
    <div v-if="cargando" class="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <svg class="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <span class="text-sm">Cargando empresas…</span>
    </div>

    <!-- Sin empresas -->
    <div v-else-if="empresas.length === 0" class="text-center py-16 text-gray-500 dark:text-gray-400">
      <p class="text-sm">No tienes empresas asignadas.</p>
    </div>

    <!-- Grilla de tarjetas -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <button
        v-for="empresa in empresas"
        :key="empresa.id"
        class="group text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        @click="entrarEmpresa(empresa)"
      >
        <!-- Nombre + plan -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {{ empresa.razon_social || empresa.slug }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ empresa.rut || '' }}</p>
          </div>
          <!-- Badge de plan -->
          <span
            v-if="empresa.plan"
            class="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            :class="planBadgeClass(empresa.plan)"
          >
            {{ empresa.plan }}
          </span>
        </div>

        <!-- Estado de suscripción -->
        <div class="flex items-center gap-1.5 mt-auto">
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="statusDotClass(empresa.subscription_status)"
          />
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ statusLabel(empresa.subscription_status) }}</span>
        </div>

        <!-- Arrow indicator -->
        <div class="flex justify-end mt-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useGrantStore } from '../../stores/grantStore';
import type { Empresa } from '../../models/Empresa';
import type { EmpresaPlan, SubscriptionStatus } from '../../models/Empresa';

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();
const grantStore = useGrantStore();

const cargando = ref(true);

const clienteSlug = computed(() => route.params.clienteSlug as string);
const clienteId = computed(() => grantStore.resolverClienteId(clienteSlug.value));

const empresas = computed(() => empresaStore.empresas ?? []);

onMounted(async () => {
  cargando.value = true;
  const id = clienteId.value;
  if (id) {
    empresaStore.listarEmpresas('cliente', null, id);
  } else if (sessionStore.userRole === 'super_admin') {
    empresaStore.listarEmpresas('super_admin');
  }
  // Dar un tick para que el reactive de useCollection se actualice
  setTimeout(() => { cargando.value = false; }, 600);
});

function entrarEmpresa(empresa: Empresa) {
  // Registrar el slug para que el guard requiresCompany pueda resolverlo
  grantStore.registrarEmpresaSlug(empresa.slug, empresa.id);
  router.push({ name: 'empresa-home', params: { companySlug: empresa.slug } });
}

function planBadgeClass(plan: EmpresaPlan | null): string {
  if (plan === 'business') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
  if (plan === 'pro') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

function statusDotClass(status: SubscriptionStatus | null | undefined): string {
  if (status === 'active' || status === 'trialing') return 'bg-emerald-400';
  if (status === 'past_due' || status === 'paused') return 'bg-amber-400';
  if (status === 'canceled') return 'bg-red-400';
  return 'bg-gray-300 dark:bg-gray-600';
}

function statusLabel(status: SubscriptionStatus | null | undefined): string {
  const labels: Record<string, string> = {
    active: 'Activa',
    trialing: 'Período de prueba',
    paused: 'Pausada',
    past_due: 'Pago pendiente',
    canceled: 'Cancelada',
    pending: 'Pendiente de activación',
  };
  return status ? (labels[status] ?? status) : 'Sin suscripción';
}
</script>
