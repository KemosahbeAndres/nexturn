<template>
  <!-- Barra de estado (minimizada) -->
  <div v-if="!logStore.isOpen || logStore.isMinimized"
    class="fixed bottom-0 left-0 md:left-44 lg:left-64 right-0 z-40 flex items-center justify-between px-3 py-1.5 bg-gray-900 border-t border-gray-700 cursor-pointer select-none"
    @click="logStore.toggle()">
    <div class="flex items-center gap-2 min-w-0">
      <span class="w-2 h-2 rounded-full shrink-0"
        :class="hasErrors ? 'bg-red-500 animate-pulse' : hasWarns ? 'bg-amber-400' : 'bg-emerald-500'"></span>
      <span class="text-[10px] font-mono text-gray-300 truncate">
        <template v-if="latest">{{ latest.message }}</template>
        <template v-else>Consola</template>
      </span>
      <span v-if="hasErrors"
        class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white shrink-0">
        {{ logStore.unreadErrors }} error{{ logStore.unreadErrors !== 1 ? 's' : '' }}
      </span>
    </div>
    <div class="flex items-center gap-2 shrink-0 ml-2">
      <span class="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
        {{ logStore.entries.length }} log{{ logStore.entries.length !== 1 ? 's' : '' }}
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
        class="w-3 h-3 text-gray-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
      </svg>
    </div>
  </div>

  <!-- Panel expandido -->
  <Teleport to="body">
    <div v-if="logStore.isOpen && !logStore.isMinimized"
      class="fixed z-50 left-0 md:left-44 lg:left-64 right-0 bottom-0 flex flex-col bg-gray-950 border-t border-gray-700"
      :style="{ height: panelHeight + 'px' }">

      <!-- Handle de resize -->
      <div class="w-full h-1 cursor-ns-resize hover:bg-violet-500 transition-colors shrink-0"
        @mousedown.prevent="startResize" />

      <!-- Cabecera -->
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 shrink-0 gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Consola</span>
          <div class="flex gap-1.5">
            <button v-for="lvl in ['debug','info','warn','error'] as const" :key="lvl"
              @click="toggleFilter(lvl)"
              class="text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors"
              :class="[
                filtros.has(lvl) ? levelBg(lvl) : 'bg-gray-800 text-gray-500',
              ]">
              {{ lvl.toUpperCase() }}
            </button>
          </div>
          <div class="flex gap-1.5 ml-1">
            <button v-for="src in ['client','fn'] as const" :key="src"
              @click="toggleFuente(src)"
              class="text-[9px] font-medium px-1.5 py-0.5 rounded border transition-colors"
              :class="fuentesFiltro.has(src)
                ? 'border-violet-500 text-violet-300 bg-violet-900/30'
                : 'border-gray-700 text-gray-600'">
              {{ src === 'client' ? 'Cliente' : 'CF' }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button @click="logStore.clear()"
            class="text-[9px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors">
            Limpiar
          </button>
          <button @click="logStore.minimize()"
            class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <button @click="logStore.close()"
            class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Lista de logs (scroll al final) -->
      <div ref="listRef" class="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed p-1">
        <div v-if="!entradaFiltradas.length" class="text-gray-600 italic px-2 py-3 text-center">Sin logs</div>
        <div v-for="entry in entradaFiltradas" :key="entry.id"
          class="flex items-start gap-1.5 px-2 py-0.5 rounded hover:bg-white/5 transition-colors">
          <span class="text-gray-600 tabular-nums shrink-0 select-none w-20">{{ formatTs(entry.ts) }}</span>
          <span class="shrink-0 w-14 font-bold uppercase" :class="levelColor(entry.level)">{{ entry.level }}</span>
          <span class="shrink-0 w-14 text-gray-500">[{{ entry.source }}{{ entry.scope ? ':' + entry.scope : '' }}]</span>
          <span class="flex-1 break-all whitespace-pre-wrap" :class="levelColor(entry.level)">{{ entry.message }}</span>
        </div>
      </div>

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useLogStore, type LogLevel, type LogSource } from '../stores/logStore';

const logStore = useLogStore();

const panelHeight = ref(240);
const listRef = ref<HTMLElement | null>(null);

const filtros = ref<Set<LogLevel>>(new Set(['debug', 'info', 'warn', 'error']));
const fuentesFiltro = ref<Set<LogSource>>(new Set(['client', 'fn']));

function toggleFilter(lvl: LogLevel) {
  if (filtros.value.has(lvl)) filtros.value.delete(lvl);
  else filtros.value.add(lvl);
  filtros.value = new Set(filtros.value);
}

function toggleFuente(src: LogSource) {
  if (fuentesFiltro.value.has(src)) fuentesFiltro.value.delete(src);
  else fuentesFiltro.value.add(src);
  fuentesFiltro.value = new Set(fuentesFiltro.value);
}

const entradaFiltradas = computed(() =>
  logStore.entries.filter(e => filtros.value.has(e.level) && fuentesFiltro.value.has(e.source))
);

const latest = computed(() => logStore.entries[logStore.entries.length - 1] ?? null);
const hasErrors = computed(() => logStore.entries.some(e => e.level === 'error'));
const hasWarns = computed(() => logStore.entries.some(e => e.level === 'warn'));

function formatTs(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function levelColor(lvl: LogLevel): string {
  switch (lvl) {
    case 'error': return 'text-red-400';
    case 'warn':  return 'text-amber-400';
    case 'debug': return 'text-gray-500';
    default:      return 'text-gray-300';
  }
}

function levelBg(lvl: LogLevel): string {
  switch (lvl) {
    case 'error': return 'bg-red-900/60 text-red-300';
    case 'warn':  return 'bg-amber-900/60 text-amber-300';
    case 'debug': return 'bg-gray-700 text-gray-300';
    default:      return 'bg-gray-700 text-gray-100';
  }
}

// Auto-scroll al último log
watch(entradaFiltradas, async () => {
  await nextTick();
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
}, { flush: 'post' });

// Resize con drag
let startY = 0;
let startH = 0;

function startResize(e: MouseEvent) {
  startY = e.clientY;
  startH = panelHeight.value;
  window.addEventListener('mousemove', onResize);
  window.addEventListener('mouseup', stopResize);
}

function onResize(e: MouseEvent) {
  const delta = startY - e.clientY;
  panelHeight.value = Math.max(120, Math.min(window.innerHeight * 0.8, startH + delta));
}

function stopResize() {
  window.removeEventListener('mousemove', onResize);
  window.removeEventListener('mouseup', stopResize);
}
</script>
