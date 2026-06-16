<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger -->
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors text-left"
      :class="[
        disabled
          ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60 cursor-not-allowed'
          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer',
        open ? 'ring-2 ring-offset-0 ' + ringColor : ''
      ]"
    >
      <!-- Avatar seleccionado -->
      <template v-if="selected">
        <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          :class="avatarClass">
          {{ initials(selected) }}
        </span>
        <span class="flex-1 min-w-0 truncate font-medium text-gray-800 dark:text-gray-100">{{ label(selected) }}</span>
        <button
          v-if="clearable && !disabled"
          type="button"
          @click.stop="clear"
          class="shrink-0 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          tabindex="-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </template>
      <template v-else>
        <span class="flex-1 text-gray-400 dark:text-gray-500">{{ placeholder }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
          class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
          :class="open ? 'rotate-180' : ''">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </template>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="open"
        class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden"
        :class="dropUp ? 'bottom-full mb-1 top-auto' : ''">

        <!-- Búsqueda -->
        <div class="p-2 border-b border-gray-100 dark:border-gray-700">
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
              class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref="searchRef"
              v-model="search"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 text-gray-900 dark:text-white placeholder-gray-400"
              :class="ringColor"
            />
          </div>
        </div>

        <!-- Lista de opciones -->
        <ul class="max-h-52 overflow-y-auto">
          <li v-if="filteredOptions.length === 0" class="px-3 py-3 text-sm text-center text-gray-400 dark:text-gray-500 italic">
            Sin resultados
          </li>
          <li
            v-for="option in filteredOptions"
            :key="keyOf(option)"
            @click="select(option)"
            class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors"
            :class="isSelected(option)
              ? selectedClass
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'"
          >
            <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              :class="isSelected(option) ? avatarSelectedClass : avatarClass">
              {{ initials(option) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-medium truncate">{{ label(option) }}</p>
              <p v-if="sublabel(option)" class="text-xs truncate opacity-60">{{ sublabel(option) }}</p>
            </div>
            <span v-if="badgeFn && badgeFn(option)"
              class="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full"
              :class="badgeColorFn ? badgeColorFn(option) : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'">
              {{ badgeFn(option) }}
            </span>
            <svg v-else-if="isSelected(option)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
              class="w-3.5 h-3.5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  options: T[];
  modelValue: T | null;
  keyFn: (item: T) => string;
  labelFn: (item: T) => string;
  sublabelFn?: (item: T) => string;
  initialsFn?: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchFn?: (item: T, query: string) => boolean;
  clearable?: boolean;
  disabled?: boolean;
  dropUp?: boolean;
  color?: 'blue' | 'indigo' | 'emerald';
  badgeFn?: (item: T) => string;
  badgeColorFn?: (item: T) => string;
}>(), {
  placeholder: 'Seleccionar...',
  searchPlaceholder: 'Buscar...',
  clearable: true,
  disabled: false,
  dropUp: false,
  color: 'blue',
});

const emit = defineEmits<{ 'update:modelValue': [value: T | null] }>();

const open = ref(false);
const search = ref('');
const containerRef = ref<HTMLElement>();
const searchRef = ref<HTMLInputElement>();

const selected = computed(() => props.modelValue);

const ringColor = computed(() => {
  const map = { blue: 'focus:ring-blue-500', indigo: 'focus:ring-indigo-500', emerald: 'focus:ring-emerald-500' };
  return map[props.color];
});
const selectedClass = computed(() => {
  const map = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  };
  return map[props.color];
});
const avatarClass = computed(() =>
  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
);
const avatarSelectedClass = computed(() => {
  const map = {
    blue: 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300',
  };
  return map[props.color];
});

const filteredOptions = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return props.options;
  if (props.searchFn) return props.options.filter(o => props.searchFn!(o, q));
  return props.options.filter(o => props.labelFn(o).toLowerCase().includes(q));
});

function keyOf(item: T) { return props.keyFn(item); }
function label(item: T) { return props.labelFn(item); }
function sublabel(item: T) { return props.sublabelFn ? props.sublabelFn(item) : ''; }
function initials(item: T) {
  if (props.initialsFn) return props.initialsFn(item);
  const words = props.labelFn(item).split(' ');
  return (words[0]?.[0] ?? '') + (words[1]?.[0] ?? '').toUpperCase();
}
function isSelected(item: T) {
  return !!selected.value && props.keyFn(selected.value) === props.keyFn(item);
}

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    search.value = '';
    await nextTick();
    searchRef.value?.focus();
  }
}

function select(item: T) {
  emit('update:modelValue', item);
  open.value = false;
}

function clear() {
  emit('update:modelValue', null);
  open.value = false;
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
