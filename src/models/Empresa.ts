import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Contacto } from './Contacto';
import { Role, roleFromFirestore, roleToFirestore } from './Role';

export type EmpresaType = 'empresa' | 'congregacion';

export class Empresa {
  public contacto?: Contacto;

  constructor(
    public id: string,
    public active: boolean,
    public contact_id: string,
    public type: EmpresaType,
    public cargos: Role[],
    public slug: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get isEmpresa(): boolean {
    return this.type === 'empresa';
  }

  get isCongregacion(): boolean {
    return this.type === 'congregacion';
  }

  get displayName(): string {
    return this.contacto?.first_name ?? this.slug;
  }
}

export const empresaConverter: FirestoreDataConverter<Empresa> = {
  toFirestore(empresa: Empresa): DocumentData {
    return {
      active: empresa.active,
      contact_id: empresa.contact_id,
      type: empresa.type,
      cargos: empresa.cargos.map(roleToFirestore),
      slug: empresa.slug,
      createdAt: empresa.createdAt ? Timestamp.fromDate(empresa.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: empresa.deletedAt ? Timestamp.fromDate(empresa.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Empresa {
    const data = snapshot.data(options)!;
    return new Empresa(
      snapshot.id,
      data.active,
      data.contact_id,
      data.type as EmpresaType,
      (data.cargos || data.work_roles || []).map(roleFromFirestore),
      data.slug || '',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
