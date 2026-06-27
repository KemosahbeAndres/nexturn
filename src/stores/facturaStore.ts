import { defineStore } from 'pinia';
import {
  collection, doc, getDocs, query, where, updateDoc, addDoc, Timestamp, getDoc
} from 'firebase/firestore';
import { ref } from 'vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import { DocumentoTributario, documentoTributarioConverter } from '../models/DocumentoTributario';
import type { EstadoDTE, OrigenDTE } from '../models/DocumentoTributario';
import { empresaConverter } from '../models/Empresa';
import type { EmpresaPlan, EmpresaEntitlements, SubscriptionStatus, DTEProvider } from '../models/Empresa';
import { PLAN_ENTITLEMENTS } from '../models/Empresa';

const functions = getFunctions(undefined, 'southamerica-west1');

export const useFacturaStore = defineStore('factura', () => {
  const documentos = ref<DocumentoTributario[]>([]);
  const cargando = ref(false);
  const error = ref<string | null>(null);

  // ── Suscripciones ──────────────────────────────────────────────────────────

  async function iniciarSuscripcion(empresaId: string, plan: EmpresaPlan) {
    cargando.value = true;
    error.value = null;
    try {
      const fn = httpsCallable<{ empresa_id: string; plan: EmpresaPlan }, { init_point: string }>(
        functions,
        'crearSuscripcion'
      );
      const result = await fn({ empresa_id: empresaId, plan });
      return result.data.init_point;
    } catch (e: any) {
      error.value = e.message ?? 'Error al iniciar suscripción';
      throw e;
    } finally {
      cargando.value = false;
    }
  }

  async function cancelarSuscripcion(empresaId: string) {
    cargando.value = true;
    error.value = null;
    try {
      const fn = httpsCallable<{ empresa_id: string }, { ok: boolean }>(
        functions,
        'cancelarSuscripcion'
      );
      await fn({ empresa_id: empresaId });
    } catch (e: any) {
      error.value = e.message ?? 'Error al cancelar suscripción';
      throw e;
    } finally {
      cargando.value = false;
    }
  }

  // ── Documentos Tributarios ─────────────────────────────────────────────────

  async function cargarDocumentos(empresaId: string) {
    cargando.value = true;
    error.value = null;
    try {
      const snap = await getDocs(
        query(
          collection(db, 'documentos_tributarios').withConverter(documentoTributarioConverter),
          where('empresa_id', '==', empresaId)
        )
      );
      documentos.value = snap.docs.map(d => d.data()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (e: any) {
      error.value = e.message ?? 'Error al cargar documentos';
    } finally {
      cargando.value = false;
    }
  }

  async function cargarTodosDocumentos() {
    cargando.value = true;
    error.value = null;
    try {
      const snap = await getDocs(
        collection(db, 'documentos_tributarios').withConverter(documentoTributarioConverter)
      );
      documentos.value = snap.docs.map(d => d.data()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (e: any) {
      error.value = e.message ?? 'Error al cargar documentos';
    } finally {
      cargando.value = false;
    }
  }

  // Sube PDF + XML de un DTE emitido manualmente en SII portal
  async function subirDTEManual(
    documentoId: string,
    pdfUrl: string,
    xmlUrl: string,
    folio: string
  ) {
    const docRef = doc(db, 'documentos_tributarios', documentoId);
    await updateDoc(docRef, {
      archivo_pdf_url: pdfUrl,
      archivo_xml_url: xmlUrl,
      folio,
      estado: 'emitido' as EstadoDTE,
      emitido_at: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Notificar vía Cloud Function
    const fn = httpsCallable<{ documento_id: string }, { ok: boolean }>(
      functions,
      'notificarDTEEmitido'
    );
    await fn({ documento_id: documentoId });

    // Marcar como notificado localmente
    await updateDoc(docRef, { estado: 'notificado' as EstadoDTE, notificado_at: Timestamp.now(), updatedAt: Timestamp.now() });

    const idx = documentos.value.findIndex(d => d.id === documentoId);
    if (idx !== -1) {
      documentos.value[idx].estado = 'notificado';
      documentos.value[idx].archivo_pdf_url = pdfUrl;
      documentos.value[idx].archivo_xml_url = xmlUrl;
      documentos.value[idx].folio = folio;
    }
  }

  // ── Entitlements / hard block ──────────────────────────────────────────────

  async function verificarLimiteEmpleados(empresaId: string): Promise<boolean> {
    const empSnap = await getDoc(doc(db, 'empresas', empresaId).withConverter(empresaConverter));
    if (!empSnap.exists()) return false;
    const empresa = empSnap.data();
    if (empresa.entitlements.max_empleados === -1) return true;

    const empSnap2 = await getDocs(
      query(collection(db, 'empleados'), where('company_id', '==', empresaId), where('deletedAt', '==', null))
    );
    return empSnap2.size < empresa.entitlements.max_empleados;
  }

  async function verificarLimiteSucursales(empresaId: string): Promise<boolean> {
    const empSnap = await getDoc(doc(db, 'empresas', empresaId).withConverter(empresaConverter));
    if (!empSnap.exists()) return false;
    const empresa = empSnap.data();
    if (empresa.entitlements.max_sucursales === -1) return true;

    const locSnap = await getDocs(
      query(collection(db, 'ubicaciones'), where('company_id', '==', empresaId), where('deletedAt', '==', null))
    );
    return locSnap.size < empresa.entitlements.max_sucursales;
  }

  // Actualiza plan + entitlements de una empresa (solo super_admin)
  async function actualizarPlan(empresaId: string, plan: EmpresaPlan) {
    const entitlements: EmpresaEntitlements = PLAN_ENTITLEMENTS[plan];
    await updateDoc(doc(db, 'empresas', empresaId), {
      plan,
      entitlements,
      updatedAt: Timestamp.now(),
    });
  }

  // Actualiza configuración de proveedor DTE por defecto (solo super_admin)
  async function actualizarDTEProvider(empresaId: string, provider: DTEProvider) {
    await updateDoc(doc(db, 'empresas', empresaId), {
      dte_provider_default: provider,
      updatedAt: Timestamp.now(),
    });
  }

  return {
    documentos,
    cargando,
    error,
    iniciarSuscripcion,
    cancelarSuscripcion,
    cargarDocumentos,
    cargarTodosDocumentos,
    subirDTEManual,
    verificarLimiteEmpleados,
    verificarLimiteSucursales,
    actualizarPlan,
    actualizarDTEProvider,
  };
});
