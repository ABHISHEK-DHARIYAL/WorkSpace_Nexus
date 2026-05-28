const { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, db } = require("../config/db");

class PageService {
  static async getByListing(listingId: string) {
    const q = query(
      collection(db, "pages"), 
      where("listingId", "==", listingId),
      orderBy("pageNumber", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getById(id: string) {
    const docRef = doc(db, "pages", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  static async create(data: any) {
    const newPage = {
      listingId: data.listingId,
      title: data.title,
      content: data.content || "",
      pageNumber: data.pageNumber || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "pages"), newPage);
    const createdPage = { id: docRef.id, ...newPage };

    // Update parent listing's pages array
    const listingRef = doc(db, "listings", data.listingId);
    const listingSnap = await getDoc(listingRef);
    if (listingSnap.exists()) {
      const listingData = listingSnap.data();
      const pages = listingData.pages || [];
      if (!pages.includes(docRef.id)) {
        await updateDoc(listingRef, {
          pages: [...pages, docRef.id],
          updatedAt: new Date().toISOString()
        });
      }
    }

    return createdPage;
  }

  static async getByWorkspace(workspaceId: string) {
    const listingsRef = collection(db, "listings");
    const qListings = query(listingsRef, where("workspaceId", "==", workspaceId));
    const listingsSnap = await getDocs(qListings);
    const listingIds = listingsSnap.docs.map(d => d.id);
    
    if (listingIds.length === 0) return [];
    
    const pagesRef = collection(db, "pages");
    const matchedPages: any[] = [];
    
    for (let i = 0; i < listingIds.length; i += 30) {
      const chunk = listingIds.slice(i, i + 30);
      const qPages = query(pagesRef, where("listingId", "in", chunk));
      const pagesSnap = await getDocs(qPages);
      matchedPages.push(...pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
    }
    
    return matchedPages;
  }

  static async update(id: string, data: any) {
    if (!id) throw new Error("Page ID is required for update");
    
    const docRef = doc(db, "pages", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Page with ID ${id} not found`);
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  static async saveDraft(pageId: string, content: string, userId: string) {
    const draftRef = doc(db, "drafts", `${pageId}_${userId}`);
    await updateDoc(draftRef, {
      content,
      updatedAt: new Date().toISOString()
    }).catch(async () => {
      // Create if doesn't exist
      await addDoc(collection(db, "drafts"), {
        pageId,
        userId,
        content,
        updatedAt: new Date().toISOString()
      });
    });
  }

  static async getDraft(pageId: string, userId: string) {
    const q = query(
      collection(db, "drafts"),
      where("pageId", "==", pageId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  static async delete(id: string) {
    const docRef = doc(db, "pages", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const pageData = docSnap.data();
      const listingId = pageData.listingId;
      
      // Delete page
      await deleteDoc(docRef);
      
      // Update parent listing's pages array
      const listingRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        const listingData = listingSnap.data();
        const pages = (listingData.pages || []).filter((pId: string) => pId !== id);
        await updateDoc(listingRef, {
          pages,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      await deleteDoc(docRef);
    }
    
    return { message: "Page deleted successfully" };
  }

  static async getAll(userId: string) {
    const listingsRef = collection(db, "listings");
    const qListings = query(listingsRef, where("owner", "==", userId));
    const listingsSnap = await getDocs(qListings);
    const listingIds = listingsSnap.docs.map(d => d.id);
    
    if (listingIds.length === 0) return [];
    
    const pagesRef = collection(db, "pages");
    const matchedPages: any[] = [];
    
    for (let i = 0; i < listingIds.length; i += 30) {
      const chunk = listingIds.slice(i, i + 30);
      const qPages = query(pagesRef, where("listingId", "in", chunk));
      const pagesSnap = await getDocs(qPages);
      matchedPages.push(...pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
    }
    
    return matchedPages;
  }
}


module.exports = {
  PageService
};
