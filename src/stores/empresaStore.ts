import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp, getDoc, documentId } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase'; // Ajusta esto a la ruta real de tu instancia de Firebase
import { Empresa, empresaConverter } from '../models/Empresa'
import { contactoConverter } from '../models/Contacto';

export const useEmpresaStore = defineStore('empresa', () => {
  // 1. Ref con converter nativo
  const empresasRef = collection(db, 'empresas').withConverter(empresaConverter);
  
  // 2. Parámetros reactivos de consulta
  const queryParams = ref<{ role: string | null; empresaId: string | null }>({ role: null, empresaId: null });

  function listarEmpresas(role: string, empresaId?: string | null) {
    queryParams.value = { role, empresaId: empresaId || null };
  }

  // 3. Filtro de base de datos protegido por rol
  const empresasQuery = computed(() => {
    if (!queryParams.value.role) return null;
    let q = query(empresasRef, where('deletedAt', '==', null));
    
    if (queryParams.value.role !== 'super_admin') {
      if (!queryParams.value.empresaId) return null;
      q = query(q, where(documentId(), '==', queryParams.value.empresaId));
    }
    return q;
  });

  // 4. Estado local Reactivo manejado directamente por VueFire
  const empresas = useCollection(empresasQuery);

  // 5. Hidratar la información de contacto de las empresas
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

  // CREATE
  async function createEmpresa(data: Omit<Empresa, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const docRef = doc(empresasRef);
    const newEmpresa = new Empresa(
      docRef.id,
      data.active,
      data.contact_id,
      data.type,
      data.work_roles
    );
    
    await setDoc(docRef, newEmpresa);
    return docRef.id;
  }

  // UPDATE
  async function updateEmpresa(id: string, updateData: Partial<Omit<Empresa, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'empresas', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  // SOFT DELETE (Borrado Lógico)
  async function softDeleteEmpresa(id: string) {
    const docRef = doc(db, 'empresas', id);
    await updateDoc(docRef, {
      active: false,
      deletedAt: Timestamp.now()
    });
  }

  return { empresas, listarEmpresas, createEmpresa, updateEmpresa, softDeleteEmpresa };
});