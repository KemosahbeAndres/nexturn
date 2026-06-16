import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type UbicacionCategory = 'sucursal' | 'territorio' | 'stand' | string;

export interface Turno {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slots_available: number;
  required_roles: string[];
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
    public manager_id: string | null = null,
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
      turnos: ubicacion.turnos.map(t => ({
        ...t,
        createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        deletedAt: t.deletedAt ? Timestamp.fromDate(t.deletedAt) : null,
      })),
      createdAt: ubicacion.createdAt ? Timestamp.fromDate(ubicacion.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: ubicacion.deletedAt ? Timestamp.fromDate(ubicacion.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Ubicacion {
    const data = snapshot.data(options)!;
    const turnos: Turno[] = (data.turnos || []).map((t: any) => ({
      id: t.id,
      day_of_week: t.day_of_week || '',
      start_time: t.start_time || '',
      end_time: t.end_time || '',
      slots_available: t.slots_available ?? 2,
      required_roles: t.required_roles || [],
      createdAt: t.createdAt?.toDate() || new Date(),
      updatedAt: t.updatedAt?.toDate() || new Date(),
      deletedAt: t.deletedAt?.toDate() ?? null,
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
      data.manager_id ?? null,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
