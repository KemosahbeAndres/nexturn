import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

// Requiere índice compuesto en Firestore: (empleado_id ASC, date ASC)
export type SegmentoTipo = 'estacion' | 'descanso';
export type SegmentoStatus = 'draft' | 'published';

export class Segmento {
  constructor(
    public id: string,
    public empresa_id: string,
    public ubicacion_id: string,
    public empleado_id: string,
    public date: string,
    public estacion_id: string | null,
    public tipo: SegmentoTipo,
    public start: string,
    public end: string,
    public asignacion_id: string,
    public status: SegmentoStatus,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const segmentoConverter: FirestoreDataConverter<Segmento> = {
  toFirestore(s: Segmento): DocumentData {
    return {
      empresa_id: s.empresa_id,
      ubicacion_id: s.ubicacion_id,
      empleado_id: s.empleado_id,
      date: s.date,
      estacion_id: s.estacion_id,
      tipo: s.tipo,
      start: s.start,
      end: s.end,
      asignacion_id: s.asignacion_id,
      status: s.status,
      createdAt: s.createdAt ? Timestamp.fromDate(s.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: s.deletedAt ? Timestamp.fromDate(s.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Segmento {
    const data = snapshot.data(options)!;
    return new Segmento(
      snapshot.id,
      data.empresa_id || '',
      data.ubicacion_id || '',
      data.empleado_id || '',
      data.date || '',
      data.estacion_id ?? null,
      data.tipo || 'estacion',
      data.start || '',
      data.end || '',
      data.asignacion_id || '',
      data.status || 'draft',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
