import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import type { Contacto } from './Contacto';

export interface Disponibilidad {
  id: string;
  days: string[];
  monthly_frequency: number;
  weekly_frequency: number;
  special_rule: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Empleado {
  public contacto?: Contacto;

  constructor(
    public id: string,
    public company_id: string,
    public contact_id: string,
    public active: boolean,
    public work_role: string,
    public disponibilidad: Disponibilidad | null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get displayName(): string {
    if (!this.contacto) return 'Sin nombre';
    return `${this.contacto.first_name} ${this.contacto.last_name}`.trim();
  }

  get initials(): string {
    if (!this.contacto) return '?';
    const fn = this.contacto.first_name?.[0] ?? '';
    const ln = this.contacto.last_name?.[0] ?? '';
    return (fn + ln).toUpperCase() || '?';
  }
}

export const empleadoConverter: FirestoreDataConverter<Empleado> = {
  toFirestore(empleado: Empleado): DocumentData {
    const disp = empleado.disponibilidad;
    return {
      company_id: empleado.company_id,
      contact_id: empleado.contact_id,
      active: empleado.active,
      work_role: empleado.work_role,
      disponibilidad: disp ? {
        ...disp,
        createdAt: disp.createdAt ? Timestamp.fromDate(disp.createdAt) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        deletedAt: disp.deletedAt ? Timestamp.fromDate(disp.deletedAt) : null,
      } : null,
      createdAt: empleado.createdAt ? Timestamp.fromDate(empleado.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: empleado.deletedAt ? Timestamp.fromDate(empleado.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Empleado {
    const data = snapshot.data(options)!;
    const d = data.disponibilidad;
    const disponibilidad: Disponibilidad | null = d ? {
      id: d.id || '',
      days: d.days || [],
      monthly_frequency: d.monthly_frequency ?? 0,
      weekly_frequency: d.weekly_frequency ?? 0,
      special_rule: d.special_rule || '',
      createdAt: d.createdAt?.toDate() || new Date(),
      updatedAt: d.updatedAt?.toDate() || new Date(),
      deletedAt: d.deletedAt?.toDate() ?? null,
    } : null;

    return new Empleado(
      snapshot.id,
      data.company_id || '',
      data.contact_id || '',
      data.active ?? true,
      data.work_role || '',
      disponibilidad,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
