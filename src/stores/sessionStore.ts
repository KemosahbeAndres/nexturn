import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, updateDoc, query, where, Timestamp, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase'; // Asegúrate de exportar 'auth' desde la config de tu proyecto
import { Usuario, usuarioConverter } from '../models/Usuario';
import { empresaConverter } from '../models/Empresa';
import { Sesion, sesionConverter } from '../models/Sesion';
import { Contacto, contactoConverter } from '../models/Contacto';

export const useSessionStore = defineStore('session', () => {
  // 1. STATE (Datos Reactivos)
  const currentUser = ref<Usuario | null>(null);
  const currentSession = ref<Sesion | null>(null);
  
  // Preferencias personales del usuario persistidas en el estado local
  const preferences = ref({ 
    theme: localStorage.getItem('theme_preference') || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    language: 'es',
    notificationsEnabled: true
  });

  // Sincronizar automáticamente el DOM con el tema seleccionado
  watch(() => preferences.value.theme, (newTheme) => {
    localStorage.setItem('theme_preference', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark', 'ion-palette-dark');
    } else {
      document.documentElement.classList.remove('dark', 'ion-palette-dark');
    }
  }, { immediate: true });

  // 2. GETTERS (Consultas Rápidas)
  const isAuthenticated = computed(() => currentUser.value !== null && currentSession.value !== null);
  const userRole = computed(() => currentUser.value?.system_role || 'visitor');
  const isDarkMode = computed(() => preferences.value.theme === 'dark');

  // 3. ACTIONS (Lógica de Negocio)

  async function checkIfFirstSetup() {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, limit(1));
    const snap = await getDocs(q);
    return snap.empty;
  }

  async function registerFirstSuperAdmin(userData: any) {
    const isFirst = await checkIfFirstSetup();
    if (!isFirst) {
      throw new Error('Ya existe al menos un usuario en el sistema. Utiliza el inicio de sesión.');
    }

    // 1. Crear el usuario en la autenticación de Firebase
    //const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

    // 2. Crear el Contacto asociado
    const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
    const newContactoRef = doc(contactosRef);
    const newContacto = new Contacto(
      newContactoRef.id, userData.first_name, userData.last_name, userData.rut, userData.email,
      '', '', false, true // Sin teléfono ni dirección por ahora, no es empresa, está activo
    );
    await setDoc(newContactoRef, newContacto);

    // 3. Crear el Usuario administrador
    const usuariosRef = collection(db, 'usuarios').withConverter(usuarioConverter);
    const newUsuarioRef = doc(usuariosRef);
    const newUsuario = new Usuario(
      newUsuarioRef.id,
      null, // empresa_id (super_admin no pertenece a una empresa)
      newContactoRef.id,
      userData.password, // Aunque está cifrada en Auth, el requerimiento actual lo pide en modelo
      'super_admin'
    );
    await setDoc(newUsuarioRef, newUsuario);

    // 4. Iniciar sesión automáticamente
    await login(userData.email, userData.password, false);
  }

  async function login(identificador: string, pass: string, stayConnected: boolean = false) {
    let emailForAuth = identificador;

    // Si el identificador no contiene '@', asumimos que es un RUT y buscamos su correo asociado
    if (!identificador.includes('@')) {
      const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
      const qRut = query(contactosRef, where('rut', '==', identificador), where('deletedAt', '==', null));
      const rutSnap = await getDocs(qRut);
      
      if (rutSnap.empty) {
        throw new Error('No se encontró información de contacto asociada a este RUT.');
      }
      emailForAuth = rutSnap.docs[0].data().email;
    }

    // 3.1. Autenticación subyacente con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, emailForAuth, pass);
    const authUser = userCredential.user;

    // 3.2. Buscar el Contacto asociado al correo electrónico
    const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
    const qContact = query(contactosRef, where('email', '==', emailForAuth), where('deletedAt', '==', null));
    const contactSnap = await getDocs(qContact);
    
    if (contactSnap.empty) {
      await signOut(auth); // Revertir si no existe el contacto asociado
      throw new Error('No existe información de contacto activa asociada a este correo.');
    }
    
    const contactData = contactSnap.docs[0].data();

    // 3.3. Descargar el Perfil de Usuario desde Firestore mediante contact_id
    const usuariosRef = collection(db, 'usuarios').withConverter(usuarioConverter);
    const qUser = query(usuariosRef, where('contact_id', '==', contactData.id), where('deletedAt', '==', null));
    const userSnap = await getDocs(qUser);
    
    if (userSnap.empty) {
      await signOut(auth); // Revertir si no existe en la base de datos
      throw new Error('Usuario no encontrado en la base de datos o se encuentra inactivo.');
    }
    
    const usuarioData = userSnap.docs[0].data();
    
    // Anidamos el objeto de contacto previamente descargado
    usuarioData.contacto = contactData;

    // 3.4. Obtener los datos de la Empresa, si no es super_admin
    if (usuarioData.system_role !== 'super_admin' && usuarioData.empresa_id) {
      const empresaRef = doc(db, 'empresas', usuarioData.empresa_id).withConverter(empresaConverter);
      const empresaSnap = await getDoc(empresaRef);
      if (empresaSnap.exists()) {
        usuarioData.empresa = empresaSnap.data();
      }
    }
    
    currentUser.value = usuarioData;

    // 3.4.1. Cargar preferencias del usuario si existen
    if (usuarioData.preferences) {
      preferences.value = { ...preferences.value, ...usuarioData.preferences };
    }

    // 3.5. Generar el registro en la colección 'sesiones'
    const sesionesRef = collection(db, 'sesiones').withConverter(sesionConverter);
    const newSessionRef = doc(sesionesRef);
    const token = await authUser.getIdToken();
    
    const nuevaSesion = new Sesion(
      newSessionRef.id,
      usuarioData.id,
      navigator.userAgent,
      token,
      stayConnected ? 0 : 120 // 0 significa duración infinita, de lo contrario 120 min
    );
    
    await setDoc(newSessionRef, nuevaSesion);
    currentSession.value = nuevaSesion;

    // Centralizamos el guardado en Local Storage
    localStorage.setItem('session_token', token);
    localStorage.setItem('user_id', usuarioData.id);
  }

  async function logout() {
    // Eliminar la sesión activa en Firestore
    if (currentSession.value) {
      const sessionRef = doc(db, 'sesiones', currentSession.value.id);
      await deleteDoc(sessionRef); 
    }
    
    // Limpiar Firebase Auth
    await signOut(auth);
    
    // Resetear el estado local
    currentUser.value = null;
    currentSession.value = null;

    // Limpiamos el Local Storage
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
  }

  async function refresh_token() {
    if (!currentSession.value || !auth.currentUser) {
      throw new Error('No hay sesión activa para refrescar.');
    }
    
    // Forzar la generación de un nuevo token nativo de Firebase
    const newToken = await auth.currentUser.getIdToken(true);

    // Actualizar el documento en Firestore
    const sessionRef = doc(db, 'sesiones', currentSession.value.id);
    await updateDoc(sessionRef, {
      token: newToken,
      updatedAt: Timestamp.now()
    });

    // Actualizar el estado local (no es necesario VueFire aquí por ser acción puntual manual)
    currentSession.value.token = newToken;
    currentSession.value.updatedAt = new Date();
  }

  async function updatePreferences(newPrefs: Partial<typeof preferences.value>) {
    preferences.value = { ...preferences.value, ...newPrefs };

    // Si hay un usuario logueado, persitir sus preferencias en Firestore
    if (currentUser.value) {
      currentUser.value.preferences = preferences.value;
      const usuarioRef = doc(db, 'usuarios', currentUser.value.id);
      await updateDoc(usuarioRef, { preferences: preferences.value });
    }
  }

  async function toggleTheme() {
    const newTheme = preferences.value.theme === 'light' ? 'dark' : 'light';
    await updatePreferences({ theme: newTheme });
  }

  async function validateSession() {
    if (isAuthenticated.value) return true; // Si ya hay sesión en memoria activa

    const storedToken = localStorage.getItem('session_token');
    const storedUserId = localStorage.getItem('user_id');

    if (!storedToken || !storedUserId) return false;

    try {
      // 1. Validar si existe en la base de datos
      const sesionesRef = collection(db, 'sesiones').withConverter(sesionConverter);
      const qSession = query(sesionesRef, where('user_id', '==', storedUserId), where('token', '==', storedToken));
      const sessionSnap = await getDocs(qSession);

      if (sessionSnap.empty) throw new Error('Sesión no encontrada o inválida');
      const sessionData = sessionSnap.docs[0].data();

      // 2. Reconstruir Perfil de Usuario
      const usuarioRef = doc(db, 'usuarios', storedUserId).withConverter(usuarioConverter);
      const userSnap = await getDoc(usuarioRef);
      if (!userSnap.exists()) throw new Error('Usuario no encontrado');
      const usuarioData = userSnap.data();

      // 3. Reconstruir contacto
      const contactoRef = doc(db, 'contactos', usuarioData.contact_id).withConverter(contactoConverter);
      const contactSnap = await getDoc(contactoRef);
      if (contactSnap.exists()) usuarioData.contacto = contactSnap.data();

      // 4. Reconstruir empresa si aplica
      if (usuarioData.system_role !== 'super_admin' && usuarioData.empresa_id) {
        const empresaRef = doc(db, 'empresas', usuarioData.empresa_id).withConverter(empresaConverter);
        const empresaSnap = await getDoc(empresaRef);
        if (empresaSnap.exists()) usuarioData.empresa = empresaSnap.data();
      }

      // 5. Rehidratar estado en memoria
      currentUser.value = usuarioData;
      currentSession.value = sessionData;

      // Cargar preferencias del usuario si existen
      if (usuarioData.preferences) {
        preferences.value = { ...preferences.value, ...usuarioData.preferences };
      }

      return true;
    } catch (error) {
      console.error('Error rehidratando sesión guardada:', error);
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_id');
      return false;
    }
  }

  return { 
    currentUser, 
    currentSession, 
    preferences, 
    isAuthenticated, 
    userRole, 
    isDarkMode, 
    login, 
    logout,
    refresh_token,
    updatePreferences,
    toggleTheme,
    checkIfFirstSetup,
    registerFirstSuperAdmin,
    validateSession
  };
});
