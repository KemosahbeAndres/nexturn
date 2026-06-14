<template>
  <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Zonas</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Agrupaciones de sucursales bajo un mismo gerente de zona.
        </p>
      </div>
      <button v-if="canManage && !showNewForm" @click="openNewForm"
        class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
        + Añadir zona
      </button>
    </div>

    <div class="divide-y divide-gray-50 dark:divide-gray-700/50">

      <!-- Formulario nueva zona -->
      <div v-if="showNewForm" class="p-6 bg-blue-50/40 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
        <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-4 uppercase tracking-wide">Nueva zona</p>
        <ZonaForm
          :work-roles="empresa.work_roles"
          :saving="savingNew"
          @save="createZona"
          @cancel="closeNewForm"
        />
      </div>

      <!-- Estado vacío -->
      <div v-if="!zonaStore.zonas?.length && !showNewForm"
        class="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500 italic">
        Sin zonas definidas. Crea una para empezar.
      </div>

      <!-- Lista de zonas -->
      <div v-for="zona in zonaStore.zonas" :key="zona.id">
        <!-- Fila resumen -->
        <div class="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-default">
          <div class="flex items-center gap-3 min-w-0">
            <button v-if="canManage" @click="toggleExpand(zona.id)"
              class="shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                class="w-3.5 h-3.5 transition-transform duration-200"
                :class="expandedId === zona.id ? 'rotate-90' : ''">
                <path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
              </svg>
            </button>
            <div class="min-w-0">
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ zona.name }}</span>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="!zona.active"
                  class="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  inactiva
                </span>
                <span v-if="zona.required_role.length" class="text-xs text-gray-400 dark:text-gray-500">
                  {{ zona.required_role.join(', ') }}
                </span>
              </div>
            </div>
          </div>

          <button v-if="canManage" @click="confirmDelete(zona.id)"
            class="shrink-0 p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
            title="Eliminar zona">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5">
              <path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <!-- Panel de edición expandible -->
        <div v-if="expandedId === zona.id && canManage"
          class="px-6 pb-6 pt-2 bg-gray-50/60 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700/50">
          <ZonaForm
            :initial="zona"
            :work-roles="empresa.work_roles"
            :saving="savingEdit"
            @save="(data) => updateZona(zona.id, data)"
            @cancel="expandedId = null"
          />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, defineComponent, h } from 'vue';
import { useZonaStore } from '../../stores/zonaStore';
import type { Empresa } from '../../models/Empresa';
import type { Zona } from '../../models/Zona';

const props = defineProps<{ empresa: Empresa; canManage: boolean }>();

const zonaStore = useZonaStore();

watch(() => props.empresa.id, (id) => {
  if (id) zonaStore.listarZonas(id);
}, { immediate: true });

// ── Estado de UI ───────────────────────────────────────────────────────
const expandedId  = ref<string | null>(null);
const showNewForm = ref(false);
const savingNew   = ref(false);
const savingEdit  = ref(false);

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function openNewForm() {
  showNewForm.value = true;
  expandedId.value  = null;
}

function closeNewForm() {
  showNewForm.value = false;
}

// ── CRUD ───────────────────────────────────────────────────────────────
async function createZona(data: ZonaFormData) {
  savingNew.value = true;
  try {
    await zonaStore.createZona({
      empresa_id:    props.empresa.id,
      name:          data.name,
      manager_id:    data.manager_id || null,
      active:        data.active,
      required_role: data.required_role,
    });
    closeNewForm();
  } finally {
    savingNew.value = false;
  }
}

async function updateZona(id: string, data: ZonaFormData) {
  savingEdit.value = true;
  try {
    await zonaStore.updateZona(id, {
      name:          data.name,
      manager_id:    data.manager_id || null,
      active:        data.active,
      required_role: data.required_role,
    });
    expandedId.value = null;
  } finally {
    savingEdit.value = false;
  }
}

async function confirmDelete(id: string) {
  if (!confirm('¿Eliminar esta zona? Las sucursales asociadas no se verán afectadas.')) return;
  await zonaStore.softDeleteZona(id);
  if (expandedId.value === id) expandedId.value = null;
}

// ── Sub-componente ZonaForm ────────────────────────────────────────────
export type ZonaFormData = {
  name: string;
  manager_id: string;
  active: boolean;
  required_role: string[];
};

const ZonaForm = defineComponent({
  props: {
    initial:   { type: Object as () => Zona | null,  default: null },
    workRoles: { type: Array  as () => string[],      required: true },
    saving:    { type: Boolean,                        default: false },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref<ZonaFormData>({
      name:          props.initial?.name          ?? '',
      manager_id:    props.initial?.manager_id    ?? '',
      active:        props.initial?.active        ?? true,
      required_role: [...(props.initial?.required_role ?? [])],
    });
    const error = ref('');

    function toggleRole(role: string) {
      const idx = form.value.required_role.indexOf(role);
      if (idx === -1) form.value.required_role.push(role);
      else form.value.required_role.splice(idx, 1);
    }

    function submit() {
      if (!form.value.name.trim()) {
        error.value = 'El nombre es obligatorio.';
        return;
      }
      error.value = '';
      emit('save', { ...form.value, name: form.value.name.trim() });
    }

    const inputCls = 'w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white';
    const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

    return () => h('div', { class: 'space-y-4' }, [

      // Nombre + Estado
      h('div', { class: 'grid grid-cols-2 gap-4' }, [
        h('div', [
          h('label', { class: labelCls }, 'Nombre'),
          h('input', {
            value: form.value.name,
            onInput: (e: Event) => { form.value.name = (e.target as HTMLInputElement).value; },
            type: 'text',
            placeholder: 'Ej: Zona Norte',
            maxlength: 60,
            class: inputCls,
          }),
        ]),
        h('div', [
          h('label', { class: labelCls }, 'Estado'),
          h('div', { class: 'flex items-center gap-3 pt-2' },
            [true, false].map(val =>
              h('label', { class: 'flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300' }, [
                h('input', {
                  type: 'radio',
                  checked: form.value.active === val,
                  onChange: () => { form.value.active = val; },
                  class: 'accent-blue-600',
                }),
                val ? 'Activa' : 'Inactiva',
              ])
            )
          ),
        ]),
      ]),

      // Manager ID
      h('div', [
        h('label', { class: labelCls }, [
          'ID del encargado ',
          h('span', { class: 'font-normal text-gray-400' }, '(opcional)'),
        ]),
        h('input', {
          value: form.value.manager_id,
          onInput: (e: Event) => { form.value.manager_id = (e.target as HTMLInputElement).value; },
          type: 'text',
          placeholder: 'ID del personal asignado como gerente de zona',
          class: inputCls,
        }),
      ]),

      // Roles requeridos
      h('div', [
        h('label', { class: labelCls }, 'Roles requeridos'),
        props.workRoles.length
          ? h('div', { class: 'flex flex-wrap gap-2' },
              props.workRoles.map(role => {
                const active = form.value.required_role.includes(role);
                return h('button', {
                  type: 'button',
                  onClick: () => toggleRole(role),
                  class: [
                    'px-3 py-1 rounded-full text-sm font-medium border transition-all',
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-400',
                  ],
                }, role);
              })
            )
          : h('p', { class: 'text-xs text-gray-400 dark:text-gray-500 italic' },
              'Esta empresa no tiene roles de trabajo definidos todavía.'),
      ]),

      // Error
      error.value
        ? h('p', { class: 'text-xs text-red-500 dark:text-red-400' }, error.value)
        : null,

      // Botones
      h('div', { class: 'flex justify-end gap-2 pt-1' }, [
        h('button', {
          type: 'button',
          onClick: () => emit('cancel'),
          class: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
        }, 'Cancelar'),
        h('button', {
          type: 'button',
          disabled: props.saving,
          onClick: submit,
          class: 'px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors',
        }, props.saving ? 'Guardando…' : (props.initial ? 'Guardar cambios' : 'Crear zona')),
      ]),
    ]);
  },
});
</script>
