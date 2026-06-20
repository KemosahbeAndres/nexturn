import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export class Presencia {
  constructor(
    public id: string,
    public empresa_id: string,
    public ubicacion_id: string,
    public empleado_id: string,
    public date: string,
    public start: string,
    public end: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const presenciaConverter: FirestoreDataConverter<Presencia> = {
  toFirestore(p: Presencia): DocumentData {
    return {
      empresa_id: p.empresa_id,
      ubicacion_id: p.ubicacion_id,
      empleado_id: p.empleado_id,
      date: p.date,
      start: p.start,
      end: p.end,
      createdAt: p.createdAt ? Timestamp.fromDate(p.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: p.deletedAt ? Timestamp.fromDate(p.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Presencia {
    const data = snapshot.data(options)!;
    return new Presencia(
      snapshot.id,
      data.empresa_id || '',
      data.ubicacion_id || '',
      data.empleado_id || '',
      data.date || '',
      data.start || '',
      data.end || '',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
