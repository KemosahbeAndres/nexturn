import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp, arrayUnion } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { Ubicacion, ubicacionConverter, type Turno, type ConfiguracionTurnos } from '../models/Ubicacion';

export const useUbicacionStore = defineStore('ubicacion', () => {
  const ubicacionesRef = collection(db, 'ubicaciones').withConverter(ubicacionConverter);

  const queryParams = ref<{ empresaId: string | null; zonaId?: string | null }>({
    empresaId: null,
    zonaId: undefined,
  });

  function listarUbicaciones(empresaId: string, zonaId?: string | null) {
    queryParams.value = { empresaId, zonaId };
  }

  const ubicacionesQuery = computed(() => {
    if (!queryParams.value.empresaId) return null;

    let q = query(
      ubicacionesRef,
      where('company_id', '==', queryParams.value.empresaId)
    );

    if (queryParams.value.zonaId !== undefined) {
      q = query(q, where('zone_id', '==', queryParams.value.zonaId));
    }

    return q;
  });

  const ubicaciones = useCollection(ubicacionesQuery);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function createUbicacion(data: Omit<Ubicacion, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'hasZone' | 'activeTurnos' | 'activeConfiguraciones' | 'defaultConfiguracion'>) {
    const docRef = doc(ubicacionesRef);
    const newUbicacion = new Ubicacion(
      docRef.id,
      data.company_id,
      data.zone_id,
      data.category,
      data.name,
      data.address,
      data.active,
      data.turnos,
      data.configuraciones ?? [],
      data.manager_id ?? null,
      slugify(data.name)
    );
    await setDoc(docRef, newUbicacion);
    return docRef.id;
  }

  async function updateUbicacion(id: string, updateData: Partial<Omit<Ubicacion, 'id' | 'createdAt'>>) {
    const docRef = doc(db, 'ubicaciones', id);
    const payload: Record<string, unknown> = { ...updateData, updatedAt: Timestamp.now() };
    if (updateData.name) payload.slug = slugify(updateData.name);
    await updateDoc(docRef, payload);
  }

  async function softDeleteUbicacion(id: string) {
    const docRef = doc(db, 'ubicaciones', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  // Turno management (legado — se mantiene por compatibilidad)
  async function addTurno(ubicacionId: string, turnoData: Omit<Turno, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const docRef = doc(db, 'ubicaciones', ubicacionId);
    const newTurno: Turno = {
      id: crypto.randomUUID(),
      ...turnoData,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    await updateDoc(docRef, {
      turnos: arrayUnion(newTurno),
      updatedAt: Timestamp.now(),
    });
    return newTurno.id;
  }

  async function updateTurnosArray(ubicacionId: string, turnos: Turno[]) {
    const docRef = doc(db, 'ubicaciones', ubicacionId);
    await updateDoc(docRef, {
      turnos: turnos.map(serializeTurno),
      updatedAt: Timestamp.now(),
    });
  }

  async function softDeleteTurno(ubicacionId: string, turnoId: string, currentTurnos: Turno[]) {
    const updated = currentTurnos.map(t =>
      t.id === turnoId ? { ...t, deletedAt: new Date(), updatedAt: new Date() } : t
    );
    await updateTurnosArray(ubicacionId, updated);
  }

  // ── Helpers de serialización ──────────────────────────────────────────────────

  function serializeTurno(t: Turno) {
    return {
      id: t.id,
      day_of_week: t.day_of_week,
      start_time: t.start_time,
      end_time: t.end_time,
      requerimientos: t.requerimientos,
      createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: t.deletedAt ? Timestamp.fromDate(t.deletedAt) : null,
    };
  }

  function serializeConfiguracion(c: ConfiguracionTurnos) {
    return {
      id: c.id,
      name: c.name,
      scope: c.scope,
      month: c.month ?? null,
      date_start: c.date_start ?? null,
      date_end: c.date_end ?? null,
      turnos: c.turnos.map(serializeTurno),
      createdAt: c.createdAt ? Timestamp.fromDate(c.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: c.deletedAt ? Timestamp.fromDate(c.deletedAt) : null,
    };
  }

  // ── Gestión de ConfiguracionTurnos ───────────────────────────────────────────

  async function addConfiguracion(
    ubicacionId: string,
    data: Omit<ConfiguracionTurnos, 'id' | 'turnos' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<string> {
    const docRef = doc(db, 'ubicaciones', ubicacionId);
    const nueva: ConfiguracionTurnos = {
      id: crypto.randomUUID(),
      ...data,
      turnos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const ubicacion = ubicaciones.value?.find(u => u.id === ubicacionId);
    const current = ubicacion?.configuraciones ?? [];
    await updateDoc(docRef, {
      configuraciones: [...current, nueva].map(serializeConfiguracion),
      updatedAt: Timestamp.now(),
    });
    return nueva.id;
  }

  async function updateConfiguracionesArray(ubicacionId: string, configuraciones: ConfiguracionTurnos[]) {
    const docRef = doc(db, 'ubicaciones', ubicacionId);
    await updateDoc(docRef, {
      configuraciones: configuraciones.map(serializeConfiguracion),
      updatedAt: Timestamp.now(),
    });
  }

  async function softDeleteConfiguracion(ubicacionId: string, configId: string, currentConfigs: ConfiguracionTurnos[]) {
    const updated = currentConfigs.map(c =>
      c.id === configId ? { ...c, deletedAt: new Date(), updatedAt: new Date() } : c
    );
    await updateConfiguracionesArray(ubicacionId, updated);
  }

  async function addTurnoAConfiguracion(
    ubicacionId: string,
    configId: string,
    turnoData: Omit<Turno, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    currentConfigs: ConfiguracionTurnos[]
  ): Promise<string> {
    const turnoId = crypto.randomUUID();
    const nuevoTurno: Turno = { id: turnoId, ...turnoData, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
    const updated = currentConfigs.map(c =>
      c.id === configId ? { ...c, turnos: [...c.turnos, nuevoTurno], updatedAt: new Date() } : c
    );
    await updateConfiguracionesArray(ubicacionId, updated);
    return turnoId;
  }

  async function updateTurnoEnConfiguracion(
    ubicacionId: string,
    configId: string,
    turnoActualizado: Turno,
    currentConfigs: ConfiguracionTurnos[]
  ) {
    const updated = currentConfigs.map(c =>
      c.id === configId
        ? { ...c, turnos: c.turnos.map(t => t.id === turnoActualizado.id ? { ...turnoActualizado, updatedAt: new Date() } : t), updatedAt: new Date() }
        : c
    );
    await updateConfiguracionesArray(ubicacionId, updated);
  }

  async function softDeleteTurnoEnConfiguracion(
    ubicacionId: string,
    configId: string,
    turnoId: string,
    currentConfigs: ConfiguracionTurnos[]
  ) {
    const updated = currentConfigs.map(c =>
      c.id === configId
        ? { ...c, turnos: c.turnos.map(t => t.id === turnoId ? { ...t, deletedAt: new Date(), updatedAt: new Date() } : t), updatedAt: new Date() }
        : c
    );
    await updateConfiguracionesArray(ubicacionId, updated);
  }

  return {
    ubicaciones,
    listarUbicaciones,
    createUbicacion,
    updateUbicacion,
    softDeleteUbicacion,
    addTurno,
    updateTurnosArray,
    softDeleteTurno,
    addConfiguracion,
    updateConfiguracionesArray,
    softDeleteConfiguracion,
    addTurnoAConfiguracion,
    updateTurnoEnConfiguracion,
    softDeleteTurnoEnConfiguracion,
  };
});
