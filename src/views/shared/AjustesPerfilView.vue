<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-2xl space-y-6">

    <!-- Avatar + nombre -->
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-300 text-xl font-bold select-none">
        {{ initials }}
      </div>
      <div class="min-w-0">
        <p class="text-base font-semibold text-gray-900 dark:text-white truncate">{{ fullName }}</p>
        <span :class="roleBadgeClass" class="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-md capitalize">
          {{ formatRole(sessionStore.currentUser?.system_role ?? '') }}
        </span>
      </div>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleSave" class="space-y-4">
      <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Información personal</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input v-model="form.first_name" type="text" placeholder="Nombre"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
          <input v-model="form.last_name" type="text" placeholder="Apellido"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT</label>
          <input v-model="form.rut" type="text" placeholder="12345678-9"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
          <input v-model="form.phone" type="text" placeholder="+56 9 1234 5678"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo electrónico</label>
          <input v-model="form.email" type="email" placeholder="correo@ejemplo.com"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
          <input v-model="form.address" type="text" placeholder="Av. Ejemplo 123"
            class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
      </div>

      <p v-if="successMsg" class="text-sm text-green-600 dark:text-green-400 font-medium">{{ successMsg }}</p>
      <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 font-medium">{{ errorMsg }}</p>

      <div class="flex justify-end">
        <button type="submit" :disabled="saving"
          class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useSessionStore } from '../../stores/sessionStore';

const sessionStore = useSessionStore();

const form = ref({ first_name: '', last_name: '', rut: '', email: '', phone: '', address: '' });
const saving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

onMounted(() => {
  const c = sessionStore.currentUser?.contacto;
  if (c) {
    form.value = {
      first_name: c.first_name ?? '',
      last_name:  c.last_name  ?? '',
      rut:        c.rut        ?? '',
      email:      c.email      ?? '',
      phone:      c.phone      ?? '',
      address:    c.address    ?? '',
    };
  }
});

const initials = computed(() => {
  const f = form.value.first_name[0] ?? '';
  const l = form.value.last_name[0]  ?? '';
  return (f + l).toUpperCase() || '?';
});

const fullName = computed(() =>
  [form.value.first_name, form.value.last_name].filter(Boolean).join(' ') || '—'
);

const formatRole = (role: string) => role.replace(/_/g, ' ');

const roleBadgeClass = computed(() => {
  const map: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    admin:       'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    user:        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    visitor:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[sessionStore.currentUser?.system_role ?? ''] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
});

const handleSave = async () => {
  const contactId = sessionStore.currentUser?.contact_id;
  if (!contactId) return;
  saving.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    await updateDoc(doc(db, 'contactos', contactId), {
      first_name: form.value.first_name,
      last_name:  form.value.last_name,
      rut:        form.value.rut,
      email:      form.value.email,
      phone:      form.value.phone,
      address:    form.value.address,
    });
    if (sessionStore.currentUser?.contacto) {
      Object.assign(sessionStore.currentUser.contacto, form.value);
    }
    successMsg.value = 'Cambios guardados correctamente.';
    setTimeout(() => { successMsg.value = ''; }, 3000);
  } catch (e: any) {
    errorMsg.value = e.message ?? 'Error al guardar los cambios.';
  } finally {
    saving.value = false;
  }
};
</script>
