import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  db
} from "../config/firebase";

export class AnnotationService {
  static async getByPage(pageId: string) {
    const q = query(
      collection(db, "annotations"),
      where("pageId", "==", pageId)
    );
    const snapshot = await getDocs(q);
    const annotations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    annotations.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    return annotations;
  }

  static async create(data: any) {
    const annotation = {
      pageId: data.pageId,
      type: data.type || 'comment', // 'comment', 'sticky-note', 'reaction'
      content: data.content,
      position: data.position || null, // { top, left } or character offset
      userId: data.userId,
      parentAnnotationId: data.parentAnnotationId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "annotations"), annotation);
    return { id: docRef.id, ...annotation };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "annotations", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    await deleteDoc(doc(db, "annotations", id));
    return { message: "Annotation deleted" };
  }
}
