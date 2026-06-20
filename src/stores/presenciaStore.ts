import { defineStore } from 'pinia';
import { collection, doc, setDoc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { ref } from 'vue';
import { db } from '../firebase';
import { Presencia, presenciaConverter } from '../models/Presencia';

export const usePresenciaStore = defineStore('presencia', () => {
  const presenciasRef = collection(db, 'presencias').withConverter(presenciaConverter);

  const presencias = ref<Presencia[]>([]);
  const loading = ref(false);

  async function cargarPresencias(ubicacionId: string, date: string) {
    loading.value = true;
    try {
      const snap = await getDocs(query(
        presenciasRef,
        where('ubicacion_id', '==', ubicacionId),
        where('date', '==', date),
        where('deletedAt', '==', null)
      ));
      presencias.value = snap.docs.map(d => d.data());
    } finally {
      loading.value = false;
    }
  }

  async function createPresencia(data: {
    empresa_id: string;
    ubicacion_id: string;
    empleado_id: string;
    date: string;
    start: string;
    end: string;
  }) {
    const docRef = doc(presenciasRef);
    const nueva = new Presencia(
      docRef.id,
      data.empresa_id,
      data.ubicacion_id,
      data.empleado_id,
      data.date,
      data.start,
      data.end
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function softDeletePresencia(id: string) {
    const docRef = doc(db, 'presencias', id);
    await updateDoc(docRef, { deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
    presencias.value = presencias.value.filter(p => p.id !== id);
  }

  function limpiarPresencias() {
    presencias.value = [];
  }

  return { presencias, loading, cargarPresencias, createPresencia, softDeletePresencia, limpiarPresencias };
});
