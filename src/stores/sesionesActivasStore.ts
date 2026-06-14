import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, getDoc, query, where } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase';
import { Sesion, sesionConverter } from '../models/Sesion';
import { Usuario, usuarioConverter } from '../models/Usuario';
import { contactoConverter } from '../models/Contacto';

const VENTANA_MINUTOS = 30;

export interface SesionConUsuario extends Sesion {
  usuario?: Usuario;
}

function esSesionActiva(sesion: Sesion): boolean {
  if (!sesion.active) return false;
  if (sesion.duration === 0) return true; // "permanecer conectado"
  const diffMs = Date.now() - sesion.createdAt.getTime();
  return diffMs < VENTANA_MINUTOS * 60_000;
}

function navegadorDesdeAgent(agent: string): string {
  if (!agent) return 'otro';
  if (agent.includes('Edg')) return 'edge';
  if (agent.includes('Chrome')) return 'chrome';
  if (agent.includes('Firefox')) return 'firefox';
  if (agent.includes('Safari')) return 'safari';
  return 'otro';
}

export const useSesionesActivasStore = defineStore('sesionesActivas', () => {
  const sesionesRef = collection(db, 'sesiones').withConverter(sesionConverter);
  const activa = ref(false);

  function activar() {
    activa.value = true;
  }

  // Solo traemos sesiones marcadas como activas desde Firestore
  const sesionesQuery = computed(() => {
    if (!activa.value) return null;
    return query(sesionesRef, where('active', '==', true));
  });

  const sesionesRaw = useCollection(sesionesQuery);
  const sesiones = ref<SesionConUsuario[]>([]);

  // Cache de usuarios ya hidratados para no re-fetchear en cada cambio
  const usuarioCache = new Map<string, Usuario>();

  watch(sesionesRaw, async (todas) => {
    if (!todas) return;

    // Agrupar por (user_id + navegador): la sesión más reciente por cada par
    const porClaveNavegador = new Map<string, Sesion>();
    for (const sesion of todas) {
      const nav = navegadorDesdeAgent(sesion.browser_agent);
      const clave = `${sesion.user_id}::${nav}`;
      const anterior = porClaveNavegador.get(clave);
      if (!anterior || sesion.createdAt > anterior.createdAt) {
        porClaveNavegador.set(clave, sesion);
      }
    }

    // Filtrar solo las que califican como "activas ahora"
    const activas = [...porClaveNavegador.values()].filter(esSesionActiva);

    // Hidratar con datos de usuario y contacto (con caché)
    const hidratadas: SesionConUsuario[] = [];
    for (const sesion of activas) {
      const entry: SesionConUsuario = { ...sesion };
      try {
        let usuario = usuarioCache.get(sesion.user_id);
        if (!usuario) {
          const usuarioRef = doc(db, 'usuarios', sesion.user_id).withConverter(usuarioConverter);
          const usuarioSnap = await getDoc(usuarioRef);
          if (usuarioSnap.exists()) {
            usuario = usuarioSnap.data();
            const contactoRef = doc(db, 'contactos', usuario.contact_id).withConverter(contactoConverter);
            const contactoSnap = await getDoc(contactoRef);
            if (contactoSnap.exists()) usuario.contacto = contactoSnap.data();
            usuarioCache.set(sesion.user_id, usuario);
          }
        }
        if (usuario) entry.usuario = usuario;
      } catch {
        // continúa sin hidratar
      }
      hidratadas.push(entry);
    }

    sesiones.value = hidratadas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, { deep: true });

  return { sesiones, activar };
});
