import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type ReglaType = 'juntos' | 'nunca_juntos';

export class ReglaAsignacion {
  constructor(
    public id: string,
    public person_uno_id: string,
    public person_dos_id: string,
    public is_strict: boolean,
    public type: ReglaType,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const reglaAsignacionConverter: FirestoreDataConverter<ReglaAsignacion> = {
  toFirestore(regla: ReglaAsignacion): DocumentData {
    return {
      person_uno_id: regla.person_uno_id,
      person_dos_id: regla.person_dos_id,
      is_strict: regla.is_strict,
      type: regla.type,
      createdAt: regla.createdAt ? Timestamp.fromDate(regla.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: regla.deletedAt ? Timestamp.fromDate(regla.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): ReglaAsignacion {
    const data = snapshot.data(options)!;
    return new ReglaAsignacion(
      snapshot.id,
      data.person_uno_id || '',
      data.person_dos_id || '',
      data.is_strict ?? false,
      data.type || 'juntos',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
