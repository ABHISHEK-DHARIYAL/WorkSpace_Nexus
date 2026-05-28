const { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, db } = require("../config/db");

class AnnotationService {
  static async getByPage(pageId: string) {
    const q = query(
      collection(db, "annotations"),
      where("pageId", "==", pageId),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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


module.exports = {
  AnnotationService
};
