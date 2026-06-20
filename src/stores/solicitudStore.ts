import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Solicitud, solicitudConverter } from '../models/Solicitud';
import type { SolicitudTipo, SolicitudRango, SolicitudReemplazo } from '../models/Solicitud';

export const useSolicitudStore = defineStore('solicitud', () => {
  const solicitudesRef = collection(db, 'solicitudes').withConverter(solicitudConverter);

  const queryParams = ref<{
    sucursalId: string | null;
    empleadoId: string | null;
  }>({ sucursalId: null, empleadoId: null });

  function listarPorSucursal(sucursalId: string) {
    queryParams.value = { sucursalId, empleadoId: null };
  }

  function listarPorEmpleado(empleadoId: string) {
    queryParams.value = { sucursalId: null, empleadoId };
  }

  function clearSolicitudes() {
    queryParams.value = { sucursalId: null, empleadoId: null };
  }

  const solicitudesQuery = computed(() => {
    if (queryParams.value.sucursalId) {
      return query(
        solicitudesRef,
        where('sucursal_id', '==', queryParams.value.sucursalId),
        where('deletedAt', '==', null)
      );
    }
    if (queryParams.value.empleadoId) {
      return query(
        solicitudesRef,
        where('empleado_id', '==', queryParams.value.empleadoId),
        where('deletedAt', '==', null)
      );
    }
    return null;
  });

  const solicitudes = useCollection(solicitudesQuery);
  const pendientes = computed(() => solicitudes.value?.filter(s => s.estado === 'pendiente') ?? []);
  const aprobadas = computed(() => solicitudes.value?.filter(s => s.estado === 'aprobada') ?? []);
  const rechazadas = computed(() => solicitudes.value?.filter(s => s.estado === 'rechazada') ?? []);

  async function createSolicitud(data: {
    empresa_id: string;
    empleado_id: string;
    sucursal_id: string;
    tipo: SolicitudTipo;
    rango: SolicitudRango;
  }) {
    const docRef = doc(solicitudesRef);
    const nueva = new Solicitud(
      docRef.id,
      data.empresa_id,
      data.empleado_id,
      data.sucursal_id,
      data.tipo,
      data.rango,
      'pendiente'
    );
    await setDoc(docRef, nueva);
    return docRef.id;
  }

  async function aprobarSolicitud(
    id: string,
    aprobadorId: string,
    reemplazo: SolicitudReemplazo | null
  ) {
    const docRef = doc(db, 'solicitudes', id);
    await updateDoc(docRef, {
      estado: 'aprobada',
      aprobador_id: aprobadorId,
      reemplazo: reemplazo ?? null,
      updatedAt: Timestamp.now(),
    });
  }

  async function rechazarSolicitud(id: string, aprobadorId: string) {
    const docRef = doc(db, 'solicitudes', id);
    await updateDoc(docRef, {
      estado: 'rechazada',
      aprobador_id: aprobadorId,
      updatedAt: Timestamp.now(),
    });
  }

  async function softDeleteSolicitud(id: string) {
    const docRef = doc(db, 'solicitudes', id);
    await updateDoc(docRef, {
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  return {
    solicitudes,
    pendientes,
    aprobadas,
    rechazadas,
    listarPorSucursal,
    listarPorEmpleado,
    clearSolicitudes,
    createSolicitud,
    aprobarSolicitud,
    rechazarSolicitud,
    softDeleteSolicitud,
  };
});
