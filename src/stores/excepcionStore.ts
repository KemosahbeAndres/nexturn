import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Excepcion, excepcionConverter } from '../models/Excepcion';
import type { ExcepcionType } from '../models/Excepcion';

export const useExcepcionStore = defineStore('excepcion', () => {
  const excepcionesRef = collection(db, 'excepciones').withConverter(excepcionConverter);

  const queryParams = ref<{ employeeId: string | null }>({ employeeId: null });

  function listarExcepciones(employeeId: string) {
    queryParams.value = { employeeId };
  }

  function clearExcepciones() {
    queryParams.value = { employeeId: null };
  }

  const excepcionesQuery = computed(() => {
    if (!queryParams.value.employeeId) return null;
    return query(
      excepcionesRef,
      where('employee_id', '==', queryParams.value.employeeId),
      where('deletedAt', '==', null)
    );
  });

  const excepciones = useCollection(excepcionesQuery);
  const excepcionesActivas = computed(() => excepciones.value?.filter(e => e.active) ?? []);

  async function createExcepcion(data: {
    employee_id: string;
    date: string;
    time_start: string;
    time_end: string;
    reason: string;
    type: ExcepcionType;
  }) {
    const docRef = doc(excepcionesRef);
    const nueva = new Excepcion(
      docRef.id,
      data.employee_id,
      true,
      data.date,
      data.time_start,
      data.time_end,
      data.reason,
      data.type
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function updateExcepcion(id: string, data: Partial<Pick<Excepcion, 'date' | 'time_start' | 'time_end' | 'reason' | 'type' | 'active'>>) {
    const docRef = doc(db, 'excepciones', id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  }

  async function softDeleteExcepcion(id: string) {
    const docRef = doc(db, 'excepciones', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  return {
    excepciones,
    excepcionesActivas,
    listarExcepciones,
    clearExcepciones,
    createExcepcion,
    updateExcepcion,
    softDeleteExcepcion,
  };
});
