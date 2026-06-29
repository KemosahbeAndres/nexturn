import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type UbicacionCategory = 'sucursal' | 'territorio' | 'stand' | string;

export interface Requerimiento {
  estacion_id: string | null;  // null en congregación (sin estaciones)
  cantidad: number;
}

export interface Turno {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  requerimientos: Requerimiento[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type ConfigScope = 'default' | 'month' | 'range';

export interface ConfiguracionTurnos {
  id: string;
  name: string;
  scope: ConfigScope;
  // Para scope 'month': "2026-08" (YYYY-MM)
  month?: string | null;
  // Para scope 'range': fechas ISO YYYY-MM-DD
  date_start?: string | null;
  date_end?: string | null;
  turnos: Turno[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Ubicacion {
  constructor(
    public id: string,
    public company_id: string,
    public zone_id: string | null,
    public category: UbicacionCategory,
    public name: string,
    public address: string,
    public active: boolean,
    public turnos: Turno[],
    public configuraciones: ConfiguracionTurnos[],
    public manager_id: string | null = null,
    public slug: string = '',
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get hasZone(): boolean {
    return this.zone_id !== null;
  }

  get activeTurnos(): Turno[] {
    return this.turnos.filter(t => !t.deletedAt);
  }

  get activeConfiguraciones(): ConfiguracionTurnos[] {
    return this.configuraciones.filter(c => !c.deletedAt);
  }

  get defaultConfiguracion(): ConfiguracionTurnos | undefined {
    return this.configuraciones.find(c => c.scope === 'default' && !c.deletedAt);
  }
}

function deserializeTurno(t: any): Turno {
  // Migración: si viene en formato anterior (required_roles / required_skills), convertir
  let requerimientos: Requerimiento[] = [];
  if (Array.isArray(t.requerimientos)) {
    requerimientos = t.requerimientos.map((r: any) => ({
      estacion_id: r.estacion_id !== undefined ? (r.estacion_id ?? null) : (r.role ?? null),
      cantidad: r.cantidad ?? r.count ?? 1,
    }));
  } else if (Array.isArray(t.required_roles)) {
    requerimientos = t.required_roles.map((r: any) => ({
      estacion_id: typeof r === 'string' ? r : (r.role ?? null),
      cantidad: typeof r === 'string' ? 1 : (r.count ?? 1),
    }));
  }

  return {
    id: t.id,
    day_of_week: t.day_of_week || '',
    start_time: t.start_time || '',
    end_time: t.end_time || '',
    requerimientos,
    createdAt: t.createdAt?.toDate() || new Date(),
    updatedAt: t.updatedAt?.toDate() || new Date(),
    deletedAt: t.deletedAt?.toDate() ?? null,
  };
}

function serializeTurno(t: Turno): Record<string, unknown> {
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

export const ubicacionConverter: FirestoreDataConverter<Ubicacion> = {
  toFirestore(ubicacion: Ubicacion): DocumentData {
    return {
      company_id: ubicacion.company_id,
      zone_id: ubicacion.zone_id,
      category: ubicacion.category,
      name: ubicacion.name,
      address: ubicacion.address,
      active: ubicacion.active,
      manager_id: ubicacion.manager_id ?? null,
      slug: ubicacion.slug,
      turnos: ubicacion.turnos.map(serializeTurno),
      configuraciones: (ubicacion.configuraciones ?? []).map(c => ({
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
      })),
      createdAt: ubicacion.createdAt ? Timestamp.fromDate(ubicacion.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: ubicacion.deletedAt ? Timestamp.fromDate(ubicacion.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Ubicacion {
    const data = snapshot.data(options)!;
    const turnos: Turno[] = (data.turnos || []).map(deserializeTurno);
    const configuraciones: ConfiguracionTurnos[] = (data.configuraciones || []).map((c: any) => ({
      id: c.id,
      name: c.name || '',
      scope: c.scope || 'default',
      month: c.month ?? null,
      date_start: c.date_start ?? null,
      date_end: c.date_end ?? null,
      turnos: (c.turnos || []).map(deserializeTurno),
      createdAt: c.createdAt?.toDate() || new Date(),
      updatedAt: c.updatedAt?.toDate() || new Date(),
      deletedAt: c.deletedAt?.toDate() ?? null,
    }));

    return new Ubicacion(
      snapshot.id,
      data.company_id,
      data.zone_id ?? null,
      data.category || 'sucursal',
      data.name || '',
      data.address || '',
      data.active ?? true,
      turnos,
      configuraciones,
      data.manager_id ?? null,
      data.slug || '',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
