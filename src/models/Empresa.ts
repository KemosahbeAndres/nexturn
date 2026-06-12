import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Contacto } from './Contacto';

export class Empresa {
  public contacto?: Contacto;

  constructor(
    public id: string,
    public active: boolean,
    public contact_id: string,
    public type: string,
    public work_roles: string[],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const empresaConverter: FirestoreDataConverter<Empresa> = {
  toFirestore(empresa: Empresa): DocumentData {
    return {
      active: empresa.active,
      contact_id: empresa.contact_id,
      type: empresa.type,
      work_roles: empresa.work_roles,
      createdAt: empresa.createdAt ? Timestamp.fromDate(empresa.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(), // Siempre refresca el updatedAt al guardar
      deletedAt: empresa.deletedAt ? Timestamp.fromDate(empresa.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Empresa {
    const data = snapshot.data(options)!;
    return new Empresa(
      snapshot.id,
      data.active,
      data.contact_id,
      data.type,
      data.work_roles || [],
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};