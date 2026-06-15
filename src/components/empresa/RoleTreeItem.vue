<template>
  <div>
    <div class="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
      <!-- Indentación visual -->
      <span v-if="depth > 0" class="shrink-0 text-gray-300 dark:text-gray-600 select-none" :style="{ marginLeft: `${(depth - 1) * 16}px` }">└</span>

      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
        {{ role.nombre }}
        <span class="text-indigo-400 dark:text-indigo-500 font-normal">{{ role.slug }}</span>
      </span>

      <button
        v-if="canManage"
        @click="$emit('remove', role)"
        class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all ml-auto shrink-0"
        :title="`Eliminar '${role.nombre}'`"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
        </svg>
      </button>
    </div>

    <!-- Hijos recursivos -->
    <template v-for="child in children" :key="child.id">
      <RoleTreeItem
        :role="child"
        :all-roles="allRoles"
        :can-manage="canManage"
        :depth="depth + 1"
        @remove="$emit('remove', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Role } from '../../models/Role';

const props = defineProps<{
  role: Role;
  allRoles: Role[];
  canManage: boolean;
  depth?: number;
}>();

defineEmits<{ remove: [role: Role] }>();

const children = computed(() =>
  props.allRoles.filter(r => r.parent_role === props.role.id)
);
</script>
