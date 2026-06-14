<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors duration-300">
    
    <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Empresas</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los inquilinos del sistema.</p>
      </div>
      <button v-if="sessionStore.currentUser?.system_role === 'super_admin'" @click="openModal('create')" class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
        + Añadir Empresa
      </button>
    </div>

    <!-- Tabla (lg+) -->
    <div v-if="empresaStore.empresas && empresaStore.empresas.length > 0" class="hidden lg:block overflow-x-auto overflow-y-visible rounded-b-xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Empresa</th>
            <th class="px-4 py-3 font-medium">RUT</th>
            <th class="px-4 py-3 font-medium">Correo</th>
            <th class="px-4 py-3 font-medium">Slug</th>
            <th class="px-4 py-3 font-medium">Tipo</th>
            <th class="px-4 py-3 font-medium">Estado</th>
            <th class="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-for="empresa in empresaStore.empresas" :key="empresa.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
              {{ empresa.contacto?.first_name || '—' }}
              <span class="block text-xs text-gray-400 font-normal">{{ empresa.contacto?.last_name }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{{ empresa.contacto?.rut || '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ empresa.contacto?.email || '—' }}</td>
            <td class="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-mono">{{ empresa.slug || '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">{{ empresa.type }}</td>
            <td class="px-4 py-3">
              <span :class="empresa.active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'" class="px-2 py-0.5 text-xs font-semibold rounded-md">
                {{ empresa.active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2 items-center">
                <router-link v-if="sessionStore.currentUser?.system_role === 'super_admin' && empresa.slug" :to="{ name: 'empresa-dashboard', params: { companySlug: empresa.slug } }" class="text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors">Ingresar</router-link>
                <button @click="openModal('edit', empresa)" class="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Editar</button>
                <button v-if="sessionStore.currentUser?.system_role === 'super_admin'" @click="handleDeleteCompany(empresa)" class="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">Desactivar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tarjetas (móvil) -->
    <!-- Tarjetas (móvil + tablet) -->
    <div v-if="empresaStore.empresas && empresaStore.empresas.length > 0" class="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
      <div v-for="empresa in empresaStore.empresas" :key="empresa.id" class="p-4 flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <!-- Avatar inicial -->
          <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300 font-bold text-sm">
            {{ (empresa.contacto?.first_name?.[0] ?? '?').toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {{ empresa.contacto?.first_name || '—' }}
              <span v-if="empresa.contacto?.last_name" class="font-normal"> {{ empresa.contacto.last_name }}</span>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ empresa.contacto?.email || '—' }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{{ empresa.contacto?.rut || '—' }}</p>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
              <span :class="empresa.active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'" class="inline-block px-2 py-0.5 text-xs font-semibold rounded-md">
                {{ empresa.active ? 'Activa' : 'Inactiva' }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500 capitalize">{{ empresa.type }}</span>
              <span class="text-xs text-blue-500 dark:text-blue-400 font-mono">{{ empresa.slug }}</span>
            </div>
          </div>
        </div>
        <!-- Menú 3 puntos -->
        <div class="relative shrink-0" :ref="el => { menuRefs[empresa.id] = el as Element }">
          <button @click.stop="openMenuId = openMenuId === empresa.id ? null : empresa.id" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
              <path d="M12 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
            </svg>
          </button>
          <div v-if="openMenuId === empresa.id" class="absolute right-0 top-9 z-20 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1">
            <router-link
              v-if="sessionStore.currentUser?.system_role === 'super_admin' && empresa.slug"
              :to="{ name: 'empresa-dashboard', params: { companySlug: empresa.slug } }"
              @click="openMenuId = null"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"/></svg>
              Ingresar
            </router-link>
            <button @click="openModal('edit', empresa); openMenuId = null" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
              Editar
            </button>
            <button v-if="sessionStore.currentUser?.system_role === 'super_admin'" @click="handleDeleteCompany(empresa); openMenuId = null" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              Desactivar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="!empresaStore.empresas || empresaStore.empresas.length === 0" class="p-12 flex flex-col items-center justify-center text-center">
      <div class="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
        </svg>
      </div>
      <p class="text-sm font-semibold text-gray-900 dark:text-white">Aún no hay empresas registradas</p>
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

// ---- Menú 3 puntos ----
const openMenuId = ref<string | null>(null);
const menuRefs: Record<string, Element | null> = {};

const onClickOutside = (e: MouseEvent) => {
  if (!openMenuId.value) return;
  const el = menuRefs[openMenuId.value];
  if (el && !el.contains(e.target as Node)) openMenuId.value = null;
};

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  if (sessionStore.currentUser) {
    empresaStore.listarEmpresas(
      sessionStore.currentUser.system_role,
      sessionStore.currentUser.empresa_id
    );
  }
  return () => document.removeEventListener('click', onClickOutside);
});
</script>