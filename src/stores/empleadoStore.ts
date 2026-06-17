import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase';
import { Empleado, empleadoConverter } from '../models/Empleado';
import { contactoConverter } from '../models/Contacto';
import { Contrato, contratoToPlain } from '../models/Contrato';

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
      where('company_id', '==', queryParams.value.companyId)
    );
  });

  const empleados = useCollection(empleadosQuery);

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

  const empleadosActivos = computed(() => empleados.value?.filter(e => e.active && !e.deletedAt) ?? []);

  async function createEmpleado(data: Omit<Empleado, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'contacto' | 'displayName' | 'initials'>) {
    const docRef = doc(empleadosRef);
    const nuevo = new Empleado(
      docRef.id,
      data.company_id,
      data.contact_id,
      data.active,
      data.estacion_ids ?? [],
      data.contratos ?? [],
      data.disponibilidad ?? null
    );
    await setDoc(docRef, nuevo);
    return docRef.id;
  }

  async function addContrato(empleadoId: string, contrato: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const emp = empleados.value?.find(e => e.id === empleadoId);
    if (!emp) return;
    const nuevo = new Contrato(
      crypto.randomUUID(),
      empleadoId,
      contrato.ubicacion_id,
      contrato.cargo_id,
      contrato.active ?? true,
      contrato.limite_horas ?? 0,
      contrato.fecha_inicio ?? new Date(),
      contrato.fecha_fin ?? null
    );
    const updatedContratos = [...(emp.contratos ?? []), nuevo].map(contratoToPlain);
    await updateDoc(doc(db, 'empleados', empleadoId), { contratos: updatedContratos, updatedAt: Timestamp.now() });
  }

  async function removeContrato(empleadoId: string, contratoId: string) {
    const emp = empleados.value?.find(e => e.id === empleadoId);
    if (!emp) return;
    const updatedContratos = (emp.contratos ?? [])
      .filter(c => c.id !== contratoId)
      .map(contratoToPlain);
    await updateDoc(doc(db, 'empleados', empleadoId), { contratos: updatedContratos, updatedAt: Timestamp.now() });
  }

  async function updateContrato(empleadoId: string, contratoId: string, data: Partial<Pick<Contrato, 'cargo_id' | 'ubicacion_id' | 'active' | 'limite_horas' | 'fecha_fin'>>) {
    const emp = empleados.value?.find(e => e.id === empleadoId);
    if (!emp) return;
    const updatedContratos = (emp.contratos ?? []).map(c =>
      c.id === contratoId ? { ...c, ...data } : c
    ).map(contratoToPlain);
    await updateDoc(doc(db, 'empleados', empleadoId), { contratos: updatedContratos, updatedAt: Timestamp.now() });
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
    addContrato,
    removeContrato,
    updateContrato,
  };
});
