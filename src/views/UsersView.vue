<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors duration-300">
    
    <!-- Cabecera de la tabla -->
    <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Usuarios</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los accesos al sistema.</p>
      </div>
      <button @click="openModal('create')" class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
        + Añadir Usuario
      </button>
    </div>

    <!-- Tabla de Usuarios -->
    <div v-if="usuarioStore.usuarios && usuarioStore.usuarios.length > 0" class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <th class="p-4 font-medium">Nombre</th>
            <th class="p-4 font-medium">RUT</th>
            <th class="p-4 font-medium">Correo</th>
            <th class="p-4 font-medium">Empresa</th>
            <th class="p-4 font-medium">Rol en Sistema</th>
            <th class="p-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="user in usuarioStore.usuarios" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors">
            <td class="p-4 text-sm text-gray-900 dark:text-white font-medium">{{ user.contacto?.first_name || 'Cargando...' }} {{ user.contacto?.last_name || '' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{{ user.contacto?.rut || '...' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ user.contacto?.email || '...' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{{ user.empresa?.nombre || (user.empresa_id ? 'Cargando...' : 'N/A') }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
              <span class="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-md">
                {{ user.system_role.replace('_', ' ') }}
              </span>
            </td>
            <td class="p-4 text-sm flex gap-3">
              <button @click="openModal('edit', user)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">Editar</button>
              <button @click="handleDeleteUser(user)" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Contenido vacío -->
    <div v-else class="p-16 flex flex-col items-center justify-center text-center">
      <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <span class="text-2xl">👥</span>
      </div>
      <h3 class="text-md font-semibold text-gray-900 dark:text-white">Aún no hay registros</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
        Aquí aparecerá el listado obtenido desde Firestore. Utiliza el botón superior para empezar a registrar.
      </p>
    </div>

    <!-- Instancia del Modal -->
    <UserModal
      :is-open="isModalOpen"
      :mode="modalMode"
      :empresas="empresas"
      :initial-data="selectedUser"
      @close="isModalOpen = false"
      @save="handleSaveUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useCollection } from 'vuefire';
import { db, firebaseApp } from '../firebase';
import { useUsuarioStore } from '../stores/usuarioStore';
import { useSessionStore } from '../stores/sessionStore';
import { Contacto, contactoConverter } from '../models/Contacto';
import UserModal from '../components/UserModal.vue';

const usuarioStore = useUsuarioStore();
const sessionStore = useSessionStore();

// Estado del Modal
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedUser = ref<any>(null);

// Colección de empresas para llenar el "Select" del Modal
const empresas = useCollection(collection(db, 'empresas'));

const openModal = (mode: 'create' | 'edit', user: any = null) => {
  modalMode.value = mode;
  selectedUser.value = user;
  isModalOpen.value = true;
};

const handleSaveUser = async (data: any) => {
  try {
    // Ajuste de regla estricta: Si es super_admin, forzamos empresa_id a nulo.
    const empresaIdToSave = data.system_role === 'super_admin' ? null : (data.empresa_id || null);

    if (modalMode.value === 'create') {
      // 1. Buscar si el contacto/RUT ya existe (incluso si está borrado)
      const qRut = query(collection(db, 'contactos'), where('rut', '==', data.rut));
      const rutSnap = await getDocs(qRut);
      
      let finalContactId = '';

      if (!rutSnap.empty) {
        const existingContactDoc = rutSnap.docs[0];
        const existingContact = existingContactDoc.data();

        // Si existe (activo o borrado), actualizamos su info básica y aseguramos que no esté borrado
        finalContactId = existingContactDoc.id;
        const contactRef = doc(db, 'contactos', finalContactId);
        await updateDoc(contactRef, {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          deletedAt: null // <- Restauración
        });

      } else {
        // Flujo normal si el RUT es completamente nuevo
        const contactRef = doc(collection(db, 'contactos')).withConverter(contactoConverter);
        finalContactId = contactRef.id;
        const newContacto = new Contacto(
          finalContactId, data.first_name, data.last_name, data.rut, data.email, '', '', false, true
        );
        await setDoc(contactRef, newContacto);
      }
      
      // 2. Crear el usuario en Firebase Auth sin afectar la sesión del admin
      const secondaryApp = initializeApp(firebaseApp.options, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      try {
        await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          console.warn('El correo ya existe en Firebase Auth. Se reutilizará la cuenta existente.');
          await sendPasswordResetEmail(secondaryAuth, data.email);
          alert('Nota: El usuario ya existía en Autenticación. Por seguridad de Firebase no podemos cambiar su clave directamente. Se ha enviado un correo de recuperación a ' + data.email + ' para que pueda establecer una nueva.');
        } else {
          throw e;
        }
      } finally {
        await deleteApp(secondaryApp);
      }
      
      // 3. Restaurar o Crear el documento de Usuario en Firestore
      const qUser = query(collection(db, 'usuarios'), where('contact_id', '==', finalContactId));
      const userSnap = await getDocs(qUser);
      
      if (!userSnap.empty) {
        // Si el perfil de usuario existía, lo revivimos actualizando rol y empresa
        const existingUserDoc = userSnap.docs[0];
        await usuarioStore.updateUsuario(existingUserDoc.id, {
          empresa_id: empresaIdToSave,
          system_role: data.system_role,
          deletedAt: null // <- Restauración
        });
      } else {
        await usuarioStore.createUsuario({
          empresa_id: empresaIdToSave,
          contact_id: finalContactId,
          system_role: data.system_role
        });
      }

    } else if (modalMode.value === 'edit' && selectedUser.value) {
      // 1. Actualizar documento de Contacto
      if (selectedUser.value.contact_id) {
        const contactRef = doc(db, 'contactos', selectedUser.value.contact_id);
        await updateDoc(contactRef, {
          first_name: data.first_name,
          last_name: data.last_name,
          rut: data.rut,
          email: data.email
        });
      }
      const userUpdates: any = { empresa_id: empresaIdToSave, system_role: data.system_role };
      // Ya no tocamos la contraseña durante la edición
      await usuarioStore.updateUsuario(selectedUser.value.id, userUpdates);
    }

    isModalOpen.value = false;
  } catch (error: any) {
    console.error('Error guardando usuario:', error);
    alert(error.message || 'Ocurrió un error al guardar el usuario.');
  }
};

const handleDeleteUser = async (user: any) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar a ${user.contacto?.first_name || 'este usuario'}? Esta acción le impedirá acceder al sistema.`)) return;

  try {
    // Ya no podemos borrar de Firebase Auth desde el cliente al no almacenar contraseñas.
    // Sin embargo, el Soft Delete en Firestore le impedirá acceder a la plataforma.
    
    // 1. Realizar el borrado lógico en Firestore (Usuario)
    await usuarioStore.softDeleteUsuario(user.id);
    
    // 2. Realizar el borrado lógico en Firestore (Contacto)
    if (user.contact_id) {
      const contactRef = doc(db, 'contactos', user.contact_id);
      await updateDoc(contactRef, {
        deletedAt: Timestamp.now()
      });
    }
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    alert('Ocurrió un error al eliminar el usuario.');
  }
};

onMounted(() => {
  // Inicia la escucha de la colección Firebase utilizando el contexto de seguridad del usuario actual
  if (sessionStore.currentUser) {
    usuarioStore.listarUsuarios(
      sessionStore.currentUser.system_role,
      sessionStore.currentUser.empresa_id
    );
  }
});
</script>