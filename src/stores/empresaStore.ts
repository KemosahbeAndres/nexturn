import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Ajusta esto a la ruta real de tu instancia de Firebase
import { Empresa, empresaConverter } from '../models/Empresa'

export const useEmpresaStore = defineStore('empresa', () => {
  // 1. Ref con converter nativo
  const empresasRef = collection(db, 'empresas').withConverter(empresaConverter);
  
  // 2. Filtro general para omitir documentos con Soft Delete
  const empresasQuery = query(empresasRef, where('deletedAt', '==', null));

  // 3. Estado local Reactivo manejado directamente por VueFire
  const empresas = useCollection(empresasQuery);

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
  async function updateEmpresa(id: string, updateData: Partial<Omit<Empresa, 'id' | 'createdAt' | 'deletedAt'>>) {
    const docRef = doc(empresasRef, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  // SOFT DELETE (Borrado Lógico)
  async function softDeleteEmpresa(id: string) {
    const docRef = doc(empresasRef, id);
    await updateDoc(docRef, {
      active: false,
      deletedAt: Timestamp.now()
    });
  }

  return { empresas, createEmpresa, updateEmpresa, softDeleteEmpresa };
});