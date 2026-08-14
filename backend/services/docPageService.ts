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

export class DocPageService {
  static async getByProject(projectId: string) {
    const q = query(
      collection(db, "doc_pages"),
      where("projectId", "==", projectId)
    );
    const snapshot = await getDocs(q);
    const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    pages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    return pages;
  }

  static async getAll() {
    const q = query(collection(db, "doc_pages"), orderBy("pageNumber", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getById(id: string) {
    const docRef = doc(db, "doc_pages", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  static async create(data: any) {
    const newPage = {
      title: data.title,
      content: data.content || "",
      pageNumber: data.pageNumber || 1,
      projectId: data.projectId || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "doc_pages"), newPage);
    return { id: docRef.id, ...newPage };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "doc_pages", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    // A deleted page must not leave a dangling reference in its parent
    // document's `pages` array — that array is otherwise only ever healed
    // when empty, so a stale (but non-empty) array full of dead page IDs
    // would never get corrected on its own.
    const pageSnap = await getDoc(doc(db, "doc_pages", id));
    await deleteDoc(doc(db, "doc_pages", id));

    if (pageSnap.exists()) {
      const projectId = (pageSnap.data() as any).projectId;
      if (projectId) {
        const projectRef = doc(db, "documentNexusDocuments", projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const pages = ((projectSnap.data() as any).pages || []).filter((pageId: string) => pageId !== id);
          await updateDoc(projectRef, { pages, updatedAt: new Date().toISOString() });
        }
      }
    }

    return { message: "Page deleted successfully" };
  }
}
