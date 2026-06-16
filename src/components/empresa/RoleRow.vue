<template>
  <div>
    <button
      type="button"
      @click="$emit('select', role)"
      class="w-full flex items-center gap-3 py-2.5 pr-3 rounded-lg text-left transition-colors group"
      :class="isSelected
        ? 'bg-blue-50 dark:bg-blue-900/20'
        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
      :style="{ paddingLeft: `${12 + depth * 20}px` }"
    >
      <!-- Conector árbol -->
      <span v-if="depth > 0" class="shrink-0 w-3 text-gray-300 dark:text-gray-600 select-none text-sm leading-none">└</span>

      <!-- Ícono de rol -->
      <span class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
        :class="isSelected
          ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      </span>

      <!-- Nombre y slug -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate"
          :class="isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'">
          {{ role.nombre }}
        </p>
        <p class="text-xs font-mono truncate"
          :class="isSelected ? 'text-blue-400 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'">
          {{ role.slug }}
        </p>
      </div>

      <!-- Indicador de hijos -->
      <span v-if="children.length && !isSelected"
        class="shrink-0 text-xs text-gray-300 dark:text-gray-600 tabular-nums">
        {{ children.length }}
      </span>

      <!-- Chevron seleccionado -->
      <svg v-if="isSelected"
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0 text-blue-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>

    <RoleRow
      v-for="child in children"
      :key="child.id"
      :role="child"
      :all-roles="allRoles"
      :selected-id="selectedId"
      :depth="depth + 1"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Role } from '../../models/Role';

const props = defineProps<{
  role: Role;
  allRoles: Role[];
  selectedId: string | null;
  depth?: number;
}>();

defineEmits<{ select: [role: Role] }>();

const depth = computed(() => props.depth ?? 0);

const isSelected = computed(() => props.selectedId === props.role.id);

const children = computed(() =>
  props.allRoles.filter(r => r.parent_role === props.role.id)
);
</script>
