<template>
  <form @submit.prevent="save" class="space-y-4">
    <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Información de la organización</p>

    <!-- Nombre + Razón social -->
    <div :class="empresa.isEmpresa ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ empresa.isEmpresa ? 'Nombre comercial' : 'Nombre' }}
        </label>
        <input v-model="form.first_name" type="text" required
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
      </div>
      <div v-if="empresa.isEmpresa">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón social</label>
        <input v-model="form.last_name" type="text"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
      </div>
    </div>

    <!-- RUT + Correo (empresa) -->
    <div v-if="empresa.isEmpresa" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT</label>
        <input v-model="form.rut" type="text"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono transition-colors">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo</label>
        <input v-model="form.email" type="email"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
      </div>
    </div>

    <!-- Correo opcional (congregacion) -->
    <div v-if="empresa.isCongregacion">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Correo de contacto <span class="font-normal text-gray-400">(opcional)</span>
      </label>
      <input v-model="form.email" type="email"
        class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
    </div>

    <!-- Teléfono + Dirección -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
        <input v-model="form.phone" type="text"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
        <input v-model="form.address" type="text"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
      </div>
    </div>

    <!-- Slug -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
      <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 transition-colors">
        <span class="inline-flex items-center px-3 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-sm border-r border-gray-200 dark:border-gray-600 shrink-0">
          nexturn.com/
        </span>
        <input v-model="form.slug" type="text"
          class="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white font-mono focus:outline-none">
      </div>
    </div>

    <!-- Tipo + Estado (solo lectura) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
        <p class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400">
          {{ empresa.isCongregacion ? 'Congregación' : 'Empresa' }}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
        <p class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg"
          :class="empresa.active ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
          {{ empresa.active ? 'Activa' : 'Inactiva' }}
        </p>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <button v-if="isDirty" type="button" @click="reset"
        class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        Deshacer
      </button>
      <button type="submit" :disabled="!isDirty || saving"
        class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
        {{ saving ? 'Guardando…' : 'Guardar cambios' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useEmpresaStore } from '../../stores/empresaStore';
import type { Empresa } from '../../models/Empresa';

const props = defineProps<{ empresa: Empresa }>();

const empresaStore = useEmpresaStore();
const saving = ref(false);

type InfoForm = {
  first_name: string; last_name: string; rut: string;
  email: string; phone: string; address: string; slug: string;
};

function fromEmpresa(): InfoForm {
  const c = props.empresa.contacto;
  return {
    first_name: c?.first_name ?? '',
    last_name:  c?.last_name  ?? '',
    rut:        c?.rut        ?? '',
    email:      c?.email      ?? '',
    phone:      c?.phone      ?? '',
    address:    c?.address    ?? '',
    slug:       props.empresa.slug,
  };
}

const form     = ref<InfoForm>(fromEmpresa());
const snapshot = ref<InfoForm>(fromEmpresa());

const isDirty = computed(() =>
  (Object.keys(form.value) as (keyof InfoForm)[]).some(k => form.value[k] !== snapshot.value[k])
);

// Re-sync cuando cambie la empresa desde el store (ej. otro tab o carga inicial)
watch(() => props.empresa, () => {
  const fresh = fromEmpresa();
  form.value     = { ...fresh };
  snapshot.value = { ...fresh };
}, { deep: true });

function reset() {
  form.value = { ...snapshot.value };
}

async function save() {
  if (!isDirty.value) return;
  saving.value = true;
  try {
    if (props.empresa.contact_id) {
      await updateDoc(doc(db, 'contactos', props.empresa.contact_id), {
        first_name: form.value.first_name,
        last_name:  form.value.last_name,
        rut:        form.value.rut,
        email:      form.value.email,
        phone:      form.value.phone,
        address:    form.value.address,
      });
    }
    const slug = form.value.slug.trim()
      || form.value.first_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    await empresaStore.updateEmpresa(props.empresa.id, { slug });
    form.value.slug    = slug;
    snapshot.value     = { ...form.value };
  } finally {
    saving.value = false;
  }
}
</script>
