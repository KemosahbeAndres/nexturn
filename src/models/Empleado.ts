import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import type { Contacto } from './Contacto';
import { Contrato, contratoFromPlain, contratoToPlain } from './Contrato';

export interface VentanaDisponibilidad {
  day_of_week: string;   // 'Lunes' … 'Domingo' (mismo vocabulario que dateToSpanishDay)
  start: string;         // 'HH:MM'
  end: string;           // 'HH:MM'
}

export interface Disponibilidad {
  id: string;
  ventanas: VentanaDisponibilidad[];   // oferta base: ventanas horarias por día
  days: string[];                      // resumen (días únicos con ventana); legado de UI
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
    public estacion_ids: string[],
    public contratos: Contrato[],
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
      estacion_ids: empleado.estacion_ids,
      contratos: (empleado.contratos ?? []).map(contratoToPlain),
      disponibilidad: disp ? {
        id: disp.id,
        ventanas: (disp.ventanas ?? []).map(v => ({
          day_of_week: v.day_of_week,
          start: v.start,
          end: v.end,
        })),
        days: disp.days ?? [],
        monthly_frequency: disp.monthly_frequency,
        weekly_frequency: disp.weekly_frequency,
        special_rule: disp.special_rule,
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
      ventanas: Array.isArray(d.ventanas)
        ? d.ventanas.map((v: any) => ({
            day_of_week: v.day_of_week || '',
            start: v.start || '',
            end: v.end || '',
          }))
        : [],
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
      data.estacion_ids || data.skill_ids || [],
      (data.contratos || []).map(contratoFromPlain),
      disponibilidad,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() || null
    );
  }
};
