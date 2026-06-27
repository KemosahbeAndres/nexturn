import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase'; // Asegúrate de exportar 'auth' desde la config de tu proyecto
import { Usuario, usuarioConverter } from '../models/Usuario';
import { empresaConverter } from '../models/Empresa';
import { Sesion, sesionConverter } from '../models/Sesion';
import { Contacto, contactoConverter } from '../models/Contacto';
import { useGrantStore } from './grantStore';
import { ubicacionConverter } from '../models/Ubicacion';
import { zonaConverter } from '../models/Zona';
import { clienteConverter } from '../models/Cliente';

export const useSessionStore = defineStore('session', () => {
  // 1. STATE (Datos Reactivos)
  const currentUser = ref<Usuario | null>(null);
  const currentSession = ref<Sesion | null>(null);
  const activeClienteId = ref<string | null>(null);  // Contexto del cliente/cuenta de facturación
  const activeCompanyId = ref<string | null>(null);  // Contexto de la empresa en la que navegamos
  const activeZonaId = ref<string | null>(null);     // Contexto de la zona en la que navegamos
  const activeUbicacionId = ref<string | null>(null); // Contexto de la sucursal en la que navegamos
  
  // Preferencias personales del usuario persistidas en el estado local
  const preferences = ref({
    theme: localStorage.getItem('theme_preference') || 'light',
    language: 'es',
    notificationsEnabled: true
  });

  // Sincronizar automáticamente el DOM con el tema seleccionado
  watch(() => preferences.value.theme, (newTheme) => {
    localStorage.setItem('theme_preference', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, { immediate: true });

  // 2. GETTERS (Consultas Rápidas)
  const isAuthenticated = computed(() => currentUser.value !== null && currentSession.value !== null);
  const userRole = computed(() => currentUser.value?.system_role || 'visitor');
  const isDarkMode = computed(() => preferences.value.theme === 'dark');

  // 3. ACTIONS (Lógica de Negocio)

  async function checkIfFirstSetup() {
    // No se puede consultar 'usuarios' sin autenticar (las Rules lo niegan).
    // Se usa un marcador público config/setup escrito al crear el primer super_admin.
    const setupRef = doc(db, 'config', 'setup');
    const snap = await getDoc(setupRef);
    return !snap.exists() || snap.data()?.initialized !== true;
  }

  async function registerFirstSuperAdmin(userData: any) {
    const isFirst = await checkIfFirstSetup();
    if (!isFirst) {
      throw new Error('Ya existe al menos un usuario en el sistema. Utiliza el inicio de sesión.');
    }

    // 1. Crear el usuario en la autenticación de Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

    // 2. Crear el Contacto asociado
    const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
    const newContactoRef = doc(contactosRef);
    const newContacto = new Contacto(
      newContactoRef.id, userData.first_name, userData.last_name, userData.rut, userData.email,
      '', '', false, true // Sin teléfono ni dirección por ahora, no es empresa, está activo
    );
    await setDoc(newContactoRef, newContacto);

    // 3. Crear el Usuario administrador usando el UID de Firebase Auth como ID del doc.
    // Esto es obligatorio: las Security Rules identifican al usuario via request.auth.uid,
    // que debe coincidir con el ID del doc en 'usuarios' para que isSuperAdmin() funcione.
    const authUid = userCredential.user.uid;
    const usuariosRef = collection(db, 'usuarios').withConverter(usuarioConverter);
    const newUsuarioRef = doc(usuariosRef, authUid);
    const newUsuario = new Usuario(
      authUid,
      null, // empresa_id (super_admin no pertenece a una empresa)
      newContactoRef.id,
      'super_admin'
    );
    await setDoc(newUsuarioRef, newUsuario);

    // 4. Marcar el sistema como inicializado (marcador público para checkIfFirstSetup)
    await setDoc(doc(db, 'config', 'setup'), { initialized: true, updatedAt: Timestamp.now() });

    // 5. Iniciar sesión automáticamente
    await login(userData.email, userData.password, false);
  }

  async function login(identificador: string, pass: string, stayConnected: boolean = false) {
    // El login es solo por correo. El identificador debe ser un email.
    const emailForAuth = identificador.trim();
    if (!emailForAuth.includes('@')) {
      throw new Error('Ingresa un correo electrónico válido.');
    }

    // 3.1. Autenticación subyacente con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, emailForAuth, pass);
    const authUser = userCredential.user;

    // 3.2. Descargar el Perfil de Usuario por doc ID = auth.uid (lectura puntual §9).
    // El doc ID de 'usuarios' SIEMPRE coincide con el UID de Firebase Auth: por eso
    // se lee por getDoc directo (las Security Rules no permiten query de colección sobre
    // usuarios/contactos para preservar el aislamiento multi-tenant — ver firestore.rules).
    const usuarioRef = doc(db, 'usuarios', authUser.uid).withConverter(usuarioConverter);
    const userSnap = await getDoc(usuarioRef);

    if (!userSnap.exists() || userSnap.data().deletedAt !== null) {
      await signOut(auth); // Revertir si no existe en la base de datos o está eliminado
      throw new Error('Usuario no encontrado en la base de datos o se encuentra inactivo.');
    }

    const usuarioData = userSnap.data();

    // Auto-activar usuario invitado en su primer login
    if (usuarioData.estado === 'invitado') {
      await updateDoc(usuarioRef, { estado: 'activo', updatedAt: Timestamp.now() });
      usuarioData.estado = 'activo';
    }

    // 3.3. Descargar el Contacto asociado por doc ID = contact_id del usuario
    const contactoRef = doc(db, 'contactos', usuarioData.contact_id).withConverter(contactoConverter);
    const contactSnap = await getDoc(contactoRef);

    if (!contactSnap.exists() || contactSnap.data().deletedAt !== null) {
      await signOut(auth); // Revertir si no existe el contacto asociado
      throw new Error('No existe información de contacto activa asociada a este usuario.');
    }

    // Anidamos el objeto de contacto descargado
    usuarioData.contacto = contactSnap.data();

    // 3.4. Obtener los datos de la Empresa, si no es super_admin
    if (usuarioData.system_role !== 'super_admin') {
      // Intentar por empresa_id directo primero; si no, buscar desde grants
      let empresaId = usuarioData.empresa_id ?? null;

      if (!empresaId) {
        // Cargar grants anticipadamente para obtener el company_id
        const grantSnap = await getDocs(
          query(
            collection(db, 'grants'),
            where('user_id', '==', usuarioData.id),
            where('active', '==', true),
            where('deletedAt', '==', null)
          )
        );
        const companyGrant = grantSnap.docs
          .map(d => d.data())
          .find((g: any) => g.company_id);
        if (companyGrant) empresaId = companyGrant.company_id;
      }

      if (empresaId) {
        const empresaRef = doc(db, 'empresas', empresaId).withConverter(empresaConverter);
        const empresaSnap = await getDoc(empresaRef);
        if (empresaSnap.exists()) {
          usuarioData.empresa = empresaSnap.data();
          usuarioData.empresa_id = empresaId;
          if (!usuarioData.cliente_id && usuarioData.empresa.cliente_id) {
            usuarioData.cliente_id = usuarioData.empresa.cliente_id;
          }
        }
      }
    }

    currentUser.value = usuarioData;
    activeCompanyId.value = usuarioData.empresa_id || null;
    activeClienteId.value = usuarioData.cliente_id || null;

    // Cargar grants del usuario (lectura puntual — §9 CLAUDE.md)
    if (!usuarioData.isSuperAdmin) {
      const grantStore = useGrantStore();
      await grantStore.cargarGrants(usuarioData.id);
      // Registrar slug→id de la empresa del usuario para el guard
      if (usuarioData.empresa) {
        grantStore.registrarEmpresaSlug(
          usuarioData.empresa.slug,
          usuarioData.empresa_id ?? usuarioData.empresa.id
        );
      }
      // Si tiene grant de cliente, cargar el doc del cliente para obtener su slug
      const clienteGrant = grantStore.grants.find(g => g.scope_type === 'client');
      const clienteId = clienteGrant?.scope_id ?? usuarioData.cliente_id ?? null;
      if (clienteId) {
        const clienteRef = doc(db, 'clientes', clienteId).withConverter(clienteConverter);
        const clienteSnap = await getDoc(clienteRef);
        if (clienteSnap.exists()) {
          const clienteData = clienteSnap.data();
          usuarioData.cliente = clienteData;
          grantStore.registrarClienteSlug(clienteData.slug, clienteId);
        }
      }
    }

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
    // Marcar la sesión como inactiva (soft-delete) para que no pueda reutilizarse
    if (currentSession.value) {
      const sessionRef = doc(db, 'sesiones', currentSession.value.id);
      await updateDoc(sessionRef, { active: false, updatedAt: Timestamp.now() });
    }
    
    // Limpiar Firebase Auth
    await signOut(auth);
    
    // Resetear el estado local
    currentUser.value = null;
    currentSession.value = null;
    activeClienteId.value = null;
    activeCompanyId.value = null;
    activeZonaId.value = null;
    activeUbicacionId.value = null;
    useGrantStore().limpiarGrants();

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
      const qSession = query(sesionesRef, where('user_id', '==', storedUserId), where('token', '==', storedToken), where('active', '==', true));
      const sessionSnap = await getDocs(qSession);

      if (sessionSnap.empty) throw new Error('Sesión no encontrada, inválida o cerrada');
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
      if (usuarioData.system_role !== 'super_admin') {
        let empresaId = usuarioData.empresa_id ?? null;

        if (!empresaId) {
          const grantSnap = await getDocs(
            query(
              collection(db, 'grants'),
              where('user_id', '==', usuarioData.id),
              where('active', '==', true),
              where('deletedAt', '==', null)
            )
          );
          const companyGrant = grantSnap.docs
            .map(d => d.data())
            .find((g: any) => g.company_id);
          if (companyGrant) empresaId = companyGrant.company_id;
        }

        if (empresaId) {
          const empresaRef = doc(db, 'empresas', empresaId).withConverter(empresaConverter);
          const empresaSnap = await getDoc(empresaRef);
          if (empresaSnap.exists()) {
            usuarioData.empresa = empresaSnap.data();
            usuarioData.empresa_id = empresaId;
            if (!usuarioData.cliente_id && usuarioData.empresa.cliente_id) {
              usuarioData.cliente_id = usuarioData.empresa.cliente_id;
            }
          }
        }
      }

      // 5. Rehidratar estado en memoria
      currentUser.value = usuarioData;
      currentSession.value = sessionData;
      activeCompanyId.value = usuarioData.empresa_id || null;
      activeClienteId.value = usuarioData.cliente_id || null;

      // Cargar grants (lectura puntual — §9 CLAUDE.md)
      if (!usuarioData.isSuperAdmin) {
        const grantStore = useGrantStore();
        await grantStore.cargarGrants(usuarioData.id);
        if (usuarioData.empresa) {
          grantStore.registrarEmpresaSlug(
            usuarioData.empresa.slug,
            usuarioData.empresa_id ?? usuarioData.empresa.id
          );
        }
        // Registrar slug del cliente para el guard requiresCliente
        const clienteGrant = grantStore.grants.find(g => g.scope_type === 'client');
        const clienteId = clienteGrant?.scope_id ?? usuarioData.cliente_id ?? null;
        if (clienteId) {
          const clienteRef = doc(db, 'clientes', clienteId).withConverter(clienteConverter);
          const clienteSnap = await getDoc(clienteRef);
          if (clienteSnap.exists()) {
            const clienteData = clienteSnap.data();
            usuarioData.cliente = clienteData;
            grantStore.registrarClienteSlug(clienteData.slug, clienteId);
          }
        }
      }

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

  async function resolverHomeRoute(): Promise<{ name: string; params?: Record<string, string> }> {
    const user = currentUser.value;
    if (!user || user.isSuperAdmin) return { name: 'admin-dashboard' };

    const grantStore = useGrantStore();
    const grants = grantStore.grants;
    const companySlug = user.empresa?.slug ?? '';

    // Si tiene grant de cliente → ir al selector de empresa (scope cliente)
    const clienteGrant = grants.find(g => g.scope_type === 'client');
    if (clienteGrant) {
      const clienteSlug = user.cliente?.slug ?? grantStore.resolverClienteId(clienteGrant.scope_id) ? clienteGrant.scope_id : null;
      // Buscar el slug en el mapa inverso
      const slugEntry = Object.entries(grantStore.clienteSlugToId).find(([, id]) => id === clienteGrant.scope_id);
      if (slugEntry) {
        return { name: 'cliente-empresas', params: { clienteSlug: slugEntry[0] } };
      }
    }

    // Si tiene múltiples empresas vía company_ids → ir al selector si tiene slug de cliente
    const tieneMultiEmpresa = (user.company_ids?.length ?? 0) > 1 && user.cliente?.slug;
    if (tieneMultiEmpresa) {
      return { name: 'cliente-empresas', params: { clienteSlug: user.cliente!.slug } };
    }

    // Si tiene grant de company → panel de empresa
    const tieneCompany = grants.some(g => g.scope_type === 'company');
    if (tieneCompany && companySlug) return { name: 'empresa-home', params: { companySlug } };

    // Si tiene grant de branch → ir a la sucursal
    const branchGrant = grants.find(g => g.scope_type === 'branch');
    if (branchGrant) {
      const ubicRef = doc(db, 'ubicaciones', branchGrant.scope_id).withConverter(ubicacionConverter);
      const ubicSnap = await getDoc(ubicRef);
      if (ubicSnap.exists()) {
        const ubicacion = ubicSnap.data();
        useGrantStore().registrarUbicacionSlug(ubicacion.slug, ubicacion.id, ubicacion.zone_id ?? null);
        return { name: 'sucursal-dashboard', params: { companySlug, ubicacionSlug: ubicacion.slug } };
      }
    }

    // Si tiene grant de zone → ir a la zona
    const zonaGrant = grants.find(g => g.scope_type === 'zone');
    if (zonaGrant && companySlug) {
      const zonaRef = doc(db, 'zonas', zonaGrant.scope_id).withConverter(zonaConverter);
      const zonaSnap = await getDoc(zonaRef);
      if (zonaSnap.exists()) {
        const zona = zonaSnap.data();
        return { name: 'zona-dashboard', params: { companySlug, zonaSlug: zona.slug } };
      }
    }

    // Fallback
    if (companySlug) return { name: 'empresa-home', params: { companySlug } };
    return { name: 'login' };
  }

  return {
    currentUser,
    currentSession,
    activeClienteId,
    activeCompanyId,
    activeZonaId,
    activeUbicacionId,
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
    validateSession,
    resolverHomeRoute
  };
});
