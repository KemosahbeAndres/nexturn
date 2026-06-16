import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Habilidad, habilidadConverter } from '../models/Habilidad';

export const useHabilidadStore = defineStore('habilidad', () => {
  const habilidadesRef = collection(db, 'habilidades').withConverter(habilidadConverter);

  const queryParams = ref<{ empresaId: string | null }>({ empresaId: null });

  function listarHabilidades(empresaId: string) {
    queryParams.value = { empresaId };
  }

  const habilidadesQuery = computed(() => {
    if (!queryParams.value.empresaId) return null;
    return query(
      habilidadesRef,
      where('empresa_id', '==', queryParams.value.empresaId),
      where('deletedAt', '==', null)
    );
  });

  const habilidades = useCollection(habilidadesQuery);
  const habilidadesActivas = computed(() => habilidades.value?.filter(h => h.active) ?? []);

  async function createHabilidad(data: { empresa_id: string; nombre: string; descripcion: string }) {
    const docRef = doc(habilidadesRef);
    const nueva = new Habilidad(docRef.id, data.empresa_id, data.nombre, data.descripcion, true);
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function updateHabilidad(id: string, data: Partial<Pick<Habilidad, 'nombre' | 'descripcion' | 'active'>>) {
    const docRef = doc(db, 'habilidades', id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  }

  async function softDeleteHabilidad(id: string) {
    const docRef = doc(db, 'habilidades', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  return { habilidades, habilidadesActivas, listarHabilidades, createHabilidad, updateHabilidad, softDeleteHabilidad };
});
