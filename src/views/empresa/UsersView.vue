<template>
  <div class="flex flex-col gap-4">

    <!-- Filtros (modo monoempresa: solo búsqueda de texto) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Búsqueda</h3>
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            v-model="searchText"
            type="text"
            placeholder="Buscar por nombre, email o RUT..."
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
        <button
          v-if="searchText.trim()"
          @click="searchText = ''"
          class="shrink-0 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>

    <!-- Lista de usuarios de la empresa -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Usuarios</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ filteredUsers.length }} usuario{{ filteredUsers.length !== 1 ? 's' : '' }}
            <span v-if="searchText.trim()"> encontrado{{ filteredUsers.length !== 1 ? 's' : '' }}</span>
          </p>
        </div>
        <button
          @click="openModal('create')"
          class="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          + Añadir Usuario
        </button>
      </div>

      <!-- Tabla (lg+) -->
      <div v-if="filteredUsers.length > 0" class="hidden lg:block overflow-x-auto overflow-y-visible rounded-b-xl">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">Nombre</th>
              <th class="px-4 py-3 font-medium">RUT</th>
              <th class="px-4 py-3 font-medium">Correo</th>
              <th class="px-4 py-3 font-medium">Rol</th>
              <th class="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/25 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {{ user.contacto?.first_name || '—' }} {{ user.contacto?.last_name || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{{ user.contacto?.rut || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ user.contacto?.email || '—' }}</td>
              <td class="px-4 py-3">
                <span :class="roleBadgeClass(user.system_role)" class="inline-block px-2 py-0.5 text-xs font-semibold rounded-md capitalize">
                  {{ user.system_role.replace(/_/g, ' ') }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button @click="openModal('edit', user)" class="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Editar</button>
                  <button @click="handleDeleteUser(user)" class="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas (móvil + tablet) -->
      <div v-if="filteredUsers.length > 0" class="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
        <div v-for="user in filteredUsers" :key="user.id" class="p-4 flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-300 font-bold text-sm">
              {{ ((user.contacto?.first_name?.[0] ?? '') + (user.contacto?.last_name?.[0] ?? '')).toUpperCase() || '?' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ user.contacto?.first_name || '—' }} {{ user.contacto?.last_name || '' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ user.contacto?.email || '—' }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{{ user.contacto?.rut || '—' }}</p>
              <span :class="roleBadgeClass(user.system_role)" class="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold rounded-md capitalize">
                {{ user.system_role.replace(/_/g, ' ') }}
              </span>
            </div>
          </div>
          <!-- Menú 3 puntos -->
          <div class="relative shrink-0" :ref="el => { menuRefs[user.id] = el as Element }">
            <button @click.stop="openMenuId = openMenuId === user.id ? null : user.id" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
                <path d="M12 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
              </svg>
            </button>
            <div v-if="openMenuId === user.id" class="absolute right-0 top-9 z-20 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1">
              <button @click="openModal('edit', user); openMenuId = null" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
                Editar
              </button>
              <button @click="handleDeleteUser(user); openMenuId = null" class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="filteredUsers.length === 0" class="p-12 flex flex-col items-center justify-center text-center">
        <div class="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ searchText.trim() ? 'Sin resultados' : 'Aún no hay usuarios' }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ searchText.trim() ? 'Prueba con otro término.' : 'Usa el botón superior para agregar el primero.' }}
        </p>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRoute } from 'vue-router';
import { db, firebaseApp } from '../../firebase';
import { useUsuarioStore } from '../../stores/usuarioStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { Contacto, contactoConverter } from '../../models/Contacto';
import type { SystemRole } from '../../models/Usuario';
import UserModal from '../../components/UserModal.vue';

const usuarioStore = useUsuarioStore();
const sessionStore = useSessionStore();
const route = useRoute();
const empresaStore = useEmpresaStore();

// ID de empresa resuelto: se actualiza en onMounted cuando el super_admin navega por companySlug
const resolvedEmpresaId = ref<string | null>(null);

// Excluye super_admins y filtra por la empresa resuelta en onMounted.
// El store ya trae solo los usuarios de esa empresa desde Firestore,
// pero este filtro adicional es la guardia ante cualquier race condition.
const companyUsers = computed(() => {
  const list = usuarioStore.usuarios ?? [];
  if (!resolvedEmpresaId.value) return list.filter((u) => u.system_role !== 'super_admin');
  return list.filter(
    (u) => u.system_role !== 'super_admin' && u.empresa_id === resolvedEmpresaId.value
  );
});

const searchText = ref('');

const filteredUsers = computed(() => {
  const term = searchText.value.trim().toLowerCase();
  if (!term) return companyUsers.value;
  return companyUsers.value.filter((u) => {
    const fullName = `${u.contacto?.first_name ?? ''} ${u.contacto?.last_name ?? ''}`.toLowerCase();
    const email = (u.contacto?.email ?? '').toLowerCase();
    const rut = (u.contacto?.rut ?? '').toLowerCase();
    return fullName.includes(term) || email.includes(term) || rut.includes(term);
  });
});

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
    const systemRole = data.system_role as SystemRole;
    // Siempre fija la empresa resuelta en onMounted; nunca acepta empresa_id del formulario
    const empresaIdToSave = resolvedEmpresaId.value;

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
          system_role: systemRole,
          deletedAt: null
        });
      } else {
        await usuarioStore.createUsuario({
          empresa_id: empresaIdToSave,
          contact_id: finalContactId,
          system_role: systemRole
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
        system_role: systemRole
      });
    }

    isModalOpen.value = false;
  } catch (error: any) {
    console.error('Error guardando usuario:', error);
    alert(error.message || 'Ocurrió un error al guardar el usuario.');
  }
};

const handleDeleteUser = async (user: any) => {
  // Guardia de aislamiento: solo usuarios de esta empresa
  if (user.empresa_id !== resolvedEmpresaId.value) return;

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

// ---- Helpers de UI ----
const roleBadgeClass = (role: string) => {
  const map: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    admin:       'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    user:        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    visitor:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
};

// ---- Menú 3 puntos ----
const openMenuId = ref<string | null>(null);
const menuRefs: Record<string, Element | null> = {};

const onClickOutside = (e: MouseEvent) => {
  if (!openMenuId.value) return;
  const el = menuRefs[openMenuId.value];
  if (el && !el.contains(e.target as Node)) openMenuId.value = null;
};
onMounted(async () => {
  document.addEventListener('click', onClickOutside);

  if (!sessionStore.currentUser) return;

  let roleToFetch: string = sessionStore.currentUser.system_role;
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

onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>
