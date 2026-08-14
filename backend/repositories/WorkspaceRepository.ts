import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  db,
} from '../config/firebase';
import { IWorkspaceRepository, WorkspaceRecord } from './IWorkspaceRepository';

const COLLECTION = 'workspaceHubWorkspaces';

/**
 * The only file in the app allowed to know that workspaces live in a
 * Firestore collection called "workspaceHubWorkspaces". If persistence ever
 * changes (a different database, a different collection name), only this
 * file needs to change — WorkspaceService is unaffected because it only
 * knows about IWorkspaceRepository (Dependency Inversion + Open/Closed).
 */
export class WorkspaceRepository implements IWorkspaceRepository {
  async findAllByOwner(owner: string): Promise<WorkspaceRecord[]> {
    const q = query(collection(db, COLLECTION), where('owner', '==', owner));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async findById(id: string): Promise<WorkspaceRecord | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as any) };
  }

  async create(data: Omit<WorkspaceRecord, 'id'>): Promise<WorkspaceRecord> {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return { id: docRef.id, ...data };
  }

  async createWithId(id: string, data: Omit<WorkspaceRecord, 'id'>): Promise<WorkspaceRecord> {
    await setDoc(doc(db, COLLECTION, id), data);
    return { id, ...data };
  }

  async update(id: string, data: Partial<WorkspaceRecord>): Promise<WorkspaceRecord> {
    await updateDoc(doc(db, COLLECTION, id), data);
    return { id, ...data } as WorkspaceRecord;
  }

  async updateProjectCount(id: string, projectCount: number): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), { projectCount });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  }
}
