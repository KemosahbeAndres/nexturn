import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, getDocs, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase';
import { Empleado, empleadoConverter } from '../models/Empleado';
import { contactoConverter, type Contacto } from '../models/Contacto';
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

  const _empleados = useCollection(empleadosQuery);

  // Map externo contact_id → Contacto para sobrevivir los reemplazos de VueFire
  const contactosMap = ref<Map<string, Contacto>>(new Map());
  const contactosCargando = new Set<string>();

  watch(_empleados, async (lista) => {
    if (!lista) return;
    const pendientes = lista.filter(
      emp => emp.contact_id && !contactosMap.value.has(emp.contact_id) && !contactosCargando.has(emp.contact_id)
    );
    if (pendientes.length === 0) return;

    pendientes.forEach(emp => contactosCargando.add(emp.contact_id));

    const snaps = await Promise.all(
      pendientes.map(emp =>
        getDoc(doc(db, 'contactos', emp.contact_id).withConverter(contactoConverter))
          .catch(e => { console.error('Error hidratando contacto:', emp.id, e); return null; })
      )
    );

    snaps.forEach((snap, i) => {
      if (snap?.exists()) contactosMap.value.set(pendientes[i].contact_id, snap.data());
    });
  }, { deep: false });

  // Empleados con contacto siempre hidratado desde el Map externo (sin mutar el objeto de VueFire)
  const empleados = computed(() =>
    (_empleados.value ?? []).map(emp => {
      const contacto = emp.contacto ?? contactosMap.value.get(emp.contact_id);
      if (contacto && !emp.contacto) return Object.assign(Object.create(Object.getPrototypeOf(emp)), emp, { contacto });
      return emp;
    })
  );

  const empleadosActivos = computed(() => empleados.value.filter(e => e.active && !e.deletedAt));

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
