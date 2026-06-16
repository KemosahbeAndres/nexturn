import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export class Habilidad {
  constructor(
    public id: string,
    public empresa_id: string,
    public nombre: string,
    public descripcion: string,
    public active: boolean,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const habilidadConverter: FirestoreDataConverter<Habilidad> = {
  toFirestore(h: Habilidad): DocumentData {
    return {
      empresa_id: h.empresa_id,
      nombre: h.nombre,
      descripcion: h.descripcion,
      active: h.active,
      createdAt: h.createdAt ? Timestamp.fromDate(h.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: h.deletedAt ? Timestamp.fromDate(h.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Habilidad {
    const data = snapshot.data(options)!;
    return new Habilidad(
      snapshot.id,
      data.empresa_id,
      data.nombre || '',
      data.descripcion || '',
      data.active ?? true,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
