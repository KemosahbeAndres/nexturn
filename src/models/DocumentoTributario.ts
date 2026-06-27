import { Timestamp } from 'firebase/firestore';
import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export type TipoDTE = 'boleta' | 'factura';
export type EstadoDTE = 'pendiente' | 'emitido' | 'notificado' | 'error';
export type OrigenDTE = 'openfactura' | 'sii_manual';

export class DocumentoTributario {
  constructor(
    public id: string,
    public empresa_id: string,
    public payment_ref: string,         // ID de pago MercadoPago
    public periodo: string,              // YYYY-MM
    public tipo_dte: TipoDTE,
    public monto_neto: number,           // sin IVA
    public iva: number,
    public monto_total: number,
    public folio: string | null = null,
    public origen: OrigenDTE,
    public estado: EstadoDTE = 'pendiente',
    public archivo_pdf_url: string | null = null,
    public archivo_xml_url: string | null = null,
    public emitido_at: Date | null = null,
    public notificado_at: Date | null = null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
}

export const documentoTributarioConverter: FirestoreDataConverter<DocumentoTributario> = {
  toFirestore(doc: DocumentoTributario): DocumentData {
    return {
      empresa_id: doc.empresa_id,
      payment_ref: doc.payment_ref,
      periodo: doc.periodo,
      tipo_dte: doc.tipo_dte,
      monto_neto: doc.monto_neto,
      iva: doc.iva,
      monto_total: doc.monto_total,
      folio: doc.folio ?? null,
      origen: doc.origen,
      estado: doc.estado,
      archivo_pdf_url: doc.archivo_pdf_url ?? null,
      archivo_xml_url: doc.archivo_xml_url ?? null,
      emitido_at: doc.emitido_at ? Timestamp.fromDate(doc.emitido_at) : null,
      notificado_at: doc.notificado_at ? Timestamp.fromDate(doc.notificado_at) : null,
      createdAt: doc.createdAt ? Timestamp.fromDate(doc.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): DocumentoTributario {
    const data = snapshot.data(options)!;
    return new DocumentoTributario(
      snapshot.id,
      data.empresa_id,
      data.payment_ref,
      data.periodo,
      data.tipo_dte as TipoDTE,
      data.monto_neto,
      data.iva,
      data.monto_total,
      data.folio ?? null,
      data.origen as OrigenDTE,
      data.estado as EstadoDTE ?? 'pendiente',
      data.archivo_pdf_url ?? null,
      data.archivo_xml_url ?? null,
      data.emitido_at?.toDate() ?? null,
      data.notificado_at?.toDate() ?? null,
      data.createdAt?.toDate() ?? new Date(),
      data.updatedAt?.toDate() ?? new Date(),
    );
  }
};
