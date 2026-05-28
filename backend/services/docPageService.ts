const { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, db } = require("../config/db");

class DocPageService {
  static async getByProject(projectId: string) {
    const q = query(
      collection(db, "doc_pages"),
      where("projectId", "==", projectId),
      orderBy("pageNumber", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    await deleteDoc(doc(db, "doc_pages", id));
    return { message: "Page deleted successfully" };
  }
}


module.exports = {
  DocPageService
};
