<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-colors duration-300">
    
    <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Empresas</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los inquilinos del sistema.</p>
      </div>
      <button v-if="sessionStore.currentUser?.system_role === 'super_admin'" @click="openModal('create')" class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
        + Añadir Empresa
      </button>
    </div>

    <div v-if="empresaStore.empresas && empresaStore.empresas.length > 0" class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <th class="p-4 font-medium">Empresa</th>
            <th class="p-4 font-medium">RUT</th>
            <th class="p-4 font-medium">Correo Principal</th>
            <th class="p-4 font-medium">Slug</th>
            <th class="p-4 font-medium">Tipo</th>
            <th class="p-4 font-medium">Estado</th>
            <th class="p-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="empresa in empresaStore.empresas" :key="empresa.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors">
            <td class="p-4 text-sm text-gray-900 dark:text-white font-medium">
              {{ empresa.contacto?.first_name || 'Cargando...' }}
              <span class="block text-xs text-gray-500 font-normal">{{ empresa.contacto?.last_name }}</span>
            </td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{{ empresa.contacto?.rut || 'N/A' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ empresa.contacto?.email || 'N/A' }}</td>
            <td class="p-4 text-sm text-blue-600 dark:text-blue-400 font-mono">{{ empresa.slug || 'N/A' }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-300 capitalize">{{ empresa.type }}</td>
            <td class="p-4 text-sm">
              <span :class="['px-2 py-1 text-xs font-semibold rounded-md', empresa.active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300']">
                {{ empresa.active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="p-4 text-sm flex gap-3">
              <router-link v-if="sessionStore.currentUser?.system_role === 'super_admin' && empresa.slug" :to="{ name: 'empresa-dashboard', params: { companySlug: empresa.slug } }" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors">
                Ingresar
              </router-link>
              <button @click="openModal('edit', empresa)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">Editar</button>
              <button v-if="sessionStore.currentUser?.system_role === 'super_admin'" @click="handleDeleteCompany(empresa)" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors">Desactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="p-16 flex flex-col items-center justify-center text-center">
      <div class="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <span class="text-2xl">🏢</span>
      </div>
      <h3 class="text-md font-semibold text-gray-900 dark:text-white">Aún no hay empresas registradas</h3>
    </div>

    <CompanyModal :is-open="isModalOpen" :mode="modalMode" :initial-data="selectedCompany" @close="isModalOpen = false" @save="handleSaveCompany" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useEmpresaStore } from '../stores/empresaStore';
import { useSessionStore } from '../stores/sessionStore';
import { Contacto, contactoConverter } from '../models/Contacto';
import CompanyModal from '../components/CompanyModal.vue';

const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();

const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedCompany = ref<any>(null);

const openModal = (mode: 'create' | 'edit', empresa: any = null) => {
  modalMode.value = mode;
  selectedCompany.value = empresa;
  isModalOpen.value = true;
};

const handleSaveCompany = async (data: any) => {
  try {
    if (modalMode.value === 'create') {
      let finalContactId = '';

      // Solo buscar si la empresa tiene RUT (omite cuando es 'otros' con string vacío)
      if (data.rut) {
        const qRut = query(collection(db, 'contactos'), where('rut', '==', data.rut));
        const rutSnap = await getDocs(qRut);
        if (!rutSnap.empty) {
          const existingDoc = rutSnap.docs[0];
          finalContactId = existingDoc.id;
          await updateDoc(doc(db, 'contactos', finalContactId), {
            first_name: data.first_name, last_name: data.last_name,
            email: data.email, phone: data.phone, address: data.address,
            is_company: true, deletedAt: null
          });
        }
      }
      
      if (!finalContactId) {
        const contactRef = doc(collection(db, 'contactos')).withConverter(contactoConverter);
        finalContactId = contactRef.id;
        const newContacto = new Contacto(
          finalContactId, data.first_name, data.last_name, data.rut, data.email, data.phone, data.address, true, true
        );
        await setDoc(contactRef, newContacto);
      }

      // Usamos el slug personalizado o generamos uno desde el nombre
      const baseName = data.first_name || 'empresa';
      const slug = data.slug || baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Buscar si la empresa estaba borrada y revivirla, o crear nueva
      const qEmp = query(collection(db, 'empresas'), where('contact_id', '==', finalContactId));
      const empSnap = await getDocs(qEmp);
      if (!empSnap.empty) {
        await empresaStore.updateEmpresa(empSnap.docs[0].id, { type: data.type, active: true, deletedAt: null, slug });
      } else {
        await empresaStore.createEmpresa({ active: true, contact_id: finalContactId, type: data.type, work_roles: [], slug });
      }
    } else if (modalMode.value === 'edit' && selectedCompany.value) {
      if (selectedCompany.value.contact_id) {
        await updateDoc(doc(db, 'contactos', selectedCompany.value.contact_id), {
          first_name: data.first_name, last_name: data.last_name,
          rut: data.rut, email: data.email, phone: data.phone, address: data.address
        });
      }
      const baseName = data.first_name || 'empresa';
      const slug = data.slug || baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await empresaStore.updateEmpresa(selectedCompany.value.id, { type: data.type, slug });
    }
    isModalOpen.value = false;
  } catch (error: any) {
    console.error(error);
    alert(error.message);
  }
};

const handleDeleteCompany = async (empresa: any) => {
  if (!confirm(`¿Desactivar ${empresa.contacto?.first_name || 'esta empresa'}?`)) return;
  try {
    await empresaStore.softDeleteEmpresa(empresa.id);
    if (empresa.contact_id) {
      await updateDoc(doc(db, 'contactos', empresa.contact_id), { deletedAt: Timestamp.now(), active: false });
    }
  } catch (error: any) {
    console.error(error);
  }
};

onMounted(() => {
  if (sessionStore.currentUser) {
    empresaStore.listarEmpresas(
      sessionStore.currentUser.system_role,
      sessionStore.currentUser.empresa_id
    );
  }
});
</script>