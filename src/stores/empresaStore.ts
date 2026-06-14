import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp, getDoc, documentId } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase';
import { Empresa, empresaConverter } from '../models/Empresa';
import type { EmpresaType } from '../models/Empresa';
import { contactoConverter } from '../models/Contacto';

export const useEmpresaStore = defineStore('empresa', () => {
  const empresasRef = collection(db, 'empresas').withConverter(empresaConverter);

  const queryParams = ref<{ role: string | null; empresaId: string | null }>({ role: null, empresaId: null });

  function listarEmpresas(role: string, empresaId?: string | null) {
    queryParams.value = { role, empresaId: empresaId || null };
  }

  const empresasQuery = computed(() => {
    if (!queryParams.value.role) return null;
    let q = query(empresasRef, where('deletedAt', '==', null));

    if (queryParams.value.role !== 'super_admin') {
      if (!queryParams.value.empresaId) return null;
      q = query(q, where(documentId(), '==', queryParams.value.empresaId));
    }
    return q;
  });

  const empresas = useCollection(empresasQuery);

  // Computed helpers para filtrar por tipo
  const empresasTipo = computed(() =>
    (empresas.value ?? []).filter(e => e.type === 'empresa')
  );
  const congregaciones = computed(() =>
    (empresas.value ?? []).filter(e => e.type === 'congregacion')
  );

  watch(empresas, async (nuevasEmpresas) => {
    if (!nuevasEmpresas) return;
    for (const emp of nuevasEmpresas) {
      if (!emp.contacto && emp.contact_id) {
        const contactRef = doc(db, 'contactos', emp.contact_id).withConverter(contactoConverter);
        const snap = await getDoc(contactRef);
        emp.contacto = snap.exists() ? snap.data() : { first_name: 'Desconocido', last_name: '' } as any;
      }
    }
  }, { deep: true });

  async function createEmpresa(data: { active: boolean; contact_id: string; type: EmpresaType; work_roles: string[]; slug: string }) {
    const docRef = doc(empresasRef);
    const newEmpresa = new Empresa(
      docRef.id,
      data.active,
      data.contact_id,
      data.type,
      data.work_roles,
      data.slug
    );
    await setDoc(docRef, newEmpresa);
    return docRef.id;
  }

  async function updateEmpresa(id: string, updateData: Partial<Omit<Empresa, 'id' | 'createdAt' | 'contacto'>>) {
    const docRef = doc(db, 'empresas', id);
    await updateDoc(docRef, { ...updateData, updatedAt: Timestamp.now() });
  }

  async function softDeleteEmpresa(id: string) {
    const docRef = doc(db, 'empresas', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  // Gestión de roles de trabajo (solo admin/super_admin)
  async function addWorkRole(empresaId: string, role: string) {
    const empresa = empresas.value?.find(e => e.id === empresaId);
    if (!empresa) return;
    const updated = [...new Set([...empresa.work_roles, role])];
    await updateEmpresa(empresaId, { work_roles: updated });
  }

  async function removeWorkRole(empresaId: string, role: string) {
    const empresa = empresas.value?.find(e => e.id === empresaId);
    if (!empresa) return;
    await updateEmpresa(empresaId, { work_roles: empresa.work_roles.filter(r => r !== role) });
  }

  return {
    empresas,
    empresasTipo,
    congregaciones,
    listarEmpresas,
    createEmpresa,
    updateEmpresa,
    softDeleteEmpresa,
    addWorkRole,
    removeWorkRole,
  };
});
