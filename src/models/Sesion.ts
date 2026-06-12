import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore';

export class Sesion {
  constructor(
    public id: string,
    public user_id: string,
    public browser_agent: string,
    public token: string,
    public duration: number,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}

export const sesionConverter = {
  toFirestore(sesion: Sesion): DocumentData {
    return {
      user_id: sesion.user_id,
      browser_agent: sesion.browser_agent,
      token: sesion.token,
      duration: sesion.duration,
      createdAt: sesion.createdAt ? Timestamp.fromDate(sesion.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Sesion {
    const data = snapshot.data(options)!;
    return new Sesion(
      snapshot.id,
      data.user_id,
      data.browser_agent,
      data.token,
      data.duration,
      data.createdAt?.toDate() || new Date(),
      data.updatedAt?.toDate() || new Date()
    );
  }
};
