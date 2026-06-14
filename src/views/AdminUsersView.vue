<template>
  <div class="flex flex-col gap-6">

    <!-- Tarjeta: Lista de Super Admins -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors duration-300">
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Super Administradores</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Cuentas con acceso total al sistema.</p>
        </div>
        <button
          @click="openModal('create')"
          class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          + Añadir Super Admin
        </button>
      </div>

      <div v-if="superAdmins.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <th class="p-4 font-medium">Nombre</th>
              <th class="p-4 font-medium">RUT</th>
              <th class="p-4 font-medium">Correo</th>
              <th class="p-4 font-medium">Rol en Sistema</th>
              <th class="p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="user in superAdmins"
              :key="user.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors"
            >
              <td class="p-4 text-sm text-gray-900 dark:text-white font-medium">
                {{ user.contacto?.first_name || 'Cargando...' }} {{ user.contacto?.last_name || '' }}
              </td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{{ user.contacto?.rut || '...' }}</td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ user.contacto?.email || '...' }}</td>
              <td class="p-4 text-sm">
                <span class="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-semibold rounded-md">
                  Super Admin
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

      <div v-else class="p-12 flex flex-col items-center justify-center text-center">
        <div class="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <span class="text-xl">🔐</span>
        </div>
        <h3 class="text-md font-semibold text-gray-900 dark:text-white">Sin super administradores</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">No hay cuentas con acceso total registradas.</p>
      </div>
    </div>

    <!-- Filtros multiempresa + Lista de usuarios de empresa -->
    <UserFilteredList
      mode="multi"
      :usuarios="usuarioStore.usuarios ?? []"
      :empresas="empresaStore.empresas ?? []"
      @add-user="openModal('create')"
      @edit-user="openModal('edit', $event)"
      @delete-user="handleDeleteUser"
    />

    <UserModal
      :is-open="isModalOpen"
      :mode="modalMode"
      :empresas="empresaStore.empresas"
      :initial-data="selectedUser"
      @close="isModalOpen = false"
      @save="handleSaveUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, firebaseApp } from '../firebase';
import { useUsuarioStore } from '../stores/usuarioStore';
import { useSessionStore } from '../stores/sessionStore';
import { useEmpresaStore } from '../stores/empresaStore';
import { Contacto, contactoConverter } from '../models/Contacto';
import UserModal from '../components/UserModal.vue';
import UserFilteredList from '../components/UserFilteredList.vue';

const usuarioStore = useUsuarioStore();
const sessionStore = useSessionStore();
const empresaStore = useEmpresaStore();

const superAdmins = computed(() =>
  (usuarioStore.usuarios ?? []).filter((u) => u.system_role === 'super_admin')
);

const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedUser = ref<any>(null);

const openModal = (mode: 'create' | 'edit', user: any = null) => {
  modalMode.value = mode;
  selectedUser.value = user;
  isModalOpen.value = true;
};

const handleSaveUser = async (data: any) => {
  try {
    const empresaIdToSave = data.system_role === 'super_admin' ? null : (data.empresa_id || null);

    if (modalMode.value === 'create') {
      const qRut = query(collection(db, 'contactos'), where('rut', '==', data.rut));
      const rutSnap = await getDocs(qRut);
      let finalContactId = '';

      if (!rutSnap.empty) {
        finalContactId = rutSnap.docs[0].id;
        await updateDoc(doc(db, 'contactos', finalContactId), {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          deletedAt: null
        });
      } else {
        const contactRef = doc(collection(db, 'contactos')).withConverter(contactoConverter);
        finalContactId = contactRef.id;
        await setDoc(contactRef, new Contacto(finalContactId, data.first_name, data.last_name, data.rut, data.email, '', '', false, true));
      }

      const secondaryApp = initializeApp(firebaseApp.options, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      try {
        await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          await sendPasswordResetEmail(secondaryAuth, data.email);
          alert('El usuario ya existía en Autenticación. Se ha enviado un correo de recuperación a ' + data.email + ' para restablecer la contraseña.');
        } else {
          throw e;
        }
      } finally {
        await deleteApp(secondaryApp);
      }

      const qUser = query(collection(db, 'usuarios'), where('contact_id', '==', finalContactId));
      const userSnap = await getDocs(qUser);

      if (!userSnap.empty) {
        await usuarioStore.updateUsuario(userSnap.docs[0].id, {
          empresa_id: empresaIdToSave,
          system_role: data.system_role,
          deletedAt: null
        });
      } else {
        await usuarioStore.createUsuario({
          empresa_id: empresaIdToSave,
          contact_id: finalContactId,
          system_role: data.system_role
        });
      }

    } else if (modalMode.value === 'edit' && selectedUser.value) {
      if (selectedUser.value.contact_id) {
        await updateDoc(doc(db, 'contactos', selectedUser.value.contact_id), {
          first_name: data.first_name,
          last_name: data.last_name,
          rut: data.rut,
          email: data.email
        });
      }
      await usuarioStore.updateUsuario(selectedUser.value.id, {
        empresa_id: empresaIdToSave,
        system_role: data.system_role
      });
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
    await usuarioStore.softDeleteUsuario(user.id);
    if (user.contact_id) {
      await updateDoc(doc(db, 'contactos', user.contact_id), { deletedAt: Timestamp.now() });
    }
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    alert('Ocurrió un error al eliminar el usuario.');
  }
};

onMounted(() => {
  if (sessionStore.currentUser?.system_role === 'super_admin') {
    usuarioStore.listarUsuarios('super_admin', null);
    empresaStore.listarEmpresas('super_admin', null);
  }
});
</script>
