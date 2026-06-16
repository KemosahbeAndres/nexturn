<template>
  <div class="flex h-full min-h-0 overflow-hidden">

    <!-- ── Panel izquierdo: lista ─────────────────────────────── -->
    <div class="w-1/2 flex flex-col border-r border-gray-100 dark:border-gray-700 overflow-hidden">

      <!-- Cabecera -->
      <div class="px-4 sm:px-6 pt-5 pb-3 shrink-0 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Usuarios
            <span class="ml-1.5 font-normal normal-case">{{ filteredUsers.length }}</span>
          </p>
          <button @click="openCreateModal"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0">
            + Añadir
          </button>
        </div>
        <!-- Búsqueda -->
        <div class="relative">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input v-model="searchText" type="text" placeholder="Buscar por nombre, email o RUT..."
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
        </div>
      </div>

      <!-- Lista scrollable -->
      <div class="flex-1 overflow-y-auto px-2 sm:px-3 pb-4 space-y-0.5">
        <div v-if="filteredUsers.length === 0" class="flex flex-col items-center justify-center py-16 text-center px-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-9 h-9 text-gray-300 dark:text-gray-600 mb-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
          </svg>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ searchText.trim() ? 'Sin resultados' : 'Aún no hay usuarios' }}
          </p>
        </div>

        <button
          v-for="user in filteredUsers"
          :key="user.id"
          @click="selectUser(user)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
          :class="selectedUser?.id === user.id
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/40 border border-transparent'"
        >
          <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            :class="selectedUser?.id === user.id
              ? 'bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
            {{ initials(user) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate"
              :class="selectedUser?.id === user.id ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'">
              {{ user.contacto?.first_name || '—' }} {{ user.contacto?.last_name || '' }}
            </p>
            <p class="text-xs truncate text-gray-400 dark:text-gray-500">{{ user.contacto?.email || '—' }}</p>
          </div>
          <span :class="roleBadgeClass(user.system_role)"
            class="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize hidden sm:inline-block">
            {{ roleLabel(user.system_role) }}
          </span>
        </button>
      </div>
    </div>

    <!-- ── Panel derecho: editor ──────────────────────────────── -->
    <div class="w-1/2 flex flex-col overflow-hidden">

      <!-- Estado vacío -->
      <div v-if="!selectedUser" class="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 text-gray-400 dark:text-gray-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Selecciona un usuario</p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Haz clic en uno de la lista para editarlo</p>
      </div>

      <!-- Formulario de edición -->
      <template v-else>
        <!-- Cabecera del editor -->
        <div class="px-4 sm:px-6 pt-5 pb-4 shrink-0 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/60 flex items-center justify-center shrink-0 text-sm font-bold text-blue-700 dark:text-blue-300">
            {{ initials(selectedUser) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {{ selectedUser.contacto?.first_name || '—' }} {{ selectedUser.contacto?.last_name || '' }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ selectedUser.contacto?.email || '—' }}</p>
          </div>
          <button @click="handleDeleteUser(selectedUser)"
            class="shrink-0 p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
            title="Eliminar usuario">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>

        <!-- Campos del formulario -->
        <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <p v-if="saveError" class="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{{ saveError }}</p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
              <input v-model="editForm.first_name" type="text"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Apellido</label>
              <input v-model="editForm.last_name" type="text"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RUT</label>
            <input v-model="editForm.rut" type="text"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Correo electrónico</label>
            <input v-model="editForm.email" type="email"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rol en el sistema</label>
            <select v-model="editForm.system_role"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors">
              <option value="admin">Administrador de empresa</option>
              <option value="user">Usuario (gestión de personal/turnos)</option>
              <option value="visitor">Visitante (solo lectura)</option>
            </select>
            <div class="mt-2">
              <span :class="roleBadgeClass(editForm.system_role)" class="px-2.5 py-1 text-xs font-semibold rounded-full capitalize">
                {{ roleLabel(editForm.system_role) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="px-4 sm:px-6 py-4 shrink-0 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button @click="discardChanges" :disabled="!isDirty"
            class="flex-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
            Descartar
          </button>
          <button @click="saveChanges" :disabled="!isDirty || saving"
            class="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 transition-colors">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </template>
    </div>
  </div>

  <!-- Modal solo para crear -->
  <UserModal
    :is-open="isModalOpen"
    mode="create"
    :empresas="empresaStore.empresas"
    :initial-data="null"
    @close="isModalOpen = false"
    @save="handleCreateUser"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRoute } from 'vue-router';
import { db, firebaseApp } from '../../firebase';
import { useUsuarioStore } from '../../stores/usuarioStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { Contacto, contactoConverter } from '../../models/Contacto';
import UserModal from '../../components/UserModal.vue';

const usuarioStore = useUsuarioStore();
const sessionStore = useSessionStore();
const route = useRoute();
const empresaStore = useEmpresaStore();

const resolvedEmpresaId = ref<string | null>(null);

const companyUsers = computed(() => {
  const list = usuarioStore.usuarios ?? [];
  if (!resolvedEmpresaId.value) return list.filter(u => u.system_role !== 'super_admin');
  return list.filter(u => u.system_role !== 'super_admin' && u.empresa_id === resolvedEmpresaId.value);
});

const searchText = ref('');
const filteredUsers = computed(() => {
  const term = searchText.value.trim().toLowerCase();
  if (!term) return companyUsers.value;
  return companyUsers.value.filter(u => {
    const fullName = `${u.contacto?.first_name ?? ''} ${u.contacto?.last_name ?? ''}`.toLowerCase();
    const email = (u.contacto?.email ?? '').toLowerCase();
    const rut = (u.contacto?.rut ?? '').toLowerCase();
    return fullName.includes(term) || email.includes(term) || rut.includes(term);
  });
});

// ── Selección y formulario de edición ────────────────────────
const selectedUser = ref<any>(null);

type EditForm = { first_name: string; last_name: string; rut: string; email: string; system_role: string };
const editForm = ref<EditForm>({ first_name: '', last_name: '', rut: '', email: '', system_role: 'user' });
const snapshot = ref<EditForm>({ first_name: '', last_name: '', rut: '', email: '', system_role: 'user' });
const saving = ref(false);
const saveError = ref('');

const isDirty = computed(() =>
  editForm.value.first_name !== snapshot.value.first_name ||
  editForm.value.last_name  !== snapshot.value.last_name  ||
  editForm.value.rut        !== snapshot.value.rut        ||
  editForm.value.email      !== snapshot.value.email      ||
  editForm.value.system_role !== snapshot.value.system_role
);

function selectUser(user: any) {
  selectedUser.value = user;
  saveError.value = '';
  const form: EditForm = {
    first_name:  user.contacto?.first_name  || '',
    last_name:   user.contacto?.last_name   || '',
    rut:         user.contacto?.rut         || '',
    email:       user.contacto?.email       || '',
    system_role: user.system_role || 'user',
  };
  editForm.value  = { ...form };
  snapshot.value  = { ...form };
}

// Si el usuario seleccionado se actualiza reactivamente en el store, sincroniza
watch(companyUsers, (list) => {
  if (!selectedUser.value) return;
  const updated = list.find(u => u.id === selectedUser.value.id);
  if (updated) selectedUser.value = updated;
}, { deep: true });

function discardChanges() {
  editForm.value = { ...snapshot.value };
  saveError.value = '';
}

async function saveChanges() {
  if (!selectedUser.value || !isDirty.value) return;
  saving.value = true;
  saveError.value = '';
  try {
    if (selectedUser.value.contact_id) {
      await updateDoc(doc(db, 'contactos', selectedUser.value.contact_id), {
        first_name: editForm.value.first_name,
        last_name:  editForm.value.last_name,
        rut:        editForm.value.rut,
        email:      editForm.value.email,
      });
    }
    await usuarioStore.updateUsuario(selectedUser.value.id, {
      empresa_id:  resolvedEmpresaId.value,
      system_role: editForm.value.system_role,
    });
    snapshot.value = { ...editForm.value };
  } catch (e: any) {
    saveError.value = e.message || 'Error al guardar.';
  } finally {
    saving.value = false;
  }
}

// ── Modal de creación ─────────────────────────────────────────
const isModalOpen = ref(false);

function openCreateModal() {
  isModalOpen.value = true;
}

const handleCreateUser = async (data: any) => {
  try {
    const empresaIdToSave = resolvedEmpresaId.value;

    const qRut = query(collection(db, 'contactos'), where('rut', '==', data.rut));
    const rutSnap = await getDocs(qRut);
    let finalContactId = '';

    if (!rutSnap.empty) {
      finalContactId = rutSnap.docs[0].id;
      await updateDoc(doc(db, 'contactos', finalContactId), {
        first_name: data.first_name, last_name: data.last_name,
        email: data.email, deletedAt: null,
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
      } else { throw e; }
    } finally {
      await deleteApp(secondaryApp);
    }

    const qUser = query(collection(db, 'usuarios'), where('contact_id', '==', finalContactId));
    const userSnap = await getDocs(qUser);

    if (!userSnap.empty) {
      await usuarioStore.updateUsuario(userSnap.docs[0].id, {
        empresa_id: empresaIdToSave, system_role: data.system_role, deletedAt: null,
      });
    } else {
      await usuarioStore.createUsuario({
        empresa_id: empresaIdToSave, contact_id: finalContactId, system_role: data.system_role,
      });
    }

    isModalOpen.value = false;
  } catch (error: any) {
    alert(error.message || 'Ocurrió un error al crear el usuario.');
  }
};

// ── Eliminar ──────────────────────────────────────────────────
const handleDeleteUser = async (user: any) => {
  if (user.empresa_id !== resolvedEmpresaId.value) return;
  if (!confirm(`¿Eliminar a ${user.contacto?.first_name || 'este usuario'}?`)) return;
  try {
    await usuarioStore.softDeleteUsuario(user.id);
    if (user.contact_id) {
      await updateDoc(doc(db, 'contactos', user.contact_id), { deletedAt: Timestamp.now() });
    }
    selectedUser.value = null;
  } catch {
    alert('Ocurrió un error al eliminar el usuario.');
  }
};

// ── Helpers ───────────────────────────────────────────────────
function initials(user: any): string {
  const fn = user.contacto?.first_name?.[0] ?? '';
  const ln = user.contacto?.last_name?.[0] ?? '';
  return (fn + ln).toUpperCase() || '?';
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:   'Admin',
  user:    'Usuario',
  visitor: 'Visitante',
};
function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role;
}

const roleBadgeClass = (role: string) => {
  const map: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    admin:       'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    user:        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    visitor:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
};

// ── Inicialización ────────────────────────────────────────────
onMounted(async () => {
  if (!sessionStore.currentUser) return;

  let roleToFetch = sessionStore.currentUser.system_role;
  let empresaIdToFetch = sessionStore.currentUser.empresa_id;

  if (roleToFetch === 'super_admin' && route.params.companySlug) {
    const qEmp = query(collection(db, 'empresas'), where('slug', '==', route.params.companySlug));
    const snap = await getDocs(qEmp);
    if (!snap.empty) {
      roleToFetch = 'admin';
      empresaIdToFetch = snap.docs[0].id;
    }
  }

  resolvedEmpresaId.value = empresaIdToFetch ?? null;
  usuarioStore.listarUsuarios(roleToFetch, empresaIdToFetch);
  empresaStore.listarEmpresas(roleToFetch, empresaIdToFetch);
});
</script>
