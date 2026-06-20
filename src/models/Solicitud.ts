import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type SolicitudTipo = 'licencia_medica' | 'feriado_legal' | 'emergencia';
export type SolicitudEstado = 'pendiente' | 'aprobada' | 'rechazada';

export interface SolicitudRango {
  start_date: string;
  end_date: string;
}

export interface SolicitudReemplazo {
  empleado_id: string;
  rango: SolicitudRango;
}

export class Solicitud {
  constructor(
    public id: string,
    public empresa_id: string,
    public empleado_id: string,
    public sucursal_id: string,
    public tipo: SolicitudTipo,
    public rango: SolicitudRango,
    public estado: SolicitudEstado,
    public aprobador_id: string | null = null,
    public reemplazo: SolicitudReemplazo | null = null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}
}

export const solicitudConverter: FirestoreDataConverter<Solicitud> = {
  toFirestore(s: Solicitud): DocumentData {
    return {
      empresa_id: s.empresa_id,
      empleado_id: s.empleado_id,
      sucursal_id: s.sucursal_id,
      tipo: s.tipo,
      rango: s.rango,
      estado: s.estado,
      aprobador_id: s.aprobador_id,
      reemplazo: s.reemplazo ?? null,
      createdAt: s.createdAt ? Timestamp.fromDate(s.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      deletedAt: s.deletedAt ? Timestamp.fromDate(s.deletedAt) : null,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Solicitud {
    const data = snapshot.data(options)!;
    return new Solicitud(
      snapshot.id,
      data.empresa_id || '',
      data.empleado_id || '',
      data.sucursal_id || '',
      data.tipo || 'emergencia',
      data.rango || { start_date: '', end_date: '' },
      data.estado || 'pendiente',
      data.aprobador_id ?? null,
      data.reemplazo ?? null,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date(),
      data.deletedAt?.toDate() ?? null
    );
  }
};
