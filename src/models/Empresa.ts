import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { Contacto } from './Contacto';
import { Role, roleFromFirestore, roleToFirestore } from './Role';

export type EmpresaType = 'empresa' | 'congregacion';
export type EmpresaPlan = 'basic' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'trialing' | 'paused' | 'past_due' | 'canceled' | 'pending';
export type DTEProvider = 'openfactura' | 'sii_manual';

export interface EmpresaEntitlements {
  max_empleados: number;   // -1 = ilimitado
  max_sucursales: number;  // -1 = ilimitado
  features: string[];      // ej. ['algoritmo', 'reglas', 'exportaciones']
}

export const PLAN_ENTITLEMENTS: Record<EmpresaPlan, EmpresaEntitlements> = {
  basic: {
    max_empleados: 25,
    max_sucursales: 3,
    features: [],
  },
  pro: {
    max_empleados: 100,
    max_sucursales: 10,
    features: ['algoritmo', 'reglas', 'exportaciones'],
  },
  business: {
    max_empleados: -1,
    max_sucursales: -1,
    features: ['algoritmo', 'reglas', 'exportaciones', 'roles_finos', 'sso', 'api'],
  },
};

export const PLAN_PRECIOS_NETO: Record<EmpresaPlan, number> = {
  basic: 10000,
  pro: 30000,
  business: 100000,
};

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
    public deletedAt: Date | null = null,
    public cliente_id: string | null = null,
    // Datos tributarios (para DTE)
    public rut: string | null = null,
    public razon_social: string | null = null,
    public giro: string | null = null,
    public direccion: string | null = null,
    // Suscripción MercadoPago (por empresa)
    public plan: EmpresaPlan | null = null,
    public facturable: boolean = true,
    public mp_preapproval_id: string | null = null,
    public mp_preapproval_plan_id: string | null = null,
    public subscription_status: SubscriptionStatus = 'pending',
    public entitlements: EmpresaEntitlements = { max_empleados: 25, max_sucursales: 3, features: [] },
    public trial_ends_at: Date | null = null,
  ) {}

  get isEmpresa(): boolean {
    return this.type === 'empresa';
  }

  get isCongregacion(): boolean {
    return this.type === 'congregacion';
  }

  get displayName(): string {
    return this.razon_social ?? this.contacto?.first_name ?? this.slug;
  }

  get isPastDue(): boolean {
    return this.subscription_status === 'past_due';
  }

  get isActive(): boolean {
    return this.subscription_status === 'active' || this.subscription_status === 'trialing';
  }

  hasFeature(feature: string): boolean {
    return this.entitlements.features.includes(feature);
  }
}

export const empresaConverter: FirestoreDataConverter<Empresa> = {
  toFirestore(empresa: Empresa): DocumentData {
    return {
      active: empresa.active,
      contact_id: empresa.contact_id,
      cliente_id: empresa.cliente_id,
      type: empresa.type,
      cargos: empresa.cargos.map(roleToFirestore),
      slug: empresa.slug,
      // Datos tributarios
      rut: empresa.rut ?? null,
      razon_social: empresa.razon_social ?? null,
      giro: empresa.giro ?? null,
      direccion: empresa.direccion ?? null,
      // Suscripción
      plan: empresa.plan ?? null,
      facturable: empresa.facturable,
      mp_preapproval_id: empresa.mp_preapproval_id ?? null,
      mp_preapproval_plan_id: empresa.mp_preapproval_plan_id ?? null,
      subscription_status: empresa.subscription_status,
      entitlements: empresa.entitlements,
      trial_ends_at: empresa.trial_ends_at ? Timestamp.fromDate(empresa.trial_ends_at) : null,
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
      (data.type as EmpresaType) ?? 'empresa',
      (data.cargos || data.work_roles || []).map(roleFromFirestore),
      data.slug || '',
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null,
      data.cliente_id ?? null,
      data.rut ?? null,
      data.razon_social ?? null,
      data.giro ?? null,
      data.direccion ?? null,
      data.plan as EmpresaPlan ?? null,
      data.facturable ?? true,
      data.mp_preapproval_id ?? null,
      data.mp_preapproval_plan_id ?? null,
      data.subscription_status as SubscriptionStatus ?? 'pending',
      data.entitlements ?? { max_empleados: 25, max_sucursales: 3, features: [] },
      data.trial_ends_at?.toDate() ?? null,
    );
  }
};
