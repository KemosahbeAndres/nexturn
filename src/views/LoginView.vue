<template>
  <main class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 relative transition-colors duration-300">
        
        <!-- Botón de Modo Oscuro / Claro -->
        <button type="button" @click="sessionStore.toggleTheme()" class="btn-theme-toggle fixed top-6 right-6 z-[999]">
          <!-- Icono Sol -->
          <svg v-if="!sessionStore.isDarkMode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
          <!-- Icono Luna -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </button>

        <!-- Muestra un loader mientras verifica si existen usuarios -->
        <div v-if="checkingSetup" class="flex justify-center items-center">
          <svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- FORMULARIO DE REGISTRO INICIAL -->
        <div v-else-if="isFirstSetup" class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-300">
          <div class="mb-6 text-center">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Bienvenido al Sistema</h2>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Crea el primer super administrador</p>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input v-model="firstName" type="text" placeholder="Ej: Juan" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
              <input v-model="lastName" type="text" placeholder="Ej: Pérez" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUT</label>
              <input v-model="rut" type="text" placeholder="12345678-9" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
              <input v-model="email" type="email" placeholder="correo@empresa.com" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
              <input v-model="password" type="password" placeholder="••••••••" @keyup.enter="handleSetup" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
          </div>
            
          <button @click="handleSetup" :disabled="loading" class="btn-primary mt-6">
            {{ loading ? 'Creando Usuario...' : 'Crear y Entrar' }}
          </button>
          
          <p v-if="errorMessage" class="mt-4 text-sm text-red-600 text-center font-medium">{{ errorMessage }}</p>
        </div>

        <!-- FORMULARIO DE INICIO DE SESIÓN -->
        <div v-else class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-300">
          <div class="mb-6 text-center">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Bienvenido</h2>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Ingresa tus datos para continuar</p>
          </div>
          
          <div class="space-y-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">RUT o Email</label>
              <input v-model="identificador" type="text" placeholder="12345678-9 o correo@empresa.com" @keyup.enter="handleLogin" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 dark:text-gray-300">Contraseña</label>
              <input v-model="password" type="password" placeholder="••••••••" @keyup.enter="handleLogin" class="w-full px-4 h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white">
            </div>
            
            <div class="flex items-center mt-2">
              <input type="checkbox" id="stayConnected" v-model="stayConnected" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer">
              <label for="stayConnected" class="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Permanecer conectado</label>
            </div>
          </div>
          
          <button @click="handleLogin" :disabled="loading" class="btn-primary mt-6">
            {{ loading ? 'Iniciando...' : 'Iniciar Sesión' }}
          </button>
          
          <p v-if="errorMessage" class="mt-4 text-sm text-red-600 text-center font-medium">{{ errorMessage }}</p>
        </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/sessionStore';

const identificador = ref('');
const password = ref('');
const stayConnected = ref(false);
const loading = ref(false);
const errorMessage = ref('');

// Variables para Setup Inicial
const checkingSetup = ref(true);
const isFirstSetup = ref(false);
const firstName = ref('');
const lastName = ref('');
const rut = ref('');
const email = ref('');

const sessionStore = useSessionStore();
const router = useRouter();

onMounted(async () => {
  try {
    isFirstSetup.value = await sessionStore.checkIfFirstSetup();
  } catch (error) {
    console.error("Error comprobando configuración inicial:", error);
  } finally {
    checkingSetup.value = false;
  }
});

const handleSetup = async () => {
  if (!firstName.value || !lastName.value || !rut.value || !email.value || !password.value) {
    errorMessage.value = 'Por favor, completa todos los campos.';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    await sessionStore.registerFirstSuperAdmin({
      first_name: firstName.value,
      last_name: lastName.value,
      rut: rut.value,
      email: email.value,
      password: password.value
    });
    router.push('/dashboard');
  } catch (error: any) {
    errorMessage.value = error.message || 'Error creando usuario inicial.';
  } finally {
    loading.value = false;
  }
};

const handleLogin = async () => {
  if (!identificador.value || !password.value) {
    errorMessage.value = 'Por favor, completa todos los campos.';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    await sessionStore.login(identificador.value, password.value, stayConnected.value);

    // Al autenticar redirigimos a dashboard (o la ruta que decidas como principal una vez logeado)
    router.push('/dashboard'); 
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al iniciar sesión.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>

</style>