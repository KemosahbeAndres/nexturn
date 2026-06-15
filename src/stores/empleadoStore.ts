import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase';
import { Empleado, empleadoConverter } from '../models/Empleado';
import { contactoConverter } from '../models/Contacto';

export const useEmpleadoStore = defineStore('empleado', () => {
  const empleadosRef = collection(db, 'empleados').withConverter(empleadoConverter);

  const queryParams = ref<{ companyId: string | null }>({ companyId: null });

  function listarEmpleados(companyId: string) {
    queryParams.value = { companyId };
  }

  const empleadosQuery = computed(() => {
    if (!queryParams.value.companyId) return null;
    return query(
      empleadosRef,
      where('company_id', '==', queryParams.value.companyId),
      where('deletedAt', '==', null)
    );
  });

  const empleados = useCollection(empleadosQuery);

  // Hidratar contacto automáticamente cuando llegan nuevos empleados
  watch(empleados, async (lista) => {
    if (!lista) return;
    for (const emp of lista) {
      if (!emp.contacto && emp.contact_id) {
        try {
          const ref = doc(db, 'contactos', emp.contact_id).withConverter(contactoConverter);
          const snap = await getDoc(ref);
          if (snap.exists()) emp.contacto = snap.data();
        } catch (e) {
          console.error('Error hidratando contacto de empleado:', emp.id, e);
        }
      }
    }
  }, { deep: true });

  const empleadosActivos = computed(() => empleados.value?.filter(e => e.active) ?? []);

  async function createEmpleado(data: Omit<Empleado, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'contacto' | 'displayName' | 'initials'>) {
    const docRef = doc(empleadosRef);
    const nuevo = new Empleado(
      docRef.id,
      data.company_id,
      data.contact_id,
      data.active,
      data.work_role,
      data.disponibilidad ?? null
    );
    await setDoc(docRef, nuevo);
    return docRef.id;
  }

  async function updateEmpleado(id: string, data: Partial<Omit<Empleado, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'empleados', id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  }

  async function softDeleteEmpleado(id: string) {
    const docRef = doc(db, 'empleados', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  return {
    empleados,
    empleadosActivos,
    listarEmpleados,
    createEmpleado,
    updateEmpleado,
    softDeleteEmpleado,
  };
});
