import { defineStore } from 'pinia';
import { collection, doc, getDocs, writeBatch, updateDoc, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { Asignacion, asignacionConverter } from '../models/Asignacion';

const generarAsignacionesFn = httpsCallable(functions, 'generarAsignaciones', { timeout: 120000 });

export const useAsignacionStore = defineStore('asignacion', () => {
  const asignacionesRef = collection(db, 'asignaciones').withConverter(asignacionConverter);

  // ── Lecturas puntuales ──────────────────────────────────────────────────────

  async function cargarAsignacionesManager(
    ubicacionId: string,
    dateStart: string,
    dateEnd: string
  ): Promise<Asignacion[]> {
    const snap = await getDocs(query(
      asignacionesRef,
      where('ubicacion_id', '==', ubicacionId),
      where('date', '>=', dateStart),
      where('date', '<=', dateEnd),
      where('deletedAt', '==', null)
    ));
    return snap.docs.map(d => d.data());
  }

  async function cargarAsignacionesEmpleado(
    empleadoId: string,
    dateStart: string,
    dateEnd: string
  ): Promise<Asignacion[]> {
    const snap = await getDocs(query(
      asignacionesRef,
      where('empleado_id', '==', empleadoId),
      where('date', '>=', dateStart),
      where('date', '<=', dateEnd),
      where('status', '==', 'publicado'),
      where('deletedAt', '==', null)
    ));
    return snap.docs.map(d => d.data());
  }

  // ── Mutaciones ──────────────────────────────────────────────────────────────

  async function publicarDia(ubicacionId: string, date: string): Promise<void> {
    const snap = await getDocs(query(
      asignacionesRef,
      where('ubicacion_id', '==', ubicacionId),
      where('date', '==', date),
      where('status', '==', 'sugerido'),
      where('deletedAt', '==', null)
    ));
    if (snap.empty) return;

    const BATCH_SIZE = 499;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_SIZE).forEach(d => {
        batch.update(d.ref, { status: 'publicado', updatedAt: Timestamp.now() });
      });
      await batch.commit();
    }
  }

  async function softDeleteAsignacion(id: string): Promise<void> {
    await updateDoc(doc(db, 'asignaciones', id), {
      active: false,
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  async function crearAsignacion(data: {
    empresa_id: string;
    ubicacion_id: string;
    empleado_id: string;
    date: string;
    estacion_id: string | null;
    start: string;
    end: string;
    status?: 'sugerido' | 'publicado';
  }): Promise<string> {
    const { status = 'sugerido', ...rest } = data;
    const ref = await addDoc(collection(db, 'asignaciones'), {
      ...rest,
      status,
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: null,
    });
    return ref.id;
  }

  async function actualizarEmpleadoAsignacion(id: string, empleadoId: string): Promise<void> {
    await updateDoc(doc(db, 'asignaciones', id), {
      empleado_id: empleadoId,
      status: 'publicado',
      updatedAt: Timestamp.now(),
    });
  }

  // ── Regenerar sugerencias (llama CF generarAsignaciones) ───────────────────

  async function regenerarSugerencias(
    empresaId: string,
    ubicacionId: string,
    weekStart: string,
    dias: number
  ): Promise<{ logs: string[]; dias_procesados: number; asignaciones_creadas: number; huecos: any[]; error?: string }> {
    const result = await generarAsignacionesFn({
      empresa_id: empresaId,
      ubicacion_id: ubicacionId,
      week_start: weekStart,
      dias,
    });
    return result.data as any;
  }

  // Fire-and-forget para disparadores reactivos (disponibilidad, excepciones, empleados).
  // Captura errores y los expone via callbacks para que el caller los vuelque al logStore.
  function regenerarSugerenciasSilencioso(
    empresaId: string,
    ubicacionId: string,
    onLog?: (logs: string[]) => void,
    onError?: (msg: string) => void
  ): void {
    const hoy = new Date().toISOString().slice(0, 10);
    generarAsignacionesFn({
      empresa_id: empresaId,
      ubicacion_id: ubicacionId,
      week_start: hoy,
      dias: 28,
    }).then((res: any) => {
      if (onLog && res.data?.logs) onLog(res.data.logs);
      if (res.data?.error && onError) onError(res.data.error);
    }).catch((err: any) => {
      const code = err?.code ?? '';
      const msg = err?.message ?? String(err);
      const details = err?.details ? ` | ${JSON.stringify(err.details)}` : '';
      if (onError) onError(`[${code}] ${msg}${details}`);
    });
  }

  return {
    cargarAsignacionesManager,
    cargarAsignacionesEmpleado,
    publicarDia,
    softDeleteAsignacion,
    crearAsignacion,
    actualizarEmpleadoAsignacion,
    regenerarSugerencias,
    regenerarSugerenciasSilencioso,
  };
});
