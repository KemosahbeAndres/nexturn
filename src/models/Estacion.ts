import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type EstacionIntensidad = 'alta' | 'media' | 'baja';

export class Estacion {
  constructor(
    public id: string,
    public empresa_id: string,
    public nombre: string,
    public descripcion: string,
    public active: boolean,
    public intensidad: EstacionIntensidad = 'media',
    public max_continuo_min: number | null = null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const estacionConverter: FirestoreDataConverter<Estacion> = {
  toFirestore(e: Estacion): DocumentData {
    return {
      empresa_id: e.empresa_id,
      nombre: e.nombre,
      descripcion: e.descripcion,
      active: e.active,
      intensidad: e.intensidad,
      max_continuo_min: e.max_continuo_min,
      createdAt: e.createdAt ? Timestamp.fromDate(e.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: e.deletedAt ? Timestamp.fromDate(e.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Estacion {
    const data = snapshot.data(options)!;
    return new Estacion(
      snapshot.id,
      data.empresa_id,
      data.nombre || '',
      data.descripcion || '',
      data.active ?? true,
      data.intensidad ?? 'media',
      data.max_continuo_min ?? null,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
