import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import type { Turno } from './Ubicacion';

export type AsignacionStatus = 'draft' | 'published';

export class Asignacion {
  constructor(
    public id: string,
    public location_id: string,
    public date: string,
    public turn: Turno,
    public assigned_staff: string[],
    public status: AsignacionStatus,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get isPublished(): boolean {
    return this.status === 'published';
  }
}

export const asignacionConverter: FirestoreDataConverter<Asignacion> = {
  toFirestore(asignacion: Asignacion): DocumentData {
    const t = asignacion.turn;
    return {
      location_id: asignacion.location_id,
      date: asignacion.date,
      turn: {
        ...t,
        createdAt: t.createdAt ? Timestamp.fromDate(t.createdAt) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        deletedAt: t.deletedAt ? Timestamp.fromDate(t.deletedAt) : null,
      },
      assigned_staff: asignacion.assigned_staff,
      status: asignacion.status,
      createdAt: asignacion.createdAt ? Timestamp.fromDate(asignacion.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: asignacion.deletedAt ? Timestamp.fromDate(asignacion.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Asignacion {
    const data = snapshot.data(options)!;
    const t = data.turn ?? {};
    const turn: Turno = {
      id: t.id || '',
      day_of_week: t.day_of_week || '',
      start_time: t.start_time || '',
      end_time: t.end_time || '',
      requerimientos: t.requerimientos || [],
      createdAt: t.createdAt?.toDate() || new Date(),
      updatedAt: t.updatedAt?.toDate() || new Date(),
      deletedAt: t.deletedAt?.toDate() ?? null,
    };
    return new Asignacion(
      snapshot.id,
      data.location_id || '',
      data.date || '',
      turn,
      data.assigned_staff || [],
      data.status || 'draft',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
