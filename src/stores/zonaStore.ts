import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Zona, zonaConverter } from '../models/Zona';

export const useZonaStore = defineStore('zona', () => {
  const zonasRef = collection(db, 'zonas').withConverter(zonaConverter);

  const queryParams = ref<{ empresaId: string | null }>({ empresaId: null });

  function listarZonas(empresaId: string) {
    queryParams.value = { empresaId };
  }

  const zonasQuery = computed(() => {
    if (!queryParams.value.empresaId) return null;
    return query(
      zonasRef,
      where('empresa_id', '==', queryParams.value.empresaId),
      where('deletedAt', '==', null)
    );
  });

  const zonas = useCollection(zonasQuery);

  async function createZona(data: Omit<Zona, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const docRef = doc(zonasRef);
    const newZona = new Zona(
      docRef.id,
      data.empresa_id,
      data.name,
      data.manager_id,
      data.active,
      data.required_role
    );
    await setDoc(docRef, newZona);
    return docRef.id;
  }

  async function updateZona(id: string, updateData: Partial<Omit<Zona, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'zonas', id);
    await updateDoc(docRef, { ...updateData, updatedAt: Timestamp.now() });
  }

  async function softDeleteZona(id: string) {
    const docRef = doc(db, 'zonas', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  return { zonas, listarZonas, createZona, updateZona, softDeleteZona };
});
