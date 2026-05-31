import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy,
  limit,
  db
} from "../config/firebase";

export class VersionService {
  static async createSnapshot(pageId: string, content: string, title: string) {
    const snapshot = {
      pageId,
      content,
      title,
      timestamp: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "page_versions"), snapshot);
    return { id: docRef.id, ...snapshot };
  }

  static async getByPage(pageId: string) {
    const q = query(
      collection(db, "page_versions"),
      where("pageId", "==", pageId)
    );
    const snapshot = await getDocs(q);
    const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    versions.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return versions.slice(0, 50);
  }
}
