import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, getDocs, writeBatch, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { Segmento, segmentoConverter } from '../models/Segmento';
import type { SegmentoStatus } from '../models/Segmento';

const actualizarBorradorFn = httpsCallable(functions, 'actualizarBorrador', { timeout: 120000 });

export const useSegmentoStore = defineStore('segmento', () => {
  const segmentosRef = collection(db, 'segmentos').withConverter(segmentoConverter);

  const queryParams = ref<{
    ubicacionId: string | null;
    date: string | null;
    status?: SegmentoStatus;
  }>({ ubicacionId: null, date: null });

  function listarSegmentos(ubicacionId: string, date: string, status?: SegmentoStatus) {
    queryParams.value = { ubicacionId, date, status };
  }

  function clearSegmentos() {
    queryParams.value = { ubicacionId: null, date: null };
  }

  const segmentosQuery = computed(() => {
    if (!queryParams.value.ubicacionId || !queryParams.value.date) return null;
    const conds = [
      where('ubicacion_id', '==', queryParams.value.ubicacionId),
      where('date', '==', queryParams.value.date),
      where('deletedAt', '==', null),
    ];
    if (queryParams.value.status) conds.push(where('status', '==', queryParams.value.status));
    return query(segmentosRef, ...conds);
  });

  const segmentos = useCollection(segmentosQuery);

  // Lectura puntual para el manager — todos los estados de la semana
  async function cargarSegmentosManager(
    ubicacionId: string,
    weekStart: string,
    weekEnd: string
  ): Promise<Segmento[]> {
    const snap = await getDocs(query(
      segmentosRef,
      where('ubicacion_id', '==', ubicacionId),
      where('date', '>=', weekStart),
      where('date', '<=', weekEnd),
      where('deletedAt', '==', null)
    ));
    return snap.docs.map(d => d.data());
  }

  // Lectura puntual para CalendarioView empleado — solo publicados
  async function cargarSegmentosEmpleado(
    empleadoId: string,
    dateStart: string,
    dateEnd: string
  ): Promise<Segmento[]> {
    const snap = await getDocs(query(
      segmentosRef,
      where('empleado_id', '==', empleadoId),
      where('date', '>=', dateStart),
      where('date', '<=', dateEnd),
      where('status', '==', 'publicado'),
      where('deletedAt', '==', null)
    ));
    return snap.docs.map(d => d.data());
  }

  async function aprobarSegmento(id: string) {
    await updateDoc(doc(db, 'segmentos', id), { status: 'aprobado', updatedAt: Timestamp.now() });
  }

  async function rechazarSegmento(id: string) {
    await updateDoc(doc(db, 'segmentos', id), { status: 'rechazado', updatedAt: Timestamp.now() });
  }

  // Publica todos los segmentos `aprobado` de un día y actualiza la Asignacion
  async function publicarDia(ubicacionId: string, date: string): Promise<void> {
    const snap = await getDocs(query(
      segmentosRef,
      where('ubicacion_id', '==', ubicacionId),
      where('date', '==', date),
      where('status', '==', 'aprobado'),
      where('deletedAt', '==', null)
    ));
    if (snap.empty) return;

    const BATCH_SIZE = 500;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_SIZE).forEach(d => {
        batch.update(d.ref, { status: 'publicado', updatedAt: Timestamp.now() });
      });
      await batch.commit();
    }

    // Actualizar Asignacion del día a published
    const asignacionId = snap.docs[0].data().asignacion_id;
    if (asignacionId) {
      await updateDoc(doc(db, 'asignaciones', asignacionId), {
        status: 'published',
        updatedAt: Timestamp.now(),
      });
    }
  }

  async function publishSegmentos(asignacionId: string) {
    const snap = await getDocs(query(
      segmentosRef,
      where('asignacion_id', '==', asignacionId),
      where('deletedAt', '==', null)
    ));
    if (snap.empty) return;

    const BATCH_SIZE = 500;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_SIZE).forEach(d => {
        batch.update(d.ref, { status: 'publicado', updatedAt: Timestamp.now() });
      });
      await batch.commit();
    }
  }

  async function softDeleteSegmento(id: string) {
    const docRef = doc(db, 'segmentos', id);
    await updateDoc(docRef, { deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }

  // Regenera el borrador del mes completo (4 semanas desde hoy) en segundo plano.
  // Se llama después de cambios en turnos, disponibilidad o empleados.
  // No espera — fire-and-forget — el calendario se recargará manualmente si el usuario lo abre.
  function regenerarBorradorMes(empresaId: string, ubicacionId: string): void {
    const hoy = new Date().toISOString().slice(0, 10);
    actualizarBorradorFn({
      empresa_id: empresaId,
      ubicacion_id: ubicacionId,
      week_start: hoy,
      dias: 28,
    }).catch(() => { /* silencioso — el calendario mostrará el estado actual */ });
  }

  return {
    segmentos,
    listarSegmentos,
    clearSegmentos,
    cargarSegmentosManager,
    cargarSegmentosEmpleado,
    aprobarSegmento,
    rechazarSegmento,
    publicarDia,
    publishSegmentos,
    softDeleteSegmento,
    regenerarBorradorMes,
  };
});
