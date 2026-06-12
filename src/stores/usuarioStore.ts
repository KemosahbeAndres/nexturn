import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase'; // Ajusta esto a la ruta real de tu instancia de Firebase
import { Usuario, usuarioConverter } from '../models/Usuario';

export const useUsuarioStore = defineStore('usuario', () => {
  // 1. Ref con converter nativo
  const usuariosRef = collection(db, 'usuarios').withConverter(usuarioConverter);
  
  // 2. Parámetros de consulta reactivos locales del store
  const queryParams = ref<{ role: string | null; empresaId: string | null }>({
    role: null,
    empresaId: null
  });

  // 3. Acción estricta para inicializar la escucha de usuarios según rol
  function listarUsuarios(role: string, empresaId?: string | null) {
    if (role !== 'super_admin' && !empresaId) {
      throw new Error('El id de la empresa es obligatorio para listar usuarios, a menos que el rol sea super_admin.');
    }
    queryParams.value = { role, empresaId: empresaId || null };
  }

  // 4. Filtro computado: pausado (null) por defecto, o evaluado una vez seteado el contexto
  const usuariosQuery = computed(() => {
    if (!queryParams.value.role) return null; // Retornar null pausa VueFire dinámicamente

    let q = query(usuariosRef, where('deletedAt', '==', null));
    if (queryParams.value.role !== 'super_admin') {
      q = query(q, where('empresa_id', '==', queryParams.value.empresaId));
    }
    return q;
  });

  // 5. Estado local Reactivo manejado directamente por VueFire
  const usuarios = useCollection(usuariosQuery);

  // CREATE
  async function createUsuario(data: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    // 1. Verificación de integridad: empresa obligatoria según el rol del nuevo usuario
    if (data.system_role !== 'super_admin' && !data.empresa_id) {
      throw new Error('El id de la empresa es obligatorio para crear usuarios, a menos que el rol sea super_admin.');
    }

    // 2. Verificación de permisos del usuario activo (basado en el estado inicializado en queryParams)
    const { role: activeRole, empresaId: activeEmpresaId } = queryParams.value;

    if (!activeRole) {
      throw new Error('Contexto de seguridad no inicializado. Llame a listarUsuarios primero para verificar sus permisos.');
    }

    if (activeRole !== 'super_admin') {
      if (activeRole !== 'admin') {
        throw new Error('Permisos insuficientes: Solo los administradores pueden crear usuarios.');
      }
      if (data.empresa_id !== activeEmpresaId) {
        throw new Error('Operación denegada: Como administrador, solo puede crear usuarios para su propia empresa.');
      }
      if (data.system_role === 'super_admin') {
        throw new Error('Operación denegada: Un administrador no puede crear nuevas cuentas de nivel super_admin.');
      }
    }

    const docRef = doc(usuariosRef);
    const newUsuario = new Usuario(
      docRef.id,
      data.empresa_id,
      data.contact_id,
      data.password, 
      data.system_role
    );
    
    await setDoc(docRef, newUsuario);
    return docRef.id;
  }

  // UPDATE
  async function updateUsuario(id: string, updateData: Partial<Omit<Usuario, 'id' | 'createdAt' | 'deletedAt'>>) {
    const docRef = doc(usuariosRef, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  // SOFT DELETE (Borrado Lógico)
  async function softDeleteUsuario(id: string) {
    const docRef = doc(usuariosRef, id);
    await updateDoc(docRef, {
      deletedAt: Timestamp.now()
    });
  }

  return { usuarios, listarUsuarios, createUsuario, updateUsuario, softDeleteUsuario };
});