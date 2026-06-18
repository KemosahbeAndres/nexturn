import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Contacto } from './Contacto';

export type ClientePlan = 'free' | 'pro' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface ClienteEntitlements {
  max_empleados: number;    // -1 = ilimitado
  max_sucursales: number;   // -1 = ilimitado
  multiempresa: boolean;
  features: string[];
}

export const DEFAULT_ENTITLEMENTS: ClienteEntitlements = {
  max_empleados: 15,
  max_sucursales: 1,
  multiempresa: false,
  features: [],
};

export class Cliente {
  public contacto?: Contacto;

  constructor(
    public id: string,
    public contact_id: string,
    public slug: string,
    public plan: ClientePlan = 'free',
    public subscription_status: SubscriptionStatus = 'trialing',
    public entitlements: ClienteEntitlements = { ...DEFAULT_ENTITLEMENTS },
    public stripe_customer_id: string | null = null,
    public active: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get isFree(): boolean {
    return this.plan === 'free';
  }

  get isMultiempresa(): boolean {
    return this.entitlements.multiempresa;
  }

  hasFeature(feature: string): boolean {
    return this.entitlements.features.includes(feature);
  }
}

export const clienteConverter: FirestoreDataConverter<Cliente> = {
  toFirestore(cliente: Cliente): DocumentData {
    return {
      contact_id: cliente.contact_id,
      slug: cliente.slug,
      plan: cliente.plan,
      subscription_status: cliente.subscription_status,
      entitlements: cliente.entitlements,
      stripe_customer_id: cliente.stripe_customer_id,
      active: cliente.active,
      createdAt: cliente.createdAt ? Timestamp.fromDate(cliente.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: cliente.deletedAt ? Timestamp.fromDate(cliente.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Cliente {
    const data = snapshot.data(options)!;
    return new Cliente(
      snapshot.id,
      data.contact_id,
      data.slug || '',
      data.plan as ClientePlan || 'free',
      data.subscription_status as SubscriptionStatus || 'trialing',
      data.entitlements || { ...DEFAULT_ENTITLEMENTS },
      data.stripe_customer_id || null,
      data.active ?? true,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null,
    );
  }
};
