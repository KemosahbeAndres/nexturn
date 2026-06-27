<template>
  <div class="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">

    <!-- Header con filtros -->
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Documentos Tributarios (DTE)</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestión de boletas y facturas. Proveedores: OpenFactura (automático) / SII manual.</p>
      </div>
      <div class="flex gap-2">
        <select
          v-model="filtroEstado"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="emitido">Emitido</option>
          <option value="notificado">Notificado</option>
          <option value="error">Error</option>
        </select>
        <select
          v-model="filtroOrigen"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los orígenes</option>
          <option value="sii_manual">SII Manual</option>
          <option value="openfactura">OpenFactura</option>
        </select>
      </div>
    </div>

    <!-- Tabla de documentos -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div v-if="facturaStore.cargando" class="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
        Cargando documentos...
      </div>
      <div v-else-if="documentosFiltrados.length === 0" class="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
        No hay documentos que coincidan con los filtros.
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Empresa / Período</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Origen</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="doc in documentosFiltrados"
            :key="doc.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900 dark:text-white">{{ doc.empresa_id }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ doc.periodo }} · {{ doc.tipo_dte }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="text-gray-900 dark:text-white">${{ doc.monto_total.toLocaleString('es-CL') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">neto ${{ doc.monto_neto.toLocaleString('es-CL') }}</p>
            </td>
            <td class="px-4 py-3">
              <span :class="origenChipClass(doc.origen)">{{ doc.origen === 'sii_manual' ? 'SII Manual' : 'OpenFactura' }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="estadoChipClass(doc.estado)">{{ doc.estado }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center gap-2 justify-end">
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
                <!-- Solo mostrar "Subir DTE" para documentos SII manual pendientes o con error -->
                <button
                  v-if="doc.origen === 'sii_manual' && (doc.estado === 'pendiente' || doc.estado === 'error')"
                  @click="abrirModalSubida(doc.id)"
                  class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                >
                  Subir DTE
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Subir DTE manual -->
    <div v-if="modalSubida" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
        <h3 class="font-semibold text-gray-900 dark:text-white">Subir DTE emitido en SII</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Ingresa el folio asignado y las URLs de los archivos en Firebase Storage (PDF y XML).
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Folio</label>
          <input
            v-model="subidaForm.folio"
            type="text"
            placeholder="12345"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Upload PDF -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Archivo PDF</label>
          <input
            type="file"
            accept=".pdf"
            @change="onPDFChange"
            class="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
          />
        </div>

        <!-- Upload XML -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Archivo XML</label>
          <input
            type="file"
            accept=".xml"
            @change="onXMLChange"
            class="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
          />
        </div>

        <p v-if="errorSubida" class="text-sm text-red-600 dark:text-red-400">{{ errorSubida }}</p>

        <div class="flex gap-3 justify-end pt-1">
          <button
            @click="cerrarModalSubida"
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="subirDTE"
            :disabled="subiendo || !subidaForm.folio || !pdfFile || !xmlFile"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {{ subiendo ? 'Subiendo...' : 'Subir y notificar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFacturaStore } from '../../stores/facturaStore';
import type { EstadoDTE, OrigenDTE } from '../../models/DocumentoTributario';

const facturaStore = useFacturaStore();
const filtroEstado = ref('');
const filtroOrigen = ref('');

const modalSubida = ref(false);
const documentoIdActivo = ref('');
const subiendo = ref(false);
const errorSubida = ref('');
const pdfFile = ref<File | null>(null);
const xmlFile = ref<File | null>(null);

const subidaForm = ref({
  folio: '',
});

onMounted(async () => {
  await facturaStore.cargarTodosDocumentos();
});

const documentosFiltrados = computed(() => {
  return facturaStore.documentos.filter(d => {
    if (filtroEstado.value && d.estado !== filtroEstado.value) return false;
    if (filtroOrigen.value && d.origen !== filtroOrigen.value) return false;
    return true;
  });
});

function abrirModalSubida(documentoId: string) {
  documentoIdActivo.value = documentoId;
  subidaForm.value.folio = '';
  pdfFile.value = null;
  xmlFile.value = null;
  errorSubida.value = '';
  modalSubida.value = true;
}

function cerrarModalSubida() {
  modalSubida.value = false;
  documentoIdActivo.value = '';
}

function onPDFChange(e: Event) {
  const input = e.target as HTMLInputElement;
  pdfFile.value = input.files?.[0] ?? null;
}

function onXMLChange(e: Event) {
  const input = e.target as HTMLInputElement;
  xmlFile.value = input.files?.[0] ?? null;
}

async function subirDTE() {
  if (!subidaForm.value.folio || !pdfFile.value || !xmlFile.value) {
    errorSubida.value = 'Completa todos los campos.';
    return;
  }
  subiendo.value = true;
  errorSubida.value = '';

  try {
    const storage = getStorage();
    const docId = documentoIdActivo.value;

    const pdfRef = storageRef(storage, `dte/${docId}/boleta.pdf`);
    const xmlRef = storageRef(storage, `dte/${docId}/boleta.xml`);

    const [pdfSnap, xmlSnap] = await Promise.all([
      uploadBytes(pdfRef, pdfFile.value),
      uploadBytes(xmlRef, xmlFile.value),
    ]);

    const [pdfUrl, xmlUrl] = await Promise.all([
      getDownloadURL(pdfSnap.ref),
      getDownloadURL(xmlSnap.ref),
    ]);

    await facturaStore.subirDTEManual(docId, pdfUrl, xmlUrl, subidaForm.value.folio);
    cerrarModalSubida();
  } catch (e: any) {
    errorSubida.value = e.message ?? 'Error al subir archivos.';
  } finally {
    subiendo.value = false;
  }
}

function estadoChipClass(estado: EstadoDTE) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  if (estado === 'notificado') return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`;
  if (estado === 'emitido') return `${base} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400`;
  if (estado === 'error') return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`;
  return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400`;
}

function origenChipClass(origen: OrigenDTE) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  if (origen === 'openfactura') return `${base} bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400`;
  return `${base} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`;
}
</script>
