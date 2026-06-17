import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { ReglaAsignacion, reglaAsignacionConverter } from '../models/ReglaAsignacion';
import type { ReglaType } from '../models/ReglaAsignacion';

export const useReglaAsignacionStore = defineStore('reglaAsignacion', () => {
  const reglasRef = collection(db, 'reglas_asignacion').withConverter(reglaAsignacionConverter);

  // Filtramos por employee_id (cualquiera de los dos campos de la pareja)
  // Firestore no permite OR nativo entre campos distintos, así que se hacen dos queries
  // y se unen en el computed. Por ahora listamos por person_uno_id para el contexto
  // de un empleado dado y el store expone ambos sentidos.
  const queryParams = ref<{ employeeId: string | null }>({ employeeId: null });

  function listarReglas(employeeId: string) {
    queryParams.value = { employeeId };
  }

  function clearReglas() {
    queryParams.value = { employeeId: null };
  }

  const reglasQueryUno = computed(() => {
    if (!queryParams.value.employeeId) return null;
    return query(reglasRef, where('person_uno_id', '==', queryParams.value.employeeId), where('deletedAt', '==', null));
  });

  const reglasQueryDos = computed(() => {
    if (!queryParams.value.employeeId) return null;
    return query(reglasRef, where('person_dos_id', '==', queryParams.value.employeeId), where('deletedAt', '==', null));
  });

  const reglasUno = useCollection(reglasQueryUno);
  const reglasDos = useCollection(reglasQueryDos);

  // Unión deduplicada de ambas queries
  const reglas = computed((): ReglaAsignacion[] => {
    const mapa = new Map<string, ReglaAsignacion>();
    for (const r of reglasUno.value ?? []) mapa.set(r.id, r);
    for (const r of reglasDos.value ?? []) mapa.set(r.id, r);
    return Array.from(mapa.values());
  });

  const reglasJuntos = computed(() => reglas.value.filter(r => r.type === 'juntos'));
  const reglasSeparados = computed(() => reglas.value.filter(r => r.type === 'nunca_juntos'));

  async function createRegla(data: {
    person_uno_id: string;
    person_dos_id: string;
    is_strict: boolean;
    type: ReglaType;
  }) {
    const docRef = doc(reglasRef);
    const nueva = new ReglaAsignacion(
      docRef.id,
      data.person_uno_id,
      data.person_dos_id,
      data.is_strict,
      data.type
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function updateRegla(id: string, data: Partial<Pick<ReglaAsignacion, 'is_strict' | 'type'>>) {
    const docRef = doc(db, 'reglas_asignacion', id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  }

  async function softDeleteRegla(id: string) {
    const docRef = doc(db, 'reglas_asignacion', id);
    await updateDoc(docRef, { deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }

  return {
    reglas,
    reglasJuntos,
    reglasSeparados,
    listarReglas,
    clearReglas,
    createRegla,
    updateRegla,
    softDeleteRegla,
  };
});
