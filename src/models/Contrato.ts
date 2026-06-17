import { Timestamp } from 'firebase/firestore';

export class Contrato {
  constructor(
    public id: string,
    public empleado_id: string,
    public ubicacion_id: string,
    public cargo_id: string,
    public active: boolean,
    public limite_horas: number = 0,
    public fecha_inicio: Date = new Date(),
    public fecha_fin: Date | null = null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export function contratoToPlain(c: Contrato): Record<string, unknown> {
  return {
    id: c.id,
    empleado_id: c.empleado_id,
    ubicacion_id: c.ubicacion_id,
    cargo_id: c.cargo_id,
    active: c.active,
    limite_horas: c.limite_horas ?? 0,
    fecha_inicio: c.fecha_inicio ? Timestamp.fromDate(c.fecha_inicio) : Timestamp.now(),
    fecha_fin: c.fecha_fin ? Timestamp.fromDate(c.fecha_fin) : null,
    createdAt: c.createdAt ? Timestamp.fromDate(c.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
    deletedAt: c.deletedAt ? Timestamp.fromDate(c.deletedAt) : null,
  };
}

export function contratoFromPlain(data: Record<string, any>): Contrato {
  return new Contrato(
    data.id || '',
    data.empleado_id || '',
    data.ubicacion_id || '',
    data.cargo_id || '',
    data.active ?? true,
    data.limite_horas ?? 0,
    data.fecha_inicio?.toDate?.() || new Date(),
    data.fecha_fin?.toDate?.() ?? null,
    data.createdAt?.toDate?.() || new Date(),
    data.updatedAt?.toDate?.() || new Date(),
    data.deletedAt?.toDate?.() ?? null
  );
}
