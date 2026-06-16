import { Timestamp } from 'firebase/firestore';

export class Contrato {
  constructor(
    public id: string,
    public empleado_id: string,
    public ubicacion_id: string,
    public cargo_id: string,
    public active: boolean,
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
    data.createdAt?.toDate?.() || new Date(),
    data.updatedAt?.toDate?.() || new Date(),
    data.deletedAt?.toDate?.() ?? null
  );
}
