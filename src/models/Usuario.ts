import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Contacto } from './Contacto';
import { Empresa } from './Empresa';

export class Usuario {
  // Propiedades relacionales anidadas (hidratadas localmente al iniciar sesión)
  public contacto?: Contacto;
  public empresa?: Empresa;

  constructor(
    public id: string,
    public empresa_id: string | null,
    public contact_id: string,
    public system_role: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null,
    public preferences?: {
      theme: string;
      language: string;
      notificationsEnabled: boolean;
    }
  ) {}
}

export const usuarioConverter: FirestoreDataConverter<Usuario> = {
  toFirestore(usuario: Usuario): DocumentData {
    return {
      empresa_id: usuario.empresa_id,
      contact_id: usuario.contact_id,
      system_role: usuario.system_role,
      createdAt: usuario.createdAt ? Timestamp.fromDate(usuario.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: usuario.deletedAt ? Timestamp.fromDate(usuario.deletedAt) : null,
      preferences: usuario.preferences || null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Usuario {
    const data = snapshot.data(options)!;
    return new Usuario(
      snapshot.id,
      data.empresa_id,
      data.contact_id,
      data.system_role,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null,
      data.preferences
    );
  }
};