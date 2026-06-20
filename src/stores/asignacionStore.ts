import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Asignacion, asignacionConverter } from '../models/Asignacion';
import type { AsignacionStatus } from '../models/Asignacion';

export const useAsignacionStore = defineStore('asignacion', () => {
  const asignacionesRef = collection(db, 'asignaciones').withConverter(asignacionConverter);

  const queryParams = ref<{ ubicacionId: string | null; date?: string }>({ ubicacionId: null });

  function listarAsignaciones(ubicacionId: string, date?: string) {
    queryParams.value = { ubicacionId, date };
  }

  function clearAsignaciones() {
    queryParams.value = { ubicacionId: null };
  }

  const asignacionesQuery = computed(() => {
    if (!queryParams.value.ubicacionId) return null;
    const conditions = [
      where('ubicacion_id', '==', queryParams.value.ubicacionId),
      where('deletedAt', '==', null),
    ];
    if (queryParams.value.date) {
      conditions.push(where('date', '==', queryParams.value.date));
    }
    return query(asignacionesRef, ...conditions);
  });

  const asignaciones = useCollection(asignacionesQuery);
  const asignacionesDraft = computed(() => asignaciones.value?.filter(a => a.status === 'draft') ?? []);
  const asignacionesPublicadas = computed(() => asignaciones.value?.filter(a => a.status === 'published') ?? []);

  async function createAsignacion(data: {
    empresa_id: string;
    ubicacion_id: string;
    date: string;
    status?: AsignacionStatus;
  }) {
    const docRef = doc(asignacionesRef);
    const nueva = new Asignacion(
      docRef.id,
      data.empresa_id,
      data.ubicacion_id,
      data.date,
      data.status ?? 'draft'
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function publishAsignacion(id: string) {
    const docRef = doc(db, 'asignaciones', id);
    await updateDoc(docRef, { status: 'published', updatedAt: Timestamp.now() });
  }

  async function softDeleteAsignacion(id: string) {
    const docRef = doc(db, 'asignaciones', id);
    await updateDoc(docRef, { deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }

  return {
    asignaciones,
    asignacionesDraft,
    asignacionesPublicadas,
    listarAsignaciones,
    clearAsignaciones,
    createAsignacion,
    publishAsignacion,
    softDeleteAsignacion,
  };
});
