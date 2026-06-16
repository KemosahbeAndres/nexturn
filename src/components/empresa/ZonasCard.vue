<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Zonas</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Agrupaciones de sucursales bajo un mismo gerente de zona.
        </p>
      </div>
      <button v-if="canManage && !showNewForm" @click="openNewForm"
        class="shrink-0 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
        + Añadir zona
      </button>
    </div>

    <!-- Formulario nueva zona -->
    <div v-if="showNewForm" class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
      <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-4 uppercase tracking-wide">Nueva zona</p>
      <ZonaForm
        :saving="savingNew"
        @save="createZona"
        @cancel="closeNewForm"
      />
    </div>

    <!-- Estado vacío -->
    <p v-if="!zonaStore.zonas?.length && !showNewForm"
      class="text-sm text-gray-400 dark:text-gray-500 italic py-4">
      Sin zonas definidas. Crea una para empezar.
    </p>

    <!-- Lista de zonas -->
    <div class="divide-y divide-gray-100 dark:divide-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <div v-for="zona in zonaStore.zonas" :key="zona.id">
        <!-- Fila resumen -->
        <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-default">
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
          class="px-4 pb-5 pt-3 bg-gray-50/60 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700/50">
          <ZonaForm
            :initial="zona"
            :saving="savingEdit"
            @save="(data) => updateZona(zona.id, data)"
            @cancel="expandedId = null"
          />
        </div>
      </div>
    </div>
  </div>
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

const expandedId  = ref<string | null>(null);
const showNewForm = ref(false);
const savingNew   = ref(false);
const savingEdit  = ref(false);

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}
function openNewForm() { showNewForm.value = true; expandedId.value = null; }
function closeNewForm() { showNewForm.value = false; }

export type ZonaFormData = { name: string; manager_id: string; active: boolean };

async function createZona(data: ZonaFormData) {
  savingNew.value = true;
  try {
    await zonaStore.createZona({ empresa_id: props.empresa.id, name: data.name, manager_id: data.manager_id || null, active: data.active });
    closeNewForm();
  } finally { savingNew.value = false; }
}

async function updateZona(id: string, data: ZonaFormData) {
  savingEdit.value = true;
  try {
    await zonaStore.updateZona(id, { name: data.name, manager_id: data.manager_id || null, active: data.active });
    expandedId.value = null;
  } finally { savingEdit.value = false; }
}

async function confirmDelete(id: string) {
  if (!confirm('¿Eliminar esta zona? Las sucursales asociadas no se verán afectadas.')) return;
  await zonaStore.softDeleteZona(id);
  if (expandedId.value === id) expandedId.value = null;
}

const ZonaForm = defineComponent({
  props: {
    initial: { type: Object as () => Zona | null, default: null },
    saving:  { type: Boolean, default: false },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const form = ref<ZonaFormData>({ name: props.initial?.name ?? '', manager_id: props.initial?.manager_id ?? '', active: props.initial?.active ?? true });
    const error = ref('');
    function submit() {
      if (!form.value.name.trim()) { error.value = 'El nombre es obligatorio.'; return; }
      error.value = '';
      emit('save', { ...form.value, name: form.value.name.trim() });
    }
    const inputCls = 'w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white';
    const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'grid grid-cols-2 gap-4' }, [
        h('div', [
          h('label', { class: labelCls }, 'Nombre'),
          h('input', { value: form.value.name, onInput: (e: Event) => { form.value.name = (e.target as HTMLInputElement).value; }, type: 'text', placeholder: 'Ej: Zona Norte', maxlength: 60, class: inputCls }),
        ]),
        h('div', [
          h('label', { class: labelCls }, 'Estado'),
          h('div', { class: 'flex items-center gap-3 pt-2' }, [true, false].map(val =>
            h('label', { class: 'flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300' }, [
              h('input', { type: 'radio', checked: form.value.active === val, onChange: () => { form.value.active = val; }, class: 'accent-blue-600' }),
              val ? 'Activa' : 'Inactiva',
            ])
          )),
        ]),
      ]),
      error.value ? h('p', { class: 'text-xs text-red-500 dark:text-red-400' }, error.value) : null,
      h('div', { class: 'flex justify-end gap-2 pt-1' }, [
        h('button', { type: 'button', onClick: () => emit('cancel'), class: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors' }, 'Cancelar'),
        h('button', { type: 'button', disabled: props.saving, onClick: submit, class: 'px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors' }, props.saving ? 'Guardando…' : (props.initial ? 'Guardar cambios' : 'Crear zona')),
      ]),
    ]);
  },
});
</script>
