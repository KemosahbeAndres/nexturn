<template>
  <div class="flex flex-col gap-6">

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
import { ref, onMounted } from 'vue';
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
          first_name: data.first_name, last_name: data.last_name,
          email: data.email, deletedAt: null
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
          alert('El usuario ya existía. Se envió un correo de recuperación a ' + data.email);
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
          empresa_id: empresaIdToSave, system_role: data.system_role, deletedAt: null
        });
      } else {
        await usuarioStore.createUsuario({
          empresa_id: empresaIdToSave, contact_id: finalContactId, system_role: data.system_role
        });
      }

    } else if (modalMode.value === 'edit' && selectedUser.value) {
      if (selectedUser.value.contact_id) {
        await updateDoc(doc(db, 'contactos', selectedUser.value.contact_id), {
          first_name: data.first_name, last_name: data.last_name,
          rut: data.rut, email: data.email
        });
      }
      await usuarioStore.updateUsuario(selectedUser.value.id, {
        empresa_id: empresaIdToSave, system_role: data.system_role
      });
    }

    isModalOpen.value = false;
  } catch (error: any) {
    console.error('Error guardando usuario:', error);
    alert(error.message || 'Ocurrió un error al guardar el usuario.');
  }
};

const handleDeleteUser = async (user: any) => {
  if (!confirm(`¿Eliminar a ${user.contacto?.first_name || 'este usuario'}?`)) return;
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
