import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, getDocs, writeBatch, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Segmento, segmentoConverter } from '../models/Segmento';
import type { SegmentoStatus } from '../models/Segmento';

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

  // Lectura puntual para CalendarioView — sin listener
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
      where('status', '==', 'published'),
      where('deletedAt', '==', null)
    ));
    return snap.docs.map(d => d.data());
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
        batch.update(d.ref, { status: 'published', updatedAt: Timestamp.now() });
      });
      await batch.commit();
    }
  }

  async function softDeleteSegmento(id: string) {
    const docRef = doc(db, 'segmentos', id);
    await updateDoc(docRef, { deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }

  return {
    segmentos,
    listarSegmentos,
    clearSegmentos,
    cargarSegmentosEmpleado,
    publishSegmentos,
    softDeleteSegmento,
  };
});
