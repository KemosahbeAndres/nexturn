import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export class Zona {
  constructor(
    public id: string,
    public empresa_id: string,
    public name: string,
    public manager_id: string | null,
    public active: boolean,
    public required_role: string[],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const zonaConverter: FirestoreDataConverter<Zona> = {
  toFirestore(zona: Zona): DocumentData {
    return {
      empresa_id: zona.empresa_id,
      name: zona.name,
      manager_id: zona.manager_id,
      active: zona.active,
      required_role: zona.required_role,
      createdAt: zona.createdAt ? Timestamp.fromDate(zona.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: zona.deletedAt ? Timestamp.fromDate(zona.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Zona {
    const data = snapshot.data(options)!;
    return new Zona(
      snapshot.id,
      data.empresa_id,
      data.name || '',
      data.manager_id ?? null,
      data.active ?? true,
      data.required_role || [],
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
