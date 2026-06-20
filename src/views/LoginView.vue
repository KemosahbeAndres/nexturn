<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 relative transition-colors duration-300">

    <!-- Botón Modo Oscuro / Claro -->
    <button type="button" @click="sessionStore.toggleTheme()" class="fixed top-6 right-6 z-[999] p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      <svg v-if="!sessionStore.isDarkMode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    </button>

    <!-- Loader verificación inicial -->
    <div v-if="checkingSetup" class="flex justify-center items-center">
      <svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- ══════════════════════════════════════════
         FORMULARIO DE REGISTRO INICIAL
    ══════════════════════════════════════════ -->
    <div v-else-if="isFirstSetup" class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-300">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Bienvenido al Sistema</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Crea el primer super administrador</p>
      </div>

      <AlertBox :alert="alertSetup" class="mb-4" />

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input v-model="firstName" type="text" placeholder="Ej: Juan"
            class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
          <input v-model="lastName" type="text" placeholder="Ej: Pérez"
            class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT</label>
          <input
            :value="setupRut.rut.value"
            @input="setupRut.onInput"
            @blur="setupRut.onBlur"
            type="text" placeholder="12345678-9"
            :class="[
              'w-full px-4 h-12 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 dark:text-white',
              setupRut.showError.value ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            ]">
          <p v-if="setupRut.showError.value" class="mt-1 text-xs text-red-500">RUT inválido. Verifica el dígito verificador.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
          <input v-model="setupEmail" type="email" placeholder="correo@empresa.com"
            class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
          <input v-model="setupPassword" type="password" placeholder="••••••••" @keyup.enter="handleSetup"
            class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white">
        </div>
      </div>

      <button @click="handleSetup" :disabled="loadingSetup"
        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2">
        <svg v-if="loadingSetup" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        {{ loadingSetup ? 'Creando usuario...' : 'Crear y Entrar' }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════
         FORMULARIO DE INICIO DE SESIÓN
    ══════════════════════════════════════════ -->
    <div v-else class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-300">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Bienvenido</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Ingresa tus datos para continuar</p>
      </div>

      <AlertBox :alert="alertLogin" class="mb-4" />

      <div class="space-y-4 mb-4">

        <!-- Correo electrónico -->
        <div>
          <label class="block text-sm font-medium mb-1 dark:text-gray-300">Correo electrónico</label>
          <input
            v-model="loginEmail"
            type="email" placeholder="correo@empresa.com"
            :disabled="loadingLogin"
            class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white"
            @keyup.enter="handleLogin"
          >
        </div>

        <!-- Contraseña -->
        <div>
          <label class="block text-sm font-medium mb-1 dark:text-gray-300">Contraseña</label>
          <input
            v-model="loginPassword"
            type="password" placeholder="••••••••"
            :disabled="loadingLogin"
            class="w-full px-4 h-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            @keyup.enter="handleLogin"
          >
        </div>

        <div class="flex items-center">
          <input type="checkbox" id="stayConnected" v-model="stayConnected"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer">
          <label for="stayConnected" class="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Permanecer conectado</label>
        </div>
      </div>

      <button @click="handleLogin" :disabled="loadingLogin"
        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        <svg v-if="loadingLogin" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        {{ loadingLogin ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
      </button>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';
import { useRut } from '../composables/useRut';

// ── Componentes inline ────────────────────────────────────────────────────────

type AlertType = { type: 'error' | 'success'; message: string } | null;

const AlertBox = defineComponent({
  props: { alert: { type: Object as () => AlertType, default: null } },
  setup(props) {
    return () => {
      if (!props.alert) return null;
      const isError = props.alert.type === 'error';
      return h('div', {
        class: [
          'rounded-lg px-4 py-3 flex items-start gap-3 text-sm',
          isError
            ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
            : 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300',
        ],
      }, [
        h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: 'h-5 w-5 shrink-0 mt-0.5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
          isError
            ? h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' })
            : h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }),
        ]),
        h('span', props.alert.message),
      ]);
    };
  },
});

// ── Store / router ────────────────────────────────────────────────────────────

const sessionStore = useSessionStore();
const router = useRouter();

// ── Setup inicial ─────────────────────────────────────────────────────────────

const checkingSetup = ref(true);
const isFirstSetup = ref(false);
const loadingSetup = ref(false);
const alertSetup = ref<AlertType>(null);

const firstName = ref('');
const lastName = ref('');
const setupEmail = ref('');
const setupPassword = ref('');
const setupRut = useRut();

onMounted(async () => {
  try {
    isFirstSetup.value = await sessionStore.checkIfFirstSetup();
  } catch {
    // continúa al login
  } finally {
    checkingSetup.value = false;
  }
});

// ── Login — solo por correo ─────────────────────────────────────────────────────

const loginEmail = ref('');
const loginPassword = ref('');
const stayConnected = ref(false);
const loadingLogin = ref(false);
const alertLogin = ref<AlertType>(null);

// ── Acciones ──────────────────────────────────────────────────────────────────

function showAlert(target: 'setup' | 'login', type: 'error' | 'success', message: string) {
  if (target === 'setup') alertSetup.value = { type, message };
  else alertLogin.value = { type, message };
}

const handleSetup = async () => {
  if (!firstName.value || !lastName.value || !setupRut.rut.value || !setupEmail.value || !setupPassword.value) {
    showAlert('setup', 'error', 'Por favor, completa todos los campos.');
    return;
  }
  if (!setupRut.isValid.value) {
    showAlert('setup', 'error', 'El RUT ingresado no es válido.');
    return;
  }

  loadingSetup.value = true;
  alertSetup.value = null;
  try {
    await sessionStore.registerFirstSuperAdmin({
      first_name: firstName.value,
      last_name: lastName.value,
      rut: setupRut.rutClean.value,
      email: setupEmail.value,
      password: setupPassword.value,
    });
    showAlert('setup', 'success', '¡Usuario creado correctamente! Redirigiendo...');
    setTimeout(() => router.push('/dashboard'), 1200);
  } catch (error: any) {
    showAlert('setup', 'error', error.message || 'Error creando usuario inicial.');
  } finally {
    loadingSetup.value = false;
  }
};

const handleLogin = async () => {
  const identificador = loginEmail.value.trim();
  if (!identificador || !loginPassword.value) {
    showAlert('login', 'error', 'Por favor, completa todos los campos.');
    return;
  }
  loadingLogin.value = true;
  alertLogin.value = null;
  try {
    await sessionStore.login(identificador, loginPassword.value, stayConnected.value);
    showAlert('login', 'success', '¡Bienvenido! Redirigiendo al panel...');
    setTimeout(() => router.push('/dashboard'), 1000);
  } catch (error: any) {
    showAlert('login', 'error', error.message || 'Credenciales incorrectas.');
  } finally {
    loadingLogin.value = false;
  }
};
</script>
