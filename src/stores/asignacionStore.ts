import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Asignacion, asignacionConverter } from '../models/Asignacion';
import type { AsignacionStatus } from '../models/Asignacion';
import type { Turno } from '../models/Ubicacion';

export const useAsignacionStore = defineStore('asignacion', () => {
  const asignacionesRef = collection(db, 'asignaciones').withConverter(asignacionConverter);

  const queryParams = ref<{ locationId: string | null; status?: AsignacionStatus }>({ locationId: null });

  function listarAsignaciones(locationId: string, status?: AsignacionStatus) {
    queryParams.value = { locationId, status };
  }

  function clearAsignaciones() {
    queryParams.value = { locationId: null };
  }

  const asignacionesQuery = computed(() => {
    if (!queryParams.value.locationId) return null;
    const conditions = [
      where('location_id', '==', queryParams.value.locationId),
      where('deletedAt', '==', null),
    ];
    if (queryParams.value.status) {
      conditions.push(where('status', '==', queryParams.value.status));
    }
    return query(asignacionesRef, ...conditions);
  });

  const asignaciones = useCollection(asignacionesQuery);

  const asignacionesDraft = computed(() => asignaciones.value?.filter(a => a.status === 'draft') ?? []);
  const asignacionesPublicadas = computed(() => asignaciones.value?.filter(a => a.status === 'published') ?? []);

  async function createAsignacion(data: {
    location_id: string;
    date: string;
    turn: Turno;
    assigned_staff: string[];
    status?: AsignacionStatus;
  }) {
    const docRef = doc(asignacionesRef);
    const nueva = new Asignacion(
      docRef.id,
      data.location_id,
      data.date,
      data.turn,
      data.assigned_staff,
      data.status ?? 'draft'
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function updateAsignacion(id: string, data: Partial<Pick<Asignacion, 'date' | 'turn' | 'assigned_staff' | 'status'>>) {
    const docRef = doc(db, 'asignaciones', id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
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
    updateAsignacion,
    publishAsignacion,
    softDeleteAsignacion,
  };
});
