<template>
  <div class="space-y-6">

    <!-- ══════════════════════ PANEL EMPRESAS ══════════════════════ -->
    <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors duration-300">

      <!-- Header empresas -->
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🏢 Empresas
            <span class="text-xs font-normal bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {{ empTable.filtered.value.length }}
            </span>
          </h2>
        </div>
        <div class="relative w-full sm:w-64">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <input v-model="empTable.search.value" type="text" placeholder="Buscar empresa…"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400">
        </div>
        <button v-if="isSuperAdmin" @click="openModal('create', 'empresa')"
          class="shrink-0 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          + Añadir
        </button>
      </div>

      <!-- Tabla escritorio (lg+) -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">Empresa</th>
              <th class="px-4 py-3 font-medium">RUT</th>
              <th class="px-4 py-3 font-medium">Correo</th>
              <th class="px-4 py-3 font-medium">Slug</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium w-28">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="org in empTable.paginated.value" :key="org.id"
              class="group cursor-pointer transition-colors"
              :class="org.slug ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/25'"
              @click="org.slug && navigateTo(org.slug)">
              <!-- Nombre + indicador hover -->
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                <div class="flex items-center gap-2">
                  <span>{{ org.contacto?.first_name || '—' }}</span>
                  <span v-if="org.slug"
                    class="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                    Abrir <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
                  </span>
                </div>
                <span class="block text-xs text-gray-400 font-normal">{{ org.contacto?.last_name }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{{ org.contacto?.rut || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ org.contacto?.email || '—' }}</td>
              <td class="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-mono">{{ org.slug || '—' }}</td>
              <td class="px-4 py-3"><StatusBadge :active="org.active" /></td>
              <td class="px-4 py-3" @click.stop>
                <RowActions :org="org" :is-super-admin="isSuperAdmin"
                  @edit="openModal('edit', 'empresa', org)" @delete="handleDeleteCompany(org)" />
              </td>
            </tr>
            <tr v-if="empTable.paginated.value.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                {{ empTable.search.value ? 'Sin resultados para la búsqueda.' : 'Aún no hay empresas registradas.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas móvil/tablet (<lg) -->
      <div class="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
        <MobileCard v-for="org in empTable.paginated.value" :key="org.id" :org="org" :is-super-admin="isSuperAdmin"
          :open-menu-id="openMenuId ?? undefined" :menu-refs="menuRefs"
          @navigate="org.slug && navigateTo(org.slug)"
          @toggle-menu="toggleMenu" @close-menu="openMenuId = null"
          @edit="openModal('edit', 'empresa', org)" @delete="handleDeleteCompany(org)" />
        <div v-if="empTable.paginated.value.length === 0" class="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
          {{ empTable.search.value ? 'Sin resultados para la búsqueda.' : 'Aún no hay empresas registradas.' }}
        </div>
      </div>

      <Pagination v-if="empTable.totalPages.value > 1"
        :page="empTable.page.value" :total-pages="empTable.totalPages.value"
        :total="empTable.filtered.value.length"
        @prev="empTable.prev()" @next="empTable.next()" @go="empTable.goTo($event)" />
    </section>

    <!-- ══════════════════════ PANEL CONGREGACIONES ══════════════════════ -->
    <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors duration-300">

      <!-- Header congregaciones -->
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ⛪ Congregaciones
            <span class="text-xs font-normal bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {{ congTable.filtered.value.length }}
            </span>
          </h2>
        </div>
        <div class="relative w-full sm:w-64">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <input v-model="congTable.search.value" type="text" placeholder="Buscar congregación…"
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400">
        </div>
        <button v-if="isSuperAdmin" @click="openModal('create', 'congregacion')"
          class="shrink-0 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          + Añadir
        </button>
      </div>

      <!-- Tabla escritorio -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th class="px-4 py-3 font-medium">Congregación</th>
              <th class="px-4 py-3 font-medium">Correo</th>
              <th class="px-4 py-3 font-medium">Teléfono</th>
              <th class="px-4 py-3 font-medium">Slug</th>
              <th class="px-4 py-3 font-medium">Estado</th>
              <th class="px-4 py-3 font-medium w-28">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="org in congTable.paginated.value" :key="org.id"
              class="group cursor-pointer transition-colors"
              :class="org.slug ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/25'"
              @click="org.slug && navigateTo(org.slug)">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                <div class="flex items-center gap-2">
                  <span>{{ org.contacto?.first_name || '—' }}</span>
                  <span v-if="org.slug"
                    class="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                    Abrir <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ org.contacto?.email || '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ org.contacto?.phone || '—' }}</td>
              <td class="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-mono">{{ org.slug || '—' }}</td>
              <td class="px-4 py-3"><StatusBadge :active="org.active" /></td>
              <td class="px-4 py-3" @click.stop>
                <RowActions :org="org" :is-super-admin="isSuperAdmin"
                  @edit="openModal('edit', 'congregacion', org)" @delete="handleDeleteCompany(org)" />
              </td>
            </tr>
            <tr v-if="congTable.paginated.value.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                {{ congTable.search.value ? 'Sin resultados para la búsqueda.' : 'Aún no hay congregaciones registradas.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas móvil/tablet -->
      <div class="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
        <MobileCard v-for="org in congTable.paginated.value" :key="org.id" :org="org" :is-super-admin="isSuperAdmin"
          :open-menu-id="openMenuId ?? undefined" :menu-refs="menuRefs"
          @navigate="org.slug && navigateTo(org.slug)"
          @toggle-menu="toggleMenu" @close-menu="openMenuId = null"
          @edit="openModal('edit', 'congregacion', org)" @delete="handleDeleteCompany(org)" />
        <div v-if="congTable.paginated.value.length === 0" class="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
          {{ congTable.search.value ? 'Sin resultados para la búsqueda.' : 'Aún no hay congregaciones registradas.' }}
        </div>
      </div>

      <Pagination v-if="congTable.totalPages.value > 1"
        :page="congTable.page.value" :total-pages="congTable.totalPages.value"
        :total="congTable.filtered.value.length"
        @prev="congTable.prev()" @next="congTable.next()" @go="congTable.goTo($event)" />
    </section>

    <CompanyModal :is-open="isModalOpen" :mode="modalMode" :initial-data="selectedCompany"
      @close="isModalOpen = false" @save="handleSaveCompany" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue';
import { useRouter } from 'vue-router';
import { collection, doc, setDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useEmpresaStore } from '../stores/empresaStore';
import { useSessionStore } from '../stores/sessionStore';
import { Contacto, contactoConverter } from '../models/Contacto';
import { useOrgTable } from '../composables/useOrgTable';
import CompanyModal from '../components/CompanyModal.vue';
import type { EmpresaType } from '../models/Empresa';

const router = useRouter();
const empresaStore = useEmpresaStore();
const sessionStore = useSessionStore();
const isSuperAdmin = computed(() => sessionStore.currentUser?.system_role === 'super_admin');

const empTable  = useOrgTable(computed(() => empresaStore.empresasTipo));
const congTable = useOrgTable(computed(() => empresaStore.congregaciones));

function navigateTo(slug: string) {
  router.push({ name: 'empresa-home', params: { companySlug: slug } });
}

// ── Modal ──────────────────────────────────────────────────────────────
const isModalOpen     = ref(false);
const modalMode       = ref<'create' | 'edit'>('create');
const selectedCompany = ref<any>(null);

function openModal(mode: 'create' | 'edit', type: EmpresaType, empresa: any = null) {
  modalMode.value = mode;
  selectedCompany.value = empresa ?? { type };
  isModalOpen.value = true;
}

const handleSaveCompany = async (data: any) => {
  try {
    if (modalMode.value === 'create') {
      let finalContactId = '';
      if (data.rut) {
        const rutSnap = await getDocs(query(collection(db, 'contactos'), where('rut', '==', data.rut)));
        if (!rutSnap.empty) {
          finalContactId = rutSnap.docs[0].id;
          await updateDoc(doc(db, 'contactos', finalContactId), {
            first_name: data.first_name, last_name: data.last_name,
            email: data.email, phone: data.phone, address: data.address,
            is_company: true, deletedAt: null,
          });
        }
      }
      if (!finalContactId) {
        const contactRef = doc(collection(db, 'contactos')).withConverter(contactoConverter);
        finalContactId = contactRef.id;
        await setDoc(contactRef, new Contacto(
          finalContactId, data.first_name, data.last_name, data.rut,
          data.email, data.phone, data.address, true, true,
        ));
      }
      const slug = data.slug || (data.first_name || 'org').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const empSnap = await getDocs(query(collection(db, 'empresas'), where('contact_id', '==', finalContactId)));
      if (!empSnap.empty) {
        await empresaStore.updateEmpresa(empSnap.docs[0].id, { type: data.type, active: true, deletedAt: null, slug });
      } else {
        await empresaStore.createEmpresa({ active: true, contact_id: finalContactId, type: data.type, cargos: [], slug });
      }
    } else if (selectedCompany.value) {
      if (selectedCompany.value.contact_id) {
        await updateDoc(doc(db, 'contactos', selectedCompany.value.contact_id), {
          first_name: data.first_name, last_name: data.last_name,
          rut: data.rut, email: data.email, phone: data.phone, address: data.address,
        });
      }
      const slug = data.slug || (data.first_name || 'org').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await empresaStore.updateEmpresa(selectedCompany.value.id, { type: data.type, slug });
    }
    isModalOpen.value = false;
  } catch (error: any) {
    console.error(error);
    alert(error.message);
  }
};

const handleDeleteCompany = async (empresa: any) => {
  if (!confirm(`¿Desactivar ${empresa.contacto?.first_name || 'esta organización'}?`)) return;
  try {
    await empresaStore.softDeleteEmpresa(empresa.id);
    if (empresa.contact_id) {
      await updateDoc(doc(db, 'contactos', empresa.contact_id), { deletedAt: Timestamp.now(), active: false });
    }
  } catch (error: any) { console.error(error); }
};

// ── Menú 3 puntos ─────────────────────────────────────────────────────
const openMenuId = ref<string | null>(null);
const menuRefs: Record<string, Element | null> = {};

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id;
}
const onClickOutside = (e: MouseEvent) => {
  if (!openMenuId.value) return;
  const el = menuRefs[openMenuId.value];
  if (el && !el.contains(e.target as Node)) openMenuId.value = null;
};
onMounted(() => {
  document.addEventListener('click', onClickOutside);
  if (sessionStore.currentUser) {
    empresaStore.listarEmpresas(sessionStore.currentUser.system_role, sessionStore.currentUser.empresa_id);
  }
});
onUnmounted(() => document.removeEventListener('click', onClickOutside));

// ── Sub-componentes inline ─────────────────────────────────────────────

const StatusBadge = defineComponent({
  props: { active: Boolean },
  setup(props) {
    return () => h('span', {
      class: props.active
        ? 'px-2 py-0.5 text-xs font-semibold rounded-md bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
        : 'px-2 py-0.5 text-xs font-semibold rounded-md bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    }, props.active ? 'Activa' : 'Inactiva');
  },
});

// Sin botón "Ingresar" — la fila entera navega
const RowActions = defineComponent({
  props: { org: Object, isSuperAdmin: Boolean },
  emits: ['edit', 'delete'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex gap-2 items-center' }, [
      h('button', {
        class: 'text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors',
        onClick: () => emit('edit'),
      }, 'Editar'),
      props.isSuperAdmin
        ? h('button', {
            class: 'text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors',
            onClick: () => emit('delete'),
          }, 'Desactivar')
        : null,
    ]);
  },
});

const MobileCard = defineComponent({
  props: { org: Object, isSuperAdmin: Boolean, openMenuId: String, menuRefs: Object },
  emits: ['navigate', 'toggle-menu', 'close-menu', 'edit', 'delete'],
  setup(props, { emit }) {
    return () => {
      const org = props.org as any;
      const isOpen = props.openMenuId === org.id;
      return h('div', {
        class: [
          'p-4 flex items-center justify-between gap-3 transition-colors',
          org.slug ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 active:bg-blue-100 dark:active:bg-blue-900/20' : '',
        ],
        onClick: () => emit('navigate'),
      }, [
        // Contenido principal
        h('div', { class: 'flex items-center gap-3 min-w-0' }, [
          h('div', {
            class: 'w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300 font-bold text-sm',
          }, (org.contacto?.first_name?.[0] ?? '?').toUpperCase()),
          h('div', { class: 'min-w-0' }, [
            h('div', { class: 'flex items-center gap-1.5' }, [
              h('p', { class: 'text-sm font-semibold text-gray-900 dark:text-white truncate' },
                `${org.contacto?.first_name || '—'}${org.contacto?.last_name ? ' ' + org.contacto.last_name : ''}`),
              // Indicador flecha siempre visible en móvil (no hay hover)
              org.slug
                ? h('svg', {
                    xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 16 16', fill: 'currentColor',
                    class: 'w-3.5 h-3.5 shrink-0 text-blue-400 dark:text-blue-500',
                  }, [h('path', { 'fill-rule': 'evenodd', d: 'M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z', 'clip-rule': 'evenodd' })])
                : null,
            ]),
            h('p', { class: 'text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5' }, org.contacto?.email || '—'),
            org.contacto?.rut
              ? h('p', { class: 'text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5' }, org.contacto.rut)
              : null,
            h('div', { class: 'flex items-center gap-2 mt-1.5 flex-wrap' }, [
              h('span', {
                class: org.active
                  ? 'px-2 py-0.5 text-xs font-semibold rounded-md bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : 'px-2 py-0.5 text-xs font-semibold rounded-md bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
              }, org.active ? 'Activa' : 'Inactiva'),
              org.slug
                ? h('span', { class: 'text-xs text-blue-500 dark:text-blue-400 font-mono' }, org.slug)
                : null,
            ]),
          ]),
        ]),
        // Menú 3 puntos — stopPropagation para no disparar navigate
        h('div', {
          class: 'relative shrink-0',
          ref: (el: any) => { if (props.menuRefs) (props.menuRefs as any)[org.id] = el; },
          onClick: (e: Event) => e.stopPropagation(),
        }, [
          h('button', {
            class: 'w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            onClick: (e: Event) => { e.stopPropagation(); emit('toggle-menu', org.id); },
          }, '⋮'),
          isOpen
            ? h('div', {
                class: 'absolute right-0 top-9 z-20 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1',
              }, [
                h('button', {
                  class: 'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  onClick: () => { emit('edit'); emit('close-menu'); },
                }, 'Editar'),
                props.isSuperAdmin
                  ? h('button', {
                      class: 'w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors',
                      onClick: () => { emit('delete'); emit('close-menu'); },
                    }, 'Desactivar')
                  : null,
              ])
            : null,
        ]),
      ]);
    };
  },
});

const Pagination = defineComponent({
  props: { page: Number, totalPages: Number, total: Number },
  emits: ['prev', 'next', 'go'],
  setup(props, { emit }) {
    return () => {
      const page = props.page ?? 1;
      const total = props.totalPages ?? 1;
      const range: number[] = [];
      for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i++) range.push(i);
      return h('div', { class: 'px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2' }, [
        h('span', { class: 'text-xs text-gray-400 dark:text-gray-500' },
          `${props.total} registro${(props.total ?? 0) !== 1 ? 's' : ''}`),
        h('div', { class: 'flex items-center gap-1' }, [
          h('button', {
            class: 'px-2 py-1 text-xs rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
            disabled: page <= 1,
            onClick: () => emit('prev'),
          }, '←'),
          ...range.map(n =>
            h('button', {
              key: n,
              class: n === page
                ? 'px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white font-semibold'
                : 'px-2.5 py-1 text-xs rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              onClick: () => emit('go', n),
            }, String(n))
          ),
          h('button', {
            class: 'px-2 py-1 text-xs rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors',
            disabled: page >= total,
            onClick: () => emit('next'),
          }, '→'),
        ]),
      ]);
    };
  },
});
</script>
