<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">

    <!-- Banner dunning: solo lectura si past_due -->
    <div v-if="empresa?.isPastDue" class="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 flex gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-red-500 shrink-0 mt-0.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <div>
        <p class="font-semibold text-red-700 dark:text-red-400">Pago pendiente — acceso en solo lectura</p>
        <p class="text-sm text-red-600 dark:text-red-300 mt-0.5">Tu suscripción tiene un pago fallido. Actualiza tu método de pago para restaurar el acceso completo.</p>
        <button
          @click="irACheckout"
          class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          Regularizar pago
        </button>
      </div>
    </div>

    <!-- Sección: Estado de suscripción -->
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">Suscripción</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Plan actual y estado del servicio</p>
      </div>
      <div class="p-6 space-y-5">
        <!-- Plan + status chips -->
        <div class="flex flex-wrap gap-3 items-center">
          <span class="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {{ empresa?.plan ?? 'Sin plan' }}
          </span>
          <span :class="statusChipClass">{{ statusLabel }}</span>
          <span v-if="empresa?.trial_ends_at" class="text-sm text-amber-600 dark:text-amber-400">
            Prueba hasta {{ formatDate(empresa.trial_ends_at) }}
          </span>
        </div>

        <!-- Entitlements -->
        <div v-if="empresa?.entitlements" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ empresa.entitlements.max_empleados === -1 ? '∞' : empresa.entitlements.max_empleados }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Empleados</p>
          </div>
          <div class="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ empresa.entitlements.max_sucursales === -1 ? '∞' : empresa.entitlements.max_sucursales }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sucursales</p>
          </div>
          <div class="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3 text-center">
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ empresa.entitlements.features.length > 0 ? empresa.entitlements.features.length : '—' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Features extra</p>
          </div>
        </div>

        <!-- Planes disponibles -->
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Planes disponibles</p>
          <div class="grid sm:grid-cols-3 gap-3">
            <div
              v-for="p in planes"
              :key="p.id"
              :class="[
                'rounded-xl border p-4 cursor-pointer transition-all',
                empresa?.plan === p.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
              ]"
            >
              <p class="font-semibold text-gray-900 dark:text-white capitalize">{{ p.id }}</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                ${{ p.precio.toLocaleString('es-CL') }}
                <span class="text-xs font-normal text-gray-500">neto/mes</span>
              </p>
              <ul class="mt-2 space-y-1">
                <li v-for="f in p.features" :key="f" class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <svg class="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  {{ f }}
                </li>
              </ul>
              <button
                v-if="empresa?.plan !== p.id && canManageBilling"
                @click="suscribirse(p.id)"
                :disabled="cargandoSuscripcion"
                class="mt-3 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
              >
                {{ cargandoSuscripcion ? 'Cargando...' : 'Seleccionar' }}
              </button>
              <div v-else-if="empresa?.plan === p.id" class="mt-3 text-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                Plan actual
              </div>
            </div>
          </div>
        </div>

        <!-- Cancelar -->
        <div v-if="empresa?.mp_preapproval_id && canManageBilling" class="pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            @click="confirmarCancelacion = true"
            class="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Cancelar suscripción
          </button>
        </div>
      </div>
    </section>

    <!-- Sección: Datos tributarios -->
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white">Datos tributarios</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Estos datos aparecerán en tus documentos tributarios (DTE)</p>
      </div>
      <form @submit.prevent="guardarDatosTributarios" class="p-6 space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT empresa</label>
            <input
              v-model="form.rut"
              type="text"
              placeholder="76.543.210-9"
              :disabled="!canManageBilling"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón social</label>
            <input
              v-model="form.razon_social"
              type="text"
              placeholder="Empresa SpA"
              :disabled="!canManageBilling"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giro</label>
          <input
            v-model="form.giro"
            type="text"
            placeholder="Comercio al por menor"
            :disabled="!canManageBilling"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
          <input
            v-model="form.direccion"
            type="text"
            placeholder="Av. Ejemplo 123, Santiago"
            :disabled="!canManageBilling"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>
        <div v-if="canManageBilling" class="flex justify-end">
          <button
            type="submit"
            :disabled="guardandoDatos"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {{ guardandoDatos ? 'Guardando...' : 'Guardar datos' }}
          </button>
        </div>
        <p v-if="mensajeExito" class="text-sm text-green-600 dark:text-green-400">{{ mensajeExito }}</p>
      </form>
    </section>

    <!-- Sección: Historial de pagos / documentos -->
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-white">Documentos tributarios</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Boletas y facturas emitidas</p>
        </div>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        <div v-if="facturaStore.cargando" class="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">Cargando...</div>
        <div v-else-if="facturaStore.documentos.length === 0" class="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
          No hay documentos aún.
        </div>
        <div
          v-for="doc in facturaStore.documentos"
          :key="doc.id"
          class="px-6 py-4 flex items-center justify-between gap-4"
        >
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {{ doc.tipo_dte }} — {{ doc.periodo }}
              <span v-if="doc.folio" class="text-gray-500 dark:text-gray-400 font-normal"> · Folio {{ doc.folio }}</span>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              ${{ doc.monto_total.toLocaleString('es-CL') }} total (neto ${{ doc.monto_neto.toLocaleString('es-CL') }})
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span :class="estadoDTEChipClass(doc.estado)">{{ doc.estado }}</span>
            <a
              v-if="doc.archivo_pdf_url"
              :href="doc.archivo_pdf_url"
              target="_blank"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >PDF</a>
            <a
              v-if="doc.archivo_xml_url"
              :href="doc.archivo_xml_url"
              target="_blank"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >XML</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal: Confirmar cancelación -->
    <div v-if="confirmarCancelacion" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <h3 class="font-semibold text-gray-900 dark:text-white">¿Cancelar suscripción?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">
          El acceso se mantendrá hasta el fin del período actual. Después pasarás a modo solo lectura.
        </p>
        <div class="flex gap-3 mt-5 justify-end">
          <button @click="confirmarCancelacion = false" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Mantener plan
          </button>
          <button @click="cancelar" :disabled="cargandoSuscripcion" class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {{ cargandoSuscripcion ? 'Cancelando...' : 'Sí, cancelar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEmpresaStore } from '../../stores/empresaStore';
import { useFacturaStore } from '../../stores/facturaStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useGrantStore } from '../../stores/grantStore';
import { can } from '../../auth/access';
import type { EmpresaPlan } from '../../models/Empresa';
import type { EstadoDTE } from '../../models/DocumentoTributario';

const route = useRoute();
const empresaStore = useEmpresaStore();
const facturaStore = useFacturaStore();
const sessionStore = useSessionStore();
const grantStore = useGrantStore();

const confirmarCancelacion = ref(false);
const cargandoSuscripcion = ref(false);
const guardandoDatos = ref(false);
const mensajeExito = ref('');

const empresa = computed(() => {
  const slug = route.params.companySlug as string;
  return empresaStore.empresas?.find(e => e.slug === slug) ?? null;
});

const canManageBilling = computed(() => {
  const user = sessionStore.currentUser;
  const grants = grantStore.grants;
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const companyId = empresa.value?.id ?? '';
  return can(user, grants, 'billing.manage', 'company', companyId, { companyId });
});

const form = ref({
  rut: '',
  razon_social: '',
  giro: '',
  direccion: '',
});

onMounted(async () => {
  if (empresa.value?.id) {
    await facturaStore.cargarDocumentos(empresa.value.id);
  }
  if (empresa.value) {
    form.value.rut = empresa.value.rut ?? '';
    form.value.razon_social = empresa.value.razon_social ?? '';
    form.value.giro = empresa.value.giro ?? '';
    form.value.direccion = empresa.value.direccion ?? '';
  }
});

const planes = [
  {
    id: 'basic' as EmpresaPlan,
    precio: 10000,
    features: ['Hasta 25 empleados', 'Hasta 3 sucursales', 'Turnos y personal', '7 días de prueba'],
  },
  {
    id: 'pro' as EmpresaPlan,
    precio: 30000,
    features: ['Hasta 100 empleados', 'Hasta 10 sucursales', 'Algoritmo de asignación', 'Reglas y exportaciones'],
  },
  {
    id: 'business' as EmpresaPlan,
    precio: 100000,
    features: ['Empleados ilimitados', 'Sucursales ilimitadas', 'Roles finos', 'SSO + API'],
  },
];

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    active: 'Activa',
    trialing: 'En prueba',
    paused: 'Pausada',
    past_due: 'Pago pendiente',
    canceled: 'Cancelada',
    pending: 'Sin suscripción',
  };
  return map[empresa.value?.subscription_status ?? 'pending'] ?? 'Desconocido';
});

const statusChipClass = computed(() => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  const s = empresa.value?.subscription_status;
  if (s === 'active') return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`;
  if (s === 'trialing') return `${base} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400`;
  if (s === 'past_due') return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`;
  if (s === 'paused') return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400`;
  return `${base} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`;
});

function estadoDTEChipClass(estado: EstadoDTE) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  if (estado === 'notificado') return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`;
  if (estado === 'emitido') return `${base} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400`;
  if (estado === 'error') return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`;
  return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400`;
}

function formatDate(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function suscribirse(plan: EmpresaPlan) {
  if (!empresa.value?.id) return;
  cargandoSuscripcion.value = true;
  try {
    const initPoint = await facturaStore.iniciarSuscripcion(empresa.value.id, plan);
    window.location.href = initPoint;
  } catch (e: any) {
    alert(e.message ?? 'Error al iniciar suscripción');
  } finally {
    cargandoSuscripcion.value = false;
  }
}

async function cancelar() {
  if (!empresa.value?.id) return;
  cargandoSuscripcion.value = true;
  try {
    await facturaStore.cancelarSuscripcion(empresa.value.id);
    confirmarCancelacion.value = false;
  } catch (e: any) {
    alert(e.message ?? 'Error al cancelar suscripción');
  } finally {
    cargandoSuscripcion.value = false;
  }
}

function irACheckout() {
  if (!empresa.value?.plan) return;
  suscribirse(empresa.value.plan);
}

async function guardarDatosTributarios() {
  if (!empresa.value?.id) return;
  guardandoDatos.value = true;
  mensajeExito.value = '';
  try {
    await empresaStore.updateEmpresa(empresa.value.id, {
      rut: form.value.rut || null,
      razon_social: form.value.razon_social || null,
      giro: form.value.giro || null,
      direccion: form.value.direccion || null,
    } as any);
    mensajeExito.value = 'Datos guardados correctamente.';
    setTimeout(() => { mensajeExito.value = ''; }, 3000);
  } catch (e: any) {
    alert(e.message ?? 'Error al guardar datos');
  } finally {
    guardandoDatos.value = false;
  }
}
</script>
