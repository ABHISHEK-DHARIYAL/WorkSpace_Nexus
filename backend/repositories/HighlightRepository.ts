import { collection, getDocs, addDoc, query, where, db } from '../config/firebase';
import { IHighlightRepository, HighlightRecord } from './IHighlightRepository';

const COLLECTION = 'highlights';

export class HighlightRepository implements IHighlightRepository {
  async findAll(): Promise<HighlightRecord[]> {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HighlightRecord[];
  }

  async findByPage(pageId: string): Promise<HighlightRecord[]> {
    const snapshot = await getDocs(query(collection(db, COLLECTION), where('pageId', '==', pageId)));
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HighlightRecord[];
  }

  async create(data: Omit<HighlightRecord, 'id'>): Promise<HighlightRecord> {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return { id: docRef.id, ...data } as HighlightRecord;
  }
}
