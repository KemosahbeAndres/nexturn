import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

export class Contacto {
  constructor(
    public id: string,
    public first_name: string,
    public last_name: string,
    public rut: string,
    public email: string,
    public phone: string,
    public address: string,
    public is_company: boolean,
    public active: boolean,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const contactoConverter = {
  toFirestore(contacto: Contacto): DocumentData {
    return {
      first_name: contacto.first_name,
      last_name: contacto.last_name,
      rut: contacto.rut,
      email: contacto.email,
      phone: contacto.phone,
      address: contacto.address,
      is_company: contacto.is_company,
      active: contacto.active,
      createdAt: contacto.createdAt ? Timestamp.fromDate(contacto.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: contacto.deletedAt ? Timestamp.fromDate(contacto.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Contacto {
    const data = snapshot.data(options)!;
    return new Contacto(
      snapshot.id,
      data.first_name || '',
      data.last_name || '',
      data.rut || '',
      data.email || '',
      data.phone || '',
      data.address || '',
      data.is_company || false,
      data.active ?? true,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};