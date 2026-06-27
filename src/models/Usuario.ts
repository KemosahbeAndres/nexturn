import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Contacto } from './Contacto';
import { Empresa } from './Empresa';
import type { Cliente } from './Cliente';

export type SystemRole = 'super_admin' | 'client_user';
export type UserEstado = 'invitado' | 'activo' | 'suspendido';

export class Usuario {
  // Propiedades relacionales anidadas (hidratadas localmente al iniciar sesión)
  public contacto?: Contacto;
  public empresa?: Empresa;
  public cliente?: Cliente;

  constructor(
    public id: string,
    public empresa_id: string | null,   // legacy — se mantiene durante Fase 0-1
    public contact_id: string,
    public system_role: SystemRole,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null,
    public cliente_id: string | null = null,
    public preferences?: {
      theme: string;
      language: string;
      notificationsEnabled: boolean;
    },
    public estado: UserEstado = 'activo',
    // Lista denormalizada de company_ids con grant activo — usada por Security Rules
    // (no puede hacer query, solo get/exists sobre paths conocidos)
    public company_ids: string[] = []
  ) {}

  get isSuperAdmin(): boolean {
    return this.system_role === 'super_admin';
  }

  get isActivo(): boolean {
    return this.estado === 'activo';
  }
}

export const usuarioConverter: FirestoreDataConverter<Usuario> = {
  toFirestore(usuario: Usuario): DocumentData {
    return {
      empresa_id: usuario.empresa_id,
      cliente_id: usuario.cliente_id,
      contact_id: usuario.contact_id,
      system_role: usuario.system_role,
      estado: usuario.estado,
      company_ids: usuario.company_ids,
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
      data.empresa_id ?? null,
      data.contact_id,
      (data.system_role as SystemRole) || 'client_user',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null,
      data.cliente_id ?? null,
      data.preferences,
      (data.estado as UserEstado) || 'activo',
      data.company_ids ?? []
    );
  }
};