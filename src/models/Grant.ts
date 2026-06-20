import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import type { GrantRole, ScopeType } from '../auth/permissions';

export class Grant {
  constructor(
    public id: string,
    public user_id: string,
    public cliente_id: string,
    public company_id: string | null,   // null cuando scope_type === 'client'
    public scope_type: ScopeType,
    public scope_id: string,
    public role: GrantRole,
    public active: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const grantConverter: FirestoreDataConverter<Grant> = {
  toFirestore(grant: Grant): DocumentData {
    return {
      user_id: grant.user_id,
      cliente_id: grant.cliente_id,
      company_id: grant.company_id,
      scope_type: grant.scope_type,
      scope_id: grant.scope_id,
      role: grant.role,
      active: grant.active,
      createdAt: grant.createdAt ? Timestamp.fromDate(grant.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: grant.deletedAt ? Timestamp.fromDate(grant.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Grant {
    const data = snapshot.data(options)!;
    return new Grant(
      snapshot.id,
      data.user_id,
      data.cliente_id,
      data.company_id ?? null,
      data.scope_type as ScopeType,
      data.scope_id,
      data.role as GrantRole,
      data.active ?? true,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null,
    );
  }
};
