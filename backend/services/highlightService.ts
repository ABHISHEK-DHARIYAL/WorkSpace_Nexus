const { collection, getDocs, getDoc, doc, addDoc, query, where, db } = require("../config/db");

class HighlightService {
  static async getAll() {
    const q = collection(db, "highlights");
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getByPage(pageId: string) {
    const q = query(collection(db, "highlights"), where("pageId", "==", pageId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async create(data: any) {
    if (!data.pageId) throw new Error("Page ID is required for annotation");
    if (!data.listingId) throw new Error("Listing ID is required for annotation");

    const newAnnotation = {
      listingId: data.listingId,
      pageId: data.pageId,
      userId: data.userId || "anonymous",
      text: data.text || "",
      color: data.color || "yellow",
      annotationType: data.annotationType || "highlight",
      style: data.style || "solid",
      startOffset: data.startOffset || 0,
      endOffset: data.endOffset || 0,
      selectedRange: data.selectedRange || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "highlights"), newAnnotation);
    return { id: docRef.id, ...newAnnotation };
  }
}


module.exports = {
  HighlightService
};
