<template>
  <div class="shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900 flex items-center justify-between gap-4 transition-colors duration-300">
    <div>
      <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ subtitle }}</p>
      <h1 class="text-base font-bold text-gray-900 dark:text-white mt-0.5 leading-tight">{{ title }}</h1>
    </div>
    <div class="text-right shrink-0">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{{ fechaHoy }}</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{{ horaActual }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

defineProps<{
  title: string;
  subtitle?: string;
}>();

const ahora = ref(new Date());
let intervalo: ReturnType<typeof setInterval>;
let timeout: ReturnType<typeof setTimeout>;

onMounted(() => {
  const msHastaProximoMinuto = (60 - new Date().getSeconds()) * 1000 - new Date().getMilliseconds();
  timeout = setTimeout(() => {
    ahora.value = new Date();
    intervalo = setInterval(() => { ahora.value = new Date(); }, 60_000);
  }, msHastaProximoMinuto);
});

onUnmounted(() => {
  clearTimeout(timeout);
  clearInterval(intervalo);
});

const fechaHoy = computed(() =>
  ahora.value.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
);
const horaActual = computed(() =>
  ahora.value.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
);
</script>
