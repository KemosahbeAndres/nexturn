<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          {{ mode === 'create' ? 'Añadir Organización' : 'Editar Organización' }}
        </h3>
        <button @click="$emit('close')" type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none">✕</button>
      </div>

      <form @submit.prevent="handleSave" class="flex flex-col flex-1 overflow-hidden">
        <div class="p-6 overflow-y-auto flex-1 space-y-5">

          <!-- Pills de tipo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Organización</label>
            <div class="flex gap-3">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                @click="selectType(option.value)"
                :class="[
                  'flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm',
                  formData.type === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                ]"
              >
                <span class="text-xl">{{ option.icon }}</span>
                <span>{{ option.label }}</span>
                <span class="text-xs font-normal opacity-70">{{ option.description }}</span>
              </button>
            </div>
          </div>

          <!-- Campos compartidos: Nombre principal -->
          <div :class="formData.type === 'empresa' ? 'grid grid-cols-2 gap-4' : ''">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ formData.type === 'empresa' ? 'Nombre Comercial' : 'Nombre de la Congregación' }}
              </label>
              <input
                v-model="formData.first_name"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                :placeholder="formData.type === 'empresa' ? 'Ej: Burger King Chile' : 'Ej: Congregación Lauca'"
                required
              >
            </div>
            <!-- Razón social solo para empresas -->
            <div v-if="formData.type === 'empresa'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón Social</label>
              <input
                v-model="formData.last_name"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="Ej: Operaciones BK SpA"
              >
            </div>
          </div>

          <!-- RUT + Email (solo empresa) / Email opcional (congregacion) -->
          <div v-if="formData.type === 'empresa'" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT Empresa</label>
              <input
                v-model="formData.rut"
                @blur="searchExisting"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="12345678-9"
                required
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
              <input
                v-model="formData.email"
                @blur="searchExisting"
                type="email"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                required
              >
            </div>
          </div>

          <div v-if="formData.type === 'congregacion'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo de Contacto <span class="font-normal text-gray-400">(opcional)</span></label>
            <input
              v-model="formData.email"
              type="email"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="correo@congregacion.com"
            >
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (Identificador en la URL)</label>
            <div class="flex rounded-lg shadow-sm">
              <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300">
                nexturn.com/
              </span>
              <input
                v-model="formData.slug"
                @input="isSlugCustomized = true"
                type="text"
                class="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-none rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                placeholder="mi-organizacion"
              >
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Solo letras minúsculas, números y guiones. Se genera automáticamente.</p>
          </div>

          <!-- Teléfono + Dirección -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input
                v-model="formData.phone"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="+56 9 1234 5678"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input
                v-model="formData.address"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                placeholder="Calle 123, Ciudad"
              >
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button
            @click="$emit('close')"
            type="button"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            {{ mode === 'create' ? 'Guardar' : 'Actualizar' }}
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
import type { EmpresaType } from '../models/Empresa';

const props = defineProps<{ isOpen: boolean; mode: 'create' | 'edit'; initialData?: any }>();
const emit = defineEmits(['close', 'save']);

const typeOptions: { value: EmpresaType; label: string; icon: string; description: string }[] = [
  { value: 'empresa',      label: 'Empresa',      icon: '🏢', description: 'Con RUT y razón social' },
  { value: 'congregacion', label: 'Congregación',  icon: '⛪', description: 'Sin datos tributarios' },
];

type FormData = {
  type: EmpresaType;
  rut: string;
  email: string;
  first_name: string;
  last_name: string;
  slug: string;
  phone: string;
  address: string;
};

const defaultForm = (): FormData => ({
  type: 'empresa', rut: '', email: '', first_name: '',
  last_name: '', slug: '', phone: '', address: '',
});

const formData = ref<FormData>(defaultForm());
const isSlugCustomized = ref(false);

function selectType(type: EmpresaType) {
  formData.value.type = type;
  if (type === 'congregacion') {
    formData.value.rut = '';
    formData.value.last_name = '';
  }
}

// Poblar el form al abrir
watch(() => props.isOpen, (newVal) => {
  if (!newVal) return;
  if (props.mode === 'edit' && props.initialData) {
    formData.value = {
      type: props.initialData.type || 'empresa',
      rut: props.initialData.contacto?.rut || '',
      email: props.initialData.contacto?.email || '',
      first_name: props.initialData.contacto?.first_name || '',
      last_name: props.initialData.contacto?.last_name || '',
      slug: props.initialData.slug || '',
      phone: props.initialData.contacto?.phone || '',
      address: props.initialData.contacto?.address || '',
    };
    isSlugCustomized.value = !!props.initialData.slug;
  } else {
    const preset = defaultForm();
    if (props.initialData?.type) preset.type = props.initialData.type;
    formData.value = preset;
    isSlugCustomized.value = false;
  }
});

// Auto-slug desde el nombre
watch(() => formData.value.first_name, (newName) => {
  if (isSlugCustomized.value || !newName) return;
  formData.value.slug = newName
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
});

// Normalizar slug al editar manualmente
watch(() => formData.value.slug, (newSlug) => {
  if (!isSlugCustomized.value || !newSlug) return;
  formData.value.slug = newSlug
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\-]+/g, '-');
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
      formData.value.last_name  = c.last_name  || formData.value.last_name;
      formData.value.rut        = c.rut        || formData.value.rut;
      formData.value.email      = c.email      || formData.value.email;
      formData.value.phone      = c.phone      || formData.value.phone;
      formData.value.address    = c.address    || formData.value.address;
    }
  } catch (error) { console.error(error); }
};

const handleSave = () => {
  formData.value.slug = formData.value.slug.replace(/(^-|-$)+/g, '');
  emit('save', { ...formData.value });
};
</script>
