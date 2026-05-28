const { collection, getDocs, getDoc, doc, addDoc, query, where, deleteDoc, orderBy, db } = require("../config/db");

class ContentService {
  static async getAll() {
    const q = query(collection(db, "contents"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getBySlug(slug: string) {
    const q = query(collection(db, "contents"), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const document = snapshot.docs[0];
    return { id: document.id, ...document.data() };
  }

  static async create(data: any, userEmail: string) {
    const { title, body, category, excerpt, image } = data;
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const newContent = { 
      title, 
      slug, 
      body, 
      category: category || "General",
      excerpt: excerpt || body.substring(0, 150) + "...",
      image: image || "",
      createdBy: userEmail, 
      createdAt: new Date().toISOString() 
    };
    const docRef = await addDoc(collection(db, "contents"), newContent);
    return { id: docRef.id, ...newContent };
  }

  static async delete(id: string) {
    await deleteDoc(doc(db, "contents", id));
    return { message: "Content deleted successfully" };
  }
}


module.exports = {
  ContentService
};
