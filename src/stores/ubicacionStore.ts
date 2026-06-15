import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp, arrayUnion } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Ubicacion, ubicacionConverter, type Turno } from '../models/Ubicacion';

export const useUbicacionStore = defineStore('ubicacion', () => {
  const ubicacionesRef = collection(db, 'ubicaciones').withConverter(ubicacionConverter);

  const queryParams = ref<{ empresaId: string | null; zonaId?: string | null }>({
    empresaId: null,
    zonaId: undefined,
  });

  function listarUbicaciones(empresaId: string, zonaId?: string | null) {
    queryParams.value = { empresaId, zonaId };
  }

  const ubicacionesQuery = computed(() => {
    if (!queryParams.value.empresaId) return null;

    let q = query(
      ubicacionesRef,
      where('company_id', '==', queryParams.value.empresaId),
      where('deletedAt', '==', null)
    );

    // Filtrar por zona si se especifica (null = ubicaciones sin zona / congregaciones)
    if (queryParams.value.zonaId !== undefined) {
      q = query(q, where('zone_id', '==', queryParams.value.zonaId));
    }

    return q;
  });

  const ubicaciones = useCollection(ubicacionesQuery);

  async function createUbicacion(data: Omit<Ubicacion, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'hasZone' | 'activeTurnos'>) {
    const docRef = doc(ubicacionesRef);
    const newUbicacion = new Ubicacion(
      docRef.id,
      data.company_id,
      data.zone_id,
      data.category,
      data.manager_id,
      data.name,
      data.address,
      data.active,
      data.turnos
    );
    await setDoc(docRef, newUbicacion);
    return docRef.id;
  }

  async function updateUbicacion(id: string, updateData: Partial<Omit<Ubicacion, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'ubicaciones', id);
    await updateDoc(docRef, { ...updateData, updatedAt: Timestamp.now() });
  }

  async function softDeleteUbicacion(id: string) {
    const docRef = doc(db, 'ubicaciones', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  // Turno management
  async function addTurno(ubicacionId: string, turnoData: Omit<Turno, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const docRef = doc(db, 'ubicaciones', ubicacionId);
    const newTurno: Turno = {
      id: crypto.randomUUID(),
      ...turnoData,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    await updateDoc(docRef, {
      turnos: arrayUnion(newTurno),
      updatedAt: Timestamp.now(),
    });
    return newTurno.id;
  }

  // Para editar o hacer soft-delete de un turno se reemplaza el array completo
  async function updateTurnosArray(ubicacionId: string, turnos: Turno[]) {
    const docRef = doc(db, 'ubicaciones', ubicacionId);
    await updateDoc(docRef, {
      turnos: turnos.map(t => ({
        ...t,
        updatedAt: new Date(),
      })),
      updatedAt: Timestamp.now(),
    });
  }

  async function softDeleteTurno(ubicacionId: string, turnoId: string, currentTurnos: Turno[]) {
    const updated = currentTurnos.map(t =>
      t.id === turnoId ? { ...t, deletedAt: new Date(), updatedAt: new Date() } : t
    );
    await updateTurnosArray(ubicacionId, updated);
  }

  return {
    ubicaciones,
    listarUbicaciones,
    createUbicacion,
    updateUbicacion,
    softDeleteUbicacion,
    addTurno,
    updateTurnosArray,
    softDeleteTurno,
  };
});
