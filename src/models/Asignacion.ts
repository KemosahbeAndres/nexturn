import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type AsignacionStatus = 'sugerido' | 'publicado';

export class Asignacion {
  constructor(
    public id: string,
    public empresa_id: string,
    public ubicacion_id: string,
    public empleado_id: string,
    public date: string,
    public estacion_id: string | null,
    public start: string,
    public end: string,
    public status: AsignacionStatus,
    public active: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get isPublished(): boolean {
    return this.status === 'publicado';
  }
}

function normalizeStatus(raw: string | undefined): AsignacionStatus {
  if (!raw) return 'sugerido';
  if (raw === 'draft' || raw === 'aprobado') return 'sugerido';
  if (raw === 'published' || raw === 'publicado') return 'publicado';
  return 'sugerido';
}

export const asignacionConverter: FirestoreDataConverter<Asignacion> = {
  toFirestore(a: Asignacion): DocumentData {
    return {
      empresa_id: a.empresa_id,
      ubicacion_id: a.ubicacion_id,
      empleado_id: a.empleado_id,
      date: a.date,
      estacion_id: a.estacion_id ?? null,
      start: a.start,
      end: a.end,
      status: a.status,
      active: a.active,
      createdAt: a.createdAt ? Timestamp.fromDate(a.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: a.deletedAt ? Timestamp.fromDate(a.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Asignacion {
    const data = snapshot.data(options)!;
    return new Asignacion(
      snapshot.id,
      data.empresa_id || '',
      data.ubicacion_id || '',
      data.empleado_id || '',
      data.date || '',
      data.estacion_id ?? null,
      data.start || '',
      data.end || '',
      normalizeStatus(data.status),
      data.active ?? true,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
