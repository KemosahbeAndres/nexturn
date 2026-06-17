import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type ExcepcionType = 'feriado_legal' | 'dia_administrativo' | 'emergencia' | 'otro';

export class Excepcion {
  constructor(
    public id: string,
    public employee_id: string,
    public active: boolean,
    public date: string,
    public time_start: string,
    public time_end: string,
    public reason: string,
    public type: ExcepcionType,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const excepcionConverter: FirestoreDataConverter<Excepcion> = {
  toFirestore(excepcion: Excepcion): DocumentData {
    return {
      employee_id: excepcion.employee_id,
      active: excepcion.active,
      date: excepcion.date,
      time_start: excepcion.time_start,
      time_end: excepcion.time_end,
      reason: excepcion.reason,
      type: excepcion.type,
      createdAt: excepcion.createdAt ? Timestamp.fromDate(excepcion.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: excepcion.deletedAt ? Timestamp.fromDate(excepcion.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Excepcion {
    const data = snapshot.data(options)!;
    return new Excepcion(
      snapshot.id,
      data.employee_id || '',
      data.active ?? true,
      data.date || '',
      data.time_start || '',
      data.time_end || '',
      data.reason || '',
      data.type || 'otro',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
