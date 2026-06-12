<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ mode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario' }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none">
          ✕
        </button>
      </div>

      <!-- Body (Formulario) -->
      <form @submit.prevent="handleSave" class="flex flex-col flex-1 overflow-hidden">
      <div class="p-6 overflow-y-auto flex-1 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT</label>
            <input v-model="formData.rut" @blur="searchExisting" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="12345678-9" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
            <input v-model="formData.email" @blur="searchExisting" type="email" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input v-model="formData.first_name" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
            <input v-model="formData.last_name" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
          </div>
        </div>

        <div v-if="mode === 'create'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña temporal (Requerida en Firebase Auth)</label>
          <input v-model="formData.password" type="password" required class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol en el Sistema</label>
          <select v-model="formData.system_role" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
            <option value="super_admin">Super Administrador (Global)</option>
            <option value="admin">Administrador de Empresa</option>
            <option value="user">Usuario (Gestión de Personal/Turnos)</option>
            <option value="visitor">Visitante (Solo lectura)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa a la que pertenece</label>
          <select v-model="formData.empresa_id" :required="formData.system_role !== 'super_admin'" :disabled="formData.system_role === 'super_admin'" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:text-white">
            <option value="">-- Seleccionar Empresa --</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nombre || 'Empresa sin nombre' }}
            </option>
          </select>
          <p v-if="formData.system_role === 'super_admin'" class="text-xs text-blue-500 mt-1">Los Super Administradores no están vinculados a una empresa específica.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
        <button @click="$emit('close')" type="button" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          {{ mode === 'create' ? 'Crear' : 'Guardar Cambios' }}
        </button>
      </div>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps<{
  isOpen: boolean;
  mode: 'create' | 'edit';
  empresas: any[];
  initialData?: any;
}>();

const emit = defineEmits(['close', 'save']);

const formData = ref({
  first_name: '', last_name: '', rut: '', email: '', password: '', empresa_id: '', system_role: 'user'
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.mode === 'edit' && props.initialData) {
      formData.value = {
        first_name: props.initialData.contacto?.first_name || '', last_name: props.initialData.contacto?.last_name || '',
        rut: props.initialData.contacto?.rut || '', email: props.initialData.contacto?.email || '',
        password: '',
        empresa_id: props.initialData.empresa_id || '', system_role: props.initialData.system_role || 'user'
      };
    } else {
      formData.value = { first_name: '', last_name: '', rut: '', email: '', password: '', empresa_id: '', system_role: 'user' };
    }
  }
});

const searchExisting = async () => {
  if (props.mode !== 'create') return;
  if (!formData.value.rut && !formData.value.email) return;

  try {
    const contactosRef = collection(db, 'contactos');
    const q = formData.value.rut 
      ? query(contactosRef, where('rut', '==', formData.value.rut))
      : query(contactosRef, where('email', '==', formData.value.email));
      
    const snap = await getDocs(q);
    if (!snap.empty) {
      const contact = snap.docs[0].data();
      const contactId = snap.docs[0].id;
      
      formData.value.first_name = contact.first_name || formData.value.first_name;
      formData.value.last_name = contact.last_name || formData.value.last_name;
      formData.value.rut = contact.rut || formData.value.rut;
      formData.value.email = contact.email || formData.value.email;

      const userSnap = await getDocs(query(collection(db, 'usuarios'), where('contact_id', '==', contactId)));
      if (!userSnap.empty) {
        const user = userSnap.docs[0].data();
        formData.value.empresa_id = user.empresa_id || formData.value.empresa_id;
        formData.value.system_role = user.system_role || formData.value.system_role;
      }
    }
  } catch (error) {
    console.error('Error al buscar datos existentes:', error);
  }
};

const handleSave = () => emit('save', { ...formData.value });
</script>