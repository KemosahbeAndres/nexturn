<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ mode === 'create' ? 'Añadir Empresa' : 'Editar Empresa' }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none">✕</button>
      </div>

      <form @submit.prevent="handleSave" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 overflow-y-auto flex-1 space-y-4">
          <!-- Tipo de Registro (Arriba de todo, ancho completo) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Registro</label>
            <select v-model="formData.type" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
              <option value="empresa">Empresa</option>
              <option value="pyme">PYME</option>
              <option value="personal">Marca Personal</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <!-- Formulario Completo (Para Empresa, Pyme, Personal) -->
          <template v-if="formData.type !== 'otros'">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT Empresa</label>
                <input v-model="formData.rut" @blur="searchExisting" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="12345678-9" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                <input v-model="formData.email" @blur="searchExisting" type="email" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial</label>
                <input v-model="formData.first_name" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón Social</label>
                <input v-model="formData.last_name" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
              </div>
            </div>
          </template>

          <!-- Nombre alternativo para el tipo "Otros" -->
          <template v-else>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Contacto</label>
              <input v-model="formData.first_name" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required>
            </div>
          </template>

          <!-- Slug (URL amigable) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (Identificador en la URL)</label>
            <div class="flex rounded-lg shadow-sm">
              <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300">
                nexturn.com/
              </span>
              <input v-model="formData.slug" @input="isSlugCustomized = true" type="text" class="flex-1 min-w-0 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-none rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white sm:text-sm" placeholder="mi-empresa">
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Solo letras minúsculas, números y guiones.</p>
          </div>

          <!-- Campos Comunes a ambos modos -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input v-model="formData.phone" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input v-model="formData.address" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white">
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button @click="$emit('close')" type="button" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors">Cancelar</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            {{ mode === 'create' ? 'Guardar Empresa' : 'Actualizar Cambios' }}
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

const props = defineProps<{ isOpen: boolean; mode: 'create' | 'edit'; initialData?: any; }>();
const emit = defineEmits(['close', 'save']);

const isSlugCustomized = ref(false);
const formData = ref({ rut: '', email: '', first_name: '', last_name: '', slug: '', phone: '', address: '', type: 'empresa' });

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.mode === 'edit' && props.initialData) {
      formData.value = {
        rut: props.initialData.contacto?.rut || '', email: props.initialData.contacto?.email || '',
        first_name: props.initialData.contacto?.first_name || '', last_name: props.initialData.contacto?.last_name || '',
        slug: props.initialData.slug || '',
        phone: props.initialData.contacto?.phone || '', address: props.initialData.contacto?.address || '',
        type: props.initialData.type || 'empresa'
      };
      isSlugCustomized.value = !!props.initialData.slug;
    } else {
      formData.value = { rut: '', email: '', first_name: '', last_name: '', slug: '', phone: '', address: '', type: 'empresa' };
      isSlugCustomized.value = false;
    }
  }
});

watch(() => formData.value.type, (newType) => {
  if (newType === 'otros') {
    formData.value.rut = '';
    formData.value.email = '';
    formData.value.last_name = '';
  }
});

// Generar el slug automáticamente si el usuario no lo ha tocado manualmente
watch(() => formData.value.first_name, (newName) => {
  if (!isSlugCustomized.value && newName) {
    formData.value.slug = newName
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remueve tildes
      .replace(/[^a-z0-9]+/g, '-') // Reemplaza espacios y símbolos por guiones
      .replace(/(^-|-$)+/g, ''); // Quita guiones iniciales o finales
  }
});

// Formatear el slug si el usuario lo edita a mano (previene espacios o mayúsculas en tiempo real)
watch(() => formData.value.slug, (newSlug) => {
  if (isSlugCustomized.value && newSlug) {
    formData.value.slug = newSlug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\-]+/g, '-');
  }
});

const searchExisting = async () => {
  if (props.mode !== 'create') return;
  if (!formData.value.rut && !formData.value.email) return;
  try {
    const q = formData.value.rut 
      ? query(collection(db, 'contactos'), where('rut', '==', formData.value.rut))
      : query(collection(db, 'contactos'), where('email', '==', formData.value.email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const c = snap.docs[0].data();
      formData.value.first_name = c.first_name || formData.value.first_name;
      formData.value.last_name = c.last_name || formData.value.last_name;
      formData.value.rut = c.rut || formData.value.rut;
      formData.value.email = c.email || formData.value.email;
      formData.value.phone = c.phone || formData.value.phone;
      formData.value.address = c.address || formData.value.address;
    }
  } catch (error) { console.error(error); }
};

const handleSave = () => {
  formData.value.slug = formData.value.slug.replace(/(^-|-$)+/g, ''); // Limpieza final de guiones colgados
  emit('save', { ...formData.value });
};
</script>