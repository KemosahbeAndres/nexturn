import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'client' | 'fn';

export interface LogEntry {
  id: number;
  ts: number;
  level: LogLevel;
  source: LogSource;
  scope?: string;
  message: string;
}

let _nextId = 1;
const MAX_ENTRIES = 500;

export const useLogStore = defineStore('log', () => {
  const entries = ref<LogEntry[]>([]);
  const isOpen = ref(false);
  const isMinimized = ref(true);

  const unreadErrors = computed(() =>
    entries.value.filter(e => e.level === 'error').length
  );

  function push(level: LogLevel, source: LogSource, message: string, opts?: { scope?: string }) {
    entries.value.push({ id: _nextId++, ts: Date.now(), level, source, scope: opts?.scope, message });
    if (entries.value.length > MAX_ENTRIES) entries.value.splice(0, entries.value.length - MAX_ENTRIES);
    // Abrir automáticamente si hay error y estaba cerrado
    if (level === 'error') {
      isOpen.value = true;
      isMinimized.value = false;
    }
  }

  // Helpers para logs de cliente
  function debug(msg: string, opts?: { scope?: string }) { push('debug', 'client', msg, opts); }
  function info(msg: string, opts?: { scope?: string }) { push('info', 'client', msg, opts); }
  function warn(msg: string, opts?: { scope?: string }) { push('warn', 'client', msg, opts); }
  function error(msg: string, opts?: { scope?: string }) { push('error', 'client', msg, opts); }

  // Ingesta de logs que vienen del servidor (CF)
  function pushServerLogs(logs: string[], fnName?: string) {
    const scope = fnName ?? 'fn';
    logs.forEach(line => {
      const level: LogLevel = /error/i.test(line) ? 'error'
        : /warn/i.test(line) ? 'warn'
        : /debug/i.test(line) ? 'debug'
        : 'info';
      push(level, 'fn', line, { scope });
    });
  }

  function clear() { entries.value = []; }
  function open() { isOpen.value = true; isMinimized.value = false; }
  function minimize() { isMinimized.value = true; }
  function toggle() {
    if (!isOpen.value) { isOpen.value = true; isMinimized.value = false; }
    else isMinimized.value = !isMinimized.value;
  }
  function close() { isOpen.value = false; isMinimized.value = true; }

  return { entries, isOpen, isMinimized, unreadErrors, debug, info, warn, error, pushServerLogs, clear, open, minimize, toggle, close };
});
