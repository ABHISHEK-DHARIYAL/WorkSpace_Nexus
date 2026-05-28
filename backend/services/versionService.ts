const { collection, getDocs, getDoc, doc, addDoc, query, where, orderBy, limit, db } = require("../config/db");

class VersionService {
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
      where("pageId", "==", pageId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}


module.exports = {
  VersionService
};
