import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Estacion, estacionConverter } from '../models/Estacion';
import type { EstacionIntensidad } from '../models/Estacion';

export const useEstacionStore = defineStore('estacion', () => {
  const estacionesRef = collection(db, 'estaciones').withConverter(estacionConverter);

  const queryParams = ref<{ empresaId: string | null }>({ empresaId: null });

  function listarEstaciones(empresaId: string) {
    queryParams.value = { empresaId };
  }

  const estacionesQuery = computed(() => {
    if (!queryParams.value.empresaId) return null;
    return query(
      estacionesRef,
      where('empresa_id', '==', queryParams.value.empresaId)
    );
  });

  const estaciones = useCollection(estacionesQuery);
  const estacionesActivas = computed(() =>
    estaciones.value?.filter(e => e.active && !e.deletedAt) ?? []
  );

  async function createEstacion(data: {
    empresa_id: string;
    nombre: string;
    descripcion: string;
    intensidad?: EstacionIntensidad;
    max_continuo_min?: number | null;
  }) {
    const docRef = doc(estacionesRef);
    const nueva = new Estacion(
      docRef.id,
      data.empresa_id,
      data.nombre,
      data.descripcion,
      true,
      data.intensidad ?? 'media',
      data.max_continuo_min ?? null
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function updateEstacion(
    id: string,
    data: Partial<Pick<Estacion, 'nombre' | 'descripcion' | 'active' | 'intensidad' | 'max_continuo_min'>>
  ) {
    const docRef = doc(db, 'estaciones', id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  }

  async function softDeleteEstacion(id: string) {
    const docRef = doc(db, 'estaciones', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  return { estaciones, estacionesActivas, listarEstaciones, createEstacion, updateEstacion, softDeleteEstacion };
});
