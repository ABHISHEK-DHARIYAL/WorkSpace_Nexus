const { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, db } = require("../config/db");

class DocIndexService {
  static async getByProject(projectId: string) {
    const q = query(
      collection(db, "doc_indices"),
      where("projectId", "==", projectId),
      orderBy("position", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getAll() {
    const q = query(collection(db, "doc_indices"), orderBy("position", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getById(id: string) {
    const docRef = doc(db, "doc_indices", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  static async create(data: any) {
    const newIndex = {
      title: data.title,
      linkedPage: data.linkedPage, // Page ID
      linkedSectionId: data.linkedSectionId || "", // Anchor ID
      position: data.position || 0,
      projectId: data.projectId || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "doc_indices"), newIndex);
    return { id: docRef.id, ...newIndex };
  }

  static async update(id: string, data: any) {
    const docRef = doc(db, "doc_indices", id);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async delete(id: string) {
    await deleteDoc(doc(db, "doc_indices", id));
    return { message: "Index item deleted successfully" };
  }
}


module.exports = {
  DocIndexService
};
